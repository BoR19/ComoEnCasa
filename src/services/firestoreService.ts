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
  CustomerContactItem,
  EmployeeRoleTitle,
  InventoryItem,
  KitchenOrder,
  MenuItem,
  OrderLineItem,
  OrderMode,
  OrderStatus,
  PaymentMethod,
  StaffMember,
  StaffPermissions,
  StaffRoleTitle,
  TableItem,
} from '../types/app';
import { normalizeWhatsAppPhone } from '../utils/ticketHelpers';

export const DEFAULT_ADMIN_PIN = '0000';
export const DEFAULT_MOZO_PIN = '1234';

export const ALL_STAFF_PERMISSIONS: StaffPermissions = {
  orders_tables: true,
  kitchen_board: true,
  cashier_billing: true,
  menu_pricing: true,
  reports_history: true,
};

export const DEFAULT_PERMISSIONS_BY_ROLE: Record<
  EmployeeRoleTitle,
  StaffPermissions
> = {
  Mozo: {
    orders_tables: true,
    kitchen_board: true,
    cashier_billing: false,
    menu_pricing: false,
    reports_history: false,
  },
  Cajero: {
    orders_tables: true,
    kitchen_board: true,
    cashier_billing: true,
    menu_pricing: false,
    reports_history: true,
  },
  Cocina: {
    orders_tables: false,
    kitchen_board: true,
    cashier_billing: false,
    menu_pricing: false,
    reports_history: false,
  },
};

export function normalizeStaffPermissions(
  raw?: Partial<StaffPermissions> | null,
  fallbackRole: EmployeeRoleTitle = 'Mozo'
): StaffPermissions {
  const defaults = DEFAULT_PERMISSIONS_BY_ROLE[fallbackRole];
  return {
    orders_tables:
      typeof raw?.orders_tables === 'boolean'
        ? raw.orders_tables
        : defaults.orders_tables,
    kitchen_board:
      typeof raw?.kitchen_board === 'boolean'
        ? raw.kitchen_board
        : defaults.kitchen_board,
    cashier_billing:
      typeof raw?.cashier_billing === 'boolean'
        ? raw.cashier_billing
        : defaults.cashier_billing,
    menu_pricing:
      typeof raw?.menu_pricing === 'boolean'
        ? raw.menu_pricing
        : defaults.menu_pricing,
    reports_history:
      typeof raw?.reports_history === 'boolean'
        ? raw.reports_history
        : defaults.reports_history,
  };
}

function sanitizeOrderLines(items: OrderLineItem[]): OrderLineItem[] {
  return items.slice(0, 50).map((it) => {
    const clean: OrderLineItem = {
      menuItemId: String(it.menuItemId || ''),
      category: it.category,
      name: String(it.name || ''),
      sizeLabel: String(it.sizeLabel || ''),
      quantity: Math.max(1, Number(it.quantity) || 1),
      price: Number(it.price) || 0,
    };
    if (typeof it.extrasSummary === 'string' && it.extrasSummary.trim().length > 0) {
      clean.extrasSummary = it.extrasSummary.trim().slice(0, 200);
    }
    return clean;
  });
}

