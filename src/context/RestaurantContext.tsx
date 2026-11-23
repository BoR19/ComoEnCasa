import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  INITIAL_DELIVERY_INFO,
  INITIAL_INVENTORY,
  INITIAL_MENU_ITEMS,
  INITIAL_TABLES,
} from '../data/mockData';
import { auth, googleProvider } from '../firebase';
import {
  addAuthorizedStaffInFirestore,
  appendOrderItemsInFirestore,
  buildOrderCode,
  collectOrderPaymentInFirestore,
  createOrderInFirestore,
  createTableInFirestore,
  customerPayOrderInFirestore,
  deleteOrderInFirestore,
  deleteTableInFirestore,
  freeTableInFirestore,
  moveTableOrderInFirestore,
  rateOrderInFirestore,
  removeAuthorizedStaffInFirestore,
  resolveUserRoles,
  saveInventoryInFirestore,
  saveMozoPinInFirestore,
  seedInitialCatalogIfEmpty,
  setWaiterCallInFirestore,
  subscribeAuthorizedStaff,
  subscribeCustomerContacts,
  subscribeInventory,
  subscribeMenuItems,
  subscribeOrders,
  subscribeStaffConfig,
  subscribeTableSessions,
  subscribeTables,
  toggleAuthorizedStaffInFirestore,
  updateOrderItemsInFirestore,
  updateOrderStatusInFirestore,
  upsertMenuItemInFirestore,
  upsertTableSessionInFirestore,
} from '../services/firestoreService';
import {
  AuthorizedStaffItem,
  CartItem,
  CustomerContactItem,
  DeliveryInfo,
  DishSizeOption,
  ExtraOption,
  InventoryItem,
  KitchenOrder,
  MenuItem,
  OrderLineItem,
  OrderMode,
  OrderStatus,
  PaymentMethod,
  ScreenId,
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

interface RestaurantContextValue {
  // Navigation & overlays
  history: ScreenId[];
  currentScreen: ScreenId;
  navDirection: number;
  navigate: (screen: ScreenId) => void;
  goBack: () => void;
  showGooglePrompt: boolean;
  setShowGooglePrompt: React.Dispatch<React.SetStateAction<boolean>>;
  showCartDrawer: boolean;
  setShowCartDrawer: React.Dispatch<React.SetStateAction<boolean>>;
  clearPendingAuthAction: () => void;
  toastMsg: string;
  showToast: (msg: string) => void;

  // Auth & Role
  firebaseUser: User | null;
  authReady: boolean;
  authLoading: boolean;
  authError: string;
  setAuthError: React.Dispatch<React.SetStateAction<string>>;
  isAdminUser: boolean;
  isMozoStaff: boolean;
  isStaff: boolean;
  isAdminAuthenticated: boolean;
  isMozoAuthenticated: boolean;
  userRole: AppUserRole;
  isStaffSession: boolean;
  setActiveRole: React.Dispatch<React.SetStateAction<AppUserRole>>;
  enterAdminPanel: () => void;
  handleGoogleSignIn: () => Promise<void>;
  handleGoogleSignOut: () => Promise<void>;
  handleAdminLogout: () => Promise<void>;
  handleMozoLoginSuccess: () => void;
  handleMozoLogout: () => void;

  // Shared global restaurant data (never reset on role change)
  menuItems: MenuItem[];
  tables: TableItem[];
  orders: KitchenOrder[];
  inventory: InventoryItem[];
  authorizedStaff: AuthorizedStaffItem[];
  customerContacts: CustomerContactItem[];
  mozoPin: string;

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
  handleUpdateMozoPin: (newPin: string) => void;
  handleAddAuthorizedStaff: (email: string, name: string) => void;
  handleToggleAuthorizedStaff: (email: string, active: boolean) => void;
  handleRemoveAuthorizedStaff: (email: string) => void;
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

const QR_PHONES_STORAGE_KEY = 'comoencasa_qr_table_phones_v1';

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

  // Firebase Auth & Role state
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string>('');
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const [isMozoStaff, setIsMozoStaff] = useState<boolean>(false);
  const isStaff = isAdminUser || isMozoStaff;
  const popupInFlightRef = useRef<boolean>(false);

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isMozoAuthenticated, setIsMozoAuthenticated] = useState<boolean>(false);
  const [activeRole, setActiveRole] = useState<AppUserRole>('customer');

  // Modals & Drawers
  const [showGooglePrompt, setShowGooglePrompt] = useState<boolean>(false);
  const [showCartDrawer, setShowCartDrawer] = useState<boolean>(false);
  const pendingAuthActionRef = useRef<((user: User) => void) | null>(null);

  // Single Unified Global State for Menu, Tables & Orders (never wiped on role switch)
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
  const [authorizedStaff, setAuthorizedStaff] = useState<AuthorizedStaffItem[]>(
    []
  );
  const [customerContacts, setCustomerContacts] = useState<
    CustomerContactItem[]
  >([]);
  const [cloudTableSessions, setCloudTableSessions] = useState<
    Record<number, { customerPhone: string; activeOrderId?: string }>
  >({});
  const [tablePhonesByNumber, setTablePhonesByNumber] = useState<
    Record<number, string>
  >(() => readStoredTablePhones());
  const [mozoPin, setMozoPin] = useState<string>('1234');
  const [toastMsg, setToastMsg] = useState<string>('');

  // Effective role respects explicit activeRole while enforcing permissions
  const userRole: AppUserRole =
    activeRole === 'admin' && isAdminAuthenticated
      ? 'admin'
      : activeRole === 'mozo' && isMozoAuthenticated
      ? 'mozo'
      : isAdminAuthenticated && !isMozoAuthenticated
      ? 'admin'
      : isMozoAuthenticated && !isAdminAuthenticated
      ? 'mozo'
      : 'customer';
  const isStaffSession = userRole !== 'customer';

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
    setShowGooglePrompt(false);
    pendingAuthActionRef.current = null;
  }, []);

  const clearPendingAuthAction = useCallback(() => {
    pendingAuthActionRef.current = null;
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
      if (target === 'admin-panel') {
        if (!isAdminAuthenticated) {
          target = 'admin-login';
        } else {
          setActiveRole('admin');
        }
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
    [closeActiveOverlays, isAdminAuthenticated]
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

  // Monitor Firebase Authentication & Role Resolution (never clears shared orders/tables)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthLoading(true);
      setFirebaseUser(user);

      if (user) {
        const roles = await resolveUserRoles(user);
        setIsAdminUser(roles.isAdmin);
        setIsMozoStaff(roles.isMozo);
        setIsAdminAuthenticated(roles.isAdmin);
        if (roles.isAdmin) {
          setActiveRole((curr) => (curr === 'mozo' ? 'mozo' : 'admin'));
          void seedInitialCatalogIfEmpty();
        }
      } else {
        setIsAdminUser(false);
        setIsMozoStaff(false);
        setIsAdminAuthenticated(false);
        setAuthorizedStaff([]);
        setActiveRole((curr) =>
          curr === 'admin' ? (isMozoAuthenticated ? 'mozo' : 'customer') : curr
        );
      }

      setAuthReady(true);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [isMozoAuthenticated]);

  // Auto-enter Admin Panel if Admin signs in while on admin-login screen
  useEffect(() => {
    if (isAdminUser && currentScreen === 'admin-login') {
      setIsAdminAuthenticated(true);
      setActiveRole('admin');
      setShowCartDrawer(false);
      setShowGooglePrompt(false);
      pendingAuthActionRef.current = null;
      setNavDirection(1);
      setHistory((prev) =>
        prev[prev.length - 1] === 'admin-panel' ? prev : [...prev, 'admin-panel']
      );
    }
  }, [isAdminUser, currentScreen]);

  // Public real-time listeners: Menu & Tables (shared across all roles)
  useEffect(() => {
    const unsubMenu = subscribeMenuItems(setMenuItems);
    const unsubTables = subscribeTables((cloudTables) => {
      // Keep locally occupied tables synchronized if there are active unpaid local orders
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

  // Auth-gated real-time Orders listener: merges cloud orders without wiping local session orders
  useEffect(() => {
    if (!authReady || authLoading || !firebaseUser || !firebaseUser.emailVerified) {
      return;
    }
    const unsubOrders = subscribeOrders(
      firebaseUser.uid,
      isStaff,
      (cloudOrders) => {
        setOrders((prev) => {
          const filteredCloud = cloudOrders.filter(
            (o) => !deletedOrderIdsRef.current.has(o.id)
          );
          const cloudById = new Map(filteredCloud.map((o) => [o.id, o]));
          // Keep any active in-session orders not yet overwritten by Firestore (e.g. local-staff or created under another role before switch)
          const preservedLocal = prev.filter((o) => {
            if (deletedOrderIdsRef.current.has(o.id)) return false;
            if (cloudById.has(o.id)) return false;
            if (o.customerUid === 'local-staff') return true;
            // If non-staff Google account is active during Mozo/Admin session, keep session orders created by other roles
            return !isStaff;
          });
          return [...filteredCloud, ...preservedLocal];
        });
      }
    );
    return () => unsubOrders();
  }, [authReady, authLoading, firebaseUser, isStaff]);

  // Staff-gated real-time Mozo PIN, Table Sessions & Customer Contacts listeners
  useEffect(() => {
    if (!authReady || authLoading || !firebaseUser || !isStaff) {
      setCloudTableSessions({});
      setCustomerContacts([]);
      return;
    }
    const unsubConfig = subscribeStaffConfig(setMozoPin);
    const unsubSessions = subscribeTableSessions(setCloudTableSessions);
    const unsubContacts = subscribeCustomerContacts(setCustomerContacts);
    return () => {
      unsubConfig();
      unsubSessions();
      unsubContacts();
    };
  }, [authReady, authLoading, firebaseUser, isStaff]);

  // Admin-gated real-time Inventory & Authorized Staff listeners
  useEffect(() => {
    if (!authReady || authLoading || !firebaseUser || !isAdminUser) {
      return;
    }
    const unsubInv = subscribeInventory(setInventory);
    const unsubStaff = subscribeAuthorizedStaff(setAuthorizedStaff);
    return () => {
      unsubInv();
      unsubStaff();
    };
  }, [authReady, authLoading, firebaseUser, isAdminUser]);

  // Sync locally captured QR table phone to Firestore once customer verifies Google account
  useEffect(() => {
    if (!firebaseUser || !firebaseUser.emailVerified) return;
    const localPhone = tablePhonesByNumber[selectedTable];
    if (!localPhone) return;
    void upsertTableSessionInFirestore({
      tableNumber: selectedTable,
      customerUid: firebaseUser.uid,
      customerPhone: localPhone,
    });
  }, [firebaseUser, selectedTable, tablePhonesByNumber]);

  const handleGoogleSignIn = useCallback(async () => {
    if (popupInFlightRef.current) return;
    popupInFlightRef.current = true;
    setAuthError('');
    try {
      setAuthLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const roles = await resolveUserRoles(user);
      setFirebaseUser(user);
      setIsAdminUser(roles.isAdmin);
      setIsMozoStaff(roles.isMozo);
      setIsAdminAuthenticated(roles.isAdmin);
      if (roles.isAdmin) {
        await seedInitialCatalogIfEmpty();
      }
      showToast(`Conectado como ${user.displayName || user.email}`);

      if (pendingAuthActionRef.current && user.emailVerified) {
        const action = pendingAuthActionRef.current;
        pendingAuthActionRef.current = null;
        setShowGooglePrompt(false);
        action(user);
      }
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      let msg =
        'No se pudo completar el acceso con Google. Inténtalo nuevamente.';

      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request'
      ) {
        msg =
          'Cerraste la ventana de Google antes de terminar. Toca el botón nuevamente para iniciar sesión.';
      } else if (code === 'auth/popup-blocked') {
        msg =
          'Tu navegador bloqueó la ventana emergente de Google. Permite las ventanas emergentes (popups) e inténtalo de nuevo.';
      } else if (code === 'auth/unauthorized-domain') {
        const host =
          typeof window !== 'undefined' ? window.location.hostname : '';
        msg = host
          ? `El dominio "${host}" aún no está autorizado en Firebase Authentication (Settings → Authorized domains).`
          : 'Este dominio aún no está autorizado en Firebase Authentication (Authorized domains).';
      } else if (code === 'auth/network-request-failed') {
        msg = 'Sin conexión a internet. Verifica tu red e inténtalo de nuevo.';
      }

      setAuthError(msg);
      showToast(msg);
    } finally {
      popupInFlightRef.current = false;
      setAuthLoading(false);
    }
  }, [showToast]);

  const handleGoogleSignOut = useCallback(async () => {
    setAuthError('');
    try {
      await signOut(auth);
      setIsAdminAuthenticated(false);
      showToast('Cuenta Google desconectada');
    } catch {
      showToast('No se pudo cerrar la cuenta Google');
    }
  }, [showToast]);

  const requireVerifiedCustomer = useCallback(
    (action: (user: User) => void) => {
      if (firebaseUser && firebaseUser.emailVerified) {
        action(firebaseUser);
        return;
      }
      setAuthError('');
      setShowCartDrawer(false);
      pendingAuthActionRef.current = action;
      setShowGooglePrompt(true);
    },
    [firebaseUser]
  );

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
    const found = orders.find(
      (o) =>
        o.id === selectedDeliveryOrderId &&
        o.mode === 'delivery' &&
        !isOrderSettled(o)
    );
    return found;
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
          if (firebaseUser && firebaseUser.emailVerified) {
            void upsertTableSessionInFirestore({
              tableNumber: selectedTable,
              customerUid: firebaseUser.uid,
              customerPhone: parsed.whatsappDigits,
            });
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
          (isStaffSession || isStaff || o.customerUid === ownerUid)
      );

      const canSyncCloud = Boolean(firebaseUser && firebaseUser.emailVerified);

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
        if (canSyncCloud && (isStaff || existingUnpaid.customerUid === ownerUid)) {
          void appendOrderItemsInFirestore({
            orderId: existingUnpaid.id,
            items: updatedItems,
            total: updatedTotal,
            status: 'Preparando',
          });
          if (resolvedPhone) {
            void upsertTableSessionInFirestore({
              tableNumber: selectedTable,
              customerUid: ownerUid,
              customerPhone: resolvedPhone,
              activeOrderId: existingUnpaid.id,
            });
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
            ? 'Tomado desde Comanda en Vivo'
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

        if (canSyncCloud && (isStaff || ownerUid === firebaseUser?.uid)) {
          void createOrderInFirestore({
            order: newOrder,
            customerUid: ownerUid,
            occupyTableIfNeeded: {
              tableNumber: selectedTable,
              capacity: tableObj?.capacity || 4,
              isCurrentlyFree: tableObj?.status === 'libre',
              isStaff: isStaff || isStaffSession,
            },
          });
        }
      }

      setCart([]);
      if (!canSyncCloud && isStaffSession) {
        showToast(
          `Pedido guardado en Mesa ${selectedTable} (conecta Google para nube)`
        );
      } else {
        showToast(`Pedido enviado a Cocina · Mesa ${selectedTable}`);
      }
      if (!stayInWorkspace) {
        navigate('tables-order');
      }
    },
    [
      cart,
      cartTotal,
      cloudTableSessions,
      firebaseUser,
      isStaff,
      isStaffSession,
      navigate,
      orders,
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
          ? 'Para llevar (Comanda en Vivo)'
          : 'Pedido Para Llevar',
        status: 'Preparando',
        total: cartTotal,
        estimatedMinutes: 15,
        createdAt: getCurrentTimeLabel(),
        paid: false,
        waiterRequested: false,
      };

      const canSyncCloud = Boolean(firebaseUser && firebaseUser.emailVerified);
      setOrders((prev) => [takeawayOrder, ...prev]);
      setSelectedTakeawayOrderId(newOrderId);
      setCart([]);
      setTakeawayInfo({ customerName: '', pickupNote: '' });

      if (canSyncCloud && (isStaff || ownerUid === firebaseUser?.uid)) {
        void createOrderInFirestore({
          order: takeawayOrder,
          customerUid: ownerUid,
        });
      }

      if (!canSyncCloud && isStaffSession) {
        showToast(
          `Para Llevar (${cleanName}) guardado · Código: ${confirmationCode}`
        );
      } else {
        showToast(
          `Pedido Para Llevar enviado · Código de retiro: ${confirmationCode}`
        );
      }

      if (!stayInWorkspace) {
        navigate('cart');
      }
    },
    [
      cart,
      cartTotal,
      firebaseUser,
      isStaff,
      isStaffSession,
      navigate,
      orders.length,
      showToast,
      takeawayInfo,
    ]
  );

  const handleCartProceedOrder = useCallback(() => {
    if (cart.length === 0) return;

    if (orderMode === 'dine-in') {
      if (isStaffSession) {
        const uid =
          firebaseUser && firebaseUser.emailVerified && isStaff
            ? firebaseUser.uid
            : 'local-staff';
        executeDineInOrder(uid, true);
        return;
      }
      requireVerifiedCustomer((user) => {
        executeDineInOrder(user.uid, false);
      });
    } else if (orderMode === 'takeaway') {
      if (
        linkedTakeawayOrder &&
        !isOrderSettled(linkedTakeawayOrder) &&
        (isStaffSession || linkedTakeawayOrder.customerUid === firebaseUser?.uid)
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
          (isStaff || linkedTakeawayOrder.customerUid === firebaseUser.uid)
        ) {
          void appendOrderItemsInFirestore({
            orderId: linkedTakeawayOrder.id,
            items: updatedItems,
            total: updatedTotal,
            status: updatedStatus,
          });
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

      if (isStaffSession) {
        const uid =
          firebaseUser && firebaseUser.emailVerified && isStaff
            ? firebaseUser.uid
            : 'local-staff';
        executeTakeawayOrder(uid, true);
        return;
      }
      requireVerifiedCustomer((user) => {
        executeTakeawayOrder(user.uid, false);
      });
    } else if (
      isStaffSession &&
      linkedDeliveryOrder &&
      !isOrderSettled(linkedDeliveryOrder)
    ) {
      const lines = cartItemsToOrderLines(cart);
      const extraTotal = cartTotal;
      const updatedItems = [...linkedDeliveryOrder.items, ...lines];
      const updatedTotal = linkedDeliveryOrder.total + extraTotal;
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
        (isStaff || linkedDeliveryOrder.customerUid === firebaseUser.uid)
      ) {
        void appendOrderItemsInFirestore({
          orderId: linkedDeliveryOrder.id,
          items: updatedItems,
          total: updatedTotal,
          status: updatedStatus,
        });
      }

      setCart([]);
      showToast(`Platos agregados a Delivery ${linkedDeliveryOrder.code}`);
    } else {
      navigate('delivery-info');
    }
  }, [
    cart,
    cartTotal,
    executeDineInOrder,
    executeTakeawayOrder,
    firebaseUser,
    isStaff,
    isStaffSession,
    linkedDeliveryOrder,
    linkedTakeawayOrder,
    navigate,
    orderMode,
    requireVerifiedCustomer,
    showToast,
    takeawayInfo.customerName,
  ]);

  const createDeliveryOrderFromCart = useCallback(
    (user: User, paid: boolean, method?: PaymentMethod): KitchenOrder => {
      const newDelId = `ord-del-${Date.now()}`;
      const notesParts = [
        deliveryInfo.reference.trim(),
        deliveryInfo.notes.trim(),
      ].filter(Boolean);
      const deliveryOrder: KitchenOrder = {
        id: newDelId,
        code: buildOrderCode(orders.length),
        customerUid: user.uid,
        mode: 'delivery',
        customerLabel: user.displayName
          ? `Delivery · ${user.displayName.split(' ')[0]}`
          : 'Pedido Delivery',
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

      void createOrderInFirestore({
        order: deliveryOrder,
        customerUid: user.uid,
        deliveryReference: deliveryInfo.reference.trim(),
      });

      return deliveryOrder;
    },
    [cart, cartTotal, deliveryInfo, orders.length]
  );

  const handleDeliveryInfoContinue = useCallback(() => {
    if (cart.length === 0) {
      showToast('Agrega al menos un platillo antes de pedir Delivery');
      navigate('menu');
      return;
    }

    if (deliveryInfo.payOnDelivery) {
      requireVerifiedCustomer((user) => {
        createDeliveryOrderFromCart(user, false);
        showToast('Pedido Delivery enviado a Cocina (pago contra entrega)');
        navigate('delivery-tracking');
      });
    } else {
      setPaymentContext('delivery-prepay');
      navigate('payment-methods');
    }
  }, [
    cart.length,
    createDeliveryOrderFromCart,
    deliveryInfo.payOnDelivery,
    navigate,
    requireVerifiedCustomer,
    showToast,
  ]);

  const handleCompletePayment = useCallback(() => {
    requireVerifiedCustomer((user) => {
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
        void customerPayOrderInFirestore(activeTableOrder.id, paymentMethod);
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
        void customerPayOrderInFirestore(linkedTakeawayOrder.id, paymentMethod);
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
        const created = createDeliveryOrderFromCart(user, true, paymentMethod);
        setLastPaidOrderId(created.id);
        setLastPaidAmount(created.total);
        showToast('Pago confirmado · Tu Delivery está en preparación');
        navigate('payment-confirm');
      }
    });
  }, [
    activeTableOrder,
    cart.length,
    createDeliveryOrderFromCart,
    linkedTakeawayOrder,
    navigate,
    paymentContext,
    paymentMethod,
    requireVerifiedCustomer,
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
      if (firebaseUser && isStaff) {
        void updateOrderStatusInFirestore(orderId, status, deliveredAtLabel);
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
    [firebaseUser, isStaff, orders, showToast]
  );

  const handleCallWaiter = useCallback(
    (orderId: string) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, waiterRequested: true } : o))
      );
      if (firebaseUser) {
        void setWaiterCallInFirestore(orderId, true);
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
        void setWaiterCallInFirestore(orderId, true, true);
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
      if (firebaseUser && isStaff) {
        void setWaiterCallInFirestore(orderId, false);
      }
    },
    [firebaseUser, isStaff]
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

  // Bug 2 Fix: Collecting payment marks order as 'Cobrado', moves it to history,
  // frees the table immediately, and clears the active cart for that table (items: [], Bs. 0.00).
  const handleCollectOrderPayment = useCallback(
    (orderId: string, method: PaymentMethod) => {
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

      if (firebaseUser && isStaff && targetOrder?.customerUid !== 'local-staff') {
        void collectOrderPaymentInFirestore({
          orderId,
          method,
          tableNumberToFree,
        });
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
      clearTablePhoneSession,
      firebaseUser,
      isStaff,
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
      const canSyncCloud = Boolean(firebaseUser && isStaff);
      const ownerUid = canSyncCloud && firebaseUser ? firebaseUser.uid : 'local-staff';
      const isPaidNow = Boolean(payload.payNowMethod);

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
        paymentMethod: payload.payNowMethod,
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
        });
      }

      const codeHint = newOrder.confirmationCode
        ? ` · Código entrega: ${newOrder.confirmationCode}`
        : '';
      showToast(
        payload.payNowMethod
          ? `Pedido ${newOrder.code} creado y cobrado (${formatBs(total)})${codeHint}`
          : `Pedido ${newOrder.code} enviado a Cocina${codeHint}`
      );

      return newOrder;
    },
    [firebaseUser, isStaff, orders.length, showToast, tables]
  );

  const handleFreeTable = useCallback(
    (tableNumber: number) => {
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
      if (firebaseUser && isStaff) {
        void freeTableInFirestore(tableNumber);
      }
      showToast(`Mesa ${tableNumber} liberada`);
    },
    [
      activeTableOrder,
      clearTablePhoneSession,
      firebaseUser,
      isStaff,
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
      if (!isStaffSession) return false;
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

      if (firebaseUser && isStaff) {
        void createTableInFirestore(newTable);
      }

      showToast(`${cleanName} agregada (${cleanZone})`);
      return true;
    },
    [firebaseUser, isStaff, isStaffSession, showToast, tables]
  );

  const handleDeleteTable = useCallback(
    (tableNumber: number): boolean => {
      if (!isStaffSession) return false;
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

      if (firebaseUser && isStaff) {
        void deleteTableInFirestore(tableNumber);
      }

      showToast(`${target.name || `Mesa ${tableNumber}`} eliminada`);
      return true;
    },
    [firebaseUser, isStaff, isStaffSession, orders, selectedTable, showToast, tables]
  );

  const handleMoveTableOrder = useCallback(
    (fromTableNumber: number, toTableNumber: number): boolean => {
      if (!isStaffSession) return false;
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

      if (firebaseUser && isStaff) {
        const cloudOrderIds = activeOrdersToMove
          .filter((o) => o.customerUid !== 'local-staff')
          .map((o) => o.id);
        void moveTableOrderInFirestore({
          orderIds: cloudOrderIds,
          fromTableNumber,
          toTableNumber,
          toCustomerLabel: newLabel,
        });
      }

      showToast(
        `Pedido trasladado de Mesa ${fromTableNumber} a Mesa ${toTableNumber}`
      );
      return true;
    },
    [firebaseUser, isStaff, isStaffSession, orders, selectedTable, showToast, tables]
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

      if (firebaseUser && isStaff && target.customerUid !== 'local-staff') {
        void updateOrderItemsInFirestore({
          orderId,
          items: updatedItems,
          total: updatedTotal,
        });
      }
    },
    [firebaseUser, isStaff, isStaffSession, orders, showToast]
  );

  const handleDeleteOrder = useCallback(
    (order: KitchenOrder) => {
      if (!isAdminAuthenticated) return;

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

      if (firebaseUser && isAdminUser && order.customerUid !== 'local-staff') {
        void deleteOrderInFirestore({
          orderId: order.id,
          isDelivery: order.mode === 'delivery',
          tableNumberToFree,
        });
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
      isAdminAuthenticated,
      isAdminUser,
      lastPaidOrderId,
      orders,
      selectedDeliveryOrderId,
      selectedTakeawayOrderId,
      showToast,
    ]
  );

  const enterAdminPanel = useCallback(() => {
    closeActiveOverlays();
    setIsAdminAuthenticated(true);
    setActiveRole('admin');
    navigate('admin-panel');
  }, [closeActiveOverlays, navigate]);

  const handleAdminLogout = useCallback(async () => {
    closeActiveOverlays();
    clearQrParamsFromUrl();
    await handleGoogleSignOut();
    setIsAdminAuthenticated(false);
    setActiveRole(isMozoAuthenticated ? 'mozo' : 'customer');
    setNavDirection(-1);
    setHistory(['welcome']);
    showToast('Sesión de Administrador cerrada');
  }, [closeActiveOverlays, handleGoogleSignOut, isMozoAuthenticated, showToast]);

  const handleMozoLoginSuccess = useCallback(() => {
    closeActiveOverlays();
    setIsMozoAuthenticated(true);
    setActiveRole('mozo');
    setNavDirection(1);
    setHistory((prev) =>
      prev[prev.length - 1] === 'cart' ? prev : [...prev, 'cart']
    );
    showToast('Modo Mozo activado');
  }, [closeActiveOverlays, showToast]);

  const handleMozoLogout = useCallback(() => {
    closeActiveOverlays();
    clearQrParamsFromUrl();
    setIsMozoAuthenticated(false);
    setActiveRole(isAdminAuthenticated ? 'admin' : 'customer');
    setNavDirection(-1);
    setHistory(['welcome']);
    showToast('Sesión de Mozo cerrada');
  }, [closeActiveOverlays, isAdminAuthenticated, showToast]);

  const handleRateOrder = useCallback(
    (orderId: string, stars: number) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ratingStars: stars } : o))
      );
      if (firebaseUser) {
        void rateOrderInFirestore(orderId, stars);
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
      const idx = menuItems.findIndex((m) => m.id === id);
      if (idx < 0) return;
      const updated = {
        ...menuItems[idx],
        available: !menuItems[idx].available,
      };
      setMenuItems((prev) => prev.map((m) => (m.id === id ? updated : m)));
      if (isAdminUser) {
        void upsertMenuItemInFirestore(updated, idx);
      }
    },
    [isAdminUser, menuItems]
  );

  const handleSaveDishEdit = useCallback(
    (updated: MenuItem) => {
      const idx = menuItems.findIndex((m) => m.id === updated.id);
      setMenuItems((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m))
      );
      if (isAdminUser) {
        void upsertMenuItemInFirestore(
          updated,
          idx >= 0 ? idx : menuItems.length
        );
      }
      showToast(`${updated.name} actualizado`);
    },
    [isAdminUser, menuItems, showToast]
  );

  const handleAddNewDish = useCallback(
    (newItem: MenuItem) => {
      const nextOrder = menuItems.length;
      setMenuItems((prev) => [...prev, newItem]);
      if (isAdminUser) {
        void upsertMenuItemInFirestore(newItem, nextOrder);
      }
      showToast(`${newItem.name} agregado al menú`);
    },
    [isAdminUser, menuItems.length, showToast]
  );

  const handleUpdateInventory = useCallback(
    (updated: InventoryItem[]) => {
      setInventory(updated);
      if (isAdminUser) {
        void saveInventoryInFirestore(updated);
      }
      showToast('Inventario actualizado');
    },
    [isAdminUser, showToast]
  );

  const handleUpdateMozoPin = useCallback(
    (newPin: string) => {
      setMozoPin(newPin);
      if (isAdminUser) {
        void saveMozoPinInFirestore(newPin);
      }
      showToast(`PIN de Mozo actualizado (${newPin})`);
    },
    [isAdminUser, showToast]
  );

  const handleAddAuthorizedStaff = useCallback(
    (email: string, name: string) => {
      if (isAdminUser) {
        void addAuthorizedStaffInFirestore(email, name);
        showToast(`Mozo autorizado: ${email.toLowerCase()}`);
      }
    },
    [isAdminUser, showToast]
  );

  const handleToggleAuthorizedStaff = useCallback(
    (email: string, active: boolean) => {
      if (isAdminUser) {
        void toggleAuthorizedStaffInFirestore(email, active);
        showToast(active ? 'Mozo activado' : 'Mozo pausado');
      }
    },
    [isAdminUser, showToast]
  );

  const handleRemoveAuthorizedStaff = useCallback(
    (email: string) => {
      if (isAdminUser) {
        void removeAuthorizedStaffInFirestore(email);
        showToast(`Acceso revocado para ${email}`);
      }
    },
    [isAdminUser, showToast]
  );

  const value: RestaurantContextValue = {
    history,
    currentScreen,
    navDirection,
    navigate,
    goBack,
    showGooglePrompt,
    setShowGooglePrompt,
    showCartDrawer,
    setShowCartDrawer,
    clearPendingAuthAction,
    toastMsg,
    showToast,
    firebaseUser,
    authReady,
    authLoading,
    authError,
    setAuthError,
    isAdminUser,
    isMozoStaff,
    isStaff,
    isAdminAuthenticated,
    isMozoAuthenticated,
    userRole,
    isStaffSession,
    setActiveRole,
    enterAdminPanel,
    handleGoogleSignIn,
    handleGoogleSignOut,
    handleAdminLogout,
    handleMozoLoginSuccess,
    handleMozoLogout,
    menuItems,
    tables: enrichedTables,
    orders,
    inventory,
    authorizedStaff,
    customerContacts,
    mozoPin,
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
    handleUpdateMozoPin,
    handleAddAuthorizedStaff,
    handleToggleAuthorizedStaff,
    handleRemoveAuthorizedStaff,
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
