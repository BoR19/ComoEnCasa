import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  INITIAL_INVENTORY,
  INITIAL_MENU_ITEMS,
  INITIAL_TABLES,
} from '../data/mockData';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  AuthorizedStaffItem,
  InventoryItem,
  KitchenOrder,
  MenuItem,
  OrderLineItem,
  OrderMode,
  OrderStatus,
  PaymentMethod,
  TableItem,
} from '../types/app';

export const BOOTSTRAP_ADMIN_EMAIL = 'borbjo637@gmail.com';

export interface UserRoleStatus {
  isAdmin: boolean;
  isMozo: boolean;
}

export async function resolveUserRoles(user: User | null): Promise<UserRoleStatus> {
  if (!user || !user.emailVerified) {
    return { isAdmin: false, isMozo: false };
  }

  const email = (user.email || '').toLowerCase();
  if (email === BOOTSTRAP_ADMIN_EMAIL) {
    return { isAdmin: true, isMozo: true };
  }

  let isAdmin = false;
  let isMozo = false;

  try {
    const adminSnap = await getDoc(doc(db, 'admins', user.uid));
    if (adminSnap.exists()) {
      isAdmin = true;
      isMozo = true;
    }
  } catch {
    // Non-admin read is allowed only for own uid; fallback safely
  }

  if (!isAdmin && email) {
    try {
      const staffSnap = await getDoc(doc(db, 'authorized_staff', email));
      if (staffSnap.exists() && staffSnap.data()?.active === true) {
        isMozo = true;
      }
    } catch {
      // Not an authorized mozo
    }
  }

  return { isAdmin, isMozo };
}

function buildMenuDocPayload(item: MenuItem, sortOrder: number) {
  return {
    id: item.id,
    name: item.name.slice(0, 100),
    category: item.category,
    description: (item.description || '').slice(0, 300),
    priceBadge: item.priceBadge.slice(0, 120),
    sizes: item.sizes.slice(0, 3),
    ingredients: item.ingredients.slice(0, 12),
    rating: Number(item.rating) || 4.8,
    prepTime: (item.prepTime || '15 min').slice(0, 40),
    available: Boolean(item.available),
    visualType: item.visualType,
    sortOrder,
    updatedAt: serverTimestamp(),
  };
}

export async function seedInitialCatalogIfEmpty(): Promise<void> {
  try {
    const [menuSnap, tableSnap, invSnap, staffCfgSnap] = await Promise.all([
      getDocs(collection(db, 'menuItems')),
      getDocs(collection(db, 'tables')),
      getDocs(collection(db, 'inventory')),
      getDoc(doc(db, 'config', 'staff')),
    ]);

    const batch = writeBatch(db);
    let hasWrites = false;

    if (menuSnap.empty) {
      INITIAL_MENU_ITEMS.forEach((item, idx) => {
        batch.set(doc(db, 'menuItems', item.id), buildMenuDocPayload(item, idx));
      });
      hasWrites = true;
    }

    if (tableSnap.empty) {
      INITIAL_TABLES.forEach((tbl) => {
        batch.set(doc(db, 'tables', `mesa-${tbl.number}`), {
          number: tbl.number,
          status: tbl.status === 'ocupada' ? 'ocupada' : 'libre',
          capacity: tbl.capacity,
          updatedAt: serverTimestamp(),
        });
      });
      hasWrites = true;
    }

    if (invSnap.empty) {
      INITIAL_INVENTORY.forEach((inv) => {
        batch.set(doc(db, 'inventory', inv.id), {
          id: inv.id,
          name: inv.name,
          quantity: inv.quantity,
          unit: inv.unit,
          status: inv.status,
          updatedAt: serverTimestamp(),
        });
      });
      hasWrites = true;
    }

    if (!staffCfgSnap.exists()) {
      batch.set(doc(db, 'config', 'staff'), {
        mozoPin: '1234',
        updatedAt: serverTimestamp(),
      });
      hasWrites = true;
    }

    if (hasWrites) {
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'menuItems|tables|inventory|config/staff');
  }
}

export function subscribeMenuItems(
  onData: (items: MenuItem[]) => void
): () => void {
  const q = query(collection(db, 'menuItems'), orderBy('sortOrder', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        onData(INITIAL_MENU_ITEMS);
        return;
      }
      const items: MenuItem[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: data.id || d.id,
          name: data.name,
          category: data.category,
          description: data.description || '',
          priceBadge: data.priceBadge || '',
          sizes: Array.isArray(data.sizes) ? data.sizes : [],
          ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
          rating: typeof data.rating === 'number' ? data.rating : 4.8,
          prepTime: data.prepTime || '15 min',
          available: Boolean(data.available),
          visualType: data.visualType || 'pollo-horno',
        };
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'menuItems');
    }
  );
}

