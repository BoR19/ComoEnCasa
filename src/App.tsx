import React, { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { LogIn, X } from 'lucide-react';
import { DesktopSidebar } from './components/DesktopSidebar';
import { BottomNav } from './components/ShellComponents';
import { AdminLoginScreen, AdminPanelScreen } from './components/screens/AdminScreens';
import { CartScreen } from './components/screens/CartScreen';
import { CustomizeDishScreen } from './components/screens/CustomizeDishScreen';
import {
  DeliveryConfirmScreen,
  DeliveryInfoScreen,
  DeliveryTrackingScreen,
} from './components/screens/DeliveryScreen';
import { DishDetailScreen } from './components/screens/DishDetailScreen';
import { MenuScreen } from './components/screens/MenuScreen';
import { MozoScreen } from './components/screens/MozoScreen';
import {
  PaymentConfirmScreen,
  PaymentMethodsScreen,
  PaymentQrScreen,
} from './components/screens/PaymentScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import {
  TableOrderScreen,
  TableQrScreen,
  TableSelectScreen,
} from './components/screens/TablesQrScreen';
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import {
  INITIAL_DELIVERY_INFO,
  INITIAL_INVENTORY,
  INITIAL_MENU_ITEMS,
  INITIAL_TABLES,
} from './data/mockData';
import { auth, googleProvider } from './firebase';
import {
  addAuthorizedStaffInFirestore,
  appendOrderItemsInFirestore,
  buildOrderCode,
  collectOrderPaymentInFirestore,
  createOrderInFirestore,
  customerPayOrderInFirestore,
  freeTableInFirestore,
  rateOrderInFirestore,
  removeAuthorizedStaffInFirestore,
  resolveUserRoles,
  saveInventoryInFirestore,
  saveMozoPinInFirestore,
  seedInitialCatalogIfEmpty,
  setWaiterCallInFirestore,
  subscribeAuthorizedStaff,
  subscribeInventory,
  subscribeMenuItems,
  subscribeOrders,
  subscribeStaffConfig,
  subscribeTables,
  toggleAuthorizedStaffInFirestore,
  updateOrderStatusInFirestore,
  upsertMenuItemInFirestore,
} from './services/firestoreService';
import {
  AuthorizedStaffItem,
  CartItem,
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
} from './types/app';
import {
  cartItemsToOrderLines,
  formatBs,
  getCartTotal,
  getCurrentTimeLabel,
} from './utils/appHelpers';