function buildMenuDocPayload(item: MenuItem, sortOrder: number) {
  return {
    id: item.id,
    name: item.name.slice(0, 100),
    category: item.category,
    description: (item.description || '').slice(0, 300),
    priceBadge: item.priceBadge.slice(0, 120),
    sizes: item.sizes.slice(0, 3).map((s) => ({
      id: String(s.id || ''),
      label: String(s.label || ''),
      price: Number(s.price) || 0,
    })),
    ingredients: item.ingredients.slice(0, 12).map((ing) => String(ing || '')),
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
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }

    let menuSnap, tableSnap, invSnap, staffCfgSnap, staffSnap;
    try {
      [menuSnap, tableSnap, invSnap, staffCfgSnap, staffSnap] =
        await Promise.all([
          getDocs(collection(db, 'menuItems')),
          getDocs(collection(db, 'tables')),
          getDocs(collection(db, 'inventory')),
          getDoc(doc(db, 'config', 'staff')),
          getDocs(collection(db, 'staff')),
        ]);
    } catch (readErr) {
      const msg = readErr instanceof Error ? readErr.message : String(readErr || '');
      if (msg.toLowerCase().includes('offline') || msg.toLowerCase().includes('unavailable')) {
        return;
      }
      throw readErr;
    }

    const batch = writeBatch(db);
    let hasWrites = false;

    if (menuSnap && menuSnap.empty) {
      INITIAL_MENU_ITEMS.forEach((item, idx) => {
        batch.set(doc(db, 'menuItems', item.id), buildMenuDocPayload(item, idx));
      });
      hasWrites = true;
    }

    if (tableSnap && tableSnap.empty) {
      INITIAL_TABLES.forEach((tbl) => {
        const docPayload: Record<string, unknown> = {
          number: tbl.number,
          status: tbl.status === 'ocupada' ? 'ocupada' : 'libre',
          capacity: tbl.capacity,
          updatedAt: serverTimestamp(),
        };
        if (tbl.name) docPayload.name = tbl.name.slice(0, 80);
        if (tbl.zone) docPayload.zone = tbl.zone.slice(0, 40);
        batch.set(doc(db, 'tables', `mesa-${tbl.number}`), docPayload);
      });
      hasWrites = true;
    }

    if (invSnap && invSnap.empty) {
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

    if (staffCfgSnap && !staffCfgSnap.exists()) {
      batch.set(doc(db, 'config', 'staff'), {
        adminPin: DEFAULT_ADMIN_PIN,
        mozoPin: DEFAULT_MOZO_PIN,
        updatedAt: serverTimestamp(),
      });
      hasWrites = true;
    }

    if (staffSnap && staffSnap.empty) {
      batch.set(doc(db, 'staff', 'staff-carlos'), {
        id: 'staff-carlos',
        name: 'Carlos (Mozo)',
        role: 'Mozo',
        pin: DEFAULT_MOZO_PIN,
        active: true,
        permissions: DEFAULT_PERMISSIONS_BY_ROLE.Mozo,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      hasWrites = true;
    }

    if (hasWrites) {
      await batch.commit();
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error || '');
    if (msg.toLowerCase().includes('offline') || msg.toLowerCase().includes('unavailable')) {
      return;
    }
    handleFirestoreError(
      error,
      OperationType.WRITE,
      'menuItems|tables|inventory|config/staff|staff'
    );
  }
}

function notifyListenerError(
  error: unknown,
  operationType: OperationType,
  path: string,
  onError?: (err: unknown) => void
): void {
  try {
    handleFirestoreError(error, operationType, path);
  } catch (structuredError) {
    if (onError) {
      onError(structuredError);
    }
  }
}

export function subscribeMenuItems(
  onData: (items: MenuItem[]) => void,
  onError?: (error: unknown) => void
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
      notifyListenerError(error, OperationType.LIST, 'menuItems', onError);
    }
  );
}

export function subscribeTables(
  onData: (tables: TableItem[]) => void,
  onError?: (error: unknown) => void
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
        const num = Number(data.number);
        const zone =
          typeof data.zone === 'string' && data.zone.trim()
            ? data.zone.trim()
            : 'Salón';
        const name =
          typeof data.name === 'string' && data.name.trim()
            ? data.name.trim()
            : `Mesa ${num}`;
        return {
          id: d.id,
          number: num,
          name,
          zone,
          status: data.status === 'ocupada' ? 'ocupada' : 'libre',
          capacity: Number(data.capacity) || 4,
        };
      });
      onData(list);
    },
    (error) => {
      notifyListenerError(error, OperationType.LIST, 'tables', onError);
    }
  );
}