export function subscribeTables(
  onData: (tables: TableItem[]) => void
): () => void {
  const q = query(collection(db, 'tables'), orderBy('number', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        onData(INITIAL_TABLES);
        return;
      }
      const list: TableItem[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          number: Number(data.number),
          status: data.status === 'ocupada' ? 'ocupada' : 'libre',
          capacity: Number(data.capacity) || 4,
        };
      });
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tables');
    }
  );
}

export function subscribeOrders(
  userUid: string,
  isStaff: boolean,
  onData: (orders: KitchenOrder[]) => void
): () => void {
  const q = isStaff
    ? query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    : query(collection(db, 'orders'), where('customerUid', '==', userUid));

  return onSnapshot(
    q,
    async (snapshot) => {
      const rawDocs = snapshot.docs.map((d) => {
        const data = d.data();
        const ts = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 0;
        const order: KitchenOrder & { _createdAtMs: number } = {
          id: data.id || d.id,
          code: data.code,
          customerUid: data.customerUid,
          mode: data.mode,
          tableNumber: typeof data.tableNumber === 'number' ? data.tableNumber : undefined,
          customerLabel: data.customerLabel,
          items: Array.isArray(data.items) ? data.items : [],
          notes: typeof data.notes === 'string' ? data.notes : '',
          status: data.status,
          total: Number(data.total),
          estimatedMinutes: Number(data.estimatedMinutes) || 15,
          createdAt: data.createdAtLabel || '',
          deliveredAt: typeof data.deliveredAtLabel === 'string' ? data.deliveredAtLabel : undefined,
          paid: Boolean(data.paid),
          paymentMethod: data.paymentMethod,
          waiterRequested: Boolean(data.waiterRequested),
          ratingStars: typeof data.ratingStars === 'number' ? data.ratingStars : undefined,
          _createdAtMs: ts,
        };
        return order;
      });

      rawDocs.sort((a, b) => b._createdAtMs - a._createdAtMs);

      const enriched = await Promise.all(
        rawDocs.map(async ({ _createdAtMs: _ts, ...ord }) => {
          if (ord.mode === 'delivery') {
            try {
              const piiSnap = await getDoc(doc(db, 'orders', ord.id, 'private', 'delivery'));
              if (piiSnap.exists()) {
                const pii = piiSnap.data();
                return {
                  ...ord,
                  deliveryAddress: pii.address,
                  deliveryPhone: pii.phone,
                };
              }
            } catch {
              // Ignore if private doc does not exist
            }
          }
          return ord;
        })
      );

      onData(enriched);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    }
  );
}

export function subscribeInventory(
  onData: (items: InventoryItem[]) => void
): () => void {
  return onSnapshot(
    collection(db, 'inventory'),
    (snapshot) => {
      if (snapshot.empty) {
        onData(INITIAL_INVENTORY);
        return;
      }
      const list: InventoryItem[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: data.id || d.id,
          name: data.name,
          quantity: Number(data.quantity) || 0,
          unit: data.unit,
          status: data.status === 'Bajo stock' ? 'Bajo stock' : 'Stock OK',
        };
      });
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'inventory');
    }
  );
}

export function subscribeStaffConfig(
  onPin: (mozoPin: string) => void
): () => void {
  return onSnapshot(
    doc(db, 'config', 'staff'),
    (snapshot) => {
      if (snapshot.exists()) {
        const pin = snapshot.data()?.mozoPin;
        if (typeof pin === 'string' && /^[0-9]{4}$/.test(pin)) {
          onPin(pin);
        }
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'config/staff');
    }
  );
}

export function subscribeAuthorizedStaff(
  onData: (list: AuthorizedStaffItem[]) => void
): () => void {
  return onSnapshot(
    collection(db, 'authorized_staff'),
    (snapshot) => {
      const list: AuthorizedStaffItem[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          email: data.email || d.id,
          name: data.name || data.email || d.id,
          active: Boolean(data.active),
        };
      });
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'authorized_staff');
    }
  );
}

export async function upsertMenuItemInFirestore(
  item: MenuItem,
  sortOrder: number
): Promise<void> {
  try {
    await setDoc(doc(db, 'menuItems', item.id), buildMenuDocPayload(item, sortOrder));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `menuItems/${item.id}`);
  }
}

