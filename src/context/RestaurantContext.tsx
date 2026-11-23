import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import {
  INITIAL_DELIVERY_INFO,
  INITIAL_INVENTORY,
  INITIAL_MENU_ITEMS,
  INITIAL_TABLES,
} from '../data/mockData';
import { auth } from '../firebase';
import {
  ALL_STAFF_PERMISSIONS,
  DEFAULT_ADMIN_PIN,
  DEFAULT_MOZO_PIN,
  DEFAULT_PERMISSIONS_BY_ROLE,
  activateStaffSessionInFirestore,
  appendOrderItemsInFirestore,
  buildOrderCode,
  clearStaffSessionInFirestore,
  collectOrderPaymentInFirestore,
  createOrderInFirestore,
  createTableInFirestore,
  customerPayOrderInFirestore,
  deleteOrderInFirestore,
  deleteStaffMemberInFirestore,
  deleteTableInFirestore,
  freeTableInFirestore,
  moveTableOrderInFirestore,
  normalizeStaffPermissions,
  rateOrderInFirestore,
  saveInventoryInFirestore,
  saveStaffConfigPinsInFirestore,
  seedInitialCatalogIfEmpty,
  setWaiterCallInFirestore,
  subscribeCustomerContacts,
  subscribeInventory,
  subscribeMenuItems,
  subscribeOrders,
  subscribeStaffConfig,
  subscribeStaffMembers,
  subscribeTableSessions,
  subscribeTables,
  toggleStaffActiveInFirestore,
  updateOrderItemsInFirestore,
  updateOrderStatusInFirestore,
  upsertMenuItemInFirestore,
  upsertStaffMemberInFirestore,
  upsertTableSessionInFirestore,
} from '../services/firestoreService';
import {
  ActiveStaffSession,
  CartItem,
  CustomerContactItem,
  DeliveryInfo,
  DishSizeOption,
  EmployeeRoleTitle,
  ExtraOption,
  InventoryItem,
  KitchenOrder,
  MenuItem,
  OrderLineItem,
  OrderMode,
  OrderStatus,
  PaymentMethod,
  ScreenId,
  StaffMember,
  StaffPermissions,
  TableItem,
  TakeawayInfo,
} from '../types/app';
import { validateBoliviaPhone } from '../utils/ticketHelpers';
import {
  cartItemsToOrderLines,
  formatBs,
  generateConfirmationCode,
  getActiveOrderForTable,
  getCartCount,
  getCartTotal,
  getCurrentTimeLabel,
  getOrderLinesTotal,
  getTakeawayCustomerName,
  isOrderSettled,
} from '../utils/appHelpers';

export type AppUserRole = 'admin' | 'mozo' | 'customer';

const EMPTY_PERMISSIONS: StaffPermissions = {
  orders_tables: false,
  kitchen_board: false,
  cashier_billing: false,
  menu_pricing: false,
  reports_history: false,
};

const GUEST_UID_STORAGE_KEY = 'comoencasa_guest_uid_v1';
const QR_PHONES_STORAGE_KEY = 'comoencasa_qr_table_phones_v1';
const STAFF_PINS_STORAGE_KEY = 'comoencasa_staff_pins_v1';
const STAFF_MEMBERS_STORAGE_KEY = 'comoencasa_staff_members_v1';
const ACTIVE_SHIFT_SESSION_KEY = 'comoencasa_active_staff_session_v1';

const DEFAULT_STARTER_STAFF: StaffMember[] = [
  {
    id: 'staff-carlos',
    name: 'Carlos (Mozo)',
    role: 'Mozo',
    pin: DEFAULT_MOZO_PIN,
    active: true,
    permissions: DEFAULT_PERMISSIONS_BY_ROLE.Mozo,
  },
];

function getOrCreateGuestUid(): string {
  if (typeof window === 'undefined') return 'guest-ssr';
  try {
    const existing = window.localStorage.getItem(GUEST_UID_STORAGE_KEY);
    if (existing && existing.trim()) return existing.trim();
    const generated = `anon-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    window.localStorage.setItem(GUEST_UID_STORAGE_KEY, generated);
    return generated;
  } catch {
    return `anon-${Date.now()}`;
  }
}

function readStoredPins(): { adminPin: string; mozoPin: string } {
  if (typeof window === 'undefined') {
    return { adminPin: DEFAULT_ADMIN_PIN, mozoPin: DEFAULT_MOZO_PIN };
  }
  try {
    const raw = window.localStorage.getItem(STAFF_PINS_STORAGE_KEY);
    if (!raw) {
      return { adminPin: DEFAULT_ADMIN_PIN, mozoPin: DEFAULT_MOZO_PIN };
    }
    const parsed = JSON.parse(raw) as Partial<{
      adminPin: string;
      mozoPin: string;
    }>;
    return {
      adminPin:
        typeof parsed.adminPin === 'string' && /^[0-9]{4}$/.test(parsed.adminPin)
          ? parsed.adminPin
          : DEFAULT_ADMIN_PIN,
      mozoPin:
        typeof parsed.mozoPin === 'string' && /^[0-9]{4}$/.test(parsed.mozoPin)
          ? parsed.mozoPin
          : DEFAULT_MOZO_PIN,
    };
  } catch {
    return { adminPin: DEFAULT_ADMIN_PIN, mozoPin: DEFAULT_MOZO_PIN };
  }
}

function writeStoredPins(pins: { adminPin: string; mozoPin: string }): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STAFF_PINS_STORAGE_KEY, JSON.stringify(pins));
  } catch {
    // Ignore storage errors
  }
}

function readStoredStaffMembers(): StaffMember[] {
  if (typeof window === 'undefined') return DEFAULT_STARTER_STAFF;
  try {
    const raw = window.localStorage.getItem(STAFF_MEMBERS_STORAGE_KEY);
    if (!raw) return DEFAULT_STARTER_STAFF;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_STARTER_STAFF;
    return parsed
      .filter((item) => item && typeof item.id === 'string')
      .map((item) => {
        const role: EmployeeRoleTitle =
          item.role === 'Cajero' || item.role === 'Cocina' ? item.role : 'Mozo';
        return {
          id: String(item.id),
          name: String(item.name || 'Personal'),
          role,
          pin:
            typeof item.pin === 'string' && /^[0-9]{4}$/.test(item.pin)
              ? item.pin
              : DEFAULT_MOZO_PIN,
          active: Boolean(item.active),
          permissions: normalizeStaffPermissions(item.permissions, role),
        };
      });
  } catch {
    return DEFAULT_STARTER_STAFF;
  }
}

function writeStoredStaffMembers(list: StaffMember[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STAFF_MEMBERS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore storage errors
  }
}

function readStoredShiftSession(): ActiveStaffSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(ACTIVE_SHIFT_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ActiveStaffSession>;
    if (
      !parsed ||
      typeof parsed.staffId !== 'string' ||
      typeof parsed.pin !== 'string'
    ) {
      return null;
    }
    const isAdmin = Boolean(parsed.isAdmin);
    const fallbackRole: EmployeeRoleTitle =
      parsed.role === 'Cajero' || parsed.role === 'Cocina'
        ? parsed.role
        : 'Mozo';
    return {
      staffId: parsed.staffId,
      name: String(parsed.name || (isAdmin ? 'Administrador' : 'Personal')),
      role: isAdmin ? 'Admin' : fallbackRole,
      pin: parsed.pin,
      isAdmin,
      permissions: isAdmin
        ? ALL_STAFF_PERMISSIONS
        : normalizeStaffPermissions(parsed.permissions, fallbackRole),
    };
  } catch {
    return null;
  }
}

function writeStoredShiftSession(session: ActiveStaffSession | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!session) {
      window.sessionStorage.removeItem(ACTIVE_SHIFT_SESSION_KEY);
      return;
    }
    window.sessionStorage.setItem(
      ACTIVE_SHIFT_SESSION_KEY,
      JSON.stringify(session)
    );
  } catch {
    // Ignore storage errors
  }
}

function parseTableParamFromUrl(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('mesa') && !params.has('tableId')) return null;
    const raw = params.get('mesa') || params.get('tableId') || '';
    if (!raw) return null;
    const cleaned = raw.replace(/^mesa-/i, '').trim();
    const num = Number.parseInt(cleaned, 10);
    if (Number.isInteger(num) && num >= 1 && num <= 99) {
      return num;
    }
  } catch {
    // Ignore malformed query string
  }
  return null;
}

function clearQrParamsFromUrl(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('mesa') && !url.searchParams.has('tableId')) {
      return;
    }
    url.searchParams.delete('mesa');
    url.searchParams.delete('tableId');
    const nextSearch = url.searchParams.toString();
    const cleanUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ''}${url.hash}`;
    window.history.replaceState(window.history.state, '', cleanUrl);
  } catch {
    // Ignore history API errors
  }
}

function clearStoredQrSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(QR_PHONES_STORAGE_KEY);
    window.localStorage.removeItem(QR_PHONES_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

function readStoredTablePhones(): Record<number, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(QR_PHONES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    const clean: Record<number, string> = {};
    Object.entries(parsed).forEach(([k, v]) => {
      const num = Number.parseInt(k, 10);
      if (Number.isInteger(num) && typeof v === 'string' && v.trim()) {
        clean[num] = v.trim();
      }
    });
    return clean;
  } catch {
    return {};
  }
}

