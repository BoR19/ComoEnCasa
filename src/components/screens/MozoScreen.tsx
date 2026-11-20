import React, { useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Banknote,
  BellRing,
  Check,
  CheckCircle2,
  ChefHat,
  LogIn,
  LogOut,
  Minus,
  Plus,
  Printer,
  Search,
  Unlock,
  Utensils,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import {
  DishSizeOption,
  KitchenOrder,
  MenuCategory,
  MenuItem,
  OrderLineItem,
  OrderMode,
  OrderStatus,
  PaymentMethod,
  TableItem,
} from '../../types/app';
import {
  PAYMENT_METHODS,
  formatBs,
} from '../../utils/appHelpers';
import { DishIllustration } from '../BrandAssets';
import { CategoryTabs, MobileHeader } from '../ShellComponents';
import { TicketModal } from '../TicketModal';

type MozoTab = 'tables' | 'orders' | 'menu';

interface MozoScreenProps {
  menuItems: MenuItem[];
  kitchenOrders: KitchenOrder[];
  tables: TableItem[];
  firebaseUser: User | null;
  isStaff: boolean;
  authError?: string;
  onGoogleSignIn: () => void;
  onCreatePosOrder: (payload: {
    mode: OrderMode;
    tableNumber?: number;
    deliveryAddress?: string;
    deliveryPhone?: string;
    notes: string;
    items: OrderLineItem[];
    payNowMethod?: PaymentMethod;
  }) => KitchenOrder;
  onAppendOrderItems: (orderId: string, items: OrderLineItem[]) => KitchenOrder | undefined;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onCollectOrderPayment: (orderId: string, method: PaymentMethod) => void;
  onDismissWaiterCall: (orderId: string) => void;
  onFreeTable: (tableNumber: number) => void;
  onLogout: () => void;
}

export const MozoScreen: React.FC<MozoScreenProps> = ({
  menuItems,
  kitchenOrders,
  tables,
  firebaseUser,
  isStaff,
  authError,
  onGoogleSignIn,
  onCreatePosOrder,
  onAppendOrderItems,
  onUpdateOrderStatus,
  onCollectOrderPayment,
  onDismissWaiterCall,
  onFreeTable,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<MozoTab>('tables');

  // Menu search & category
  const [menuCategory, setMenuCategory] = useState<MenuCategory>('Platos Fuertes');
  const [menuQuery, setMenuQuery] = useState('');

  // Orders filter
  const [orderFilter, setOrderFilter] = useState<'all' | 'unpaid' | 'dine-in' | 'delivery'>('all');

  // Collect payment modal
  const [collectingOrder, setCollectingOrder] = useState<KitchenOrder | null>(null);
  const [collectMethod, setCollectMethod] = useState<PaymentMethod>('Efectivo');
  const [openTicketOnCollect, setOpenTicketOnCollect] = useState(true);

  // Ticket modal (Print / WhatsApp)
  const [ticketOrder, setTicketOrder] = useState<KitchenOrder | null>(null);

  // Comanda composer modal (New or Append to existing table order)
  const [showComposer, setShowComposer] = useState(false);
  const [appendTargetOrder, setAppendTargetOrder] = useState<KitchenOrder | null>(null);
  const [compMode, setCompMode] = useState<OrderMode>('dine-in');
  const [compTable, setCompTable] = useState<number>(1);
  const [compAddress, setCompAddress] = useState('');
  const [compPhone, setCompPhone] = useState('');
  const [compNotes, setCompNotes] = useState('');
  const [compCategory, setCompCategory] = useState<MenuCategory>('Platos Fuertes');
  const [compItems, setCompItems] = useState<OrderLineItem[]>([]);
  const [compPayNow, setCompPayNow] = useState(false);
  const [compPayMethod, setCompPayMethod] = useState<PaymentMethod>('Efectivo');
  const [openTicketOnCreate, setOpenTicketOnCreate] = useState(true);

  const freeTablesCount = tables.filter((t) => t.status === 'libre').length;
  const occupiedTablesCount = tables.length - freeTablesCount;
  const unpaidCount = kitchenOrders.filter((o) => !o.paid).length;
  const waiterRequests = useMemo(
    () => kitchenOrders.filter((o) => o.waiterRequested),
    [kitchenOrders]
  );

  const filteredMenu = useMemo(() => {
    const q = menuQuery.trim().toLowerCase();
    return menuItems.filter((item) => {
      if (q) return item.name.toLowerCase().includes(q);
      return item.category === menuCategory;
    });
  }, [menuItems, menuCategory, menuQuery]);

  const filteredOrders = useMemo(() => {
    return kitchenOrders.filter((o) => {
      if (orderFilter === 'unpaid') return !o.paid;
      if (orderFilter === 'dine-in') return o.mode === 'dine-in';
      if (orderFilter === 'delivery') return o.mode === 'delivery';
      return true;
    });
  }, [kitchenOrders, orderFilter]);

  const getActiveOrderForTable = (tableNumber: number): KitchenOrder | undefined => {
    return (
      kitchenOrders.find(
        (o) => o.mode === 'dine-in' && o.tableNumber === tableNumber && !o.paid
      ) ||
      kitchenOrders.find(
        (o) => o.mode === 'dine-in' && o.tableNumber === tableNumber
      )
    );
  };

  const openNewComanda = (tableNumber?: number) => {
    setAppendTargetOrder(null);
    setCompMode('dine-in');
    setCompTable(tableNumber ?? 1);
    setCompAddress('');
    setCompPhone('');
    setCompNotes('');
    setCompItems([]);
    setCompPayNow(false);
    setShowComposer(true);
  };

  const openAppendComanda = (order: KitchenOrder) => {
    setAppendTargetOrder(order);
    setCompMode(order.mode);
    setCompTable(order.tableNumber ?? 1);
    setCompItems([]);
    setCompNotes('');
    setCompPayNow(false);
    setShowComposer(true);
  };

  const addLineItem = (item: MenuItem, size: DishSizeOption) => {
    if (!item.available) return;
    setCompItems((prev) => {
      const idx = prev.findIndex(
        (l) => l.menuItemId === item.id && l.sizeLabel === size.label
      );
      if (idx >= 0) {
        return prev.map((l, i) =>
          i === idx ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          category: item.category,
          name: item.name,
          sizeLabel: size.label,
          quantity: 1,
          price: size.price,
        },
      ];
    });
  };

  const updateLineQty = (index: number, delta: number) => {
    setCompItems((prev) =>
      prev
        .map((it, i) => (i === index ? { ...it, quantity: it.quantity + delta } : it))
        .filter((it) => it.quantity > 0)
    );
  };

  const compTotal = compItems.reduce((acc, it) => acc + it.price * it.quantity, 0);

  const handleQuickAddFromMenuTab = (item: MenuItem, size: DishSizeOption) => {
    if (!item.available) return;
    addLineItem(item, size);
    if (!showComposer) {
      setAppendTargetOrder(null);
      setCompMode('dine-in');
    }
  };

  const handleSubmitComposer = (e: React.FormEvent) => {
    e.preventDefault();
    if (compItems.length === 0) return;

    if (appendTargetOrder) {
      const updated = onAppendOrderItems(appendTargetOrder.id, compItems);
      setShowComposer(false);
      setCompItems([]);
      setAppendTargetOrder(null);
      if (updated && openTicketOnCreate) {
        setTicketOrder(updated);
      }
      return;
    }

    const created = onCreatePosOrder({
      mode: compMode,
      tableNumber: compMode === 'dine-in' ? compTable : undefined,
      deliveryAddress: compMode === 'delivery' ? compAddress : undefined,
      deliveryPhone: compMode === 'delivery' ? compPhone : undefined,
      notes: compNotes,
      items: compItems,
      payNowMethod: compPayNow ? compPayMethod : undefined,
    });
    setCompItems([]);
    setCompNotes('');
    setCompAddress('');
    setCompPhone('');
    setCompPayNow(false);
    setShowComposer(false);
    if (openTicketOnCreate) {
      setTicketOrder(created);
    }
  };

  return (
    <div className="relative flex-1 flex flex-col bg-[#FFF8E8] min-h-0">
      <MobileHeader
        title="Modo Mozo • Comandas"
        rightSlot={
          <button
            type="button"
            onClick={onLogout}
            aria-label="Cerrar sesión de mozo"
            title="Cerrar sesión"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#D9A441] hover:bg-[#4A2C1A] active:scale-95 transition-transform cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </button>
        }
      />

      {/* Sub-navigation bar */}
      <div className="bg-[#4A2C1A] px-2.5 py-2 shrink-0">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-3 gap-1.5 lg:gap-2.5">
          {(
            [
              {
                id: 'tables',
                label: `Mesas (${freeTablesCount} lib.)`,
                icon: UtensilsCrossed,
              },
              {
                id: 'orders',
                label: `Comandas (${unpaidCount})`,
                icon: ChefHat,
              },
              {
                id: 'menu',
                label: 'Menú',
                icon: Utensils,
              },
            ] as {
              id: MozoTab;
              label: string;
              icon: React.ComponentType<{ className?: string }>;
            }[]
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[38px] px-2 py-1.5 rounded-xl text-[11px] lg:text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#D9A441] text-[#2B1A0E]'
                    : 'text-[#FFF8E8]/90 hover:bg-[#3B1F0E]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto phone-scroll">
        <div className="max-w-6xl mx-auto w-full px-4 lg:px-8 pt-4 lg:pt-6 pb-6 space-y-4">
          {(!firebaseUser || !isStaff) ? (
            <div className="rounded-2xl bg-[#3B1F0E] text-[#FFF8E8] border border-[#D9A441] p-3.5 space-y-2 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold text-[#D9A441]">
                    {firebaseUser
                      ? `Cuenta (${firebaseUser.email}) sin permiso de Mozo`
                      : 'Conecta una cuenta Google autorizada para sincronizar en vivo'}
                  </p>
                  <p className="text-[11px] text-[#FFF8E8]/85 mt-0.5 leading-relaxed">
                    {firebaseUser
                      ? 'Para seguridad de los pedidos, el Administrador debe agregar este correo en Panel Admin → Mozos autorizados (o conecta la cuenta del Administrador).'
                      : 'Por seguridad, las comandas y mesas en vivo requieren conectar una vez la cuenta Google del Administrador o de un Mozo autorizado en Panel Admin.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  className="px-3.5 py-2 rounded-xl bg-[#D9A441] text-[#2B1A0E] text-xs font-extrabold inline-flex items-center gap-1.5 hover:bg-[#E8C87A] cursor-pointer shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{firebaseUser ? 'Cambiar cuenta' : 'Conectar con Google'}</span>
                </button>
              </div>
              {authError && (
                <p className="text-[11px] font-bold text-[#E8C87A] bg-[#4A2C1A] border border-[#D9A441]/40 rounded-xl px-3 py-1.5">
                  {authError}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-[#2E6F32]/12 border border-[#2E6F32]/30 px-3 py-1.5 flex items-center justify-between text-[11px] font-extrabold text-[#2E6F32]">
              <span className="inline-flex items-center gap-1.5 truncate">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Sincronización en vivo activa · {firebaseUser.email}</span>
              </span>
            </div>
          )}

          {/* Waiter Calls */}
          {waiterRequests.map((req) => (
            <div
              key={`waiter-${req.id}`}
              className="rounded-2xl bg-[#B84A27] text-[#FFF8E8] p-3 flex items-center justify-between gap-2 shadow-sm"
            >
              <div className="flex items-center gap-2 text-xs font-extrabold">
                <BellRing className="w-4 h-4 text-[#D9A441] shrink-0" />
                <span>{req.customerLabel} solicita al mozo</span>
              </div>
              <button
                type="button"
                onClick={() => onDismissWaiterCall(req.id)}
                className="px-2.5 py-1 rounded-xl bg-[#FFF8E8] text-[#2B1A0E] text-[11px] font-extrabold cursor-pointer shrink-0"
              >
                Atendido
              </button>
            </div>
          ))}

          {/* TAB 1: MESAS DISPONIBLES */}
          {activeTab === 'tables' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-serif-display text-xl lg:text-2xl font-bold text-[#2B1A0E]">
                    Mesas disponibles
                  </h2>
                  <p className="text-xs font-bold text-[#7A5A3A]">
                    {freeTablesCount} libres · {occupiedTablesCount} ocupadas
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openNewComanda()}
                  className="min-h-[42px] px-4 py-2 rounded-2xl bg-[#B84A27] text-[#FFF8E8] font-extrabold text-xs inline-flex items-center gap-1.5 hover:bg-[#C95B34] cursor-pointer"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  <span>Nueva Comanda</span>
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
                {tables.map((table) => {
                  const isOccupied = table.status === 'ocupada';
                  const activeOrder = getActiveOrderForTable(table.number);

                  return (
                    <div
                      key={table.number}
                      className={`rounded-2xl border p-3.5 flex flex-col justify-between gap-2.5 transition-all ${
                        isOccupied
                          ? 'bg-[#FDF2D6] border-[#B84A27]/70'
                          : 'bg-[#FFFDF8] border-[#D9A441]/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div>
                          <p className="font-serif-display text-lg font-bold text-[#2B1A0E]">
                            Mesa {table.number}
                          </p>
                          <p className="text-[11px] font-bold text-[#7A5A3A]">
                            Cap. {table.capacity} pers.
                          </p>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold inline-flex items-center gap-1 ${
                            isOccupied
                              ? 'bg-[#B83227]/15 text-[#B83227]'
                              : 'bg-[#2E6F32]/15 text-[#2E6F32]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isOccupied ? 'bg-[#B83227]' : 'bg-[#2E6F32]'
                            }`}
                          />
                          {isOccupied ? 'Ocupada' : 'Libre'}
                        </span>
                      </div>

                      {activeOrder && isOccupied ? (
                        <div className="rounded-xl bg-[#FFF8E8] border border-[#D9A441]/45 p-2 text-[11px] space-y-1">
                          <div className="flex justify-between font-extrabold text-[#2B1A0E]">
                            <span>{activeOrder.code}</span>
                            <span className="text-[#B84A27] tabular-nums">
                              {formatBs(activeOrder.total)}
                            </span>
                          </div>
                          <div className="flex justify-between text-[10px] font-bold text-[#7A5A3A]">
                            <span>{activeOrder.status}</span>
                            <span
                              className={
                                activeOrder.paid ? 'text-[#2E6F32]' : 'text-[#B84A27]'
                              }
                            >
                              {activeOrder.paid ? 'Pagado' : 'Sin cobrar'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] font-semibold text-[#7A5A3A]">
                          Lista para asignar clientes
                        </p>
                      )}

                      <div className="space-y-1.5 pt-0.5">
                        {!isOccupied ? (
                          <button
                            type="button"
                            onClick={() => openNewComanda(table.number)}
                            className="w-full min-h-[36px] px-2.5 py-1.5 rounded-xl bg-[#D9A441] text-[#2B1A0E] text-xs font-extrabold flex items-center justify-center gap-1 hover:bg-[#E8C87A] cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tomar comanda</span>
                          </button>
                        ) : (
                          <>
                            {activeOrder && (
                              <div className="grid grid-cols-2 gap-1.5">
                                {!activeOrder.paid ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCollectMethod('Efectivo');
                                      setCollectingOrder(activeOrder);
                                    }}
                                    className="min-h-[34px] px-2 py-1 rounded-xl bg-[#2E6F32] text-[#FFF8E8] text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <Banknote className="w-3.5 h-3.5" />
                                    <span>Cobrar</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => onFreeTable(table.number)}
                                    className="min-h-[34px] px-2 py-1 rounded-xl bg-[#FFF8E8] border border-[#3B1F0E] text-[#3B1F0E] text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <Unlock className="w-3 h-3" />
                                    <span>Liberar</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setTicketOrder(activeOrder)}
                                  className="min-h-[34px] px-2 py-1 rounded-xl bg-[#D9A441] text-[#2B1A0E] text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Printer className="w-3 h-3" />
                                  <span>Ticket</span>
                                </button>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                activeOrder && !activeOrder.paid
                                  ? openAppendComanda(activeOrder)
                                  : openNewComanda(table.number)
                              }
                              className="w-full min-h-[32px] px-2 py-1 rounded-xl bg-[#FDF2D6] border border-[#D9A441] text-[#3B1F0E] text-[11px] font-extrabold flex items-center justify-center gap-1 hover:bg-[#E8C87A]/35 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Agregar platos</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: COMANDAS Y COBROS */}
          {activeTab === 'orders' && (
            <div className="space-y-3.5">
              <div className="space-y-2.5 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
                <button
                  type="button"
                  onClick={() => openNewComanda()}
                  className="w-full lg:w-auto min-h-[44px] px-4 lg:px-5 py-2.5 rounded-2xl bg-[#B84A27] text-[#FFF8E8] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs hover:bg-[#C95B34] cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  <span>Nueva Comanda (Mesa o Delivery)</span>
                </button>

                <div className="grid grid-cols-4 gap-1 lg:w-96">
                  {(
                    [
                      { id: 'all', label: 'Todas' },
                      { id: 'unpaid', label: 'Por cobrar' },
                      { id: 'dine-in', label: 'Mesas' },
                      { id: 'delivery', label: 'Delivery' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setOrderFilter(f.id)}
                      className={`min-h-[36px] rounded-xl text-[11px] font-extrabold border cursor-pointer ${
                        orderFilter === f.id
                          ? 'bg-[#3B1F0E] border-[#3B1F0E] text-[#FFF8E8]'
                          : 'bg-[#FDF2D6] border-[#D9A441]/55 text-[#3B1F0E]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="rounded-2xl bg-[#FDF2D6] border border-[#D9A441]/55 p-6 text-center space-y-2">
                  <p className="font-serif-display text-base font-bold text-[#3B1F0E]">
                    Sin comandas registradas
                  </p>
                  <p className="text-xs text-[#7A5A3A]">
                    Toca "Nueva Comanda" o elige una mesa libre para empezar a tomar pedidos.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4 items-start">
                  {filteredOrders.map((order) => {
                    const statuses: OrderStatus[] =
                      order.mode === 'delivery'
                        ? ['Preparando', 'En camino', 'Entregado']
                        : ['Preparando', 'Listo', 'Entregado'];

                    const tableObj = order.tableNumber
                      ? tables.find((t) => t.number === order.tableNumber)
                      : undefined;

                    return (
                      <article
                        key={order.id}
                        className="rounded-2xl bg-[#FDF2D6] border border-[#D9A441]/70 p-3.5 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-serif-display text-lg font-bold text-[#2B1A0E]">
                              {order.customerLabel}
                            </h3>
                            <p className="text-[11px] font-bold text-[#7A5A3A]">
                              {order.code} · {order.createdAt}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-extrabold text-sm text-[#B84A27] tabular-nums block">
                              {formatBs(order.total)}
                            </span>
                            <span
                              className={`inline-block mt-0.5 px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                                order.paid
                                  ? 'bg-[#2E6F32]/15 text-[#2E6F32]'
                                  : 'bg-[#B84A27]/15 text-[#B84A27]'
                              }`}
                            >
                              {order.paid
                                ? `Pagado (${order.paymentMethod})`
                                : 'Pendiente de cobro'}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs font-bold text-[#2B1A0E] space-y-0.5">
                          {order.items.map((it, idx) => (
                            <p key={idx}>
                              • {it.quantity > 1 ? `${it.quantity}x ` : ''}
                              {it.name} {it.sizeLabel} ({formatBs(it.price * it.quantity)})
                            </p>
                          ))}
                        </div>

                        {order.deliveryAddress && (
                          <p className="text-[11px] font-semibold text-[#1E8299]">
                            Dirección: {order.deliveryAddress} ({order.deliveryPhone})
                          </p>
                        )}

                        {order.notes && (
                          <div className="text-xs text-[#7A5A3A] bg-[#FFFDF8] px-3 py-1.5 rounded-xl border border-[#D9A441]/30">
                            <span className="font-extrabold text-[#3B1F0E]">Notas: </span>
                            {order.notes}
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <p className="text-xs font-extrabold text-[#3B1F0E]">Estado:</p>
                          <div className="grid grid-cols-3 gap-1.5">
                            {statuses.map((st) => {
                              const active = order.status === st;
                              return (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => onUpdateOrderStatus(order.id, st)}
                                  className={`min-h-[34px] px-2 py-1 rounded-xl text-[11px] font-extrabold border transition-colors cursor-pointer ${
                                    active
                                      ? 'bg-[#D9A441] border-[#B84A27] text-[#2B1A0E]'
                                      : 'bg-[#FFFDF8] border-[#D9A441]/50 text-[#7A5A3A]'
                                  }`}
                                >
                                  {st}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setTicketOrder(order)}
                            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-[#E8C87A] cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Ticket / WA</span>
                          </button>

                          {!order.paid && (
                            <>
                              <button
                                type="button"
                                onClick={() => openAppendComanda(order)}
                                className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-[#FFFDF8] border border-[#D9A441] text-[#3B1F0E] font-extrabold text-xs flex items-center justify-center gap-1 hover:bg-[#E8C87A]/25 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Agregar</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setCollectMethod('Efectivo');
                                  setCollectingOrder(order);
                                }}
                                className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl bg-[#2E6F32] text-[#FFF8E8] font-extrabold text-xs flex items-center justify-center gap-1.5 hover:opacity-95 cursor-pointer tabular-nums"
                              >
                                <Banknote className="w-4 h-4" />
                                <span>Cobrar {formatBs(order.total)}</span>
                              </button>
                            </>
                          )}

                          {order.mode === 'dine-in' &&
                            order.tableNumber &&
                            tableObj?.status === 'ocupada' && (
                              <button
                                type="button"
                                onClick={() => onFreeTable(order.tableNumber!)}
                                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#FFFDF8] border border-[#3B1F0E] text-[#3B1F0E] font-extrabold text-xs flex items-center justify-center gap-1 hover:bg-[#E8C87A]/30 cursor-pointer"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Liberar Mesa {order.tableNumber}</span>
                              </button>
                            )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MENÚ DEL DÍA */}
          {activeTab === 'menu' && (
            <div className="space-y-4">
              <div className="space-y-3 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
                <div className="relative lg:w-72 shrink-0">
                  <Search className="w-4 h-4 text-[#7A5A3A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={menuQuery}
                    onChange={(e) => setMenuQuery(e.target.value)}
                    placeholder="Buscar platillo en menú..."
                    className="w-full h-10 pl-10 pr-4 rounded-2xl bg-[#FFFDF8] border border-[#D9A441]/60 text-xs text-[#2B1A0E] font-semibold focus:outline-none focus:ring-2 focus:ring-[#B84A27]"
                  />
                </div>

                <div className="min-w-0">
                  <CategoryTabs
                    activeCategory={menuCategory}
                    onSelectCategory={setMenuCategory}
                    compact
                  />
                </div>
              </div>

              {compItems.length > 0 && (
                <div className="rounded-2xl bg-[#3B1F0E] text-[#FFF8E8] p-3 flex flex-wrap items-center justify-between gap-2 shadow-sm">
                  <span className="text-xs font-extrabold">
                    Borrador de comanda: {compItems.reduce((a, b) => a + b.quantity, 0)} ítems ·{' '}
                    <span className="text-[#D9A441] tabular-nums">{formatBs(compTotal)}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCompItems([])}
                      className="px-2.5 py-1 rounded-xl bg-[#4A2C1A] text-xs font-bold cursor-pointer"
                    >
                      Limpiar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAppendTargetOrder(null);
                        setShowComposer(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#D9A441] text-[#2B1A0E] text-xs font-extrabold cursor-pointer"
                    >
                      Completar Comanda
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredMenu.map((item) => (
                  <article
                    key={item.id}
                    className={`rounded-2xl bg-[#FDF2D6] border border-[#D9A441]/60 p-3 flex flex-col justify-between gap-2.5 ${
                      !item.available ? 'opacity-65' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-14 rounded-xl overflow-hidden shrink-0 border border-[#D9A441]/40">
                        <DishIllustration visualType={item.visualType} dishId={item.id} name={item.name} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="font-extrabold text-sm text-[#2B1A0E] truncate">
                            {item.name}
                          </h3>
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold shrink-0 ${
                              item.available
                                ? 'bg-[#2E6F32]/15 text-[#2E6F32]'
                                : 'bg-[#B83227]/15 text-[#B83227]'
                            }`}
                          >
                            {item.available ? 'Disponible' : 'Agotado'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7A5A3A] line-clamp-2 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[#D9A441]/30">
                      {item.sizes.map((sz) => (
                        <button
                          key={sz.id}
                          type="button"
                          disabled={!item.available}
                          onClick={() => handleQuickAddFromMenuTab(item, sz)}
                          className="flex-1 min-w-[95px] py-1.5 px-2.5 rounded-xl bg-[#D9A441] text-[#2B1A0E] text-[11px] font-extrabold hover:bg-[#E8C87A] disabled:opacity-45 cursor-pointer tabular-nums"
                        >
                          + {sz.label} {formatBs(sz.price)}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Cobrar Comanda */}
      {collectingOrder && (
        <div className="absolute inset-0 z-40 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#FFF8E8] rounded-2xl border border-[#D9A441] p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-serif-display text-lg font-bold text-[#3B1F0E]">
                Cobrar {collectingOrder.customerLabel}
              </h3>
              <button
                type="button"
                onClick={() => setCollectingOrder(null)}
                aria-label="Cerrar"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#3B1F0E] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl bg-[#FDF2D6] border border-[#D9A441]/55 p-3 flex items-center justify-between">
              <span className="text-xs font-bold text-[#7A5A3A]">
                Comanda {collectingOrder.code}
              </span>
              <span className="text-lg font-extrabold text-[#B84A27] tabular-nums">
                {formatBs(collectingOrder.total)}
              </span>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-extrabold text-[#3B1F0E]">
                Método de cobro:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setCollectMethod(m)}
                    className={`min-h-[40px] px-2.5 py-1.5 rounded-xl border text-xs font-extrabold cursor-pointer ${
                      collectMethod === m
                        ? 'bg-[#D9A441] border-[#B84A27] text-[#2B1A0E]'
                        : 'bg-[#FDF2D6] border-[#D9A441]/55 text-[#2B1A0E]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpenTicketOnCollect((p) => !p)}
              className="flex items-center gap-2 text-xs font-extrabold text-[#3B1F0E] cursor-pointer pt-1"
            >
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  openTicketOnCollect
                    ? 'bg-[#3B1F0E] border-[#3B1F0E] text-[#D9A441]'
                    : 'border-[#7A5A3A]'
                }`}
              >
                {openTicketOnCollect && <Check className="w-3 h-3" strokeWidth={3} />}
              </span>
              <span>Abrir Ticket (Imprimir / WhatsApp) al cobrar</span>
            </button>

            {collectingOrder.mode === 'dine-in' && collectingOrder.tableNumber && (
              <p className="text-[11px] font-bold text-[#2E6F32] bg-[#2E6F32]/10 border border-[#2E6F32]/25 rounded-xl px-3 py-1.5">
                Al confirmar el cobro, la Mesa {collectingOrder.tableNumber} pasará a estado Libre automáticamente.
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                const paidCopy: KitchenOrder = {
                  ...collectingOrder,
                  paid: true,
                  paymentMethod: collectMethod,
                };
                onCollectOrderPayment(collectingOrder.id, collectMethod);
                setCollectingOrder(null);
                if (openTicketOnCollect) {
                  setTicketOrder(paidCopy);
                }
              }}
              className="w-full min-h-[46px] rounded-2xl bg-[#2E6F32] text-[#FFF8E8] font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar Cobro • {formatBs(collectingOrder.total)}</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal: Nueva Comanda / Agregar Platos */}
      {showComposer && (
        <div className="absolute inset-0 z-40 bg-black/60 flex items-center justify-center p-3">
          <form
            onSubmit={handleSubmitComposer}
            className="w-full max-w-xl max-h-[90%] bg-[#FFF8E8] rounded-2xl border border-[#D9A441] p-4 flex flex-col gap-3 shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between shrink-0">
              <h3 className="font-serif-display text-lg font-bold text-[#3B1F0E]">
                {appendTargetOrder
                  ? `Agregar platos · ${appendTargetOrder.customerLabel} (${appendTargetOrder.code})`
                  : 'Nueva Comanda de Mozo'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowComposer(false);
                  setAppendTargetOrder(null);
                }}
                aria-label="Cerrar"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#3B1F0E] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto phone-scroll space-y-3 pr-1">
              {!appendTargetOrder && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCompMode('dine-in')}
                      className={`min-h-[38px] rounded-xl text-xs font-extrabold cursor-pointer ${
                        compMode === 'dine-in'
                          ? 'bg-[#3B1F0E] text-[#FFF8E8]'
                          : 'bg-[#FDF2D6] text-[#3B1F0E] border border-[#D9A441]/55'
                      }`}
                    >
                      Mesa (Local)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompMode('delivery')}
                      className={`min-h-[38px] rounded-xl text-xs font-extrabold cursor-pointer ${
                        compMode === 'delivery'
                          ? 'bg-[#3B1F0E] text-[#FFF8E8]'
                          : 'bg-[#FDF2D6] text-[#3B1F0E] border border-[#D9A441]/55'
                      }`}
                    >
                      Delivery
                    </button>
                  </div>

                  {compMode === 'dine-in' ? (
                    <div>
                      <label className="block text-xs font-bold text-[#3B1F0E] mb-1">
                        Seleccionar Mesa
                      </label>
                      <select
                        value={compTable}
                        onChange={(e) => setCompTable(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-[#FDF2D6] border border-[#D9A441] text-xs font-bold text-[#2B1A0E]"
                      >
                        {tables.map((t) => (
                          <option key={t.number} value={t.number}>
                            Mesa {t.number} ({t.status === 'ocupada' ? 'Ocupada' : 'Libre'})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={compAddress}
                        onChange={(e) => setCompAddress(e.target.value)}
                        placeholder="Dirección de entrega"
                        className="px-3 py-2 rounded-xl bg-[#FDF2D6] border border-[#D9A441] text-xs font-semibold text-[#2B1A0E]"
                      />
                      <input
                        type="tel"
                        required
                        value={compPhone}
                        onChange={(e) => setCompPhone(e.target.value)}
                        placeholder="Teléfono / WhatsApp"
                        className="px-3 py-2 rounded-xl bg-[#FDF2D6] border border-[#D9A441] text-xs font-semibold text-[#2B1A0E]"
                      />
                    </div>
                  )}
                </>
              )}

              <CategoryTabs
                activeCategory={compCategory}
                onSelectCategory={setCompCategory}
                compact
              />

              <div className="space-y-1.5">
                {menuItems
                  .filter((m) => m.available && m.category === compCategory)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl bg-[#FDF2D6] border border-[#D9A441]/45 p-2 space-y-1.5"
                    >
                      <p className="text-xs font-extrabold text-[#2B1A0E]">
                        {item.name}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {item.sizes.map((sz) => (
                          <button
                            key={sz.id}
                            type="button"
                            onClick={() => addLineItem(item, sz)}
                            className="px-2 py-1 rounded-lg bg-[#D9A441] text-[#2B1A0E] text-[10px] font-extrabold hover:bg-[#E8C87A] cursor-pointer"
                          >
                            + {sz.label} Bs {sz.price}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>

              {compItems.length > 0 && (
                <div className="rounded-xl bg-[#FFFDF8] border border-[#B84A27]/40 p-2.5 space-y-1.5">
                  <p className="text-xs font-extrabold text-[#B84A27]">
                    Ítems en esta comanda:
                  </p>
                  {compItems.map((it, idx) => (
                    <div
                      key={`${it.name}-${it.sizeLabel}-${idx}`}
                      className="flex items-center justify-between text-xs font-bold"
                    >
                      <span className="truncate pr-2">
                        {it.name} ({it.sizeLabel})
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateLineQty(idx, -1)}
                          className="w-6 h-6 rounded-lg bg-[#FDF2D6] border border-[#D9A441] flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="tabular-nums">{it.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateLineQty(idx, 1)}
                          className="w-6 h-6 rounded-lg bg-[#D9A441] flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!appendTargetOrder && (
                <>
                  <input
                    type="text"
                    value={compNotes}
                    onChange={(e) => setCompNotes(e.target.value)}
                    placeholder="Notas para cocina (opcional)"
                    className="w-full px-3 py-2 rounded-xl bg-[#FDF2D6] border border-[#D9A441]/60 text-xs font-semibold text-[#2B1A0E]"
                  />

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setCompPayNow((p) => !p)}
                      className="flex items-center gap-2 text-xs font-extrabold text-[#3B1F0E] cursor-pointer"
                    >
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          compPayNow
                            ? 'bg-[#2E6F32] border-[#2E6F32] text-white'
                            : 'border-[#7A5A3A]'
                        }`}
                      >
                        {compPayNow && <Check className="w-3 h-3" strokeWidth={3} />}
                      </span>
                      <span>Cobrar inmediatamente</span>
                    </button>

                    {compPayNow && (
                      <div className="grid grid-cols-2 gap-1.5">
                        {PAYMENT_METHODS.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setCompPayMethod(m)}
                            className={`py-1.5 px-2 rounded-lg border text-[11px] font-extrabold cursor-pointer ${
                              compPayMethod === m
                                ? 'bg-[#D9A441] border-[#B84A27] text-[#2B1A0E]'
                                : 'bg-[#FDF2D6] border-[#D9A441]/55'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={() => setOpenTicketOnCreate((p) => !p)}
                className="flex items-center gap-2 text-xs font-extrabold text-[#3B1F0E] cursor-pointer pt-1"
              >
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center ${
                    openTicketOnCreate
                      ? 'bg-[#3B1F0E] border-[#3B1F0E] text-[#D9A441]'
                      : 'border-[#7A5A3A]'
                  }`}
                >
                  {openTicketOnCreate && <Check className="w-3 h-3" strokeWidth={3} />}
                </span>
                <span>Abrir Ticket (Imprimir / WhatsApp) al guardar</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={compItems.length === 0}
              className="w-full min-h-[44px] rounded-2xl bg-[#3B1F0E] text-[#FFF8E8] font-extrabold text-xs disabled:opacity-45 cursor-pointer shrink-0 tabular-nums"
            >
              {appendTargetOrder
                ? `Agregar a ${appendTargetOrder.customerLabel} • ${formatBs(compTotal)}`
                : compPayNow
                ? `Registrar y Cobrar • ${formatBs(compTotal)}`
                : `Enviar Comanda a Cocina • ${formatBs(compTotal)}`}
            </button>
          </form>
        </div>
      )}

      <TicketModal
        order={ticketOrder}
        onClose={() => setTicketOrder(null)}
      />
    </div>
  );
};