export async function createOrderInFirestore(params: {
  order: KitchenOrder;
  customerUid: string;
  deliveryReference?: string;
  occupyTableIfNeeded?: {
    tableNumber: number;
    capacity: number;
    isCurrentlyFree: boolean;
    isStaff: boolean;
  };
}): Promise<void> {
  const { order, customerUid, deliveryReference, occupyTableIfNeeded } = params;
  const path = `orders/${order.id}`;

  try {
    const batch = writeBatch(db);
    const orderDoc: Record<string, unknown> = {
      id: order.id,
      code: order.code.slice(0, 20),
      customerUid,
      mode: order.mode,
      customerLabel: order.customerLabel.slice(0, 80),
      items: order.items.slice(0, 50),
      notes: (order.notes || '').slice(0, 300),
      status: order.status,
      total: Number(order.total),
      estimatedMinutes: Number(order.estimatedMinutes),
      createdAtLabel: order.createdAt.slice(0, 20),
      paid: Boolean(order.paid),
      waiterRequested: Boolean(order.waiterRequested),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (order.mode === 'dine-in' && typeof order.tableNumber === 'number') {
      orderDoc.tableNumber = order.tableNumber;
    }
    if (order.paymentMethod) {
      orderDoc.paymentMethod = order.paymentMethod;
    }

    batch.set(doc(db, 'orders', order.id), orderDoc);

    if (order.mode === 'delivery' && order.deliveryAddress && order.deliveryPhone) {
      const privateDoc: Record<string, unknown> = {
        customerUid,
        address: order.deliveryAddress.slice(0, 220),
        phone: order.deliveryPhone.slice(0, 30),
        updatedAt: serverTimestamp(),
      };
      if (deliveryReference && deliveryReference.trim()) {
        privateDoc.reference = deliveryReference.trim().slice(0, 220);
      }
      batch.set(doc(db, 'orders', order.id, 'private', 'delivery'), privateDoc);
    }

    if (
      occupyTableIfNeeded &&
      (occupyTableIfNeeded.isStaff || occupyTableIfNeeded.isCurrentlyFree)
    ) {
      batch.update(doc(db, 'tables', `mesa-${occupyTableIfNeeded.tableNumber}`), {
        status: 'ocupada',
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function appendOrderItemsInFirestore(params: {
  orderId: string;
  items: OrderLineItem[];
  total: number;
  status: OrderStatus;
}): Promise<void> {
  try {
    await updateDoc(doc(db, 'orders', params.orderId), {
      items: params.items.slice(0, 50),
      total: Number(params.total),
      status: params.status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${params.orderId}`);
  }
}

export async function updateOrderStatusInFirestore(
  orderId: string,
  status: OrderStatus,
  deliveredAtLabel?: string
): Promise<void> {
  try {
    const payload: Record<string, unknown> = {
      status,
      updatedAt: serverTimestamp(),
    };
    if (deliveredAtLabel) {
      payload.deliveredAtLabel = deliveredAtLabel.slice(0, 20);
    }
    await updateDoc(doc(db, 'orders', orderId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
  }
}

export async function setWaiterCallInFirestore(
  orderId: string,
  waiterRequested: boolean
): Promise<void> {
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      waiterRequested,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
  }
}

export async function collectOrderPaymentInFirestore(params: {
  orderId: string;
  method: PaymentMethod;
  tableNumberToFree?: number;
}): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'orders', params.orderId), {
      paid: true,
      paymentMethod: params.method,
      waiterRequested: false,
      updatedAt: serverTimestamp(),
    });

    if (typeof params.tableNumberToFree === 'number') {
      batch.update(doc(db, 'tables', `mesa-${params.tableNumberToFree}`), {
        status: 'libre',
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${params.orderId}`);
  }
}

export async function customerPayOrderInFirestore(
  orderId: string,
  method: PaymentMethod
): Promise<void> {
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      paid: true,
      paymentMethod: method,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
  }
}

export async function freeTableInFirestore(tableNumber: number): Promise<void> {
  try {
    await updateDoc(doc(db, 'tables', `mesa-${tableNumber}`), {
      status: 'libre',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tables/mesa-${tableNumber}`);
  }
}

export async function rateOrderInFirestore(
  orderId: string,
  stars: number
): Promise<void> {
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      ratingStars: stars,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
  }
}

export async function saveInventoryInFirestore(
  items: InventoryItem[]
): Promise<void> {
  try {
    const batch = writeBatch(db);
    items.forEach((inv) => {
      batch.set(doc(db, 'inventory', inv.id), {
        id: inv.id,
        name: inv.name,
        quantity: Number(inv.quantity),
        unit: inv.unit,
        status: inv.status,
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'inventory');
  }
}

export async function saveMozoPinInFirestore(mozoPin: string): Promise<void> {
  try {
    await setDoc(doc(db, 'config', 'staff'), {
      mozoPin,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'config/staff');
  }
}

export async function addAuthorizedStaffInFirestore(
  email: string,
  name: string
): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    await setDoc(doc(db, 'authorized_staff', cleanEmail), {
      email: cleanEmail,
      name: name.trim().slice(0, 80) || cleanEmail,
      active: true,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `authorized_staff/${cleanEmail}`);
  }
}

export async function toggleAuthorizedStaffInFirestore(
  email: string,
  active: boolean
): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    await updateDoc(doc(db, 'authorized_staff', cleanEmail), {
      active,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `authorized_staff/${cleanEmail}`);
  }
}

export async function removeAuthorizedStaffInFirestore(
  email: string
): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    await deleteDoc(doc(db, 'authorized_staff', cleanEmail));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `authorized_staff/${cleanEmail}`);
  }
}

export function buildOrderCode(existingCount: number): string {
  const suffix = String(Date.now()).slice(-3);
  return `#${1001 + existingCount}-${suffix}`.slice(0, 20);
}

export type { OrderMode };
