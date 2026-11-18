import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AppIcon } from './components/BrandAssets';
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
import {
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

const QUICK_NAV_ITEMS: { id: ScreenId; label: string; group: string }[] = [
  { id: 'welcome', label: '1. Bienvenida', group: 'Cliente' },
  { id: 'menu', label: '2. Menú Cliente', group: 'Cliente' },
  { id: 'dish-detail', label: '3. Detalle Plato', group: 'Cliente' },
  { id: 'customize', label: '4. Personaliza tu Platillo', group: 'Cliente' },
  { id: 'cart', label: '5. Carrito', group: 'Cliente' },
  { id: 'tables-select', label: '6A. Selecciona tu Mesa', group: 'Mesas QR' },
  { id: 'tables-qr', label: '6B. Escanea el QR', group: 'Mesas QR' },
  { id: 'tables-order', label: '6C. Pedido en Mesa', group: 'Mesas QR' },
  { id: 'delivery-info', label: '7A. Datos de Delivery', group: 'Delivery' },
  { id: 'delivery-tracking', label: '7B. Repartidor en camino', group: 'Delivery' },
  { id: 'delivery-confirm', label: '7C. Confirmación Delivery', group: 'Delivery' },
  { id: 'payment-methods', label: '8A. Métodos de Pago', group: 'Pagos' },
  { id: 'payment-qr', label: '8B. Pago con QR', group: 'Pagos' },
  { id: 'payment-confirm', label: '8C. Confirmación de Pago', group: 'Pagos' },
  { id: 'admin-login', label: '9. Admin Login', group: 'Admin' },
  { id: 'admin-panel', label: '10. Admin Panel', group: 'Admin' },
];

export default function App() {
  const [history, setHistory] = useState<ScreenId[]>(['welcome']);
  const [navDirection, setNavDirection] = useState<number>(1);
  const shouldReduceMotion = useReducedMotion();
  const currentScreen = history[history.length - 1];

  // Global reactive app state (starts clean without fake orders)
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
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isMozoAuthenticated, setIsMozoAuthenticated] = useState<boolean>(false);
  const [mozoPin, setMozoPin] = useState<string>('1234');
  const [toastMsg, setToastMsg] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? '' : curr));
    }, 2400);
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

  const handleCartProceedOrder = () => {
    if (cart.length === 0) return;

    if (orderMode === 'dine-in') {
      const lines = cartItemsToOrderLines(cart);
      const existingUnpaid = kitchenOrders.find(
        (o) => o.mode === 'dine-in' && o.tableNumber === selectedTable && !o.paid
      );

      if (existingUnpaid) {
        setKitchenOrders((prev) =>
          prev.map((o) =>
            o.id === existingUnpaid.id
              ? {
                  ...o,
                  items: [...o.items, ...lines],
                  total: o.total + cartTotal,
                  status: 'Preparando',
                }
              : o
          )
        );
        setActiveTableOrderId(existingUnpaid.id);
      } else {
        const newOrderId = `ord-mesa-${Date.now()}`;
        const newOrder: KitchenOrder = {
          id: newOrderId,
          code: `#${1001 + kitchenOrders.length}`,
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
        };
        setKitchenOrders((prev) => [newOrder, ...prev]);
        setActiveTableOrderId(newOrderId);
      }

      setTables((prev) =>
        prev.map((t) =>
          t.number === selectedTable ? { ...t, status: 'ocupada' } : t
        )
      );
      setCart([]);
      showToast(`Pedido enviado a Cocina · Mesa ${selectedTable}`);
      navigate('tables-order');
    } else {
      navigate('delivery-info');
    }
  };

  const createDeliveryOrderFromCart = (paid: boolean, method?: PaymentMethod): KitchenOrder => {
    const newDelId = `ord-del-${Date.now()}`;
    const notesParts = [deliveryInfo.reference.trim(), deliveryInfo.notes.trim()].filter(
      Boolean
    );
    const deliveryOrder: KitchenOrder = {
      id: newDelId,
      code: `#${1001 + kitchenOrders.length}`,
      mode: 'delivery',
      customerLabel: 'Pedido Delivery',
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
    };
    setKitchenOrders((prev) => [deliveryOrder, ...prev]);
    setActiveDeliveryOrderId(newDelId);
    setCart([]);
    return deliveryOrder;
  };

  const handleDeliveryInfoContinue = () => {
    if (cart.length === 0) {
      showToast('Agrega al menos un platillo antes de pedir Delivery');
      navigate('menu');
      return;
    }

    if (deliveryInfo.payOnDelivery) {
      createDeliveryOrderFromCart(false);
      showToast('Pedido Delivery enviado a Cocina (pago contra entrega)');
      navigate('delivery-tracking');
    } else {
      setPaymentContext('delivery-prepay');
      navigate('payment-methods');
    }
  };

  const handleCompletePayment = () => {
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
      showToast(`Pago registrado para Mesa ${selectedTable}`);
      navigate('payment-confirm');
    } else {
      if (cart.length === 0) {
        showToast('Tu carrito está vacío');
        navigate('menu');
        return;
      }
      const created = createDeliveryOrderFromCart(true, paymentMethod);
      setLastPaidOrderId(created.id);
      setLastPaidAmount(created.total);
      showToast('Pago confirmado · Tu Delivery está en preparación');
      navigate('payment-confirm');
    }
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    setKitchenOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              deliveredAt: status === 'Entregado' ? getCurrentTimeLabel() : o.deliveredAt,
            }
          : o
      )
    );
  };

  const handleCallWaiter = (orderId: string) => {
    setKitchenOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, waiterRequested: true } : o))
    );
    showToast(`Mesero notificado para Mesa ${selectedTable}`);
  };

  const handleDismissWaiterCall = (orderId: string) => {
    setKitchenOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, waiterRequested: false } : o))
    );
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
        setTables((prev) =>
          prev.map((t) =>
            t.number === tableNum ? { ...t, status: 'libre' } : t
          )
        );
        if (activeTableOrderId === orderId) {
          setActiveTableOrderId(null);
        }
        showToast(`Cobro registrado (${method}) · Mesa ${tableNum} ahora Libre`);
        return;
      }
    }

    showToast(`Cobro registrado (${method})`);
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
    const newOrder: KitchenOrder = {
      id: newId,
      code: `#${1001 + kitchenOrders.length}`,
      mode: payload.mode,
      tableNumber: payload.mode === 'dine-in' ? payload.tableNumber : undefined,
      customerLabel:
        payload.mode === 'dine-in'
          ? `Mesa ${payload.tableNumber}`
          : 'Pedido Delivery (Caja)',
      deliveryAddress: payload.mode === 'delivery' ? payload.deliveryAddress : undefined,
      deliveryPhone: payload.mode === 'delivery' ? payload.deliveryPhone : undefined,
      items: payload.items,
      notes: payload.notes || (payload.mode === 'dine-in' ? 'Tomado en caja' : 'Delivery tomado en caja'),
      status: 'Preparando',
      total,
      estimatedMinutes: payload.mode === 'dine-in' ? 15 : 25,
      createdAt: getCurrentTimeLabel(),
      paid: Boolean(payload.payNowMethod),
      paymentMethod: payload.payNowMethod,
    };

    setKitchenOrders((prev) => [newOrder, ...prev]);

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
    const updatedOrder: KitchenOrder = {
      ...existing,
      items: [...existing.items, ...newItems],
      total: existing.total + extraTotal,
      status: existing.status === 'Entregado' ? 'Preparando' : existing.status,
    };

    setKitchenOrders((prev) =>
      prev.map((o) => (o.id === orderId ? updatedOrder : o))
    );

    showToast('Platos agregados a la comanda');
    return updatedOrder;
  };

  const handleAdminLogout = () => {
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
      {/* Desktop Navigation Sidebar (PC & Large Screens) */}
      <aside className="hidden lg:flex w-64 xl:w-72 shrink-0 flex-col rounded-[24px] bg-[#3B1F0E] text-[#FFF8E8] p-5 shadow-xl border border-[#D9A441]/30">
        <div className="pb-4 border-b border-[#D9A441]/25">
          <div className="flex items-center gap-3">
            <AppIcon size="sm" />
            <div>
              <p className="font-script text-2xl text-[#D9A441] leading-none">
                Como en Casa
              </p>
              <p className="text-[11px] font-bold text-[#E8C87A] mt-1">
                Tupiza • Comida Tradicional
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto phone-scroll py-3 space-y-1.5 pr-1">
          {QUICK_NAV_ITEMS.map((nav) => {
            const active = currentScreen === nav.id;
            return (
              <button
                key={nav.id}
                type="button"
                onClick={() => navigate(nav.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#D9A441] text-[#2B1A0E]'
                    : 'bg-[#4A2C1A]/60 text-[#FFF8E8]/90 hover:bg-[#4A2C1A]'
                }`}
              >
                <span className="truncate">{nav.label}</span>
                <span
                  className={`text-[10px] ml-2 shrink-0 ${
                    active ? 'text-[#3B1F0E]' : 'text-[#E8C87A]/80'
                  }`}
                >
                  {nav.group}
                </span>
              </button>
            );
          })}
          {isMozoAuthenticated && (
            <button
              type="button"
              onClick={() => navigate('mozo-panel')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                currentScreen === 'mozo-panel'
                  ? 'bg-[#D9A441] text-[#2B1A0E]'
                  : 'bg-[#2E6F32]/35 text-[#FFF8E8] border border-[#D9A441]/40 hover:bg-[#2E6F32]/50'
              }`}
            >
              <span className="truncate">Modo Mozo • Comandas</span>
              <span className="text-[10px] ml-2 shrink-0 text-[#E8C87A]">
                Activo
              </span>
            </button>
          )}
        </div>

        <div className="pt-3 border-t border-[#D9A441]/25 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-[#E8C87A]">Modo activo:</span>
            <span className="font-extrabold">
              {orderMode === 'dine-in' ? `Mesa ${selectedTable}` : 'Delivery'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#E8C87A]">Carrito:</span>
            <span className="font-extrabold tabular-nums">
              {cartCount} items · {formatBs(cartTotal)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#E8C87A]">Pedidos en Cocina:</span>
            <span className="font-extrabold tabular-nums">
              {kitchenOrders.length}
            </span>
          </div>
        </div>
      </aside>

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
                  onBack={goBack}
                  onGoTables={() => navigate('tables-select')}
                  onGoTableOrder={() => navigate('tables-order')}
                  onGoDeliveryTracking={() => navigate('delivery-tracking')}
                  onGoAdminLogin={() => navigate('admin-login')}
                />
              )}

              {currentScreen === 'admin-login' && (
                <AdminLoginScreen
                  onLoginSuccess={() => {
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
                  onToggleDishAvailability={(id) => {
                    setMenuItems((prev) =>
                      prev.map((m) =>
                        m.id === id ? { ...m, available: !m.available } : m
                      )
                    );
                  }}
                  onSaveDishEdit={(updated) => {
                    setMenuItems((prev) =>
                      prev.map((m) => (m.id === updated.id ? updated : m))
                    );
                    showToast(`${updated.name} actualizado`);
                  }}
                  onAddNewDish={(newItem) => {
                    setMenuItems((prev) => [...prev, newItem]);
                    showToast(`${newItem.name} agregado al menú`);
                  }}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onCollectOrderPayment={handleCollectOrderPayment}
                  onCreatePosOrder={handleCreatePosOrder}
                  onDismissWaiterCall={handleDismissWaiterCall}
                  onFreeTable={handleFreeTable}
                  onUpdateInventory={(updated) => {
                    setInventory(updated);
                    showToast('Inventario actualizado');
                  }}
                  mozoPin={mozoPin}
                  onUpdateMozoPin={(newPin) => {
                    setMozoPin(newPin);
                    showToast(`PIN de Mozo actualizado (${newPin})`);
                  }}
                  onLogout={handleAdminLogout}
                  onBack={goBack}
                />
              )}

              {currentScreen === 'mozo-panel' && (
                <MozoScreen
                  menuItems={menuItems}
                  kitchenOrders={kitchenOrders}
                  tables={tables}
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
