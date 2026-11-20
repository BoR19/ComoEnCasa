import React, { useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Banknote,
  BellRing,
  CheckCircle2,
  ChefHat,
  LogIn,
  LogOut,
  Plus,
  Printer,
  Search,
  ShoppingBag,
  Unlock,
  Utensils,
  UtensilsCrossed,
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
  OrderFilterType,
  filterOrdersByType,
  formatBs,
  getActiveOrderForTable,
  getOrderLinesCount,
  getOrderLinesTotal,
  getTableStats,
} from '../../utils/appHelpers';
import { DishIllustration } from '../BrandAssets';
import { CollectPaymentModal, OrderKdsCard } from '../OrderKdsCard';
import { PosOrderModal } from '../PosOrderModal';
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
  cartCount: number;
  onOpenComanda: () => void;
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
  onAppendOrderItems: (
    orderId: string,
    items: OrderLineItem[]
  ) => KitchenOrder | undefined;
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
  cartCount,
  onOpenComanda,
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
  const [menuCategory, setMenuCategory] =
    useState<MenuCategory>('Platos Fuertes');
  const [menuQuery, setMenuQuery] = useState('');

  // Orders filter
  const [orderFilter, setOrderFilter] = useState<OrderFilterType>('all');

  // Collect payment & Ticket modals
  const [collectingOrder, setCollectingOrder] = useState<KitchenOrder | null>(
    null
  );
  const [ticketOrder, setTicketOrder] = useState<KitchenOrder | null>(null);

  // Comanda composer modal (New or Append to existing table order)
  const [showComposer, setShowComposer] = useState(false);
  const [appendTargetOrder, setAppendTargetOrder] =
    useState<KitchenOrder | null>(null);
  const [compInitialTable, setCompInitialTable] = useState<number>(1);
  const [compItems, setCompItems] = useState<OrderLineItem[]>([]);

  const switchTab = (next: MozoTab) => {
    setCollectingOrder(null);
    setShowComposer(false);
    setAppendTargetOrder(null);
    setTicketOrder(null);
    setActiveTab(next);
  };

  const { freeCount: freeTablesCount, occupiedCount: occupiedTablesCount } =
    useMemo(() => getTableStats(tables), [tables]);

  const unpaidCount = useMemo(
    () => kitchenOrders.filter((o) => !o.paid).length,
    [kitchenOrders]
  );

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

  const filteredOrders = useMemo(
    () => filterOrdersByType(kitchenOrders, orderFilter),
    [kitchenOrders, orderFilter]
  );

  const compTotal = useMemo(() => getOrderLinesTotal(compItems), [compItems]);
  const compCount = useMemo(() => getOrderLinesCount(compItems), [compItems]);

  const openNewComanda = (tableNumber?: number) => {
    setAppendTargetOrder(null);
    setCompInitialTable(tableNumber ?? 1);
    setShowComposer(true);
  };

  const openAppendComanda = (order: KitchenOrder) => {
    setAppendTargetOrder(order);
    setCompInitialTable(order.tableNumber ?? 1);
    setShowComposer(true);
  };

  const handleQuickAddFromMenuTab = (item: MenuItem, size: DishSizeOption) => {
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

  return (
    <div className="relative flex-1 flex flex-col bg-[#FFF8E8] min-h-0">
      <MobileHeader
        title="Modo Mozo • Comandas"
        rightSlot={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenComanda}
              aria-label="Abrir Comanda en Vivo"
              title="Comanda en Vivo"
              className="xl:hidden relative min-w-[40px] min-h-[40px] px-2 flex items-center justify-center rounded-xl bg-[#4A2C1A] text-[#D9A441] hover:bg-[#4A2C1A]/80 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="ml-1 text-[10px] font-extrabold text-[#FFF8E8] tabular-nums">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Cerrar sesión de mozo"
              title="Cerrar sesión"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#D9A441] hover:bg-[#4A2C1A] active:scale-95 transition-transform cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        }
      />

      {/* Sub-navigation bar */}
      <div className="bg-[#4A2C1A] px-2 sm:px-2.5 py-2 shrink-0">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-3 gap-1 sm:gap-1.5 lg:gap-2.5">
          {(
            [
              {
                id: 'tables',
                label: `Mesas (${freeTablesCount})`,
                wideLabel: `Mesas (${freeTablesCount} lib.)`,
                icon: UtensilsCrossed,
              },
              {
                id: 'orders',
                label: `Comandas (${unpaidCount})`,
                wideLabel: `Comandas (${unpaidCount})`,
                icon: ChefHat,
              },
              {
                id: 'menu',
                label: 'Menú',
                wideLabel: 'Menú',
                icon: Utensils,
              },
            ] as {
              id: MozoTab;
              label: string;
              wideLabel: string;
              icon: React.ComponentType<{ className?: string }>;
            }[]
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchTab(tab.id)}
                className={`min-h-[38px] px-1.5 sm:px-2 py-1.5 rounded-xl text-[10px] sm:text-xs font-extrabold flex items-center justify-center gap-1 sm:gap-1.5 transition-colors cursor-pointer min-w-0 ${
                  active
                    ? 'bg-[#D9A441] text-[#2B1A0E]'
                    : 'text-[#FFF8E8]/90 hover:bg-[#3B1F0E]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="sm:hidden truncate">{tab.label}</span>
                <span className="hidden sm:inline truncate">{tab.wideLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto phone-scroll">
        <div className="max-w-6xl mx-auto w-full px-4 lg:px-8 pt-4 lg:pt-6 pb-6 space-y-4">
          {!firebaseUser || !isStaff ? (
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
                  <span>
                    {firebaseUser ? 'Cambiar cuenta' : 'Conectar con Google'}
                  </span>
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
                <span className="truncate">
                  Sincronización en vivo activa · {firebaseUser.email}
                </span>
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
                  <p className="text-xs font-bold text-[#7A5A3A] tabular-nums">
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
                  const activeOrder = getActiveOrderForTable(
                    kitchenOrders,
                    tables,
                    table.number
                  );

                  return (
                    <div
                      key={table.number}
                      className={`rounded-2xl border p-3.5 flex flex-col justify-between gap-2.5 transition-all ${
                        isOccupied
                          ? 'bg-[#FDF2D6] border-[#B84A27]/70'
                          : 'bg-[#FFFDF8] border-[#D9A441]/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div>
                          <p className="font-serif-display text-lg font-bold text-[#2B1A0E]">
                            Mesa {table.number}
                          </p>
                          <p className="text-[11px] font-bold text-[#7A5A3A] tabular-nums">
                            Cap. {table.capacity} pers.
                          </p>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                            isOccupied
                              ? 'bg-[#B83227]/15 text-[#B83227]'
                              : 'bg-[#2E6F32]/15 text-[#2E6F32]'
                          }`}
                        >
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
                                activeOrder.paid
                                  ? 'text-[#2E6F32]'
                                  : 'text-[#B84A27]'
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
                              <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
                                {!activeOrder.paid ? (
                                  <button
                                    type="button"
                                    onClick={() => setCollectingOrder(activeOrder)}
                                    className="min-h-[34px] px-1.5 sm:px-2 py-1 rounded-xl bg-[#2E6F32] text-[#FFF8E8] text-[10px] sm:text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <Banknote className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                                    <span className="truncate">Cobrar</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => onFreeTable(table.number)}
                                    className="min-h-[34px] px-1.5 sm:px-2 py-1 rounded-xl bg-[#FFF8E8] border border-[#3B1F0E] text-[#3B1F0E] text-[10px] sm:text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <Unlock className="w-3 h-3 shrink-0" />
                                    <span className="truncate">Liberar</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setTicketOrder(activeOrder)}
                                  className="min-h-[34px] px-1.5 sm:px-2 py-1 rounded-xl bg-[#D9A441] text-[#2B1A0E] text-[10px] sm:text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Printer className="w-3 h-3 shrink-0" />
                                  <span className="truncate">Ticket</span>
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
                      className={`min-h-[36px] px-1 rounded-xl text-[10px] sm:text-[11px] font-extrabold border cursor-pointer truncate ${
                        orderFilter === f.id
                          ? 'bg-[#3B1F0E] border-[#3B1F0E] text-[#FFF8E8]'
                          : 'bg-[#FFFDF8] border-[#D9A441]/55 text-[#3B1F0E]'
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
                    const tableObj = order.tableNumber
                      ? tables.find((t) => t.number === order.tableNumber)
                      : undefined;
                    return (
                      <OrderKdsCard
                        key={order.id}
                        order={order}
                        isTableOccupied={tableObj?.status === 'ocupada'}
                        onUpdateStatus={onUpdateOrderStatus}
                        onOpenTicket={setTicketOrder}
                        onStartCollect={setCollectingOrder}
                        onFreeTable={onFreeTable}
                        onAppendItems={openAppendComanda}
                      />
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
                  <span className="text-xs font-extrabold tabular-nums">
                    Borrador de comanda: {compCount} ítems ·{' '}
                    <span className="text-[#D9A441]">
                      {formatBs(compTotal)}
                    </span>
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
                    className={`rounded-2xl bg-[#FFFDF8] border border-[#D9A441]/60 p-3 flex flex-col justify-between gap-2.5 ${
                      !item.available ? 'opacity-65' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-14 rounded-xl overflow-hidden shrink-0 border border-[#D9A441]/40">
                        <DishIllustration
                          visualType={item.visualType}
                          dishId={item.id}
                          name={item.name}
                        />
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
      <CollectPaymentModal
        order={collectingOrder}
        onClose={() => setCollectingOrder(null)}
        onConfirmCollect={(order, method, openTicket) => {
          const paidCopy: KitchenOrder = {
            ...order,
            paid: true,
            paymentMethod: method,
          };
          onCollectOrderPayment(order.id, method);
          setCollectingOrder(null);
          if (openTicket) {
            setTicketOrder(paidCopy);
          }
        }}
      />

      {/* Modal: Nueva Comanda / Agregar Platos */}
      <PosOrderModal
        isOpen={showComposer}
        title="Nueva Comanda de Mozo"
        tables={tables}
        menuItems={menuItems}
        initialTable={compInitialTable}
        appendTargetOrder={appendTargetOrder}
        draftItems={compItems}
        onClose={() => {
          setShowComposer(false);
          setAppendTargetOrder(null);
        }}
        onCreatePosOrder={onCreatePosOrder}
        onAppendOrderItems={onAppendOrderItems}
        onOpenTicket={setTicketOrder}
        onClearDraftItems={() => setCompItems([])}
      />

      <TicketModal order={ticketOrder} onClose={() => setTicketOrder(null)} />
    </div>
  );
};
