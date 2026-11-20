import React, { useMemo, useState } from 'react';
import {
  Banknote,
  Bell,
  Bike,
  CheckCircle2,
  Clock,
  Lock,
  Minus,
  Pencil,
  Plus,
  Printer,
  ShoppingBag,
  Trash2,
  Unlock,
  UtensilsCrossed,
} from 'lucide-react';
import {
  CartItem,
  KitchenOrder,
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
  getCartLineTotal,
  getCartTotal,
} from '../../utils/appHelpers';
import { AppUserRole } from '../LiveCartPanel';
import { CollectPaymentModal } from '../OrderKdsCard';
import { PosOrderModal } from '../PosOrderModal';
import { MobileHeader } from '../ShellComponents';
import { TicketModal } from '../TicketModal';

interface CartScreenProps {
  userRole: AppUserRole;
  cart: CartItem[];
  cartCount: number;
  menuItems: MenuItem[];
  kitchenOrders: KitchenOrder[];
  tables: TableItem[];
  orderMode: OrderMode;
  selectedTable: number;
  onBack: () => void;
  onChangeOrderMode: (mode: OrderMode) => void;
  onSelectTable: (tableNumber: number) => void;
  onEditTable: () => void;
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onChangeItemSize: (cartItemId: string, sizeId: string) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  onProceedOrder: () => void;
  onGoMenu: () => void;
  onOpenComandaDrawer: () => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onCollectOrderPayment: (orderId: string, method: PaymentMethod) => void;
  onFreeTable: (tableNumber: number) => void;
  onCreatePosOrder: (payload: {
    mode: OrderMode;
    tableNumber?: number;
    deliveryAddress?: string;
    deliveryPhone?: string;
    notes: string;
    items: OrderLineItem[];
    payNowMethod?: PaymentMethod;
  }) => KitchenOrder;
  onCallWaiter: (orderId: string) => void;
  onPayTableOrder: (order: KitchenOrder) => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({
  userRole,
  cart,
  cartCount,
  menuItems,
  kitchenOrders,
  tables,
  orderMode,
  selectedTable,
  onBack,
  onChangeOrderMode,
  onSelectTable,
  onEditTable,
  onUpdateQuantity,
  onChangeItemSize,
  onRemoveItem,
  onClearCart,
  onProceedOrder,
  onGoMenu,
  onOpenComandaDrawer,
  onUpdateOrderStatus,
  onCollectOrderPayment,
  onFreeTable,
  onCreatePosOrder,
  onCallWaiter,
  onPayTableOrder,
}) => {
  const isStaff = userRole === 'admin' || userRole === 'mozo';
  const [orderFilter, setOrderFilter] = useState<OrderFilterType>('all');
  const [collectingOrder, setCollectingOrder] = useState<KitchenOrder | null>(
    null
  );
  const [ticketOrder, setTicketOrder] = useState<KitchenOrder | null>(null);
  const [showPosModal, setShowPosModal] = useState(false);

  const subtotal = useMemo(() => getCartTotal(cart), [cart]);

  const filteredOrders = useMemo(
    () => filterOrdersByType(kitchenOrders, orderFilter),
    [kitchenOrders, orderFilter]
  );

  const handleSelectCard = (order: KitchenOrder) => {
    if (order.mode === 'dine-in' && order.tableNumber) {
      onChangeOrderMode('dine-in');
      onSelectTable(order.tableNumber);
    } else {
      onChangeOrderMode('delivery');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FFF8E8] min-h-0">
      <MobileHeader
        title="Comandas"
        onBack={onBack}
        rightSlot={
          <div className="flex items-center gap-1">
            {isStaff && (
              <button
                type="button"
                onClick={() => setShowPosModal(true)}
                aria-label="Nueva comanda"
                title="Nueva Comanda"
                className="min-h-[38px] px-2.5 rounded-xl bg-[#D9A441] text-[#2B1A0E] text-[11px] font-extrabold inline-flex items-center gap-1 hover:bg-[#E8C87A] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span className="hidden sm:inline">Nueva</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenComandaDrawer}
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
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto phone-scroll">
        <div className="max-w-6xl mx-auto w-full px-4 lg:px-8 pt-4 lg:pt-6 pb-8 space-y-5">
          {/* Top Toolbar: Filters & Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="grid grid-cols-4 gap-1 sm:w-96 p-1 rounded-xl bg-[#FDF2D6] border border-[#D9A441]/55">
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
                  className={`min-h-[34px] px-1.5 rounded-lg text-[10px] sm:text-xs font-extrabold transition-colors cursor-pointer truncate ${
                    orderFilter === f.id
                      ? 'bg-[#3B1F0E] text-[#FFF8E8] shadow-xs'
                      : 'text-[#7A5A3A] hover:text-[#2B1A0E]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2">
              <span className="text-xs font-bold text-[#7A5A3A] tabular-nums">
                {filteredOrders.length}{' '}
                {filteredOrders.length === 1 ? 'comanda' : 'comandas'}
              </span>
              <button
                type="button"
                onClick={onGoMenu}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#FDF2D6] border border-[#D9A441]/70 text-[#3B1F0E] text-xs font-extrabold inline-flex items-center gap-1.5 hover:bg-[#E8C87A]/35 cursor-pointer"
              >
                <UtensilsCrossed className="w-3.5 h-3.5 text-[#B84A27]" />
                <span>Carta</span>
              </button>
              {isStaff && (
                <button
                  type="button"
                  onClick={() => setShowPosModal(true)}
                  className="hidden sm:inline-flex min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#B84A27] text-[#FFF8E8] text-xs font-extrabold items-center gap-1.5 hover:bg-[#C95B34] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                  <span>Nueva Comanda</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Draft Comanda Card (only when user has items queued to send) */}
          {cart.length > 0 && (
            <section
              aria-label="Borrador de comanda listo para enviar"
              className="rounded-3xl bg-[#3B1F0E] text-[#FFF8E8] border border-[#D9A441]/45 p-4 sm:p-5 shadow-md space-y-3.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-mono font-bold text-[#D9A441] tracking-wide">
                  BORRADOR · {cartCount} {cartCount === 1 ? 'ÍTEM' : 'ÍTEMS'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onChangeOrderMode('dine-in')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer ${
                      orderMode === 'dine-in'
                        ? 'bg-[#D9A441] text-[#2B1A0E]'
                        : 'bg-[#4A2C1A] text-[#FFF8E8]/80'
                    }`}
                  >
                    <UtensilsCrossed className="w-3 h-3" />
                    <span>Mesa {selectedTable}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeOrderMode('delivery')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer ${
                      orderMode === 'delivery'
                        ? 'bg-[#D9A441] text-[#2B1A0E]'
                        : 'bg-[#4A2C1A] text-[#FFF8E8]/80'
                    }`}
                  >
                    <Bike className="w-3 h-3" />
                    <span>Delivery</span>
                  </button>
                  {orderMode === 'dine-in' && (
                    <button
                      type="button"
                      onClick={onEditTable}
                      className="px-2.5 py-1 rounded-lg bg-[#4A2C1A] text-[#E8C87A] text-[11px] font-bold inline-flex items-center gap-1 hover:bg-[#4A2C1A]/80 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Cambiar</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-serif-display text-xl font-bold text-[#FFF8E8]">
                  {orderMode === 'dine-in'
                    ? `Nueva Comanda · Mesa ${selectedTable}`
                    : 'Nueva Comanda · Delivery'}
                </h2>
                <span className="text-lg font-extrabold text-[#D9A441] tabular-nums shrink-0">
                  Bs. {subtotal.toFixed(2)}
                </span>
              </div>

              <div className="border-t border-[#D9A441]/20 pt-3 space-y-2.5">
                {cart.map((item) => {
                  const sourceMenu = menuItems.find(
                    (m) => m.id === item.menuItemId
                  );
                  const lineTotal = getCartLineTotal(item);
                  return (
                    <div
                      key={item.cartItemId}
                      className="flex flex-wrap items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-[13px] font-bold text-[#FFF8E8] uppercase tracking-wide">
                          {item.quantity}x {item.name}{' '}
                          <span className="text-[#E8C87A]/80 font-semibold normal-case">
                            ({item.sizeLabel})
                          </span>
                        </p>
                        {item.extras.length > 0 && (
                          <p className="text-[11px] text-[#E8C87A]/75">
                            Extras: {item.extras.map((e) => e.label).join(', ')}
                          </p>
                        )}
                        {sourceMenu && sourceMenu.sizes.length > 1 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {sourceMenu.sizes.map((sz) => {
                              const active = item.sizeId === sz.id;
                              return (
                                <button
                                  key={sz.id}
                                  type="button"
                                  onClick={() =>
                                    onChangeItemSize(item.cartItemId, sz.id)
                                  }
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer tabular-nums ${
                                    active
                                      ? 'bg-[#D9A441] text-[#2B1A0E]'
                                      : 'bg-[#4A2C1A] text-[#FFF8E8]/80'
                                  }`}
                                >
                                  {sz.label} Bs {sz.price}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="inline-flex items-center gap-1 rounded-lg bg-[#4A2C1A] p-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity(item.cartItemId, -1)
                            }
                            aria-label={`Disminuir ${item.name}`}
                            className="w-6 h-6 rounded flex items-center justify-center text-[#FFF8E8] hover:bg-[#3B1F0E] cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-extrabold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.cartItemId, 1)}
                            aria-label={`Aumentar ${item.name}`}
                            className="w-6 h-6 rounded flex items-center justify-center bg-[#D9A441] text-[#2B1A0E] cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-xs sm:text-[13px] font-bold text-[#FFF8E8] tabular-nums w-18 text-right">
                          Bs. {lineTotal.toFixed(2)}
                        </span>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.cartItemId)}
                          aria-label={`Eliminar ${item.name}`}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#E8C87A]/70 hover:text-[#FFF8E8] hover:bg-[#B83227]/40 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-[#D9A441]/20 pt-3 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onClearCart}
                  className="min-h-[38px] px-3.5 py-2 rounded-xl bg-[#4A2C1A] text-[#FFF8E8]/85 text-xs font-bold hover:text-[#FFF8E8] cursor-pointer"
                >
                  Vaciar borrador
                </button>

                <button
                  type="button"
                  onClick={onProceedOrder}
                  className="flex-1 sm:flex-none min-h-[40px] px-5 py-2 rounded-xl bg-[#2E6F32] text-[#FFF8E8] text-xs font-extrabold inline-flex items-center justify-center gap-2 hover:brightness-110 cursor-pointer tabular-nums"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {orderMode === 'dine-in'
                      ? `Enviar a Cocina · Mesa ${selectedTable} (${formatBs(subtotal)})`
                      : `Continuar a Delivery (${formatBs(subtotal)})`}
                  </span>
                </button>
              </div>
            </section>
          )}

          {/* Live Comanda Cards Grid (Pro Ticket Card Design) */}
          {filteredOrders.length === 0 ? (
            <div className="rounded-3xl bg-[#3B1F0E] text-[#FFF8E8] border border-[#D9A441]/35 p-6 sm:p-8 text-center max-w-xl mx-auto space-y-4 shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-[#4A2C1A] border border-[#D9A441]/40 flex items-center justify-center text-[#D9A441] mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="font-serif-display text-xl font-bold text-[#FFF8E8]">
                  {orderFilter === 'all'
                    ? 'Sin comandas activas'
                    : 'No hay comandas en esta vista'}
                </h2>
                <p className="text-xs text-[#FFF8E8]/75 max-w-sm mx-auto leading-relaxed">
                  {isStaff
                    ? 'Crea una nueva comanda o añade platos desde la Carta Digital para gestionarlos en tiempo real aquí y en el panel Comanda en Vivo.'
                    : 'Elige una mesa y añade platos desde la Carta Digital para seguir tu comanda en vivo.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={onGoMenu}
                  className="min-h-[42px] px-5 py-2 rounded-xl bg-[#D9A441] text-[#2B1A0E] text-xs font-extrabold hover:bg-[#E8C87A] cursor-pointer"
                >
                  Ir a Carta Digital
                </button>
                {isStaff ? (
                  <button
                    type="button"
                    onClick={() => setShowPosModal(true)}
                    className="min-h-[42px] px-5 py-2 rounded-xl bg-[#4A2C1A] border border-[#D9A441]/45 text-[#FFF8E8] text-xs font-extrabold hover:bg-[#4A2C1A]/80 cursor-pointer"
                  >
                    + Nueva Comanda
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onEditTable}
                    className="min-h-[42px] px-5 py-2 rounded-xl bg-[#4A2C1A] border border-[#D9A441]/45 text-[#FFF8E8] text-xs font-extrabold hover:bg-[#4A2C1A]/80 cursor-pointer"
                  >
                    Seleccionar Mesa
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {filteredOrders.map((order) => {
                const isSelectedCard =
                  (order.mode === 'dine-in' &&
                    orderMode === 'dine-in' &&
                    order.tableNumber === selectedTable) ||
                  (order.mode === 'delivery' && orderMode === 'delivery');

                const tableObj = order.tableNumber
                  ? tables.find((t) => t.number === order.tableNumber)
                  : undefined;
                const isTableOccupied = tableObj?.status === 'ocupada';

                const middleStatus: OrderStatus =
                  order.mode === 'delivery' ? 'En camino' : 'Listo';
                const middleLabel =
                  order.mode === 'delivery' ? 'En camino' : 'Listo';

                return (
                  <article
                    key={order.id}
                    onClick={() => handleSelectCard(order)}
                    className={`rounded-3xl bg-[#3B1F0E] text-[#FFF8E8] p-4 sm:p-5 space-y-3.5 shadow-md transition-all cursor-pointer border ${
                      isSelectedCard
                        ? 'border-[#D9A441] ring-2 ring-[#D9A441]/35'
                        : 'border-[#D9A441]/20 hover:border-[#D9A441]/55'
                    }`}
                  >
                    {/* Row 1: Order ID/Code + Timestamp */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-[#D9A441] truncate">
                        {order.code} · {order.id}
                      </span>

                      <div className="flex items-center gap-2 shrink-0 text-xs text-[#FFF8E8]/75 font-semibold tabular-nums">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{order.createdAt}</span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTicketOrder(order);
                          }}
                          aria-label={`Ticket ${order.code}`}
                          title="Ticket / WhatsApp"
                          className="w-7 h-7 rounded-lg bg-[#4A2C1A] text-[#D9A441] flex items-center justify-center hover:bg-[#4A2C1A]/80 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Row 2: Mesa / Customer Label + Total */}
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-serif-display text-lg sm:text-xl font-bold text-[#FFF8E8] truncate">
                          {order.customerLabel}
                        </h3>
                        {(order.deliveryAddress || order.notes || order.paid) && (
                          <p className="text-[11px] text-[#FFF8E8]/65 truncate mt-0.5">
                            {[
                              order.paid
                                ? `Pagado (${order.paymentMethod})`
                                : 'Pendiente de cobro',
                              order.deliveryAddress,
                              order.notes,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        )}
                      </div>

                      <span className="text-base sm:text-lg font-extrabold text-[#D9A441] tabular-nums whitespace-nowrap shrink-0">
                        Bs. {order.total.toFixed(2)}
                      </span>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-[#D9A441]/15" />

                    {/* Itemized Dish Rows */}
                    <div className="space-y-2">
                      {order.items.map((it, idx) => (
                        <div
                          key={`${order.id}-${it.name}-${it.sizeLabel}-${idx}`}
                          className="flex items-start justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-xs sm:text-[13px] font-bold text-[#FFF8E8] uppercase tracking-wide leading-snug">
                              {it.quantity}x {it.name}
                              {it.sizeLabel ? ` (${it.sizeLabel})` : ''}
                            </p>
                            {it.extrasSummary && (
                              <p className="text-[11px] text-[#E8C87A]/75 mt-0.5">
                                {it.extrasSummary}
                              </p>
                            )}
                          </div>
                          <span className="text-xs sm:text-[13px] font-semibold text-[#FFF8E8]/85 tabular-nums whitespace-nowrap shrink-0">
                            Bs. {(it.price * it.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-[#D9A441]/15" />

                    {/* Bottom Action Bar */}
                    {isStaff ? (
                      <div
                        className="flex flex-wrap items-center gap-2 pt-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateOrderStatus(order.id, 'Preparando')
                          }
                          className={`flex-1 min-w-[82px] min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                            order.status === 'Preparando'
                              ? 'bg-[#D9A441] text-[#2B1A0E]'
                              : 'bg-[#4A2C1A] text-[#FFF8E8]/85 hover:bg-[#4A2C1A]/80'
                          }`}
                        >
                          Preparando
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onUpdateOrderStatus(order.id, middleStatus)
                          }
                          className={`flex-1 min-w-[74px] min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                            order.status === middleStatus
                              ? 'bg-[#D9A441] text-[#2B1A0E]'
                              : 'bg-[#4A2C1A] text-[#FFF8E8]/85 hover:bg-[#4A2C1A]/80'
                          }`}
                        >
                          {middleLabel}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onUpdateOrderStatus(order.id, 'Entregado')
                          }
                          className={`flex-1 min-w-[74px] min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                            order.status === 'Entregado'
                              ? 'bg-[#D9A441] text-[#2B1A0E]'
                              : 'bg-[#4A2C1A] text-[#FFF8E8]/85 hover:bg-[#4A2C1A]/80'
                          }`}
                        >
                          Servido
                        </button>

                        {!order.paid ? (
                          <button
                            type="button"
                            onClick={() => setCollectingOrder(order)}
                            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#2E6F32] text-[#FFF8E8] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 hover:brightness-110 cursor-pointer shrink-0 whitespace-nowrap"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            <span>Cobrar</span>
                          </button>
                        ) : order.mode === 'dine-in' &&
                          order.tableNumber &&
                          isTableOccupied ? (
                          <button
                            type="button"
                            onClick={() => onFreeTable(order.tableNumber!)}
                            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#4A2C1A] border border-[#D9A441]/50 text-[#D9A441] text-xs font-extrabold inline-flex items-center justify-center gap-1 hover:bg-[#4A2C1A]/80 cursor-pointer shrink-0 whitespace-nowrap"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Liberar</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setTicketOrder(order)}
                            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#2E6F32]/25 text-[#9CE5A2] text-xs font-extrabold inline-flex items-center justify-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Pagado</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div
                        className="flex flex-wrap items-center gap-2 pt-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl bg-[#4A2C1A] text-[#E8C87A] text-xs font-bold inline-flex items-center justify-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{order.status}</span>
                        </span>

                        {order.mode === 'dine-in' && (
                          <button
                            type="button"
                            onClick={() => onCallWaiter(order.id)}
                            className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl bg-[#4A2C1A] text-[#FFF8E8] text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:bg-[#4A2C1A]/80 cursor-pointer whitespace-nowrap"
                          >
                            <Bell className="w-3.5 h-3.5 text-[#D9A441]" />
                            <span>
                              {order.waiterRequested
                                ? 'En camino'
                                : 'Llamar mozo'}
                            </span>
                          </button>
                        )}

                        {!order.paid ? (
                          <button
                            type="button"
                            onClick={() => onPayTableOrder(order)}
                            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#2E6F32] text-[#FFF8E8] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 hover:brightness-110 cursor-pointer shrink-0 whitespace-nowrap"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Pagar</span>
                          </button>
                        ) : (
                          <span className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#2E6F32]/25 text-[#9CE5A2] text-xs font-extrabold inline-flex items-center justify-center gap-1 shrink-0 whitespace-nowrap">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Pagado</span>
                          </span>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Collect Payment Modal */}
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

      {/* New POS Order Modal for Staff */}
      {isStaff && (
        <PosOrderModal
          isOpen={showPosModal}
          title="Nueva Comanda"
          tables={tables}
          menuItems={menuItems}
          initialTable={selectedTable}
          onClose={() => setShowPosModal(false)}
          onCreatePosOrder={onCreatePosOrder}
          onOpenTicket={setTicketOrder}
        />
      )}

      {/* Ticket / WhatsApp Modal */}
      <TicketModal order={ticketOrder} onClose={() => setTicketOrder(null)} />
    </div>
  );
};