export function subscribeOrders(
  userUid: string,
  isStaff: boolean,
  onData: (orders: KitchenOrder[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const q = isStaff
    ? query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    : query(collection(db, 'orders'), where('customerUid', '==', userUid));

  let latestSeq = 0;

  return onSnapshot(
    q,
    async (snapshot) => {
      const seq = ++latestSeq;
      const rawDocs = snapshot.docs.map((d) => {
        const data = d.data();
        const ts =
          data.createdAt instanceof Timestamp
            ? data.createdAt.toMillis()
            : Date.now();
        const order: KitchenOrder & { _createdAtMs: number } = {
          id: data.id || d.id,
          code: data.code,
          customerUid: data.customerUid,
          mode: data.mode,
          tableNumber: typeof data.tableNumber === 'number' ? data.tableNumber : undefined,
          customerLabel: data.customerLabel,
          pickupNote: typeof data.pickupNote === 'string' ? data.pickupNote : undefined,
          confirmationCode:
            typeof data.confirmationCode === 'string'
              ? data.confirmationCode
              : undefined,
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
          billRequested: Boolean(data.billRequested),
          ratingStars: typeof data.ratingStars === 'number' ? data.ratingStars : undefined,
          _createdAtMs: ts,
        };
        return order;
      });

      rawDocs.sort((a, b) => b._createdAtMs - a._createdAtMs);

      const enriched = await Promise.all(
        rawDocs.map(async ({ _createdAtMs: _ts, ...ord }) => {
          let nextOrder: KitchenOrder = ord;
          if (ord.mode === 'delivery') {
            try {
              const piiSnap = await getDoc(doc(db, 'orders', ord.id, 'private', 'delivery'));
              if (piiSnap.exists()) {
                const pii = piiSnap.data();
                nextOrder = {
                  ...nextOrder,
                  deliveryAddress: pii.address,
                  deliveryPhone: pii.phone,
                  customerPhone: normalizeWhatsAppPhone(String(pii.phone || '')) || undefined,
                };
              }
            } catch {
              // Ignore if private doc does not exist
            }
          }
          try {
            const contactSnap = await getDoc(doc(db, 'orders', ord.id, 'private', 'contact'));
            if (contactSnap.exists()) {
              const contactData = contactSnap.data();
              if (typeof contactData.phone === 'string' && contactData.phone) {
                nextOrder = {
                  ...nextOrder,
                  customerPhone: contactData.phone,
                };
              }
            }
          } catch {
            // Ignore if private contact doc does not exist
          }
          return nextOrder;
        })
      );

      if (seq !== latestSeq) return;
      onData(enriched);
    },
    (error) => {
      notifyListenerError(error, OperationType.LIST, 'orders', onError);
    }
  );
}

export function subscribeTableSessions(
  onData: (sessions: Record<number, { customerPhone: string; activeOrderId?: string }>) => void,
  onError?: (error: unknown) => void
): () => void {
  return onSnapshot(
    collection(db, 'table_sessions'),
    (snapshot) => {
      const next: Record<number, { customerPhone: string; activeOrderId?: string }> = {};
      snapshot.docs.forEach((d) => {
        const data = d.data();
        const tableNum = Number(data.tableNumber);
        const phone = typeof data.customerPhone === 'string' ? data.customerPhone : '';
        if (Number.isInteger(tableNum) && tableNum >= 1 && tableNum <= 99 && phone) {
          next[tableNum] = {
            customerPhone: phone,
            activeOrderId:
              typeof data.activeOrderId === 'string' ? data.activeOrderId : undefined,
          };
        }
      });
      onData(next);
    },
    (error) => {
      notifyListenerError(error, OperationType.LIST, 'table_sessions', onError);
    }
  );
}

export function subscribeCustomerContacts(
  onData: (contacts: CustomerContactItem[]) => void,
  onError?: (error: unknown) => void
): () => void {
  return onSnapshot(
    collection(db, 'customer_contacts'),
    (snapshot) => {
      const list: CustomerContactItem[] = snapshot.docs.map((d) => {
        const data = d.data();
        const updatedDate =
          data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null;
        return {
          phone: String(data.phone || d.id),
          customerUid: typeof data.customerUid === 'string' ? data.customerUid : undefined,
          lastTableNumber:
            typeof data.lastTableNumber === 'number' ? data.lastTableNumber : undefined,
          lastMode: data.lastMode || 'dine-in',
          lastOrderCode:
            typeof data.lastOrderCode === 'string' ? data.lastOrderCode : undefined,
          lastOrderTotal: Number(data.lastOrderTotal) || 0,
          ordersCount: Number(data.ordersCount) || 1,
          source: data.source || 'qr-table',
          updatedAtLabel: updatedDate
            ? updatedDate.toLocaleDateString('es-BO', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })
            : undefined,
        };
      });
      onData(list);
    },
    (error) => {
      notifyListenerError(error, OperationType.LIST, 'customer_contacts', onError);
    }
  );
}

export function subscribeInventory(
  onData: (items: InventoryItem[]) => void,
  onError?: (error: unknown) => void
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
      notifyListenerError(error, OperationType.LIST, 'inventory', onError);
    }
  );
}