function writeStoredTablePhones(map: Record<number, string>): void {
  if (typeof window === 'undefined') return;
  try {
    if (Object.keys(map).length === 0) {
      window.sessionStorage.removeItem(QR_PHONES_STORAGE_KEY);
      window.localStorage.removeItem(QR_PHONES_STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(QR_PHONES_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage errors
  }
}

interface RestaurantContextValue {
  // Navigation & overlays
  history: ScreenId[];
  currentScreen: ScreenId;
  navDirection: number;
  navigate: (screen: ScreenId) => void;
  goBack: () => void;
  showCartDrawer: boolean;
  setShowCartDrawer: React.Dispatch<React.SetStateAction<boolean>>;
  toastMsg: string;
  showToast: (msg: string) => void;

  // Anonymous Firebase Auth & PIN Staff Session
  firebaseUser: User | null;
  authReady: boolean;
  isAdmin: boolean;
  isStaffSession: boolean;
  userRole: AppUserRole;
  activeStaffSession: ActiveStaffSession | null;
  permissions: StaffPermissions;
  canTakeOrdersAndTables: boolean;
  canViewKitchenBoard: boolean;
  canCollectPayments: boolean;
  canEditMenu: boolean;
  canViewReports: boolean;
  staffMembers: StaffMember[];
  adminPin: string;
  mozoPin: string;
  loginWithPin: (pin: string) => Promise<{
    ok: boolean;
    error?: string;
    session?: ActiveStaffSession;
  }>;
  logoutStaffSession: () => void;

  // Shared global restaurant data
  menuItems: MenuItem[];
  tables: TableItem[];
  orders: KitchenOrder[];
  inventory: InventoryItem[];
  customerContacts: CustomerContactItem[];

  // Selection & Cart
  selectedDishId: string;
  setSelectedDishId: React.Dispatch<React.SetStateAction<string>>;
  selectedDish: MenuItem | undefined;
  favoriteIds: string[];
  handleToggleFavorite: (id: string) => void;
  orderMode: OrderMode;
  setOrderMode: React.Dispatch<React.SetStateAction<OrderMode>>;
  selectedTable: number;
  tableCustomerPhone: string;
  handleSelectTable: (tableNumber: number) => void;
  handleConfirmQrTableWelcome: (rawPhone?: string) => void;
  exitQrTableMode: () => void;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  cartCount: number;
  cartTotal: number;
  takeawayInfo: TakeawayInfo;
  setTakeawayInfo: React.Dispatch<React.SetStateAction<TakeawayInfo>>;
  deliveryInfo: DeliveryInfo;
  setDeliveryInfo: React.Dispatch<React.SetStateAction<DeliveryInfo>>;

  // Active orders & payments
  activeTableOrder: KitchenOrder | undefined;
  activeDeliveryOrder: KitchenOrder | undefined;
  linkedTakeawayOrder: KitchenOrder | undefined;
  selectedTakeawayOrderId: string | null;
  linkedDeliveryOrder: KitchenOrder | undefined;
  selectedDeliveryOrderId: string | null;
  lastPaidOrder: KitchenOrder | undefined;
  paymentMethod: PaymentMethod;
  setPaymentMethod: React.Dispatch<React.SetStateAction<PaymentMethod>>;
  paymentContext: 'table' | 'takeaway' | 'delivery-prepay';
  setPaymentContext: React.Dispatch<
    React.SetStateAction<'table' | 'takeaway' | 'delivery-prepay'>
  >;
  lastPaidAmount: number;

  // Operations
  handleAddToCart: (
    item: MenuItem,
    size: DishSizeOption,
    extras: ExtraOption[]
  ) => void;
  handleUpdateCartQuantity: (cartItemId: string, delta: number) => void;
  handleChangeCartItemSize: (cartItemId: string, sizeId: string) => void;
  handleRemoveCartItem: (cartItemId: string) => void;
  handleSaveCustomize: (payload: {
    base: string;
    toppings: string[];
    side: string;
    selectedAdditions: { item: MenuItem; size: DishSizeOption }[];
  }) => void;
  handleCartProceedOrder: () => void;
  handleDeliveryInfoContinue: () => void;
  handleCompletePayment: () => void;
  handleUpdateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    verificationCode?: string
  ) => void;
  handleCallWaiter: (orderId: string) => void;
  handleRequestBill: (orderId: string) => void;
  handleDismissWaiterCall: (orderId: string) => void;
  handleCollectOrderPayment: (orderId: string, method: PaymentMethod) => void;
  handleCreatePosOrder: (payload: {
    mode: OrderMode;
    tableNumber?: number;
    customerName?: string;
    pickupNote?: string;
    deliveryAddress?: string;
    deliveryPhone?: string;
    notes: string;
    items: OrderLineItem[];
    payNowMethod?: PaymentMethod;
  }) => KitchenOrder;
  handleFreeTable: (tableNumber: number) => void;
  handleCreateTable: (payload: {
    number: number;
    name: string;
    zone: string;
    capacity: number;
  }) => boolean;
  handleDeleteTable: (tableNumber: number) => boolean;
  handleMoveTableOrder: (
    fromTableNumber: number,
    toTableNumber: number
  ) => boolean;
  handleSelectTakeawayOrder: (orderId: string | null) => void;
  handleSelectDeliveryOrder: (orderId: string | null) => void;
  loadOrderIntoLivePanel: (
    order: KitchenOrder,
    options?: { openDrawerOnCompact?: boolean; goToMenu?: boolean }
  ) => void;
  handleUpdateOrderItemQty: (
    orderId: string,
    itemIndex: number,
    delta: number
  ) => void;
  handleDeleteOrder: (order: KitchenOrder) => void;
  handleRateOrder: (orderId: string, stars: number) => void;
  handlePayTableOrder: (ord: KitchenOrder) => void;

  // Admin catalog / inventory / staff mutations
  handleToggleDishAvailability: (id: string) => void;
  handleSaveDishEdit: (updated: MenuItem) => void;
  handleAddNewDish: (newItem: MenuItem) => void;
  handleUpdateInventory: (updated: InventoryItem[]) => void;
  handleUpdateAdminPin: (newPin: string) => Promise<boolean>;
  handleSaveStaffMember: (payload: {
    id?: string;
    name: string;
    role: EmployeeRoleTitle;
    pin: string;
    active: boolean;
    permissions: StaffPermissions;
  }) => Promise<{ ok: boolean; error?: string }>;
  handleToggleStaffActive: (staffId: string, active: boolean) => void;
  handleDeleteStaffMember: (staffId: string) => void;
}

const RestaurantContext = createContext<RestaurantContextValue | null>(null);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const initialQrTableRef = useRef<number | null>(parseTableParamFromUrl());
  const [history, setHistory] = useState<ScreenId[]>(() =>
    initialQrTableRef.current ? ['welcome', 'table-qr-welcome'] : ['welcome']
  );
  const [navDirection, setNavDirection] = useState<number>(1);
  const currentScreen = history[history.length - 1];

  // Silent Anonymous Auth + Local Guest UID Fallback (zero Google popups)
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const anonAttemptedRef = useRef<boolean>(false);
  const guestUidRef = useRef<string>(getOrCreateGuestUid());
  const effectiveUid = firebaseUser?.uid || guestUidRef.current;

  // PIN-Verified Staff & Admin Shift Session
  const [storedPins, setStoredPins] = useState<{
    adminPin: string;
    mozoPin: string;
  }>(() => readStoredPins());
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() =>
    readStoredStaffMembers()
  );
  const [activeStaffSession, setActiveStaffSession] =
    useState<ActiveStaffSession | null>(() => readStoredShiftSession());

  // Sync live permissions if Admin edits an employee in Firestore
  const resolvedStaffSession = useMemo<ActiveStaffSession | null>(() => {
    if (!activeStaffSession) return null;
    if (activeStaffSession.isAdmin) {
      return {
        ...activeStaffSession,
        role: 'Admin',
        permissions: ALL_STAFF_PERMISSIONS,
      };
    }
    const liveMember = staffMembers.find(
      (m) => m.id === activeStaffSession.staffId
    );
    if (!liveMember) return activeStaffSession;
    return {
      ...activeStaffSession,
      name: liveMember.name,
      role: liveMember.role,
      permissions: liveMember.permissions,
    };
  }, [activeStaffSession, staffMembers]);

  const isAdmin = Boolean(resolvedStaffSession?.isAdmin);
  const isStaffSession = Boolean(resolvedStaffSession);
  const userRole: AppUserRole = resolvedStaffSession
    ? resolvedStaffSession.isAdmin
      ? 'admin'
      : 'mozo'
    : 'customer';

  const permissions: StaffPermissions = useMemo(() => {
    if (!resolvedStaffSession) return EMPTY_PERMISSIONS;
    if (resolvedStaffSession.isAdmin) return ALL_STAFF_PERMISSIONS;
    return resolvedStaffSession.permissions;
  }, [resolvedStaffSession]);

  const canTakeOrdersAndTables = permissions.orders_tables;
  const canViewKitchenBoard = permissions.kitchen_board;
  const canCollectPayments = permissions.cashier_billing;
  const canEditMenu = permissions.menu_pricing;
  const canViewReports = permissions.reports_history;
  const canOpenAdminWorkspace =
    isAdmin ||
    canEditMenu ||
    canViewReports ||
    canCollectPayments ||
    canViewKitchenBoard;

  // Drawers & Toast
  const [showCartDrawer, setShowCartDrawer] = useState<boolean>(false);

  // Unified Global State (Menu, Tables, Orders, Inventory, Contacts)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [tables, setTables] = useState<TableItem[]>(INITIAL_TABLES);
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const deletedOrderIdsRef = useRef<Set<string>>(new Set());

  const [selectedDishId, setSelectedDishId] = useState<string>('pollo-al-horno');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [orderMode, setOrderMode] = useState<OrderMode>('dine-in');
  const [selectedTable, setSelectedTable] = useState<number>(
    () => initialQrTableRef.current ?? 1
  );
  const [cart, setCart] = useState<CartItem[]>([]);
  const [takeawayInfo, setTakeawayInfo] = useState<TakeawayInfo>({
    customerName: '',
    pickupNote: '',
  });
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>(
    INITIAL_DELIVERY_INFO
  );

  const [activeTableOrderId, setActiveTableOrderId] = useState<string | null>(
    null
  );
  const [activeDeliveryOrderId, setActiveDeliveryOrderId] = useState<
    string | null
  >(null);
  const [selectedTakeawayOrderId, setSelectedTakeawayOrderId] = useState<
    string | null
  >(null);
  const [selectedDeliveryOrderId, setSelectedDeliveryOrderId] = useState<
    string | null
  >(null);
  const [lastPaidOrderId, setLastPaidOrderId] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('QR');
  const [paymentContext, setPaymentContext] = useState<
    'table' | 'takeaway' | 'delivery-prepay'
  >('table');
  const [lastPaidAmount, setLastPaidAmount] = useState<number>(0);

  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [customerContacts, setCustomerContacts] = useState<
    CustomerContactItem[]
  >([]);
  const [cloudTableSessions, setCloudTableSessions] = useState<
    Record<number, { customerPhone: string; activeOrderId?: string }>
  >({});
  const [tablePhonesByNumber, setTablePhonesByNumber] = useState<
    Record<number, string>
  >(() => readStoredTablePhones());
  const [toastMsg, setToastMsg] = useState<string>('');

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? '' : curr));
    }, 2600);
  }, []);

  useEffect(() => {
    if (initialQrTableRef.current) {
      showToast(`Mesa ${initialQrTableRef.current} detectada por QR`);
      initialQrTableRef.current = null;
    }
  }, [showToast]);

  const closeActiveOverlays = useCallback(() => {
    setShowCartDrawer(false);
  }, []);

  const exitQrTableMode = useCallback(() => {
    closeActiveOverlays();
    clearQrParamsFromUrl();
    clearStoredQrSession();
    setTablePhonesByNumber({});
    setCloudTableSessions({});
    setActiveTableOrderId(null);
    setSelectedTable(1);
    setNavDirection(-1);
    setHistory(['welcome']);
  }, [closeActiveOverlays]);

  const navigate = useCallback(
    (screen: ScreenId) => {
      closeActiveOverlays();
      let target = screen;
      if (target === 'admin-panel' && !canOpenAdminWorkspace) {
        target = 'admin-login';
      }

      if (target === 'welcome') {
        clearQrParamsFromUrl();
        clearStoredQrSession();
        setTablePhonesByNumber({});
        setNavDirection(-1);
        setHistory(['welcome']);
        return;
      }

      setNavDirection(1);
      setHistory((prev) => {
        if (prev[prev.length - 1] === target) return prev;
        return [...prev, target];
      });
    },
    [canOpenAdminWorkspace, closeActiveOverlays]
  );

  const goBack = useCallback(() => {
    closeActiveOverlays();
    setNavDirection(-1);
    setHistory((prev) => {
      const nextHistory: ScreenId[] =
        prev.length > 1 ? prev.slice(0, -1) : ['welcome'];
      const nextScreen = nextHistory[nextHistory.length - 1];
      if (nextScreen === 'welcome') {
        clearQrParamsFromUrl();
        clearStoredQrSession();
      }
      return nextHistory;
    });
  }, [closeActiveOverlays]);

  // Silent Anonymous Firebase Authentication (zero popups, offline/local fallback)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        setAuthReady(true);
        return;
      }

      if (!anonAttemptedRef.current) {
        anonAttemptedRef.current = true;
        try {
          const cred = await signInAnonymously(auth);
          setFirebaseUser(cred.user);
        } catch {
          // If Anonymous Auth is disabled or network is offline, run cleanly with local guest UID
          setFirebaseUser(null);
        }
      } else {
        setFirebaseUser(null);
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Re-sync PIN-verified staff_sessions doc whenever Firebase user & active shift exist
  useEffect(() => {
    if (!authReady || !firebaseUser || !resolvedStaffSession) return;
    void activateStaffSessionInFirestore({
      uid: firebaseUser.uid,
      staffId: resolvedStaffSession.staffId,
      name: resolvedStaffSession.name,
      role: resolvedStaffSession.role,
      pin: resolvedStaffSession.pin,
      isAdmin: resolvedStaffSession.isAdmin,
    })
      .then(() => {
        if (resolvedStaffSession.isAdmin) {
          return seedInitialCatalogIfEmpty();
        }
        return undefined;
      })
      .catch(() => {
        // Non-blocking fallback when Firestore auth/rules are bootstrapping
      });
  }, [authReady, firebaseUser, resolvedStaffSession]);

  // If Admin deactivates a logged-in employee remotely, close that shift cleanly
  useEffect(() => {
    if (!resolvedStaffSession || resolvedStaffSession.isAdmin) return;
    const match = staffMembers.find((m) => m.id === resolvedStaffSession.staffId);
    if (match && !match.active) {
      writeStoredShiftSession(null);
      setActiveStaffSession(null);
      if (firebaseUser) {
        void clearStaffSessionInFirestore(firebaseUser.uid).catch(() => {});
      }
      closeActiveOverlays();
      setHistory(['welcome']);
      showToast('Tu usuario fue desactivado por el Administrador');
    }
  }, [
    closeActiveOverlays,
    firebaseUser,
    resolvedStaffSession,
    showToast,
    staffMembers,
  ]);

  // Public real-time listeners: Menu & Tables (shared across all roles)
  useEffect(() => {
    const unsubMenu = subscribeMenuItems(setMenuItems);
    const unsubTables = subscribeTables((cloudTables) => {
      setOrders((currentOrders) => {
        const localOccupiedTables = new Set(
          currentOrders
            .filter(
              (o) =>
                o.mode === 'dine-in' &&
                o.tableNumber &&
                o.status !== 'Cobrado' &&
                !o.paid &&
                o.customerUid === 'local-staff'
            )
            .map((o) => o.tableNumber as number)
        );
        setTables(
          cloudTables.map((t) =>
            localOccupiedTables.has(t.number)
              ? { ...t, status: 'ocupada' }
              : t
          )
        );
        return currentOrders;
      });
    });
    return () => {
      unsubMenu();
      unsubTables();
    };
  }, []);

  // Real-time Orders listener (anonymous Firebase UID for customers, all orders for active staff)
  useEffect(() => {
    if (!authReady || !firebaseUser) return;
    const unsubOrders = subscribeOrders(
      firebaseUser.uid,
      isStaffSession,
      (cloudOrders) => {
        setOrders((prev) => {
          const filteredCloud = cloudOrders.filter(
            (o) => !deletedOrderIdsRef.current.has(o.id)
          );
          const cloudById = new Map(filteredCloud.map((o) => [o.id, o]));
          const preservedLocal = prev.filter((o) => {
            if (deletedOrderIdsRef.current.has(o.id)) return false;
            if (cloudById.has(o.id)) return false;
            if (o.customerUid === 'local-staff') return true;
            return !isStaffSession;
          });
          return [...filteredCloud, ...preservedLocal];
        });
      }
    );
    return () => unsubOrders();
  }, [authReady, firebaseUser, isStaffSession]);

  // Staff Config (PINs) & Staff Directory listeners (signed-in terminal)
  useEffect(() => {
    if (!authReady || !firebaseUser) return;
    const unsubConfig = subscribeStaffConfig((pins) => {
      setStoredPins(pins);
      writeStoredPins(pins);
    });
    const unsubStaff = subscribeStaffMembers(isAdmin, (cloudList) => {
      if (cloudList.length > 0) {
        setStaffMembers(cloudList);
        writeStoredStaffMembers(cloudList);
      }
    });
    return () => {
      unsubConfig();
      unsubStaff();
    };
  }, [authReady, firebaseUser, isAdmin]);

  // Staff-gated real-time Table Sessions & Customer Contacts listeners
  useEffect(() => {
    if (!authReady || !firebaseUser || !isStaffSession) {
      setCloudTableSessions({});
      setCustomerContacts([]);
      return;
    }
    const unsubSessions = subscribeTableSessions(setCloudTableSessions);
    const unsubContacts = subscribeCustomerContacts(setCustomerContacts);
    return () => {
      unsubSessions();
      unsubContacts();
    };
  }, [authReady, firebaseUser, isStaffSession]);

  // Inventory listener (Admin or Reports permission)
  useEffect(() => {
    if (!authReady || !firebaseUser || (!isAdmin && !canViewReports)) {
      return;
    }
    const unsubInv = subscribeInventory(setInventory);
    return () => unsubInv();
  }, [authReady, firebaseUser, isAdmin, canViewReports]);

  // Sync locally captured QR table phone to Firestore once anonymous UID exists
  useEffect(() => {
    if (!firebaseUser) return;
    const localPhone = tablePhonesByNumber[selectedTable];
    if (!localPhone) return;
    void upsertTableSessionInFirestore({
      tableNumber: selectedTable,
      customerUid: firebaseUser.uid,
      customerPhone: localPhone,
    }).catch(() => {});
  }, [firebaseUser, selectedTable, tablePhonesByNumber]);

  const loginWithPin = useCallback(
    async (
      rawPin: string
    ): Promise<{
      ok: boolean;
      error?: string;
      session?: ActiveStaffSession;
    }> => {
      const pin = rawPin.replace(/\D/g, '').slice(0, 4);
      if (pin.length !== 4) {
        return { ok: false, error: 'Ingresa un PIN de 4 dígitos.' };
      }

      let nextSession: ActiveStaffSession | null = null;

      if (pin === storedPins.adminPin) {
        nextSession = {
          staffId: 'admin',
          name: 'Administrador',
          role: 'Admin',
          pin,
          isAdmin: true,
          permissions: ALL_STAFF_PERMISSIONS,
        };
      } else {
        const matchedStaff = staffMembers.find((m) => m.pin === pin);
        if (matchedStaff) {
          if (!matchedStaff.active) {
            return {
              ok: false,
              error: `El usuario ${matchedStaff.name} está inactivo. Solicita activación al Administrador.`,
            };
          }
          nextSession = {
            staffId: matchedStaff.id,
            name: matchedStaff.name,
            role: matchedStaff.role,
            pin,
            isAdmin: false,
            permissions: normalizeStaffPermissions(
              matchedStaff.permissions,
              matchedStaff.role
            ),
          };
        } else if (staffMembers.length === 0 && pin === storedPins.mozoPin) {
          nextSession = {
            staffId: 'staff-carlos',
            name: 'Carlos (Mozo)',
            role: 'Mozo',
            pin,
            isAdmin: false,
            permissions: DEFAULT_PERMISSIONS_BY_ROLE.Mozo,
          };
        }
      }

      if (!nextSession) {
        return {
          ok: false,
          error: 'PIN incorrecto. Verifica tus 4 dígitos con Administración.',
        };
      }

      closeActiveOverlays();
      writeStoredShiftSession(nextSession);
      setActiveStaffSession(nextSession);

      if (firebaseUser) {
        try {
          await activateStaffSessionInFirestore({
            uid: firebaseUser.uid,
            staffId: nextSession.staffId,
            name: nextSession.name,
            role: nextSession.role,
            pin: nextSession.pin,
            isAdmin: nextSession.isAdmin,
          });
          if (nextSession.isAdmin) {
            void seedInitialCatalogIfEmpty().catch(() => {});
          }
        } catch {
          // Local shift remains active even if offline
        }
      }

      setNavDirection(1);
      let landingScreen: ScreenId = 'cart';
      if (nextSession.isAdmin) {
        landingScreen = 'admin-panel';
      } else if (
        nextSession.permissions.kitchen_board ||
        nextSession.permissions.cashier_billing
      ) {
        landingScreen = 'cart';
      } else if (nextSession.permissions.orders_tables) {
        landingScreen = 'tables-select';
      } else if (
        nextSession.permissions.menu_pricing ||
        nextSession.permissions.reports_history
      ) {
        landingScreen = 'admin-panel';
      }

      setHistory((prev) =>
        prev[prev.length - 1] === landingScreen ? prev : [...prev, landingScreen]
      );

      showToast(`Turno: ${nextSession.name} (${nextSession.role})`);
      return { ok: true, session: nextSession };
    },
    [closeActiveOverlays, firebaseUser, showToast, staffMembers, storedPins]
  );

  const logoutStaffSession = useCallback(() => {
    closeActiveOverlays();
    clearQrParamsFromUrl();
    writeStoredShiftSession(null);
    setActiveStaffSession(null);
    if (firebaseUser) {
      void clearStaffSessionInFirestore(firebaseUser.uid).catch(() => {});
    }
    setNavDirection(-1);
    setHistory(['welcome']);
    showToast('Turno cerrado correctamente');
  }, [closeActiveOverlays, firebaseUser, showToast]);

  const selectedDish = useMemo(
    () =>
      menuItems.find((m) => m.id === selectedDishId) ||
      menuItems.find((m) => m.available) ||
      menuItems[0],
    [menuItems, selectedDishId]
  );

  const cartCount = useMemo(() => getCartCount(cart), [cart]);
  const cartTotal = useMemo(() => getCartTotal(cart), [cart]);

  const activeTableOrder = useMemo(() => {
    if (activeTableOrderId) {
      const byId = orders.find(
        (o) =>
          o.id === activeTableOrderId &&
          o.tableNumber === selectedTable &&
          o.status !== 'Cobrado'
      );
      const tableObj = tables.find((t) => t.number === selectedTable);
      if (byId && (!byId.paid || tableObj?.status === 'ocupada')) {
        return byId;
      }
    }
    return getActiveOrderForTable(orders, tables, selectedTable);
  }, [orders, tables, activeTableOrderId, selectedTable]);

  const activeDeliveryOrder = useMemo(() => {
    if (activeDeliveryOrderId) {
      const byId = orders.find((o) => o.id === activeDeliveryOrderId);
      if (byId) return byId;
    }
    return orders.find((o) => o.mode === 'delivery' && !isOrderSettled(o));
  }, [orders, activeDeliveryOrderId]);

  const linkedTakeawayOrder = useMemo(() => {
    if (!selectedTakeawayOrderId) return undefined;
    return orders.find(
      (o) =>
        o.id === selectedTakeawayOrderId &&
        o.mode === 'takeaway' &&
        !isOrderSettled(o)
    );
  }, [orders, selectedTakeawayOrderId]);

  const linkedDeliveryOrder = useMemo(() => {
    if (!selectedDeliveryOrderId) return undefined;
    return orders.find(
      (o) =>
        o.id === selectedDeliveryOrderId &&
        o.mode === 'delivery' &&
        !isOrderSettled(o)
    );
  }, [orders, selectedDeliveryOrderId]);

  const lastPaidOrder = useMemo(
    () => orders.find((o) => o.id === lastPaidOrderId),
    [orders, lastPaidOrderId]
  );

  const enrichedTables = useMemo(
    () =>
      tables.map((t) => {
        const cloudPhone = cloudTableSessions[t.number]?.customerPhone;
        const localPhone = tablePhonesByNumber[t.number];
        const phone = cloudPhone || localPhone;
        return phone ? { ...t, customerPhone: phone } : t;
      }),
    [tables, cloudTableSessions, tablePhonesByNumber]
  );

  const tableCustomerPhone = useMemo(
    () =>
      cloudTableSessions[selectedTable]?.customerPhone ||
      tablePhonesByNumber[selectedTable] ||
      activeTableOrder?.customerPhone ||
      '',
    [
      activeTableOrder?.customerPhone,
      cloudTableSessions,
      selectedTable,
      tablePhonesByNumber,
    ]
  );

  const handleSelectTable = useCallback((tableNumber: number) => {
    setSelectedTable(tableNumber);
  }, []);

  const handleConfirmQrTableWelcome = useCallback(
    (rawPhone?: string) => {
      setOrderMode('dine-in');
      if (rawPhone && rawPhone.trim()) {
        const parsed = validateBoliviaPhone(rawPhone);
        if (parsed.valid) {
          setTablePhonesByNumber((prev) => {
            const next = { ...prev, [selectedTable]: parsed.whatsappDigits };
            writeStoredTablePhones(next);
            return next;
          });
          if (firebaseUser) {
            void upsertTableSessionInFirestore({
              tableNumber: selectedTable,
              customerUid: firebaseUser.uid,
              customerPhone: parsed.whatsappDigits,
            }).catch(() => {});
          }
          showToast(
            `WhatsApp ${parsed.display} guardado · Bienvenido a Mesa ${selectedTable}`
          );
        }
      } else {
        showToast(`Mesa ${selectedTable} lista · Elige tus platillos`);
      }
      navigate('menu');
    },
    [firebaseUser, navigate, selectedTable, showToast]
  );

  const handleSelectTakeawayOrder = useCallback((orderId: string | null) => {
    setSelectedTakeawayOrderId(orderId);
  }, []);

  const handleSelectDeliveryOrder = useCallback((orderId: string | null) => {
    setSelectedDeliveryOrderId(orderId);
    if (orderId) {
      setActiveDeliveryOrderId(orderId);
    }
  }, []);

  const handleToggleFavorite = useCallback((id: string) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }, []);

  const handleAddToCart = useCallback(
    (item: MenuItem, size: DishSizeOption, extras: ExtraOption[]) => {
      setCart((prev) => {
        const existing = prev.find(
          (c) =>
            c.menuItemId === item.id &&
            c.sizeId === size.id &&
            c.extras.map((e) => e.id).join(',') ===
              extras.map((e) => e.id).join(',') &&
            !c.customSummary
        );
        if (existing) {
          return prev.map((c) =>
            c.cartItemId === existing.cartItemId
              ? { ...c, quantity: c.quantity + 1 }
              : c
          );
        }
        return [
          ...prev,
          {
            cartItemId: `ci-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 6)}`,
            menuItemId: item.id,
            name: item.name,
            category: item.category,
            sizeId: size.id,
            sizeLabel: size.label,
            unitPrice: size.price,
            quantity: 1,
            extras,
          },
        ];
      });
      showToast(`${item.name} (${size.label}) agregado al carrito`);
    },
    [showToast]
  );

  const handleUpdateCartQuantity = useCallback(
    (cartItemId: string, delta: number) => {
      setCart((prev) =>
        prev
          .map((item) =>
            item.cartItemId === cartItemId
              ? { ...item, quantity: item.quantity + delta }
              : item
          )
          .filter((item) => item.quantity > 0)
      );
    },
    []
  );

  const handleChangeCartItemSize = useCallback(
    (cartItemId: string, sizeId: string) => {
      setCart((prev) =>
        prev.map((item) => {
          if (item.cartItemId !== cartItemId) return item;
          const menu = menuItems.find((m) => m.id === item.menuItemId);
          const newSize = menu?.sizes.find((s) => s.id === sizeId);
          if (!newSize) return item;
          return {
            ...item,
            sizeId: newSize.id,
            sizeLabel: newSize.label,
            unitPrice: newSize.price,
          };
        })
      );
    },
    [menuItems]
  );

  const handleRemoveCartItem = useCallback((cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  }, []);

  const handleSaveCustomize = useCallback(
    (payload: {
      base: string;
      toppings: string[];
      side: string;
      selectedAdditions: { item: MenuItem; size: DishSizeOption }[];
    }) => {
      const customSummary = `Base: ${payload.base} · Toppings: ${
        payload.toppings.join(', ') || 'Ninguno'
      } · Acompañamiento: ${payload.side}`;

      const newCartItems: CartItem[] = payload.selectedAdditions.map(
        (add, idx) => ({
          cartItemId: `cust-${Date.now()}-${idx}`,
          menuItemId: add.item.id,
          name: add.item.name,
          category: add.item.category,
          sizeId: add.size.id,
          sizeLabel: add.size.label,
          unitPrice: add.size.price,
          quantity: 1,
          extras: [],
          customSummary: idx === 0 ? customSummary : undefined,
        })
      );

      if (newCartItems.length === 0) {
        newCartItems.push({
          cartItemId: `cust-bowl-${Date.now()}`,
          menuItemId: 'pollo-al-horno',
          name: 'Plato Personalizado',
          category: 'Platos Fuertes',
          sizeId: 'entero',
          sizeLabel: 'Entero',
          unitPrice: 15,
          quantity: 1,
          extras: [],
          customSummary,
        });
      }

      setCart((prev) => [...prev, ...newCartItems]);
      showToast('Personalización guardada en tu carrito');
      navigate('cart');
    },
    [navigate, showToast]
  );

  const executeDineInOrder = useCallback(
    (ownerUid: string, stayInWorkspace = false) => {
      const lines = cartItemsToOrderLines(cart);
      const capturedPhone =
        tablePhonesByNumber[selectedTable] ||
        cloudTableSessions[selectedTable]?.customerPhone ||
        undefined;
      const existingUnpaid = orders.find(
        (o) =>
          o.mode === 'dine-in' &&
          o.tableNumber === selectedTable &&
          o.status !== 'Cobrado' &&
          !o.paid &&
          (isStaffSession || o.customerUid === ownerUid)
      );

      const canSyncCloud = Boolean(firebaseUser);

      if (existingUnpaid) {
        const updatedItems = [...existingUnpaid.items, ...lines];
        const updatedTotal = existingUnpaid.total + cartTotal;
        const resolvedPhone = existingUnpaid.customerPhone || capturedPhone;
        setOrders((prev) =>
          prev.map((o) =>
            o.id === existingUnpaid.id
              ? {
                  ...o,
                  items: updatedItems,
                  total: updatedTotal,
                  status: 'Preparando',
                  customerPhone: resolvedPhone,
                }
              : o
          )
        );
        setActiveTableOrderId(existingUnpaid.id);
        if (
          canSyncCloud &&
          (isStaffSession || existingUnpaid.customerUid === ownerUid)
        ) {
          void appendOrderItemsInFirestore({
            orderId: existingUnpaid.id,
            items: updatedItems,
            total: updatedTotal,
            status: 'Preparando',
          }).catch(() => {});
          if (resolvedPhone) {
            void upsertTableSessionInFirestore({
              tableNumber: selectedTable,
              customerUid: ownerUid,
              customerPhone: resolvedPhone,
              activeOrderId: existingUnpaid.id,
            }).catch(() => {});
          }
        }
      } else {
        const newOrderId = `ord-mesa-${Date.now()}`;
        const newOrder: KitchenOrder = {
          id: newOrderId,
          code: buildOrderCode(orders.length),
          customerUid: ownerUid,
          mode: 'dine-in',
          tableNumber: selectedTable,
          customerLabel: `Mesa ${selectedTable}`,
          customerPhone: capturedPhone,
          items: lines,
          notes: isStaffSession
            ? `Tomado por ${resolvedStaffSession?.name || 'Personal'}`
            : 'Pedido desde mesa',
          status: 'Preparando',
          total: cartTotal,
          estimatedMinutes: 15,
          createdAt: getCurrentTimeLabel(),
          paid: false,
          waiterRequested: false,
          billRequested: false,
        };
        const tableObj = tables.find((t) => t.number === selectedTable);
        setOrders((prev) => [newOrder, ...prev]);
        setActiveTableOrderId(newOrderId);
        setTables((prev) =>
          prev.map((t) =>
            t.number === selectedTable ? { ...t, status: 'ocupada' } : t
          )
        );

        if (canSyncCloud) {
          void createOrderInFirestore({
            order: newOrder,
            customerUid: ownerUid,
            occupyTableIfNeeded: {
              tableNumber: selectedTable,
              capacity: tableObj?.capacity || 4,
              isCurrentlyFree: tableObj?.status === 'libre',
              isStaff: isStaffSession,
            },
          }).catch(() => {});
        }
      }

      setCart([]);
      showToast(`Pedido enviado a Cocina · Mesa ${selectedTable}`);
      if (!stayInWorkspace) {
        navigate('tables-order');
      }
    },
    [
      cart,
      cartTotal,
      cloudTableSessions,
      firebaseUser,
      isStaffSession,
      navigate,
      orders,
      resolvedStaffSession?.name,
      selectedTable,
      showToast,
      tablePhonesByNumber,
      tables,
    ]
  );

  const executeTakeawayOrder = useCallback(
    (ownerUid: string, stayInWorkspace = false) => {
      const cleanName = takeawayInfo.customerName.trim().slice(0, 80);
      if (!cleanName) return;

      const cleanPickup = takeawayInfo.pickupNote.trim().slice(0, 120);
      const confirmationCode = generateConfirmationCode();
      const newOrderId = `ord-llv-${Date.now()}`;
      const takeawayOrder: KitchenOrder = {
        id: newOrderId,
        code: buildOrderCode(orders.length),
        customerUid: ownerUid,
        mode: 'takeaway',
        customerLabel: cleanName,
        pickupNote: cleanPickup || undefined,
        confirmationCode,
        items: cartItemsToOrderLines(cart),
        notes: isStaffSession
          ? `Para llevar (${resolvedStaffSession?.name || 'Personal'})`
          : 'Pedido Para Llevar',
        status: 'Preparando',
        total: cartTotal,
        estimatedMinutes: 15,
        createdAt: getCurrentTimeLabel(),
        paid: false,
        waiterRequested: false,
      };

      const canSyncCloud = Boolean(firebaseUser);
      setOrders((prev) => [takeawayOrder, ...prev]);
      setSelectedTakeawayOrderId(newOrderId);
      setCart([]);
      setTakeawayInfo({ customerName: '', pickupNote: '' });

      if (canSyncCloud) {
        void createOrderInFirestore({
          order: takeawayOrder,
          customerUid: ownerUid,
        }).catch(() => {});
      }

      showToast(
        `Pedido Para Llevar enviado · Código de retiro: ${confirmationCode}`
      );

      if (!stayInWorkspace) {
        navigate('cart');
      }
    },
    [
      cart,
      cartTotal,
      firebaseUser,
      isStaffSession,
      navigate,
      orders.length,
      resolvedStaffSession?.name,
      showToast,
      takeawayInfo,
    ]
  );

  const handleCartProceedOrder = useCallback(() => {
    if (cart.length === 0) return;

    if (orderMode === 'dine-in') {
      executeDineInOrder(effectiveUid, isStaffSession);
    } else if (orderMode === 'takeaway') {
      if (
        linkedTakeawayOrder &&
        !isOrderSettled(linkedTakeawayOrder) &&
        (isStaffSession || linkedTakeawayOrder.customerUid === effectiveUid)
      ) {
        const lines = cartItemsToOrderLines(cart);
        const updatedItems = [...linkedTakeawayOrder.items, ...lines];
        const updatedTotal = linkedTakeawayOrder.total + cartTotal;
        const updatedStatus: OrderStatus =
          linkedTakeawayOrder.status === 'Entregado'
            ? 'Preparando'
            : linkedTakeawayOrder.status;

        setOrders((prev) =>
          prev.map((o) =>
            o.id === linkedTakeawayOrder.id
              ? {
                  ...o,
                  items: updatedItems,
                  total: updatedTotal,
                  status: updatedStatus,
                }
              : o
          )
        );

        if (
          firebaseUser &&
          linkedTakeawayOrder.customerUid !== 'local-staff' &&
          (isStaffSession || linkedTakeawayOrder.customerUid === firebaseUser.uid)
        ) {
          void appendOrderItemsInFirestore({
            orderId: linkedTakeawayOrder.id,
            items: updatedItems,
            total: updatedTotal,
            status: updatedStatus,
          }).catch(() => {});
        }

        setCart([]);
        showToast(
          `Platos agregados a Para Llevar · ${linkedTakeawayOrder.code}`
        );
        return;
      }

      if (!takeawayInfo.customerName.trim()) {
        showToast('Ingresa el nombre del cliente para el pedido Para Llevar');
        return;
      }

      executeTakeawayOrder(effectiveUid, isStaffSession);
    } else if (
      isStaffSession &&
      linkedDeliveryOrder &&
      !isOrderSettled(linkedDeliveryOrder)
    ) {
      const lines = cartItemsToOrderLines(cart);
      const updatedItems = [...linkedDeliveryOrder.items, ...lines];
      const updatedTotal = linkedDeliveryOrder.total + cartTotal;
      const updatedStatus: OrderStatus =
        linkedDeliveryOrder.status === 'Entregado'
          ? 'Preparando'
          : linkedDeliveryOrder.status;

      setOrders((prev) =>
        prev.map((o) =>
          o.id === linkedDeliveryOrder.id
            ? {
                ...o,
                items: updatedItems,
                total: updatedTotal,
                status: updatedStatus,
              }
            : o
        )
      );

      if (
        firebaseUser &&
        linkedDeliveryOrder.customerUid !== 'local-staff' &&
        (isStaffSession || linkedDeliveryOrder.customerUid === firebaseUser.uid)
      ) {
        void appendOrderItemsInFirestore({
          orderId: linkedDeliveryOrder.id,
          items: updatedItems,
          total: updatedTotal,
          status: updatedStatus,
        }).catch(() => {});
      }

      setCart([]);
      showToast(`Platos agregados a Delivery ${linkedDeliveryOrder.code}`);
    } else {
      navigate('delivery-info');
    }
  }, [
    cart,
    cartTotal,
    effectiveUid,
    executeDineInOrder,
    executeTakeawayOrder,
    firebaseUser,
    isStaffSession,
    linkedDeliveryOrder,
    linkedTakeawayOrder,
    navigate,
    orderMode,
    showToast,
    takeawayInfo.customerName,
  ]);

  const createDeliveryOrderFromCart = useCallback(
    (ownerUid: string, paid: boolean, method?: PaymentMethod): KitchenOrder => {
      const newDelId = `ord-del-${Date.now()}`;
      const notesParts = [
        deliveryInfo.reference.trim(),
        deliveryInfo.notes.trim(),
      ].filter(Boolean);
      const deliveryOrder: KitchenOrder = {
        id: newDelId,
        code: buildOrderCode(orders.length),
        customerUid: ownerUid,
        mode: 'delivery',
        customerLabel: 'Pedido Delivery',
        confirmationCode: generateConfirmationCode(),
        deliveryAddress: deliveryInfo.address.trim(),
        deliveryPhone: deliveryInfo.phone.trim(),
        items: cartItemsToOrderLines(cart),
        notes: notesParts.join(' · '),
        status: 'Preparando',
        total: cartTotal,
        estimatedMinutes: 25,
        createdAt: getCurrentTimeLabel(),
        paid,
        paymentMethod: method,
        waiterRequested: false,
      };
      setOrders((prev) => [deliveryOrder, ...prev]);
      setActiveDeliveryOrderId(newDelId);
      setSelectedDeliveryOrderId(newDelId);
      setCart([]);

      if (firebaseUser) {
        void createOrderInFirestore({
          order: deliveryOrder,
          customerUid: ownerUid,
          deliveryReference: deliveryInfo.reference.trim(),
        }).catch(() => {});
      }

      return deliveryOrder;
    },
    [cart, cartTotal, deliveryInfo, firebaseUser, orders.length]
  );

  const handleDeliveryInfoContinue = useCallback(() => {
    if (cart.length === 0) {
      showToast('Agrega al menos un platillo antes de pedir Delivery');
      navigate('menu');
      return;
    }

    if (deliveryInfo.payOnDelivery) {
      createDeliveryOrderFromCart(effectiveUid, false);
      showToast('Pedido Delivery enviado a Cocina (pago contra entrega)');
      navigate('delivery-tracking');
    } else {
      setPaymentContext('delivery-prepay');
      navigate('payment-methods');
    }
  }, [
    cart.length,
    createDeliveryOrderFromCart,
    deliveryInfo.payOnDelivery,
    effectiveUid,
    navigate,
    showToast,
  ]);

  const handleCompletePayment = useCallback(() => {
    if (paymentContext === 'table') {
      if (!activeTableOrder) {
        showToast('No hay pedido activo en la mesa seleccionada');
        return;
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === activeTableOrder.id
            ? { ...o, paid: true, paymentMethod }
            : o
        )
      );
      setLastPaidOrderId(activeTableOrder.id);
      setLastPaidAmount(activeTableOrder.total);
      if (firebaseUser) {
        void customerPayOrderInFirestore(
          activeTableOrder.id,
          paymentMethod
        ).catch(() => {});
      }
      showToast(`Pago registrado para Mesa ${selectedTable}`);
      navigate('payment-confirm');
    } else if (paymentContext === 'takeaway') {
      if (!linkedTakeawayOrder) {
        showToast('No hay pedido Para Llevar seleccionado');
        return;
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === linkedTakeawayOrder.id
            ? { ...o, paid: true, paymentMethod }
            : o
        )
      );
      setLastPaidOrderId(linkedTakeawayOrder.id);
      setLastPaidAmount(linkedTakeawayOrder.total);
      if (firebaseUser) {
        void customerPayOrderInFirestore(
          linkedTakeawayOrder.id,
          paymentMethod
        ).catch(() => {});
      }
      showToast(
        `Pago registrado · Para Llevar (${getTakeawayCustomerName(linkedTakeawayOrder)})`
      );
      navigate('payment-confirm');
    } else {
      if (cart.length === 0) {
        showToast('Tu carrito está vacío');
        navigate('menu');
        return;
      }
      const created = createDeliveryOrderFromCart(
        effectiveUid,
        true,
        paymentMethod
      );
      setLastPaidOrderId(created.id);
      setLastPaidAmount(created.total);
      showToast('Pago confirmado · Tu Delivery está en preparación');
      navigate('payment-confirm');
    }
  }, [
    activeTableOrder,
    cart.length,
    createDeliveryOrderFromCart,
    effectiveUid,
    firebaseUser,
    linkedTakeawayOrder,
    navigate,
    paymentContext,
    paymentMethod,
    selectedTable,
    showToast,
  ]);

  const handleUpdateOrderStatus = useCallback(
    (orderId: string, status: OrderStatus, verificationCode?: string) => {
      const targetOrder = orders.find((o) => o.id === orderId);
      if (
        status === 'Entregado' &&
        targetOrder &&
        (targetOrder.mode === 'takeaway' || targetOrder.mode === 'delivery') &&
        targetOrder.confirmationCode &&
        targetOrder.status !== 'Entregado'
      ) {
        if (verificationCode?.trim() !== targetOrder.confirmationCode) {
          showToast(
            'Ingresa el código de 4 dígitos del cliente para confirmar la entrega'
          );
          return;
        }
      }

      const deliveredAtLabel =
        status === 'Entregado' ? getCurrentTimeLabel() : undefined;
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status,
                deliveredAt: deliveredAtLabel || o.deliveredAt,
              }
            : o
        )
      );
      if (firebaseUser && (isStaffSession || targetOrder?.customerUid === firebaseUser.uid)) {
        void updateOrderStatusInFirestore(
          orderId,
          status,
          deliveredAtLabel
        ).catch(() => {});
      }
      if (
        status === 'Entregado' &&
        targetOrder &&
        (targetOrder.mode === 'takeaway' || targetOrder.mode === 'delivery') &&
        targetOrder.confirmationCode
      ) {
        showToast(
          `Código verificado · Pedido ${targetOrder.code} marcado como Entregado`
        );
      }
    },
    [firebaseUser, isStaffSession, orders, showToast]
  );

  const handleCallWaiter = useCallback(
    (orderId: string) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, waiterRequested: true } : o))
      );
      if (firebaseUser) {
        void setWaiterCallInFirestore(orderId, true).catch(() => {});
      }
      showToast(`Mesero notificado para Mesa ${selectedTable}`);
    },
    [firebaseUser, selectedTable, showToast]
  );

  const handleRequestBill = useCallback(
    (orderId: string) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, waiterRequested: true, billRequested: true }
            : o
        )
      );
      if (firebaseUser) {
        void setWaiterCallInFirestore(orderId, true, true).catch(() => {});
      }
      showToast(`Cuenta solicitada · Mesa ${selectedTable} marcada Por pagar`);
    },
    [firebaseUser, selectedTable, showToast]
  );

  const handleDismissWaiterCall = useCallback(
    (orderId: string) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, waiterRequested: false } : o
        )
      );
      if (firebaseUser && isStaffSession) {
        void setWaiterCallInFirestore(orderId, false).catch(() => {});
      }
    },
    [firebaseUser, isStaffSession]
  );

  const clearTablePhoneSession = useCallback((tableNum: number) => {
    clearQrParamsFromUrl();
    setTablePhonesByNumber((prev) => {
      if (!(tableNum in prev)) return prev;
      const next = { ...prev };
      delete next[tableNum];
      writeStoredTablePhones(next);
      return next;
    });
    setCloudTableSessions((prev) => {
      if (!(tableNum in prev)) return prev;
      const next = { ...prev };
      delete next[tableNum];
      return next;
    });
  }, []);

  const handleCollectOrderPayment = useCallback(
    (orderId: string, method: PaymentMethod) => {
      if (isStaffSession && !canCollectPayments) {
        showToast('No tienes permiso de Caja y Cobros');
        return;
      }

      const targetOrder = orders.find((o) => o.id === orderId);

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'Cobrado',
                paid: true,
                paymentMethod: method,
                waiterRequested: false,
                billRequested: false,
              }
            : o
        )
      );

      let tableNumberToFree: number | undefined;
      if (targetOrder?.mode === 'dine-in' && targetOrder.tableNumber) {
        const tableNum = targetOrder.tableNumber;
        const hasOtherUnpaidOnTable = orders.some(
          (o) =>
            o.id !== orderId &&
            o.mode === 'dine-in' &&
            o.tableNumber === tableNum &&
            o.status !== 'Cobrado' &&
            !o.paid
        );

        if (!hasOtherUnpaidOnTable) {
          tableNumberToFree = tableNum;
          setTables((prev) =>
            prev.map((t) =>
              t.number === tableNum ? { ...t, status: 'libre' } : t
            )
          );
          clearTablePhoneSession(tableNum);
          if (activeTableOrderId === orderId) {
            setActiveTableOrderId(null);
          }
          if (orderMode === 'dine-in' && selectedTable === tableNum) {
            setCart([]);
          }
        }
      }

      if (selectedTakeawayOrderId === orderId) {
        setSelectedTakeawayOrderId(null);
        if (orderMode === 'takeaway') {
          setCart([]);
        }
      }

      if (selectedDeliveryOrderId === orderId) {
        setSelectedDeliveryOrderId(null);
        if (orderMode === 'delivery') {
          setCart([]);
        }
      }

      if (
        firebaseUser &&
        canCollectPayments &&
        targetOrder?.customerUid !== 'local-staff'
      ) {
        void collectOrderPaymentInFirestore({
          orderId,
          method,
          tableNumberToFree,
        }).catch(() => {});
      }

      if (tableNumberToFree) {
        showToast(
          `Cobrado (${method}) · Mesa ${tableNumberToFree} Libre y carrito en Bs. 0.00`
        );
      } else {
        showToast(`Comanda cobrada (${method})`);
      }
    },
    [
      activeTableOrderId,
      canCollectPayments,
      clearTablePhoneSession,
      firebaseUser,
      isStaffSession,
      orderMode,
      orders,
      selectedDeliveryOrderId,
      selectedTable,
      selectedTakeawayOrderId,
      showToast,
    ]
  );

  const handleCreatePosOrder = useCallback(
    (payload: {
      mode: OrderMode;
      tableNumber?: number;
      customerName?: string;
      pickupNote?: string;
      deliveryAddress?: string;
      deliveryPhone?: string;
      notes: string;
      items: OrderLineItem[];
      payNowMethod?: PaymentMethod;
    }): KitchenOrder => {
      const total = getOrderLinesTotal(payload.items);
      const newId = `ord-pos-${Date.now()}`;
      const canSyncCloud = Boolean(firebaseUser && isStaffSession);
      const ownerUid =
        canSyncCloud && firebaseUser ? firebaseUser.uid : 'local-staff';
      const isPaidNow = Boolean(payload.payNowMethod && canCollectPayments);

      const confirmationCode =
        payload.mode === 'takeaway' || payload.mode === 'delivery'
          ? generateConfirmationCode()
          : undefined;

      const newOrder: KitchenOrder = {
        id: newId,
        code: buildOrderCode(orders.length),
        customerUid: ownerUid,
        mode: payload.mode,
        tableNumber: payload.mode === 'dine-in' ? payload.tableNumber : undefined,
        customerLabel:
          payload.mode === 'dine-in'
            ? `Mesa ${payload.tableNumber}`
            : payload.mode === 'takeaway'
            ? payload.customerName?.trim().slice(0, 80) || 'Cliente Para Llevar'
            : 'Pedido Delivery (Caja)',
        pickupNote:
          payload.mode === 'takeaway' && payload.pickupNote?.trim()
            ? payload.pickupNote.trim().slice(0, 120)
            : undefined,
        confirmationCode,
        deliveryAddress:
          payload.mode === 'delivery' ? payload.deliveryAddress : undefined,
        deliveryPhone:
          payload.mode === 'delivery' ? payload.deliveryPhone : undefined,
        items: payload.items,
        notes:
          payload.notes ||
          (payload.mode === 'dine-in'
            ? 'Tomado en caja'
            : payload.mode === 'takeaway'
            ? 'Para llevar tomado en caja'
            : 'Delivery tomado en caja'),
        status: isPaidNow ? 'Cobrado' : 'Preparando',
        total,
        estimatedMinutes: payload.mode === 'delivery' ? 25 : 15,
        createdAt: getCurrentTimeLabel(),
        paid: isPaidNow,
        paymentMethod: isPaidNow ? payload.payNowMethod : undefined,
        waiterRequested: false,
      };

      setOrders((prev) => [newOrder, ...prev]);

      const tableObj =
        payload.mode === 'dine-in' && payload.tableNumber
          ? tables.find((t) => t.number === payload.tableNumber)
          : undefined;

      if (payload.mode === 'dine-in' && payload.tableNumber && !isPaidNow) {
        setTables((prev) =>
          prev.map((t) =>
            t.number === payload.tableNumber ? { ...t, status: 'ocupada' } : t
          )
        );
        setActiveTableOrderId(newId);
      } else if (payload.mode === 'takeaway' && !isPaidNow) {
        setSelectedTakeawayOrderId(newId);
      } else if (payload.mode === 'delivery') {
        setActiveDeliveryOrderId(newId);
        if (!isPaidNow) {
          setSelectedDeliveryOrderId(newId);
        }
      }

      if (canSyncCloud) {
        void createOrderInFirestore({
          order: newOrder,
          customerUid: ownerUid,
          occupyTableIfNeeded:
            payload.mode === 'dine-in' && payload.tableNumber && !isPaidNow
              ? {
                  tableNumber: payload.tableNumber,
                  capacity: tableObj?.capacity || 4,
                  isCurrentlyFree: tableObj?.status === 'libre',
                  isStaff: true,
                }
              : undefined,
        }).catch(() => {});
      }

      const codeHint = newOrder.confirmationCode
        ? ` · Código entrega: ${newOrder.confirmationCode}`
        : '';
      showToast(
        isPaidNow
          ? `Pedido ${newOrder.code} creado y cobrado (${formatBs(total)})${codeHint}`
          : `Pedido ${newOrder.code} enviado a Cocina${codeHint}`
      );

      return newOrder;
    },
    [
      canCollectPayments,
      firebaseUser,
      isStaffSession,
      orders.length,
      showToast,
      tables,
    ]
  );

  const handleFreeTable = useCallback(
    (tableNumber: number) => {
      if (isStaffSession && !canTakeOrdersAndTables && !canCollectPayments) {
        showToast('No tienes permiso para liberar mesas');
        return;
      }
      setTables((prev) =>
        prev.map((t) =>
          t.number === tableNumber ? { ...t, status: 'libre' } : t
        )
      );
      clearTablePhoneSession(tableNumber);
      if (
        activeTableOrder &&
        activeTableOrder.tableNumber === tableNumber &&
        activeTableOrder.paid
      ) {
        setActiveTableOrderId(null);
      }
      if (orderMode === 'dine-in' && selectedTable === tableNumber) {
        setCart([]);
      }
      if (firebaseUser && isStaffSession) {
        void freeTableInFirestore(tableNumber).catch(() => {});
      }
      showToast(`Mesa ${tableNumber} liberada`);
    },
    [
      activeTableOrder,
      canCollectPayments,
      canTakeOrdersAndTables,
      clearTablePhoneSession,
      firebaseUser,
      isStaffSession,
      orderMode,
      selectedTable,
      showToast,
    ]
  );

  const handleCreateTable = useCallback(
    (payload: {
      number: number;
      name: string;
      zone: string;
      capacity: number;
    }): boolean => {
      if (!isStaffSession || (!canTakeOrdersAndTables && !canCollectPayments)) {
        return false;
      }
      const num = Math.round(payload.number);
      if (!Number.isInteger(num) || num < 1 || num > 99) {
        showToast('El número de mesa debe estar entre 1 y 99');
        return false;
      }
      if (tables.some((t) => t.number === num)) {
        showToast(`Ya existe la Mesa ${num}`);
        return false;
      }

      const cleanZone = payload.zone.trim().slice(0, 40) || 'Salón';
      const cleanName =
        payload.name.trim().slice(0, 80) || `Mesa ${num} - ${cleanZone}`;
      const cleanCapacity = Math.max(
        1,
        Math.min(30, Math.round(payload.capacity) || 4)
      );

      const newTable: TableItem = {
        id: `mesa-${num}`,
        number: num,
        name: cleanName,
        zone: cleanZone,
        status: 'libre',
        capacity: cleanCapacity,
      };

      setTables((prev) =>
        [...prev, newTable].sort((a, b) => a.number - b.number)
      );

      if (firebaseUser && isStaffSession) {
        void createTableInFirestore(newTable).catch(() => {});
      }

      showToast(`${cleanName} agregada (${cleanZone})`);
      return true;
    },
    [
      canCollectPayments,
      canTakeOrdersAndTables,
      firebaseUser,
      isStaffSession,
      showToast,
      tables,
    ]
  );

  const handleDeleteTable = useCallback(
    (tableNumber: number): boolean => {
      if (!isStaffSession || (!canTakeOrdersAndTables && !canCollectPayments)) {
        return false;
      }
      const target = tables.find((t) => t.number === tableNumber);
      if (!target) return false;

      const hasActiveOrder = orders.some(
        (o) =>
          o.mode === 'dine-in' &&
          o.tableNumber === tableNumber &&
          o.status !== 'Cobrado' &&
          !o.paid
      );

      if (target.status === 'ocupada' || hasActiveOrder) {
        showToast('No puedes eliminar una mesa con consumo activo');
        return false;
      }

      const remaining = tables.filter((t) => t.number !== tableNumber);
      setTables(remaining);
      if (selectedTable === tableNumber && remaining.length > 0) {
        setSelectedTable(remaining[0].number);
      }

      if (firebaseUser && isStaffSession) {
        void deleteTableInFirestore(tableNumber).catch(() => {});
      }

      showToast(`${target.name || `Mesa ${tableNumber}`} eliminada`);
      return true;
    },
    [
      canCollectPayments,
      canTakeOrdersAndTables,
      firebaseUser,
      isStaffSession,
      orders,
      selectedTable,
      showToast,
      tables,
    ]
  );

  const handleMoveTableOrder = useCallback(
    (fromTableNumber: number, toTableNumber: number): boolean => {
      if (!isStaffSession || (!canTakeOrdersAndTables && !canCollectPayments)) {
        return false;
      }
      if (fromTableNumber === toTableNumber) return false;

      const sourceTable = tables.find((t) => t.number === fromTableNumber);
      const targetTable = tables.find((t) => t.number === toTableNumber);
      if (!sourceTable || !targetTable) return false;

      const targetHasActive = orders.some(
        (o) =>
          o.mode === 'dine-in' &&
          o.tableNumber === toTableNumber &&
          o.status !== 'Cobrado' &&
          !o.paid
      );
      if (targetTable.status === 'ocupada' || targetHasActive) {
        showToast(`La Mesa ${toTableNumber} ya está ocupada`);
        return false;
      }

      const activeOrdersToMove = orders.filter(
        (o) =>
          o.mode === 'dine-in' &&
          o.tableNumber === fromTableNumber &&
          o.status !== 'Cobrado'
      );
      if (activeOrdersToMove.length === 0) {
        showToast(`No hay pedido activo en Mesa ${fromTableNumber}`);
        return false;
      }

      const movingIds = new Set(activeOrdersToMove.map((o) => o.id));
      const newLabel = `Mesa ${toTableNumber}`;

      setOrders((prev) =>
        prev.map((o) =>
          movingIds.has(o.id)
            ? { ...o, tableNumber: toTableNumber, customerLabel: newLabel }
            : o
        )
      );

      setTables((prev) =>
        prev.map((t) => {
          if (t.number === fromTableNumber) return { ...t, status: 'libre' };
          if (t.number === toTableNumber) return { ...t, status: 'ocupada' };
          return t;
        })
      );

      setTablePhonesByNumber((prev) => {
        const movedPhone = prev[fromTableNumber];
        if (!movedPhone) return prev;
        const next = { ...prev, [toTableNumber]: movedPhone };
        delete next[fromTableNumber];
        writeStoredTablePhones(next);
        return next;
      });

      if (selectedTable === fromTableNumber) {
        setSelectedTable(toTableNumber);
      }

      if (firebaseUser && isStaffSession) {
        const cloudOrderIds = activeOrdersToMove
          .filter((o) => o.customerUid !== 'local-staff')
          .map((o) => o.id);
        void moveTableOrderInFirestore({
          orderIds: cloudOrderIds,
          fromTableNumber,
          toTableNumber,
          toCustomerLabel: newLabel,
        }).catch(() => {});
      }

      showToast(
        `Pedido trasladado de Mesa ${fromTableNumber} a Mesa ${toTableNumber}`
      );
      return true;
    },
    [
      canCollectPayments,
      canTakeOrdersAndTables,
      firebaseUser,
      isStaffSession,
      orders,
      selectedTable,
      showToast,
      tables,
    ]
  );

  const loadOrderIntoLivePanel = useCallback(
    (
      order: KitchenOrder,
      options?: { openDrawerOnCompact?: boolean; goToMenu?: boolean }
    ) => {
      if (order.mode === 'dine-in' && order.tableNumber) {
        setOrderMode('dine-in');
        setSelectedTable(order.tableNumber);
        setActiveTableOrderId(order.id);
      } else if (order.mode === 'takeaway') {
        setOrderMode('takeaway');
        setSelectedTakeawayOrderId(order.id);
      } else {
        setOrderMode('delivery');
        setSelectedDeliveryOrderId(order.id);
        setActiveDeliveryOrderId(order.id);
      }

      const displayLabel =
        order.mode === 'takeaway'
          ? `Para Llevar • ${getTakeawayCustomerName(order)}`
          : order.customerLabel;

      if (options?.goToMenu) {
        navigate('menu');
        showToast(
          order.mode === 'dine-in' && order.tableNumber
            ? `Mesa ${order.tableNumber} (${order.code}) cargada · Añade platos desde la Carta`
            : `${displayLabel} (${order.code}) cargado · Añade platos desde la Carta`
        );
        return;
      }

      if (
        options?.openDrawerOnCompact &&
        typeof window !== 'undefined' &&
        window.innerWidth < 1280
      ) {
        setShowCartDrawer(true);
      }

      showToast(
        `${displayLabel} (${order.code}) cargada en Comanda en Vivo`
      );
    },
    [navigate, showToast]
  );

  const handleUpdateOrderItemQty = useCallback(
    (orderId: string, itemIndex: number, delta: number) => {
      if (!isStaffSession) return;
      const target = orders.find((o) => o.id === orderId);
      if (!target || target.paid || target.status === 'Cobrado') return;
      const currentItem = target.items[itemIndex];
      if (!currentItem) return;

      const nextQty = currentItem.quantity + delta;
      let updatedItems: OrderLineItem[];
      if (nextQty <= 0) {
        if (target.items.length <= 1) {
          showToast('El pedido debe tener al menos 1 platillo');
          return;
        }
        updatedItems = target.items.filter((_, idx) => idx !== itemIndex);
      } else {
        updatedItems = target.items.map((it, idx) =>
          idx === itemIndex ? { ...it, quantity: nextQty } : it
        );
      }

      const updatedTotal = getOrderLinesTotal(updatedItems);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, items: updatedItems, total: updatedTotal }
            : o
        )
      );

      if (
        firebaseUser &&
        isStaffSession &&
        target.customerUid !== 'local-staff'
      ) {
        void updateOrderItemsInFirestore({
          orderId,
          items: updatedItems,
          total: updatedTotal,
        }).catch(() => {});
      }
    },
    [firebaseUser, isStaffSession, orders, showToast]
  );

  const handleDeleteOrder = useCallback(
    (order: KitchenOrder) => {
      if (!isAdmin) return;

      deletedOrderIdsRef.current.add(order.id);

      let tableNumberToFree: number | undefined;
      if (order.mode === 'dine-in' && order.tableNumber) {
        const tableNum = order.tableNumber;
        const hasOtherUnpaidOnTable = orders.some(
          (o) =>
            o.id !== order.id &&
            o.mode === 'dine-in' &&
            o.tableNumber === tableNum &&
            o.status !== 'Cobrado' &&
            !o.paid
        );
        if (!hasOtherUnpaidOnTable) {
          tableNumberToFree = tableNum;
          setTables((prev) =>
            prev.map((t) =>
              t.number === tableNum ? { ...t, status: 'libre' } : t
            )
          );
        }
      }

      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      if (activeTableOrderId === order.id) setActiveTableOrderId(null);
      if (activeDeliveryOrderId === order.id) setActiveDeliveryOrderId(null);
      if (selectedTakeawayOrderId === order.id) setSelectedTakeawayOrderId(null);
      if (selectedDeliveryOrderId === order.id) setSelectedDeliveryOrderId(null);
      if (lastPaidOrderId === order.id) setLastPaidOrderId(null);

      if (firebaseUser && isAdmin && order.customerUid !== 'local-staff') {
        void deleteOrderInFirestore({
          orderId: order.id,
          isDelivery: order.mode === 'delivery',
          tableNumberToFree,
        }).catch(() => {});
      }

      showToast(
        tableNumberToFree
          ? `Pedido ${order.code} anulado · Mesa ${tableNumberToFree} liberada`
          : `Pedido ${order.code} anulado`
      );
    },
    [
      activeDeliveryOrderId,
      activeTableOrderId,
      firebaseUser,
      isAdmin,
      lastPaidOrderId,
      orders,
      selectedDeliveryOrderId,
      selectedTakeawayOrderId,
      showToast,
    ]
  );

  const handleRateOrder = useCallback(
    (orderId: string, stars: number) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ratingStars: stars } : o))
      );
      if (firebaseUser) {
        void rateOrderInFirestore(orderId, stars).catch(() => {});
      }
      showToast(`¡Gracias por calificar con ${stars} estrellas!`);
    },
    [firebaseUser, showToast]
  );

  const handlePayTableOrder = useCallback(
    (ord: KitchenOrder) => {
      if (ord.mode === 'dine-in' && ord.tableNumber) {
        setOrderMode('dine-in');
        setSelectedTable(ord.tableNumber);
        setActiveTableOrderId(ord.id);
        setPaymentContext('table');
        navigate('payment-methods');
      } else if (ord.mode === 'takeaway') {
        setOrderMode('takeaway');
        setSelectedTakeawayOrderId(ord.id);
        setPaymentContext('takeaway');
        navigate('payment-methods');
      } else {
        setOrderMode('delivery');
        setActiveDeliveryOrderId(ord.id);
        navigate('delivery-tracking');
      }
    },
    [navigate]
  );

  const handleToggleDishAvailability = useCallback(
    (id: string) => {
      if (!canEditMenu) return;
      const idx = menuItems.findIndex((m) => m.id === id);
      if (idx < 0) return;
      const updated = {
        ...menuItems[idx],
        available: !menuItems[idx].available,
      };
      setMenuItems((prev) => prev.map((m) => (m.id === id ? updated : m)));
      if (firebaseUser) {
        void upsertMenuItemInFirestore(updated, idx).catch(() => {});
      }
    },
    [canEditMenu, firebaseUser, menuItems]
  );

  const handleSaveDishEdit = useCallback(
    (updated: MenuItem) => {
      if (!canEditMenu) return;
      const idx = menuItems.findIndex((m) => m.id === updated.id);
      setMenuItems((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m))
      );
      if (firebaseUser) {
        void upsertMenuItemInFirestore(
          updated,
          idx >= 0 ? idx : menuItems.length
        ).catch(() => {});
      }
      showToast(`${updated.name} actualizado`);
    },
    [canEditMenu, firebaseUser, menuItems, showToast]
  );

  const handleAddNewDish = useCallback(
    (newItem: MenuItem) => {
      if (!canEditMenu) return;
      const nextOrder = menuItems.length;
      setMenuItems((prev) => [...prev, newItem]);
      if (firebaseUser) {
        void upsertMenuItemInFirestore(newItem, nextOrder).catch(() => {});
      }
      showToast(`${newItem.name} agregado al menú`);
    },
    [canEditMenu, firebaseUser, menuItems.length, showToast]
  );

  const handleUpdateInventory = useCallback(
    (updated: InventoryItem[]) => {
      if (!isAdmin) return;
      setInventory(updated);
      if (firebaseUser) {
        void saveInventoryInFirestore(updated).catch(() => {});
      }
      showToast('Inventario actualizado');
    },
    [firebaseUser, isAdmin, showToast]
  );

  const handleUpdateAdminPin = useCallback(
    async (rawPin: string): Promise<boolean> => {
      if (!isAdmin) return false;
      const cleanPin = rawPin.replace(/\D/g, '').slice(0, 4);
      if (cleanPin.length !== 4) {
        showToast('El PIN de Administrador debe tener 4 dígitos');
        return false;
      }
      const conflict = staffMembers.find((m) => m.pin === cleanPin);
      if (conflict) {
        showToast(`Ese PIN ya pertenece a ${conflict.name}`);
        return false;
      }

      const nextPins = { ...storedPins, adminPin: cleanPin };
      setStoredPins(nextPins);
      writeStoredPins(nextPins);

      if (resolvedStaffSession?.isAdmin) {
        const updatedSession: ActiveStaffSession = {
          ...resolvedStaffSession,
          pin: cleanPin,
        };
        setActiveStaffSession(updatedSession);
        writeStoredShiftSession(updatedSession);
      }

      if (firebaseUser) {
        try {
          await saveStaffConfigPinsInFirestore(nextPins);
          await activateStaffSessionInFirestore({
            uid: firebaseUser.uid,
            staffId: 'admin',
            name: 'Administrador',
            role: 'Admin',
            pin: cleanPin,
            isAdmin: true,
          });
        } catch {
          // Persisted locally if cloud write is unavailable
        }
      }

      showToast(`PIN maestro actualizado (${cleanPin})`);
      return true;
    },
    [
      firebaseUser,
      isAdmin,
      resolvedStaffSession,
      showToast,
      staffMembers,
      storedPins,
    ]
  );

  const handleSaveStaffMember = useCallback(
    async (payload: {
      id?: string;
      name: string;
      role: EmployeeRoleTitle;
      pin: string;
      active: boolean;
      permissions: StaffPermissions;
    }): Promise<{ ok: boolean; error?: string }> => {
      if (!isAdmin) {
        return { ok: false, error: 'Solo el Administrador puede editar personal.' };
      }

      const cleanName = payload.name.trim().slice(0, 80);
      if (!cleanName) {
        return { ok: false, error: 'Ingresa el nombre del trabajador.' };
      }

      const cleanPin = payload.pin.replace(/\D/g, '').slice(0, 4);
      if (cleanPin.length !== 4) {
        return { ok: false, error: 'El PIN debe tener exactamente 4 números.' };
      }

      if (cleanPin === storedPins.adminPin) {
        return {
          ok: false,
          error: 'Ese PIN coincide con el PIN de Administrador.',
        };
      }

      const conflict = staffMembers.find(
        (m) => m.pin === cleanPin && m.id !== payload.id
      );
      if (conflict) {
        return {
          ok: false,
          error: `El PIN ${cleanPin} ya está asignado a ${conflict.name}.`,
        };
      }

      const memberId =
        payload.id ||
        `staff-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const nextMember: StaffMember = {
        id: memberId,
        name: cleanName,
        role: payload.role,
        pin: cleanPin,
        active: Boolean(payload.active),
        permissions: normalizeStaffPermissions(payload.permissions, payload.role),
      };

      setStaffMembers((prev) => {
        const exists = prev.some((m) => m.id === memberId);
        const updated = exists
          ? prev.map((m) => (m.id === memberId ? nextMember : m))
          : [...prev, nextMember];
        const sorted = [...updated].sort((a, b) =>
          a.name.localeCompare(b.name, 'es')
        );
        writeStoredStaffMembers(sorted);
        return sorted;
      });

      if (firebaseUser) {
        void upsertStaffMemberInFirestore(nextMember).catch(() => {});
      }

      showToast(
        payload.id
          ? `Permisos actualizados para ${cleanName}`
          : `${cleanName} registrado (${payload.role})`
      );
      return { ok: true };
    },
    [firebaseUser, isAdmin, showToast, staffMembers, storedPins.adminPin]
  );

  const handleToggleStaffActive = useCallback(
    (staffId: string, active: boolean) => {
      if (!isAdmin) return;
      setStaffMembers((prev) => {
        const next = prev.map((m) =>
          m.id === staffId ? { ...m, active } : m
        );
        writeStoredStaffMembers(next);
        return next;
      });
      if (firebaseUser) {
        void toggleStaffActiveInFirestore(staffId, active).catch(() => {});
      }
      showToast(active ? 'Personal activado' : 'Personal desactivado');
    },
    [firebaseUser, isAdmin, showToast]
  );

  const handleDeleteStaffMember = useCallback(
    (staffId: string) => {
      if (!isAdmin) return;
      const target = staffMembers.find((m) => m.id === staffId);
      setStaffMembers((prev) => {
        const next = prev.filter((m) => m.id !== staffId);
        writeStoredStaffMembers(next);
        return next;
      });
      if (firebaseUser) {
        void deleteStaffMemberInFirestore(staffId).catch(() => {});
      }
      showToast(
        target ? `${target.name} eliminado del equipo` : 'Personal eliminado'
      );
    },
    [firebaseUser, isAdmin, showToast, staffMembers]
  );

  const value: RestaurantContextValue = {
    history,
    currentScreen,
    navDirection,
    navigate,
    goBack,
    showCartDrawer,
    setShowCartDrawer,
    toastMsg,
    showToast,
    firebaseUser,
    authReady,
    isAdmin,
    isStaffSession,
    userRole,
    activeStaffSession: resolvedStaffSession,
    permissions,
    canTakeOrdersAndTables,
    canViewKitchenBoard,
    canCollectPayments,
    canEditMenu,
    canViewReports,
    staffMembers,
    adminPin: storedPins.adminPin,
    mozoPin: storedPins.mozoPin,
    loginWithPin,
    logoutStaffSession,
    menuItems,
    tables: enrichedTables,
    orders,
    inventory,
    customerContacts,
    selectedDishId,
    setSelectedDishId,
    selectedDish,
    favoriteIds,
    handleToggleFavorite,
    orderMode,
    setOrderMode,
    selectedTable,
    tableCustomerPhone,
    handleSelectTable,
    handleConfirmQrTableWelcome,
    exitQrTableMode,
    cart,
    setCart,
    cartCount,
    cartTotal,
    takeawayInfo,
    setTakeawayInfo,
    deliveryInfo,
    setDeliveryInfo,
    activeTableOrder,
    activeDeliveryOrder,
    linkedTakeawayOrder,
    selectedTakeawayOrderId,
    linkedDeliveryOrder,
    selectedDeliveryOrderId,
    lastPaidOrder,
    paymentMethod,
    setPaymentMethod,
    paymentContext,
    setPaymentContext,
    lastPaidAmount,
    handleAddToCart,
    handleUpdateCartQuantity,
    handleChangeCartItemSize,
    handleRemoveCartItem,
    handleSaveCustomize,
    handleCartProceedOrder,
    handleDeliveryInfoContinue,
    handleCompletePayment,
    handleUpdateOrderStatus,
    handleCallWaiter,
    handleRequestBill,
    handleDismissWaiterCall,
    handleCollectOrderPayment,
    handleCreatePosOrder,
    handleFreeTable,
    handleCreateTable,
    handleDeleteTable,
    handleMoveTableOrder,
    handleSelectTakeawayOrder,
    handleSelectDeliveryOrder,
    loadOrderIntoLivePanel,
    handleUpdateOrderItemQty,
    handleDeleteOrder,
    handleRateOrder,
    handlePayTableOrder,
    handleToggleDishAvailability,
    handleSaveDishEdit,
    handleAddNewDish,
    handleUpdateInventory,
    handleUpdateAdminPin,
    handleSaveStaffMember,
    handleToggleStaffActive,
    handleDeleteStaffMember,
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
};

export function useRestaurant(): RestaurantContextValue {
  const ctx = useContext(RestaurantContext);
  if (!ctx) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return ctx;
}