export default function App() {
  const [history, setHistory] = useState<ScreenId[]>(['welcome']);
  const [navDirection, setNavDirection] = useState<number>(1);
  const shouldReduceMotion = useReducedMotion();
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

  // Customer Google Sign-In modal prompt (triggered on order send / payment if unsigned)
  const [showGooglePrompt, setShowGooglePrompt] = useState<boolean>(false);
  const pendingAuthActionRef = useRef<((user: User) => void) | null>(null);

  // Global reactive app state (hydrated & synced in real time via Firestore)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [selectedDishId, setSelectedDishId] = useState<string>('pollo-al-horno');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const [orderMode, setOrderMode] = useState<OrderMode>('dine-in');
  const [tables, setTables] = useState<TableItem[]>(INITIAL_TABLES);
  const [selectedTable, setSelectedTable] = useState<number>(1);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>(INITIAL_DELIVERY_INFO);

  const [kitchenOrders, setKitchenOrders] = useState<KitchenOrder[]>([]);
  const [activeTableOrderId, setActiveTableOrderId] = useState<string | null>(null);
  const [activeDeliveryOrderId, setActiveDeliveryOrderId] = useState<string | null>(null);
  const [lastPaidOrderId, setLastPaidOrderId] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('QR');
  const [paymentContext, setPaymentContext] = useState<'table' | 'delivery-prepay'>('table');
  const [lastPaidAmount, setLastPaidAmount] = useState<number>(0);

  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [authorizedStaff, setAuthorizedStaff] = useState<AuthorizedStaffItem[]>([]);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isMozoAuthenticated, setIsMozoAuthenticated] = useState<boolean>(false);
  const [mozoPin, setMozoPin] = useState<string>('1234');
  const [toastMsg, setToastMsg] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? '' : curr));
    }, 2600);
  };

  // Monitor Firebase Authentication & Role Resolution
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
          void seedInitialCatalogIfEmpty();
        }
      } else {
        setIsAdminUser(false);
        setIsMozoStaff(false);
        setIsAdminAuthenticated(false);
        setKitchenOrders([]);
        setAuthorizedStaff([]);
      }

      setAuthReady(true);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Auto-enter Admin Panel if Admin signs in while on admin-login screen
  useEffect(() => {
    if (isAdminUser && currentScreen === 'admin-login') {
      setIsAdminAuthenticated(true);
      setNavDirection(1);
      setHistory((prev) => (prev[prev.length - 1] === 'admin-panel' ? prev : [...prev, 'admin-panel']));
    }
  }, [isAdminUser, currentScreen]);

  // Public real-time listeners: Menu & Tables (visible immediately across all devices)
  useEffect(() => {
    const unsubMenu = subscribeMenuItems(setMenuItems);
    const unsubTables = subscribeTables(setTables);
    return () => {
      unsubMenu();
      unsubTables();
    };
  }, []);

  // Auth-gated real-time Orders listener
  useEffect(() => {
    if (!authReady || authLoading || !firebaseUser || !firebaseUser.emailVerified) {
      return;
    }
    const unsubOrders = subscribeOrders(firebaseUser.uid, isStaff, setKitchenOrders);
    return () => unsubOrders();
  }, [authReady, authLoading, firebaseUser, isStaff]);

  // Staff-gated real-time Mozo PIN config listener
  useEffect(() => {
    if (!authReady || authLoading || !firebaseUser || !isStaff) {
      return;
    }
    const unsubConfig = subscribeStaffConfig(setMozoPin);
    return () => unsubConfig();
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

  const handleGoogleSignIn = async () => {
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
      let msg = 'No se pudo completar el acceso con Google. Inténtalo nuevamente.';

      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        msg = 'Cerraste la ventana de Google antes de terminar. Toca el botón nuevamente para iniciar sesión.';
      } else if (code === 'auth/popup-blocked') {
        msg = 'Tu navegador bloqueó la ventana emergente de Google. Permite las ventanas emergentes (popups) e inténtalo de nuevo.';
      } else if (code === 'auth/unauthorized-domain') {
        msg = 'Este dominio aún no está autorizado en Firebase Authentication (Authorized domains).';
      } else if (code === 'auth/network-request-failed') {
        msg = 'Sin conexión a internet. Verifica tu red e inténtalo de nuevo.';
      }

      setAuthError(msg);
      showToast(msg);
    } finally {
      popupInFlightRef.current = false;
      setAuthLoading(false);
    }
  };

  const handleGoogleSignOut = async () => {
    setAuthError('');
    try {
      await signOut(auth);
      setIsAdminAuthenticated(false);
      showToast('Cuenta Google desconectada');
    } catch {
      showToast('No se pudo cerrar la cuenta Google');
    }
  };

  const requireVerifiedCustomer = (action: (user: User) => void) => {
    if (firebaseUser && firebaseUser.emailVerified) {
      action(firebaseUser);
      return;
    }
    setAuthError('');
    pendingAuthActionRef.current = action;
    setShowGooglePrompt(true);
  };

  const navigate = (screen: ScreenId) => {
    let target = screen;
    if (target === 'admin-panel' && !isAdminAuthenticated) {
      target = 'admin-login';
    }
    if (target === 'mozo-panel' && !isMozoAuthenticated) {
      showToast('Toca 5 veces el logo en Bienvenida e ingresa tu PIN de Mozo');
      target = 'welcome';
    }
    if (currentScreen === target) return;
    setNavDirection(1);
    setHistory((prev) => {
      if (prev[prev.length - 1] === target) return prev;
      return [...prev, target];
    });
  };

  const goBack = () => {
    setNavDirection(-1);
    setHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : ['welcome']));
  };

  const selectedDish = useMemo(
    () =>
      menuItems.find((m) => m.id === selectedDishId) ||
      menuItems.find((m) => m.available) ||
      menuItems[0],
    [menuItems, selectedDishId]
  );

  const cartCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart]
  );

  const cartTotal = useMemo(() => getCartTotal(cart), [cart]);

  const activeTableOrder = useMemo(() => {
    if (activeTableOrderId) {
      const byId = kitchenOrders.find(
        (o) => o.id === activeTableOrderId && o.tableNumber === selectedTable
      );
      if (byId) return byId;
    }
    return (
      kitchenOrders.find(
        (o) => o.mode === 'dine-in' && o.tableNumber === selectedTable && !o.paid
      ) ||
      kitchenOrders.find(
        (o) => o.mode === 'dine-in' && o.tableNumber === selectedTable
      )
    );
  }, [kitchenOrders, activeTableOrderId, selectedTable]);

  const activeDeliveryOrder = useMemo(() => {
    if (activeDeliveryOrderId) {
      const byId = kitchenOrders.find((o) => o.id === activeDeliveryOrderId);
      if (byId) return byId;
    }
    return kitchenOrders.find((o) => o.mode === 'delivery');
  }, [kitchenOrders, activeDeliveryOrderId]);

  const lastPaidOrder = useMemo(
    () => kitchenOrders.find((o) => o.id === lastPaidOrderId),
    [kitchenOrders, lastPaidOrderId]
  );

  // Handlers
  const handleSelectTable = (tableNumber: number) => {
    setSelectedTable(tableNumber);
  };

  const handleToggleFavorite = (id: string) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleAddToCart = (
    item: MenuItem,
    size: DishSizeOption,
    extras: ExtraOption[]
  ) => {
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
          cartItemId: `ci-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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
  };

  const handleQuickAdd = (item: MenuItem) => {
    handleAddToCart(item, item.sizes[0], []);
  };

  const handleUpdateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleChangeCartItemSize = (cartItemId: string, sizeId: string) => {
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
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const handleSaveCustomize = (payload: {
    base: string;
    toppings: string[];
    side: string;
    selectedAdditions: { item: MenuItem; size: DishSizeOption }[];
  }) => {
    const customSummary = `Base: ${payload.base} · Toppings: ${
      payload.toppings.join(', ') || 'Ninguno'
    } · Acompañamiento: ${payload.side}`;

    const newCartItems: CartItem[] = payload.selectedAdditions.map((add, idx) => ({
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
    }));

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
  };

  const executeDineInOrder = (user: User) => {
    const lines = cartItemsToOrderLines(cart);
    const existingUnpaid = kitchenOrders.find(
      (o) =>
        o.mode === 'dine-in' &&
        o.tableNumber === selectedTable &&
        !o.paid &&
        (isStaff || o.customerUid === user.uid)
    );

    if (existingUnpaid) {
      const updatedItems = [...existingUnpaid.items, ...lines];
      const updatedTotal = existingUnpaid.total + cartTotal;
      setKitchenOrders((prev) =>
        prev.map((o) =>
          o.id === existingUnpaid.id
            ? {
                ...o,
                items: updatedItems,
                total: updatedTotal,
                status: 'Preparando',
              }
            : o
        )
      );
      setActiveTableOrderId(existingUnpaid.id);
      void appendOrderItemsInFirestore({
        orderId: existingUnpaid.id,
        items: updatedItems,
        total: updatedTotal,
        status: 'Preparando',
      });
    } else {
      const newOrderId = `ord-mesa-${Date.now()}`;
      const newOrder: KitchenOrder = {
        id: newOrderId,
        code: buildOrderCode(kitchenOrders.length),
        customerUid: user.uid,
        mode: 'dine-in',
        tableNumber: selectedTable,
        customerLabel: `Mesa ${selectedTable}`,
        items: lines,
        notes: 'Pedido desde mesa',
        status: 'Preparando',
        total: cartTotal,
        estimatedMinutes: 15,
        createdAt: getCurrentTimeLabel(),
        paid: false,
        waiterRequested: false,
      };
      const tableObj = tables.find((t) => t.number === selectedTable);
      setKitchenOrders((prev) => [newOrder, ...prev]);
      setActiveTableOrderId(newOrderId);
      setTables((prev) =>
        prev.map((t) =>
          t.number === selectedTable ? { ...t, status: 'ocupada' } : t
        )
      );

      void createOrderInFirestore({
        order: newOrder,
        customerUid: user.uid,
        occupyTableIfNeeded: {
          tableNumber: selectedTable,
          capacity: tableObj?.capacity || 4,
          isCurrentlyFree: tableObj?.status === 'libre',
          isStaff,
        },
      });
    }

    setCart([]);
    showToast(`Pedido enviado a Cocina · Mesa ${selectedTable}`);
    navigate('tables-order');
  };

  const handleCartProceedOrder = () => {
    if (cart.length === 0) return;

    if (orderMode === 'dine-in') {
      requireVerifiedCustomer((user) => {
        executeDineInOrder(user);
      });
    } else {
      navigate('delivery-info');
    }
  };

  const createDeliveryOrderFromCart = (
    user: User,
    paid: boolean,
    method?: PaymentMethod
  ): KitchenOrder => {
    const newDelId = `ord-del-${Date.now()}`;
    const notesParts = [deliveryInfo.reference.trim(), deliveryInfo.notes.trim()].filter(
      Boolean
    );
    const deliveryOrder: KitchenOrder = {
      id: newDelId,
      code: buildOrderCode(kitchenOrders.length),
      customerUid: user.uid,
      mode: 'delivery',
      customerLabel: user.displayName
        ? `Delivery · ${user.displayName.split(' ')[0]}`
        : 'Pedido Delivery',
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
    setKitchenOrders((prev) => [deliveryOrder, ...prev]);
    setActiveDeliveryOrderId(newDelId);
    setCart([]);

    void createOrderInFirestore({
      order: deliveryOrder,
      customerUid: user.uid,
      deliveryReference: deliveryInfo.reference.trim(),
    });

    return deliveryOrder;
  };

  const handleDeliveryInfoContinue = () => {
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
  };

  const handleCompletePayment = () => {
    requireVerifiedCustomer((user) => {
      if (paymentContext === 'table') {
        if (!activeTableOrder) {
          showToast('No hay pedido activo en la mesa seleccionada');
          return;
        }
        setKitchenOrders((prev) =>
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
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    const deliveredAtLabel = status === 'Entregado' ? getCurrentTimeLabel() : undefined;
    setKitchenOrders((prev) =>
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
    if (firebaseUser) {
      void updateOrderStatusInFirestore(orderId, status, deliveredAtLabel);
    }
  };

  const handleCallWaiter = (orderId: string) => {
    setKitchenOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, waiterRequested: true } : o))
    );
    if (firebaseUser) {
      void setWaiterCallInFirestore(orderId, true);
    }
    showToast(`Mesero notificado para Mesa ${selectedTable}`);
  };

  const handleDismissWaiterCall = (orderId: string) => {
    setKitchenOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, waiterRequested: false } : o))
    );
    if (firebaseUser && isStaff) {
      void setWaiterCallInFirestore(orderId, false);
    }
  };

  const handleCollectOrderPayment = (orderId: string, method: PaymentMethod) => {
    const targetOrder = kitchenOrders.find((o) => o.id === orderId);

    setKitchenOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, paid: true, paymentMethod: method, waiterRequested: false }
          : o
      )
    );

    let tableNumberToFree: number | undefined;
    if (targetOrder?.mode === 'dine-in' && targetOrder.tableNumber) {
      const tableNum = targetOrder.tableNumber;
      const hasOtherUnpaidOnTable = kitchenOrders.some(
        (o) =>
          o.id !== orderId &&
          o.mode === 'dine-in' &&
          o.tableNumber === tableNum &&
          !o.paid
      );

      if (!hasOtherUnpaidOnTable) {
        tableNumberToFree = tableNum;
        setTables((prev) =>
          prev.map((t) =>
            t.number === tableNum ? { ...t, status: 'libre' } : t
          )
        );
        if (activeTableOrderId === orderId) {
          setActiveTableOrderId(null);
        }
      }
    }

    if (firebaseUser && isStaff) {
      void collectOrderPaymentInFirestore({
        orderId,
        method,
        tableNumberToFree,
      });
    }

    if (tableNumberToFree) {
      showToast(`Cobro registrado (${method}) · Mesa ${tableNumberToFree} ahora Libre`);
    } else {
      showToast(`Cobro registrado (${method})`);
    }
  };

  const handleCreatePosOrder = (payload: {
    mode: OrderMode;
    tableNumber?: number;
    deliveryAddress?: string;
    deliveryPhone?: string;
    notes: string;
    items: OrderLineItem[];
    payNowMethod?: PaymentMethod;
  }): KitchenOrder => {
    const total = payload.items.reduce((acc, it) => acc + it.price * it.quantity, 0);
    const newId = `ord-pos-${Date.now()}`;
    const ownerUid = firebaseUser?.uid || 'local-staff';
    const newOrder: KitchenOrder = {
      id: newId,
      code: buildOrderCode(kitchenOrders.length),
      customerUid: ownerUid,
      mode: payload.mode,
      tableNumber: payload.mode === 'dine-in' ? payload.tableNumber : undefined,
      customerLabel:
        payload.mode === 'dine-in'
          ? `Mesa ${payload.tableNumber}`
          : 'Pedido Delivery (Caja)',
      deliveryAddress: payload.mode === 'delivery' ? payload.deliveryAddress : undefined,
      deliveryPhone: payload.mode === 'delivery' ? payload.deliveryPhone : undefined,
      items: payload.items,
      notes:
        payload.notes ||
        (payload.mode === 'dine-in' ? 'Tomado en caja' : 'Delivery tomado en caja'),
      status: 'Preparando',
      total,
      estimatedMinutes: payload.mode === 'dine-in' ? 15 : 25,
      createdAt: getCurrentTimeLabel(),
      paid: Boolean(payload.payNowMethod),
      paymentMethod: payload.payNowMethod,
      waiterRequested: false,
    };

    setKitchenOrders((prev) => [newOrder, ...prev]);

    const tableObj =
      payload.mode === 'dine-in' && payload.tableNumber
        ? tables.find((t) => t.number === payload.tableNumber)
        : undefined;

    if (payload.mode === 'dine-in' && payload.tableNumber) {
      setTables((prev) =>
        prev.map((t) =>
          t.number === payload.tableNumber ? { ...t, status: 'ocupada' } : t
        )
      );
      setActiveTableOrderId(newId);
    } else if (payload.mode === 'delivery') {
      setActiveDeliveryOrderId(newId);
    }

    if (firebaseUser && isStaff) {
      void createOrderInFirestore({
        order: newOrder,
        customerUid: ownerUid,
        occupyTableIfNeeded:
          payload.mode === 'dine-in' && payload.tableNumber
            ? {
                tableNumber: payload.tableNumber,
                capacity: tableObj?.capacity || 4,
                isCurrentlyFree: tableObj?.status === 'libre',
                isStaff: true,
              }
            : undefined,
      });
    } else {
      showToast('Conecta Google autorizado para sincronizar en la nube');
    }

    showToast(
      payload.payNowMethod
        ? `Pedido ${newOrder.code} creado y cobrado (${formatBs(total)})`
        : `Pedido ${newOrder.code} enviado a Cocina`
    );

    return newOrder;
  };

  const handleFreeTable = (tableNumber: number) => {
    setTables((prev) =>
      prev.map((t) =>
        t.number === tableNumber ? { ...t, status: 'libre' } : t
      )
    );
    if (activeTableOrder && activeTableOrder.tableNumber === tableNumber && activeTableOrder.paid) {
      setActiveTableOrderId(null);
    }
    if (firebaseUser && isStaff) {
      void freeTableInFirestore(tableNumber);
    }
    showToast(`Mesa ${tableNumber} liberada`);
  };

  const handleAppendOrderItems = (
    orderId: string,
    newItems: OrderLineItem[]
  ): KitchenOrder | undefined => {
    if (newItems.length === 0) return undefined;
    const existing = kitchenOrders.find((o) => o.id === orderId);
    if (!existing) return undefined;

    const extraTotal = newItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
    const updatedItems = [...existing.items, ...newItems];
    const updatedTotal = existing.total + extraTotal;
    const updatedStatus: OrderStatus =
      existing.status === 'Entregado' ? 'Preparando' : existing.status;

    const updatedOrder: KitchenOrder = {
      ...existing,
      items: updatedItems,
      total: updatedTotal,
      status: updatedStatus,
    };

    setKitchenOrders((prev) =>
      prev.map((o) => (o.id === orderId ? updatedOrder : o))
    );

    if (firebaseUser && (isStaff || existing.customerUid === firebaseUser.uid)) {
      void appendOrderItemsInFirestore({
        orderId,
        items: updatedItems,
        total: updatedTotal,
        status: updatedStatus,
      });
    }

    showToast('Platos agregados a la comanda');
    return updatedOrder;
  };

  const handleAdminLogout = async () => {
    await handleGoogleSignOut();
    setIsAdminAuthenticated(false);
    setNavDirection(-1);
    setHistory(['welcome']);
    showToast('Sesión de Administrador cerrada');
  };

  const handleMozoLoginSuccess = () => {
    setIsMozoAuthenticated(true);
    setNavDirection(1);
    setHistory((prev) => [...prev, 'mozo-panel']);
    showToast('Modo Mozo activado');
  };

  const handleMozoLogout = () => {
    setIsMozoAuthenticated(false);
    setNavDirection(-1);
    setHistory(['welcome']);
    showToast('Sesión de Mozo cerrada');
  };

  const handleRateOrder = (orderId: string, stars: number) => {
    setKitchenOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ratingStars: stars } : o))
    );
    if (firebaseUser) {
      void rateOrderInFirestore(orderId, stars);
    }
    showToast(`¡Gracias por calificar con ${stars} estrellas!`);
  };

  const showBottomNav =
    currentScreen !== 'welcome' &&
    currentScreen !== 'admin-login' &&
    currentScreen !== 'mozo-panel';

  const paymentTotal =
    paymentContext === 'table' ? activeTableOrder?.total ?? 0 : cartTotal;

  const paymentSummaryLabel =
    paymentContext === 'table'
      ? `Resumen Mesa ${selectedTable}`
      : 'Resumen Pedido Delivery';

  const paymentThanks =
    lastPaidOrder?.mode === 'delivery'
      ? 'Gracias por tu pedido Delivery'
      : `Gracias, Mesa ${lastPaidOrder?.tableNumber ?? selectedTable}`;

  return (
    <div className="h-screen w-full linen-backdrop flex flex-col lg:flex-row lg:p-4 lg:gap-4 overflow-hidden">
      {/* Desktop Live Dashboard & Navigation Sidebar (PC & Large Screens) */}
      <DesktopSidebar
        currentScreen={currentScreen}
        onNavigate={navigate}
        orderMode={orderMode}
        onChangeOrderMode={(m) => setOrderMode(m)}
        selectedTable={selectedTable}
        tables={tables}
        cartCount={cartCount}
        cartTotal={cartTotal}
        favoritesCount={favoriteIds.length}
        kitchenOrders={kitchenOrders}
        activeTableOrder={activeTableOrder}
        activeDeliveryOrder={activeDeliveryOrder}
        isAdminAuthenticated={isAdminAuthenticated}
        isMozoAuthenticated={isMozoAuthenticated}
      />

      {/* Main Responsive App Frame (Full-screen on mobile, full desktop workspace on PC) */}
      <main className="relative flex-1 h-full bg-[#FFF8E8] lg:rounded-[24px] shadow-2xl lg:border-2 lg:border-[#3B1F0E]/20 overflow-hidden flex flex-col">
        {/* Global Feedback Toast */}
        {toastMsg && (
          <div className="absolute top-16 left-4 right-4 z-50 pointer-events-none flex justify-center">
            <div className="px-3.5 py-2 rounded-xl bg-[#3B1F0E] text-[#FFF8E8] border border-[#D9A441] text-xs font-extrabold shadow-lg text-center">
              {toastMsg}
            </div>
          </div>
        )}

        {/* Active Screen with Smooth Lateral Slide Transitions */}
        <div className="relative flex-1 min-h-0 overflow-hidden">
          <AnimatePresence initial={false} custom={navDirection} mode="sync">
            <motion.div
              key={currentScreen}
              custom={navDirection}
              variants={{
                enter: (dir: number) => ({
                  x: shouldReduceMotion ? '0%' : dir >= 0 ? '26%' : '-26%',
                  opacity: shouldReduceMotion ? 1 : 0,
                }),
                center: {
                  x: '0%',
                  opacity: 1,
                },
                exit: (dir: number) => ({
                  x: shouldReduceMotion ? '0%' : dir >= 0 ? '-20%' : '26%',
                  opacity: shouldReduceMotion ? 1 : 0,
                }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: shouldReduceMotion ? 0 : 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="absolute inset-0 flex flex-col min-h-0"
            >
              {currentScreen === 'welcome' && (
                <WelcomeScreen
                  mozoPin={mozoPin}
                  isMozoLoggedIn={isMozoAuthenticated}
                  onMozoLoginSuccess={handleMozoLoginSuccess}
                  onMozoLogout={handleMozoLogout}
                  onGoMozoPanel={() => navigate('mozo-panel')}
                  onSelectDineIn={() => {
                    setOrderMode('dine-in');
                    navigate('tables-select');
                  }}
                  onSelectDelivery={() => {
                    setOrderMode('delivery');
                    navigate('menu');
                  }}
                  onGoAdminLogin={() =>
                    navigate(isAdminAuthenticated ? 'admin-panel' : 'admin-login')
                  }
                />
              )}

              {(currentScreen === 'menu' ||
                currentScreen === 'search' ||
                currentScreen === 'favorites') && (
                <MenuScreen
                  mode={currentScreen}
                  menuItems={menuItems}
                  favoriteIds={favoriteIds}
                  cartCount={cartCount}
                  orderMode={orderMode}
                  selectedTable={selectedTable}
                  onBack={goBack}
                  onSelectItem={(item) => {
                    setSelectedDishId(item.id);
                    navigate('dish-detail');
                  }}
                  onQuickAdd={handleQuickAdd}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenCustomize={() => navigate('customize')}
                  onOpenCart={() => navigate('cart')}
                  onOpenTables={() => navigate('tables-select')}
                />
              )}

              {currentScreen === 'dish-detail' && selectedDish && (
                <DishDetailScreen
                  item={selectedDish}
                  isFavorite={favoriteIds.includes(selectedDish.id)}
                  onBack={goBack}
                  onToggleFavorite={handleToggleFavorite}
                  onAddToCart={(item, size, extras) => {
                    handleAddToCart(item, size, extras);
                    navigate('cart');
                  }}
                  onOpenCustomize={() => navigate('customize')}
                />
              )}

              {currentScreen === 'customize' && (
                <CustomizeDishScreen
                  menuItems={menuItems}
                  onBack={goBack}
                  onSaveAndContinue={handleSaveCustomize}
                />
              )}

              {currentScreen === 'cart' && (
                <CartScreen
                  cart={cart}
                  menuItems={menuItems}
                  orderMode={orderMode}
                  selectedTable={selectedTable}
                  onBack={goBack}
                  onChangeOrderMode={(m) => setOrderMode(m)}
                  onEditTable={() => navigate('tables-select')}
                  onUpdateQuantity={handleUpdateCartQuantity}
                  onChangeItemSize={handleChangeCartItemSize}
                  onRemoveItem={handleRemoveCartItem}
                  onClearCart={() => setCart([])}
                  onProceedOrder={handleCartProceedOrder}
                  onGoMenu={() => navigate('menu')}
                />
              )}

              {currentScreen === 'tables-select' && (
                <TableSelectScreen
                  tables={tables}
                  selectedTable={selectedTable}
                  onSelectTable={handleSelectTable}
                  onConfirmTable={() => {
                    setOrderMode('dine-in');
                    navigate('tables-qr');
                  }}
                  onBack={goBack}
                />
              )}

              {currentScreen === 'tables-qr' && (
                <TableQrScreen
                  selectedTable={selectedTable}
                  onScanQrToMenu={() => {
                    setOrderMode('dine-in');
                    navigate('menu');
                  }}
                  onViewTableOrder={() => navigate('tables-order')}
                  onBack={goBack}
                />
              )}

              {currentScreen === 'tables-order' && (
                <TableOrderScreen
                  selectedTable={selectedTable}
                  order={activeTableOrder}
                  onBack={goBack}
                  onGoMenu={() => navigate('menu')}
                  onCallWaiter={handleCallWaiter}
                  onPayAtTable={() => {
                    setOrderMode('dine-in');
                    setPaymentContext('table');
                    navigate('payment-methods');
                  }}
                />
              )}

              {currentScreen === 'delivery-info' && (
                <DeliveryInfoScreen
                  deliveryInfo={deliveryInfo}
                  totalAmount={cartTotal}
                  onChangeInfo={setDeliveryInfo}
                  onContinue={handleDeliveryInfoContinue}
                  onBack={goBack}
                />
              )}

              {currentScreen === 'delivery-tracking' && (
                <DeliveryTrackingScreen
                  order={activeDeliveryOrder}
                  onUpdateOrderStatus={(status) => {
                    if (activeDeliveryOrder) {
                      handleUpdateOrderStatus(activeDeliveryOrder.id, status);
                    }
                  }}
                  onGoConfirm={() => navigate('delivery-confirm')}
                  onGoMenu={() => navigate('menu')}
                  onBack={goBack}
                />
              )}

              {currentScreen === 'delivery-confirm' && (
                <DeliveryConfirmScreen
                  order={activeDeliveryOrder}
                  onRateOrder={handleRateOrder}
                  onBackToMenu={() => navigate('menu')}
                  onBack={goBack}
                />
              )}

              {currentScreen === 'payment-methods' && (
                <PaymentMethodsScreen
                  summaryLabel={paymentSummaryLabel}
                  totalAmount={paymentTotal}
                  selectedMethod={paymentMethod}
                  onSelectMethod={setPaymentMethod}
                  onContinue={() => {
                    if (paymentTotal <= 0) {
                      showToast('No hay monto pendiente por pagar');
                      return;
                    }
                    if (paymentMethod === 'QR') {
                      navigate('payment-qr');
                    } else {
                      handleCompletePayment();
                    }
                  }}
                  onBack={goBack}
                />
              )}

              {currentScreen === 'payment-qr' && (
                <PaymentQrScreen
                  totalAmount={paymentTotal}
                  onPaid={handleCompletePayment}
                  onBack={goBack}
                />
              )}

              {currentScreen === 'payment-confirm' && (
                <PaymentConfirmScreen
                  totalAmount={lastPaidAmount}
                  customerThanks={paymentThanks}
                  paymentMethod={lastPaidOrder?.paymentMethod || paymentMethod}
                  paidOrder={lastPaidOrder}
                  onTrackDelivery={
                    lastPaidOrder?.mode === 'delivery'
                      ? () => navigate('delivery-tracking')
                      : undefined
                  }
                  onBackToMenu={() => navigate('menu')}
                  onBack={goBack}
                />
              )}

              {currentScreen === 'profile' && (
                <ProfileScreen
                  orderMode={orderMode}
                  selectedTable={selectedTable}
                  activeTableOrder={activeTableOrder}
                  activeDeliveryOrder={activeDeliveryOrder}
                  firebaseUser={firebaseUser}
                  authLoading={authLoading}
                  onGoogleSignIn={() => void handleGoogleSignIn()}
                  onGoogleSignOut={() => void handleGoogleSignOut()}
                  onBack={goBack}
                  onGoTables={() => navigate('tables-select')}
                  onGoTableOrder={() => navigate('tables-order')}
                  onGoDeliveryTracking={() => navigate('delivery-tracking')}
                  onGoAdminLogin={() =>
                    navigate(isAdminAuthenticated ? 'admin-panel' : 'admin-login')
                  }
                />
              )}

              {currentScreen === 'admin-login' && (
                <AdminLoginScreen
                  firebaseUser={firebaseUser}
                  isAdmin={isAdminUser}
                  authLoading={authLoading}
                  authError={authError}
                  onGoogleSignIn={handleGoogleSignIn}
                  onGoogleSignOut={handleGoogleSignOut}
                  onEnterAdminPanel={() => {
                    setIsAdminAuthenticated(true);
                    navigate('admin-panel');
                  }}
                  onBack={goBack}
                />
              )}

              {currentScreen === 'admin-panel' && (
                <AdminPanelScreen
                  menuItems={menuItems}
                  kitchenOrders={kitchenOrders}
                  tables={tables}
                  inventory={inventory}
                  authorizedStaff={authorizedStaff}
                  adminEmail={firebaseUser?.email}
                  onToggleDishAvailability={(id) => {
                    const idx = menuItems.findIndex((m) => m.id === id);
                    if (idx < 0) return;
                    const updated = {
                      ...menuItems[idx],
                      available: !menuItems[idx].available,
                    };
                    setMenuItems((prev) =>
                      prev.map((m) => (m.id === id ? updated : m))
                    );
                    if (isAdminUser) {
                      void upsertMenuItemInFirestore(updated, idx);
                    }
                  }}
                  onSaveDishEdit={(updated) => {
                    const idx = menuItems.findIndex((m) => m.id === updated.id);
                    setMenuItems((prev) =>
                      prev.map((m) => (m.id === updated.id ? updated : m))
                    );
                    if (isAdminUser) {
                      void upsertMenuItemInFirestore(updated, idx >= 0 ? idx : menuItems.length);
                    }
                    showToast(`${updated.name} actualizado`);
                  }}
                  onAddNewDish={(newItem) => {
                    const nextOrder = menuItems.length;
                    setMenuItems((prev) => [...prev, newItem]);
                    if (isAdminUser) {
                      void upsertMenuItemInFirestore(newItem, nextOrder);
                    }
                    showToast(`${newItem.name} agregado al menú`);
                  }}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onCollectOrderPayment={handleCollectOrderPayment}
                  onCreatePosOrder={handleCreatePosOrder}
                  onDismissWaiterCall={handleDismissWaiterCall}
                  onFreeTable={handleFreeTable}
                  onUpdateInventory={(updated) => {
                    setInventory(updated);
                    if (isAdminUser) {
                      void saveInventoryInFirestore(updated);
                    }
                    showToast('Inventario actualizado');
                  }}
                  mozoPin={mozoPin}
                  onUpdateMozoPin={(newPin) => {
                    setMozoPin(newPin);
                    if (isAdminUser) {
                      void saveMozoPinInFirestore(newPin);
                    }
                    showToast(`PIN de Mozo actualizado (${newPin})`);
                  }}
                  onAddAuthorizedStaff={(email, name) => {
                    if (isAdminUser) {
                      void addAuthorizedStaffInFirestore(email, name);
                      showToast(`Mozo autorizado: ${email.toLowerCase()}`);
                    }
                  }}
                  onToggleAuthorizedStaff={(email, active) => {
                    if (isAdminUser) {
                      void toggleAuthorizedStaffInFirestore(email, active);
                      showToast(active ? 'Mozo activado' : 'Mozo pausado');
                    }
                  }}
                  onRemoveAuthorizedStaff={(email) => {
                    if (isAdminUser) {
                      void removeAuthorizedStaffInFirestore(email);
                      showToast(`Acceso revocado para ${email}`);
                    }
                  }}
                  onLogout={() => void handleAdminLogout()}
                  onBack={goBack}
                />
              )}

              {currentScreen === 'mozo-panel' && (
                <MozoScreen
                  menuItems={menuItems}
                  kitchenOrders={kitchenOrders}
                  tables={tables}
                  firebaseUser={firebaseUser}
                  isStaff={isStaff}
                  onGoogleSignIn={() => void handleGoogleSignIn()}
                  onCreatePosOrder={handleCreatePosOrder}
                  onAppendOrderItems={handleAppendOrderItems}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onCollectOrderPayment={handleCollectOrderPayment}
                  onDismissWaiterCall={handleDismissWaiterCall}
                  onFreeTable={handleFreeTable}
                  onLogout={handleMozoLogout}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Customer Google Sign-In Modal for live order sync */}
        {showGooglePrompt && (
          <div className="absolute inset-0 z-50 bg-black/65 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-3xl bg-[#FFF8E8] border-2 border-[#D9A441] p-5 shadow-2xl space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-serif-display text-lg font-bold text-[#3B1F0E]">
                    Conecta tu cuenta Google
                  </h2>
                  <p className="text-xs text-[#7A5A3A] mt-1 leading-relaxed">
                    Para enviar tu pedido a Cocina y sincronizarlo en tiempo real con tu mesa o delivery, inicia sesión con Google en un toque.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    pendingAuthActionRef.current = null;
                    setAuthError('');
                    setShowGooglePrompt(false);
                  }}
                  aria-label="Cerrar"
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-[#3B1F0E] hover:bg-[#FDF2D6] cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {authError && (
                <p className="text-xs font-bold text-[#B84A27] bg-[#FDF2D6] border border-[#D9A441] rounded-xl px-3 py-2">
                  {authError}
                </p>
              )}

              <button
                type="button"
                disabled={authLoading}
                onClick={() => void handleGoogleSignIn()}
                className="w-full min-h-[48px] rounded-2xl bg-[#3B1F0E] text-[#FFF8E8] font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-[#4A2C1A] disabled:opacity-50 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-[#D9A441]" />
                <span>{authLoading ? 'Conectando...' : 'Continuar con Google'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Shared Bottom Nav on interior client/panel screens */}
        {showBottomNav && (
          <BottomNav
            currentScreen={currentScreen}
            onNavigate={navigate}
            favoritesCount={favoriteIds.length}
          />
        )}
      </main>
    </div>
  );
}