export function subscribeStaffConfig(
  onPins: (pins: { adminPin: string; mozoPin: string }) => void,
  onError?: (error: unknown) => void
): () => void {
  return onSnapshot(
    doc(db, 'config', 'staff'),
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const adminPin =
          typeof data?.adminPin === 'string' && /^[0-9]{4}$/.test(data.adminPin)
            ? data.adminPin
            : DEFAULT_ADMIN_PIN;
        const mozoPin =
          typeof data?.mozoPin === 'string' && /^[0-9]{4}$/.test(data.mozoPin)
            ? data.mozoPin
            : DEFAULT_MOZO_PIN;
        onPins({ adminPin, mozoPin });
      }
    },
    (error) => {
      notifyListenerError(error, OperationType.GET, 'config/staff', onError);
    }
  );
}

export function subscribeStaffMembers(
  isAdmin: boolean,
  onData: (list: StaffMember[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const q = isAdmin
    ? collection(db, 'staff')
    : query(collection(db, 'staff'), where('active', '==', true));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: StaffMember[] = snapshot.docs
        .map((d) => {
          const data = d.data();
          const role: EmployeeRoleTitle =
            data.role === 'Cajero' || data.role === 'Cocina'
              ? data.role
              : 'Mozo';
          return {
            id: String(data.id || d.id),
            name: String(data.name || d.id),
            role,
            pin:
              typeof data.pin === 'string' && /^[0-9]{4}$/.test(data.pin)
                ? data.pin
                : DEFAULT_MOZO_PIN,
            active: Boolean(data.active),
            permissions: normalizeStaffPermissions(data.permissions, role),
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));
      onData(list);
    },
    (error) => {
      notifyListenerError(error, OperationType.LIST, 'staff', onError);
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

export async function upsertCustomerContactInFirestore(params: {
  phone: string;
  customerUid: string;
  lastTableNumber?: number;
  lastMode: OrderMode;
  lastOrderCode?: string;
  lastOrderTotal: number;
  source: 'qr-table' | 'delivery' | 'takeaway' | 'pos';
}): Promise<void> {
  const phoneKey = normalizeWhatsAppPhone(params.phone);
  if (!/^[0-9]{8,15}$/.test(phoneKey)) return;

  try {
    const ref = doc(db, 'customer_contacts', phoneKey);
    let existingCreatedAt: unknown = null;
    let existingOrdersCount = 0;
    let existingLastCode = '';
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        existingCreatedAt = data.createdAt || null;
        existingOrdersCount = Number(data.ordersCount) || 0;
        existingLastCode = typeof data.lastOrderCode === 'string' ? data.lastOrderCode : '';
      }
    } catch {
      // Non-staff user reading another UID's contact doc gets permission-denied; skip silently
      return;
    }

    const isNewOrder =
      Boolean(params.lastOrderCode) && params.lastOrderCode !== existingLastCode;
    const nextOrdersCount = existingCreatedAt
      ? existingOrdersCount + (isNewOrder ? 1 : 0)
      : params.lastOrderCode
      ? 1
      : 0;

    const payload: Record<string, unknown> = {
      phone: phoneKey,
      customerUid: params.customerUid,
      lastMode: params.lastMode,
      lastOrderTotal: Math.max(0, Number(params.lastOrderTotal) || 0),
      ordersCount: Math.max(0, Math.min(10000, nextOrdersCount)),
      source: params.source,
      createdAt: existingCreatedAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (typeof params.lastTableNumber === 'number') {
      payload.lastTableNumber = params.lastTableNumber;
    }
    if (params.lastOrderCode && params.lastOrderCode.trim()) {
      payload.lastOrderCode = params.lastOrderCode.trim().slice(0, 20);
    }

    await setDoc(ref, payload);
  } catch {
    // Non-blocking CRM sync
  }
}

export async function upsertTableSessionInFirestore(params: {
  tableNumber: number;
  customerUid: string;
  customerPhone: string;
  activeOrderId?: string;
}): Promise<void> {
  const cleanPhone = normalizeWhatsAppPhone(params.customerPhone);
  if (!/^[0-9]{8,15}$/.test(cleanPhone)) return;
  const tableId = `mesa-${params.tableNumber}`;
  try {
    const payload: Record<string, unknown> = {
      tableNumber: params.tableNumber,
      customerUid: params.customerUid,
      customerPhone: cleanPhone,
      updatedAt: serverTimestamp(),
    };
    if (params.activeOrderId) {
      payload.activeOrderId = params.activeOrderId;
    }
    await setDoc(doc(db, 'table_sessions', tableId), payload);
    await upsertCustomerContactInFirestore({
      phone: cleanPhone,
      customerUid: params.customerUid,
      lastTableNumber: params.tableNumber,
      lastMode: 'dine-in',
      lastOrderTotal: 0,
      source: 'qr-table',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `table_sessions/${tableId}`);
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
      items: sanitizeOrderLines(order.items),
      notes: (order.notes || '').slice(0, 300),
      status: order.status,
      total: Number(order.total),
      estimatedMinutes: Number(order.estimatedMinutes),
      createdAtLabel: order.createdAt.slice(0, 20),
      paid: Boolean(order.paid),
      waiterRequested: Boolean(order.waiterRequested),
      billRequested: Boolean(order.billRequested),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (order.mode === 'dine-in' && typeof order.tableNumber === 'number') {
      orderDoc.tableNumber = order.tableNumber;
    }
    if (order.mode === 'takeaway' && order.pickupNote && order.pickupNote.trim()) {
      orderDoc.pickupNote = order.pickupNote.trim().slice(0, 120);
    }
    if (
      (order.mode === 'takeaway' || order.mode === 'delivery') &&
      order.confirmationCode &&
      /^[0-9]{4}$/.test(order.confirmationCode.trim())
    ) {
      orderDoc.confirmationCode = order.confirmationCode.trim();
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

    const rawContactPhone =
      order.customerPhone ||
      order.deliveryPhone ||
      (order.mode === 'takeaway' && order.pickupNote
        ? order.pickupNote.match(/\b[67]\d{7}\b/)?.[0] || ''
        : '');
    const normalizedContactPhone = normalizeWhatsAppPhone(rawContactPhone);

    if (/^[0-9]{8,15}$/.test(normalizedContactPhone)) {
      const contactDoc: Record<string, unknown> = {
        customerUid,
        phone: normalizedContactPhone,
        updatedAt: serverTimestamp(),
      };
      if (order.mode === 'dine-in' && typeof order.tableNumber === 'number') {
        contactDoc.tableNumber = order.tableNumber;
      }
      batch.set(doc(db, 'orders', order.id, 'private', 'contact'), contactDoc);
    }

    await batch.commit();

    if (
      occupyTableIfNeeded &&
      (occupyTableIfNeeded.isStaff || occupyTableIfNeeded.isCurrentlyFree)
    ) {
      void (async () => {
        try {
          const tableRef = doc(db, 'tables', `mesa-${occupyTableIfNeeded.tableNumber}`);
          const tableSnap = await getDoc(tableRef);
          if (tableSnap.exists()) {
            const currentStatus = tableSnap.data()?.status;
            if (occupyTableIfNeeded.isStaff || currentStatus === 'libre') {
              await updateDoc(tableRef, {
                status: 'ocupada',
                updatedAt: serverTimestamp(),
              });
            }
          } else if (occupyTableIfNeeded.isStaff) {
            await setDoc(tableRef, {
              number: occupyTableIfNeeded.tableNumber,
              status: 'ocupada',
              capacity: occupyTableIfNeeded.capacity || 4,
              updatedAt: serverTimestamp(),
            });
          }
        } catch {
          // Non-blocking table status sync; order itself is already saved in Firestore
        }
      })();
    }

    if (
      /^[0-9]{8,15}$/.test(normalizedContactPhone) &&
      order.mode === 'dine-in' &&
      typeof order.tableNumber === 'number' &&
      !order.paid
    ) {
      void setDoc(doc(db, 'table_sessions', `mesa-${order.tableNumber}`), {
        tableNumber: order.tableNumber,
        customerUid,
        customerPhone: normalizedContactPhone,
        activeOrderId: order.id,
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    }

    if (/^[0-9]{8,15}$/.test(normalizedContactPhone)) {
      void upsertCustomerContactInFirestore({
        phone: normalizedContactPhone,
        customerUid,
        lastTableNumber: order.tableNumber,
        lastMode: order.mode,
        lastOrderCode: order.code,
        lastOrderTotal: order.total,
        source:
          order.mode === 'dine-in'
            ? 'qr-table'
            : order.mode === 'delivery'
            ? 'delivery'
            : 'takeaway',
      });
    }
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
      items: sanitizeOrderLines(params.items),
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
  waiterRequested: boolean,
  billRequested?: boolean
): Promise<void> {
  try {
    const payload: Record<string, unknown> = {
      waiterRequested,
      updatedAt: serverTimestamp(),
    };
    if (typeof billRequested === 'boolean') {
      payload.billRequested = billRequested;
    }
    await updateDoc(doc(db, 'orders', orderId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
  }
}

export async function updateOrderItemsInFirestore(params: {
  orderId: string;
  items: OrderLineItem[];
  total: number;
}): Promise<void> {
  try {
    await updateDoc(doc(db, 'orders', params.orderId), {
      items: sanitizeOrderLines(params.items),
      total: Number(params.total),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${params.orderId}`);
  }
}

export async function deleteOrderInFirestore(params: {
  orderId: string;
  isDelivery: boolean;
  tableNumberToFree?: number;
}): Promise<void> {
  try {
    const batch = writeBatch(db);
    if (params.isDelivery) {
      batch.delete(doc(db, 'orders', params.orderId, 'private', 'delivery'));
    }
    batch.delete(doc(db, 'orders', params.orderId, 'private', 'contact'));
    batch.delete(doc(db, 'orders', params.orderId));
    if (typeof params.tableNumberToFree === 'number') {
      const tableRef = doc(db, 'tables', `mesa-${params.tableNumberToFree}`);
      const tableSnap = await getDoc(tableRef);
      if (tableSnap.exists()) {
        batch.update(tableRef, {
          status: 'libre',
          updatedAt: serverTimestamp(),
        });
      }
      batch.delete(doc(db, 'table_sessions', `mesa-${params.tableNumberToFree}`));
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `orders/${params.orderId}`);
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
      status: 'Cobrado',
      paid: true,
      paymentMethod: params.method,
      waiterRequested: false,
      billRequested: false,
      updatedAt: serverTimestamp(),
    });

    if (typeof params.tableNumberToFree === 'number') {
      const tableRef = doc(db, 'tables', `mesa-${params.tableNumberToFree}`);
      const tableSnap = await getDoc(tableRef);
      if (tableSnap.exists()) {
        batch.update(tableRef, {
          status: 'libre',
          updatedAt: serverTimestamp(),
        });
      }
      batch.delete(doc(db, 'table_sessions', `mesa-${params.tableNumberToFree}`));
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
    const batch = writeBatch(db);
    const tableRef = doc(db, 'tables', `mesa-${tableNumber}`);
    const tableSnap = await getDoc(tableRef);
    if (tableSnap.exists()) {
      batch.update(tableRef, {
        status: 'libre',
        updatedAt: serverTimestamp(),
      });
    }
    batch.delete(doc(db, 'table_sessions', `mesa-${tableNumber}`));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tables/mesa-${tableNumber}`);
  }
}

export async function createTableInFirestore(table: TableItem): Promise<void> {
  const tableId = `mesa-${table.number}`;
  try {
    const payload: Record<string, unknown> = {
      number: Math.max(1, Math.min(99, Math.round(table.number))),
      status: table.status === 'ocupada' ? 'ocupada' : 'libre',
      capacity: Math.max(1, Math.min(30, Math.round(table.capacity))),
      updatedAt: serverTimestamp(),
    };
    if (table.name && table.name.trim()) {
      payload.name = table.name.trim().slice(0, 80);
    }
    if (table.zone && table.zone.trim()) {
      payload.zone = table.zone.trim().slice(0, 40);
    }
    await setDoc(doc(db, 'tables', tableId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `tables/${tableId}`);
  }
}

export async function deleteTableInFirestore(tableNumber: number): Promise<void> {
  const tableId = `mesa-${tableNumber}`;
  try {
    await deleteDoc(doc(db, 'tables', tableId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `tables/${tableId}`);
  }
}

export async function moveTableOrderInFirestore(params: {
  orderIds: string[];
  fromTableNumber: number;
  toTableNumber: number;
  toCustomerLabel: string;
}): Promise<void> {
  try {
    let existingSession: Record<string, unknown> | null = null;
    try {
      const snap = await getDoc(doc(db, 'table_sessions', `mesa-${params.fromTableNumber}`));
      if (snap.exists()) {
        existingSession = snap.data();
      }
    } catch {
      // Ignore if no session doc exists
    }

    const batch = writeBatch(db);
    batch.update(doc(db, 'tables', `mesa-${params.fromTableNumber}`), {
      status: 'libre',
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'tables', `mesa-${params.toTableNumber}`), {
      status: 'ocupada',
      updatedAt: serverTimestamp(),
    });
    params.orderIds.forEach((orderId) => {
      batch.update(doc(db, 'orders', orderId), {
        tableNumber: params.toTableNumber,
        customerLabel: params.toCustomerLabel.slice(0, 80),
        updatedAt: serverTimestamp(),
      });
    });

    if (existingSession && typeof existingSession.customerPhone === 'string') {
      const nextSession: Record<string, unknown> = {
        tableNumber: params.toTableNumber,
        customerUid: existingSession.customerUid || 'local-staff',
        customerPhone: existingSession.customerPhone,
        updatedAt: serverTimestamp(),
      };
      if (typeof existingSession.activeOrderId === 'string') {
        nextSession.activeOrderId = existingSession.activeOrderId;
      }
      batch.set(doc(db, 'table_sessions', `mesa-${params.toTableNumber}`), nextSession);
      batch.delete(doc(db, 'table_sessions', `mesa-${params.fromTableNumber}`));
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `tables/mesa-${params.fromTableNumber}->mesa-${params.toTableNumber}`
    );
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

export async function saveStaffConfigPinsInFirestore(params: {
  adminPin: string;
  mozoPin: string;
}): Promise<void> {
  try {
    await setDoc(doc(db, 'config', 'staff'), {
      adminPin: params.adminPin,
      mozoPin: params.mozoPin,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'config/staff');
  }
}

export async function upsertStaffMemberInFirestore(
  member: StaffMember
): Promise<void> {
  const path = `staff/${member.id}`;
  try {
    const ref = doc(db, 'staff', member.id);
    const snap = await getDoc(ref);
    const cleanPermissions = normalizeStaffPermissions(
      member.permissions,
      member.role
    );
    if (!snap.exists()) {
      await setDoc(ref, {
        id: member.id,
        name: member.name.trim().slice(0, 80),
        role: member.role,
        pin: member.pin,
        active: Boolean(member.active),
        permissions: cleanPermissions,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        name: member.name.trim().slice(0, 80),
        role: member.role,
        pin: member.pin,
        active: Boolean(member.active),
        permissions: cleanPermissions,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function toggleStaffActiveInFirestore(
  staffId: string,
  active: boolean
): Promise<void> {
  try {
    await updateDoc(doc(db, 'staff', staffId), {
      active,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `staff/${staffId}`);
  }
}

export async function deleteStaffMemberInFirestore(
  staffId: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, 'staff', staffId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `staff/${staffId}`);
  }
}

export async function activateStaffSessionInFirestore(params: {
  uid: string;
  staffId: string;
  name: string;
  role: StaffRoleTitle;
  pin: string;
  isAdmin: boolean;
}): Promise<void> {
  try {
    await setDoc(doc(db, 'staff_sessions', params.uid), {
      uid: params.uid,
      staffId: params.staffId,
      name: params.name.trim().slice(0, 80),
      role: params.role,
      pin: params.pin,
      isAdmin: params.isAdmin,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.WRITE,
      `staff_sessions/${params.uid}`
    );
  }
}

export async function clearStaffSessionInFirestore(
  uid: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, 'staff_sessions', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `staff_sessions/${uid}`);
  }
}

export function buildOrderCode(existingCount: number): string {
  const suffix = String(Date.now()).slice(-3);
  return `#${1001 + existingCount}-${suffix}`.slice(0, 20);
}

export type { OrderMode };
