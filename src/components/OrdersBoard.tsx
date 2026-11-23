import React, { useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  Bell,
  BellRing,
  CheckCircle2,
  Clock,
  KeyRound,
  Lock,
  MessageCircle,
  Plus,
  Printer,
  ShoppingBag,
  Unlock,
  UtensilsCrossed,
} from 'lucide-react';
import {
  KitchenOrder,
  MenuItem,
  OrderLineItem,
  OrderMode,
  OrderStatus,
  PaymentMethod,
  TableItem,
} from '../types/app';
import {
  ORDER_FILTER_TABS,
  OrderFilterType,
  filterOrdersByType,
  getTakeawayCustomerName,
  isOrderSettled,
  requiresDeliveryPin,
} from '../utils/appHelpers';
import {
  buildWhatsAppShareUrl,
  formatBoliviaDisplayPhone,
} from '../utils/ticketHelpers';
import { CollectPaymentModal } from './CollectPaymentModal';
import type { AppUserRole } from './LiveCartPanel';
import { PosOrderModal } from './PosOrderModal';
import { TicketModal } from './TicketModal';
import { VerifyDeliveryCodeModal } from './VerifyDeliveryCodeModal';

interface OrdersBoardProps {
  userRole: AppUserRole;
  orders: KitchenOrder[];
  tables: TableItem[];
  menuItems: MenuItem[];
  orderMode?: OrderMode;
  selectedTable?: number;
  linkedTakeawayOrderId?: string | null;
  linkedDeliveryOrderId?: string | null;
  newOrderLabel?: string;
  showCartaShortcut?: boolean;
  openNewOrderSignal?: number;
  onSelectOrderCard?: (order: KitchenOrder) => void;
  onAddDishesToOrder?: (order: KitchenOrder) => void;
  onUpdateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    verificationCode?: string
  ) => void;
  onCollectOrderPayment: (orderId: string, method: PaymentMethod) => void;
  onDismissWaiterCall?: (orderId: string) => void;
  onFreeTable: (tableNumber: number) => void;
  onCreatePosOrder?: (payload: {
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
  onCallWaiter?: (orderId: string) => void;
  onPayTableOrder?: (order: KitchenOrder) => void;
  onGoMenu?: () => void;
  onEditTable?: () => void;
}

export const OrdersBoard: React.FC<OrdersBoardProps> = ({
  userRole,
  orders,
  tables,
  menuItems,
  orderMode,
  selectedTable = 1,
  linkedTakeawayOrderId = null,
  linkedDeliveryOrderId = null,
  newOrderLabel = 'Nueva Comanda',
  showCartaShortcut = false,
  openNewOrderSignal = 0,
  onSelectOrderCard,
  onAddDishesToOrder,
  onUpdateOrderStatus,
  onCollectOrderPayment,
  onDismissWaiterCall,
  onFreeTable,
  onCreatePosOrder,
  onCallWaiter,
  onPayTableOrder,
  onGoMenu,
  onEditTable,
}) => {
  const isStaff = userRole === 'admin' || userRole === 'mozo';

  const [orderFilter, setOrderFilter] = useState<OrderFilterType>('active');
  const [collectingOrder, setCollectingOrder] = useState<KitchenOrder | null>(
    null
  );
  const [ticketOrder, setTicketOrder] = useState<KitchenOrder | null>(null);
  const [verifyingOrder, setVerifyingOrder] = useState<KitchenOrder | null>(
    null
  );
  const [showPosModal, setShowPosModal] = useState(false);

  useEffect(() => {
    setCollectingOrder(null);
    setTicketOrder(null);
    setVerifyingOrder(null);
    setShowPosModal(false);
  }, [userRole]);

  useEffect(() => {
    if (openNewOrderSignal > 0 && isStaff && onCreatePosOrder) {
      setShowPosModal(true);
    }
  }, [openNewOrderSignal, isStaff, onCreatePosOrder]);

  const filteredOrders = useMemo(
    () => filterOrdersByType(orders, orderFilter),
    [orders, orderFilter]
  );

  const waiterRequests = useMemo(
    () => orders.filter((o) => o.waiterRequested && !isOrderSettled(o)),
    [orders]
  );

  return (
    <div className="space-y-4">
      {/* Staff Waiter-Call Alerts */}
      {isStaff && onDismissWaiterCall && waiterRequests.length > 0 && (
        <div className="space-y-2">
          {waiterRequests.map((req) => (
            <div
              key={`waiter-${req.id}`}
              className="rounded-2xl bg-[var(--accent-primary)] text-[var(--bg-surface)] p-3 flex items-center justify-between gap-2 shadow-sm"
            >
              <div className="flex items-center gap-2 text-xs font-bold">
                <BellRing className="w-4 h-4 text-[var(--accent-gold)] shrink-0" />
                <span>
                  {req.billRequested
                    ? `${req.customerLabel} solicita la cuenta`
                    : `${req.customerLabel} solicita al mesero`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onDismissWaiterCall(req.id)}
                className="px-2.5 py-1 rounded-xl bg-[var(--bg-surface)] text-[var(--ink-primary)] text-xs font-bold active:scale-[0.97] transition-transform duration-150 ease-[var(--ease-out)] cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Atendido
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Unified Filter Tabs & Quick Actions Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="w-full lg:w-auto max-w-full min-w-0 flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] overflow-x-auto no-scrollbar">
          {ORDER_FILTER_TABS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setOrderFilter(f.id)}
              className={`min-h-[38px] px-3 rounded-lg text-xs font-bold transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                orderFilter === f.id
                  ? 'bg-[var(--ink-primary)] text-[var(--bg-surface)] shadow-xs'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 shrink-0">
          <span className="text-xs font-semibold text-[var(--ink-muted)] tabular-nums">
            {filteredOrders.length}{' '}
            {filteredOrders.length === 1 ? 'comanda' : 'comandas'}
          </span>

          <div className="flex items-center gap-2">
            {showCartaShortcut && onGoMenu && (
              <button
                type="button"
                onClick={onGoMenu}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-xs font-bold inline-flex items-center gap-1.5 hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              >
                <UtensilsCrossed className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>Carta</span>
              </button>
            )}

            {isStaff && onCreatePosOrder && (
              <button
                type="button"
                onClick={() => setShowPosModal(true)}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[var(--accent-primary)] text-[var(--bg-surface)] text-xs font-bold inline-flex items-center gap-1.5 hover:brightness-105 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink-primary)]"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span>{newOrderLabel}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Unified Dark Graphite Operational Ticket Cards Grid */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-3xl bg-[var(--ops-surface)] text-[var(--bg-canvas)] border border-[var(--ops-border)] p-6 sm:p-8 text-center max-w-xl mx-auto space-y-4 shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-[var(--ops-elevated)] border border-[var(--accent-gold)]/35 flex items-center justify-center text-[var(--accent-gold)] mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="font-serif-display text-xl font-bold text-[var(--bg-surface)]">
              {orderFilter === 'active'
                ? 'Sin comandas activas'
                : orderFilter === 'collected'
                ? 'Sin comandas pagadas en el historial'
                : 'No hay comandas en esta vista'}
            </h2>
            <p className="text-xs text-white/70 max-w-sm mx-auto leading-relaxed">
              {orderFilter === 'collected'
                ? 'Las comandas cobradas desaparecerán de la vista activa y aparecerán automáticamente aquí.'
                : isStaff
                ? 'Crea una nueva comanda o añade platos desde la Carta Digital para gestionarlos en tiempo real.'
                : 'Elige una mesa y añade platos desde la Carta Digital para seguir tu comanda en vivo.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            {onGoMenu && (
              <button
                type="button"
                onClick={onGoMenu}
                className="min-h-[40px] px-5 py-2 rounded-xl bg-[var(--accent-gold)] text-[var(--ink-primary)] text-xs font-bold hover:brightness-105 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Ir a Carta Digital
              </button>
            )}
            {isStaff && onCreatePosOrder ? (
              <button
                type="button"
                onClick={() => setShowPosModal(true)}
                className="min-h-[40px] px-5 py-2 rounded-xl bg-[var(--ops-elevated)] border border-[var(--accent-gold)]/40 text-[var(--bg-surface)] text-xs font-bold hover:bg-white/10 active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
              >
                + {newOrderLabel}
              </button>
            ) : (
              onEditTable && (
                <button
                  type="button"
                  onClick={onEditTable}
                  className="min-h-[40px] px-5 py-2 rounded-xl bg-[var(--ops-elevated)] border border-[var(--accent-gold)]/40 text-[var(--bg-surface)] text-xs font-bold hover:bg-white/10 active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
                >
                  Seleccionar mesa
                </button>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
          {filteredOrders.map((order) => {
            const settled = isOrderSettled(order);
            const isSelectedCard =
              Boolean(onSelectOrderCard) &&
              ((order.mode === 'dine-in' &&
                orderMode === 'dine-in' &&
                order.tableNumber === selectedTable) ||
                (order.mode === 'takeaway' &&
                  orderMode === 'takeaway' &&
                  linkedTakeawayOrderId === order.id) ||
                (order.mode === 'delivery' &&
                  orderMode === 'delivery' &&
                  linkedDeliveryOrderId === order.id));
            const takeawayName =
              order.mode === 'takeaway' ? getTakeawayCustomerName(order) : '';

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
                className={`rounded-3xl bg-[var(--ops-surface)] text-[var(--bg-canvas)] p-4 sm:p-5 space-y-3.5 shadow-md transition-[border-color,box-shadow] duration-150 ease-[var(--ease-out)] border ${
                  isSelectedCard
                    ? 'border-[var(--accent-gold)] ring-2 ring-[var(--accent-gold)]/35'
                    : 'border-[var(--ops-border)] hover:border-[var(--accent-gold)]/55'
                }`}
              >
                {/* Clickable Header + Order Code (loads order into right panel COMANDA EN VIVO) */}
                <button
                  type="button"
                  disabled={!onSelectOrderCard}
                  onClick={() => onSelectOrderCard?.(order)}
                  title={
                    onSelectOrderCard
                      ? 'Cargar este pedido en Comanda en Vivo'
                      : undefined
                  }
                  className={`group w-full text-left space-y-2 rounded-2xl transition-[transform,background-color] duration-150 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ops-accent)] ${
                    onSelectOrderCard
                      ? 'cursor-pointer hover:bg-white/5 active:scale-[0.98] -m-1.5 p-1.5'
                      : 'cursor-default'
                  }`}
                >
                  {/* Row 1: Order Code + Timestamp */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`font-mono text-xs font-bold truncate transition-colors duration-150 ${
                        onSelectOrderCard
                          ? 'text-[var(--accent-gold)] group-hover:text-[var(--ops-accent)]'
                          : 'text-[var(--accent-gold)]'
                      }`}
                    >
                      {order.code} · {order.id}
                    </span>

                    <div className="flex items-center gap-2 shrink-0 text-xs text-white/75 font-semibold tabular-nums">
                      {onSelectOrderCard && (
                        <span className="hidden sm:inline-block text-[11px] font-bold text-[var(--ops-accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          Editar en vivo
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{order.createdAt}</span>
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Takeaway Badge + Delivery PIN Status/Code */}
                  {(order.mode === 'takeaway' ||
                    order.mode === 'delivery') && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {order.mode === 'takeaway' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--ops-accent)]/20 border border-[var(--ops-accent)]/60 text-white text-xs font-bold">
                          <ShoppingBag className="w-3.5 h-3.5 text-[var(--ops-accent)] shrink-0" />
                          <span>Para Llevar • {takeawayName}</span>
                        </span>
                      )}

                      {!isStaff && order.confirmationCode && !settled && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--accent-gold)]/20 border border-[var(--accent-gold)]/60 text-[var(--accent-gold)] text-xs font-mono font-bold tracking-wider">
                          <KeyRound className="w-3 h-3 shrink-0" />
                          <span>Código: {order.confirmationCode}</span>
                        </span>
                      )}

                      {isStaff && requiresDeliveryPin(order) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--ops-elevated)] border border-[var(--accent-gold)]/40 text-[var(--accent-gold)] text-[11px] font-bold">
                          <KeyRound className="w-3 h-3 text-[var(--accent-gold)] shrink-0" />
                          <span>PIN al entregar</span>
                        </span>
                      )}

                      {(order.status === 'Entregado' || settled) &&
                        order.confirmationCode && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--status-ok)]/25 border border-[var(--status-ok)]/55 text-[var(--status-ok-text)] text-[11px] font-bold">
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            <span>Entrega verificada</span>
                          </span>
                        )}
                    </div>
                  )}

                  <div className="flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3
                          className={`font-serif-display text-lg sm:text-xl font-bold min-w-0 [overflow-wrap:break-word] transition-colors duration-150 ${
                            onSelectOrderCard
                              ? 'text-[var(--bg-surface)] group-hover:text-[var(--ops-accent)]'
                              : 'text-[var(--bg-surface)]'
                          }`}
                        >
                          {order.mode === 'takeaway'
                            ? takeawayName
                            : order.customerLabel}
                        </h3>
                        {order.billRequested && !settled && (
                          <span className="px-2 py-0.5 rounded-md bg-[var(--accent-gold)]/20 border border-[var(--accent-gold)]/60 text-[var(--accent-gold)] text-[10px] font-bold">
                            Por pagar
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/65 truncate mt-0.5 tabular-nums">
                        {[
                          settled
                            ? `Pagado (${order.paymentMethod || 'Cobrado'})`
                            : 'Pendiente de cobro',
                          order.pickupNote,
                          order.deliveryAddress,
                          order.deliveryPhone ||
                            (order.customerPhone
                              ? formatBoliviaDisplayPhone(order.customerPhone)
                              : ''),
                          order.notes,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>

                    <span className="text-base sm:text-lg font-bold text-[var(--accent-gold)] tabular-nums whitespace-nowrap shrink-0">
                      Bs. {order.total.toFixed(2)}
                    </span>
                  </div>
                </button>

                <div className="border-t border-[var(--ops-border)]" />

                {/* Itemized Dish Rows */}
                <div className="space-y-2">
                  {order.items.map((it, idx) => (
                    <div
                      key={`${order.id}-${it.name}-${it.sizeLabel}-${idx}`}
                      className="flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs sm:text-[13px] font-semibold text-[var(--bg-surface)] leading-snug min-w-0 [overflow-wrap:break-word]">
                          {it.quantity}x {it.name}
                          {it.sizeLabel ? ` (${it.sizeLabel})` : ''}
                        </p>
                        {it.extrasSummary && (
                          <p className="text-[11px] text-[var(--accent-gold)]/85 mt-0.5">
                            {it.extrasSummary}
                          </p>
                        )}
                      </div>
                      <span className="text-xs sm:text-[13px] font-semibold text-white/85 tabular-nums whitespace-nowrap shrink-0">
                        Bs. {(it.price * it.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[var(--ops-border)]" />

                {/* Bottom Action Bar */}
                {isStaff ? (
                  settled ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                      <span className="min-h-[44px] px-3 py-1.5 rounded-xl bg-[var(--status-ok)]/25 text-[var(--status-ok-text)] text-xs font-bold inline-flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          Pagado ({order.paymentMethod || 'Cobrado'})
                        </span>
                      </span>

                      <div className="flex flex-wrap items-center gap-2">
                        {order.mode === 'dine-in' &&
                          order.tableNumber &&
                          isTableOccupied && (
                            <button
                              type="button"
                              onClick={() => onFreeTable(order.tableNumber!)}
                              className="min-h-[44px] px-3 py-1.5 rounded-xl bg-[var(--ops-elevated)] border border-[var(--accent-gold)]/50 text-[var(--accent-gold)] text-xs font-bold inline-flex items-center justify-center gap-1 hover:bg-white/10 active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Liberar Mesa {order.tableNumber}</span>
                            </button>
                          )}

                        <a
                          href={buildWhatsAppShareUrl(
                            order,
                            order.customerPhone || order.deliveryPhone || ''
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-[var(--status-ok)] text-[var(--bg-surface)] text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => setTicketOrder(order)}
                          className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-[var(--ops-elevated)] border border-[var(--accent-gold)]/60 text-[var(--accent-gold)] text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:bg-[var(--accent-gold)] hover:text-[var(--ink-primary)] active:scale-[0.97] transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Ticket</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-0.5">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateOrderStatus(order.id, 'Preparando')
                          }
                          className={`min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-bold transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] ${
                            order.status === 'Preparando'
                              ? 'bg-[var(--accent-gold)] text-[var(--ink-primary)]'
                              : 'bg-[var(--ops-elevated)] text-white/85 hover:bg-white/10'
                          }`}
                        >
                          Preparando
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onUpdateOrderStatus(order.id, middleStatus)
                          }
                          className={`min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-bold transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] ${
                            order.status === middleStatus
                              ? 'bg-[var(--accent-gold)] text-[var(--ink-primary)]'
                              : 'bg-[var(--ops-elevated)] text-white/85 hover:bg-white/10'
                          }`}
                        >
                          {middleLabel}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (requiresDeliveryPin(order)) {
                              setVerifyingOrder(order);
                            } else {
                              onUpdateOrderStatus(order.id, 'Entregado');
                            }
                          }}
                          className={`min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-bold transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer whitespace-nowrap inline-flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] ${
                            order.status === 'Entregado'
                              ? 'bg-[var(--accent-gold)] text-[var(--ink-primary)]'
                              : 'bg-[var(--ops-elevated)] text-white/85 hover:bg-white/10'
                          }`}
                        >
                          {requiresDeliveryPin(order) && (
                            <KeyRound className="w-3.5 h-3.5 text-[var(--ops-accent)] shrink-0" />
                          )}
                          <span>
                            {order.mode === 'dine-in' ? 'Servido' : 'Entregado'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCollectingOrder(order)}
                          className="min-h-[44px] px-3 py-2 rounded-xl bg-[var(--status-ok)] text-[var(--bg-surface)] text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                          <Banknote className="w-3.5 h-3.5 shrink-0" />
                          <span>Pagado / Cobrar</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {onAddDishesToOrder && (
                          <button
                            type="button"
                            onClick={() => onAddDishesToOrder(order)}
                            className="min-h-[44px] px-3 py-2 rounded-xl bg-[var(--ops-elevated)] border border-[var(--ops-border)] text-[var(--bg-surface)] text-xs font-bold inline-flex items-center justify-center gap-1 hover:bg-white/10 hover:border-[var(--ops-accent)]/60 active:scale-[0.97] transition-[transform,background-color,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ops-accent)]"
                          >
                            <Plus className="w-3.5 h-3.5 text-[var(--ops-accent)] shrink-0" />
                            <span>Agregar platos</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setTicketOrder(order)}
                          className={`min-h-[44px] px-3 py-2 rounded-xl bg-[var(--ops-elevated)] border border-[var(--accent-gold)]/55 text-[var(--accent-gold)] text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:bg-[var(--accent-gold)] hover:text-[var(--ink-primary)] active:scale-[0.97] transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] ${
                            !onAddDishesToOrder ? 'col-span-2' : ''
                          }`}
                        >
                          <Printer className="w-3.5 h-3.5 shrink-0" />
                          <span>Ticket / WA</span>
                        </button>

                        <a
                          href={buildWhatsAppShareUrl(
                            order,
                            order.customerPhone || order.deliveryPhone || ''
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="col-span-2 min-h-[44px] px-3 py-2 rounded-xl bg-[var(--status-ok)] text-[var(--bg-surface)] text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                          <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Enviar recibo por WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <span className="flex-1 min-h-[44px] px-3 py-1.5 rounded-xl bg-[var(--ops-elevated)] text-[var(--accent-gold)] text-xs font-bold inline-flex items-center justify-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{order.status}</span>
                    </span>

                    {order.mode === 'dine-in' && onCallWaiter && (
                      <button
                        type="button"
                        onClick={() => onCallWaiter(order.id)}
                        className="flex-1 min-h-[44px] px-3 py-1.5 rounded-xl bg-[var(--ops-elevated)] text-[var(--bg-surface)] text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:bg-white/10 active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
                      >
                        <Bell className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
                        <span>
                          {order.waiterRequested ? 'En camino' : 'Llamar mozo'}
                        </span>
                      </button>
                    )}

                    {!settled && onPayTableOrder ? (
                      <button
                        type="button"
                        onClick={() => onPayTableOrder(order)}
                        className="min-h-[44px] px-4 py-1.5 rounded-xl bg-[var(--status-ok)] text-[var(--bg-surface)] text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] cursor-pointer shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Pagar</span>
                      </button>
                    ) : (
                      <span className="min-h-[44px] px-3 py-1.5 rounded-xl bg-[var(--status-ok)]/25 text-[var(--status-ok-text)] text-xs font-bold inline-flex items-center justify-center gap-1 shrink-0 whitespace-nowrap">
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

      {/* Collect Payment Modal */}
      <CollectPaymentModal
        order={collectingOrder}
        onClose={() => setCollectingOrder(null)}
        onConfirmCollect={(order, method, openTicket) => {
          const paidCopy: KitchenOrder = {
            ...order,
            status: 'Cobrado',
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

      {/* New POS Order Modal */}
      {isStaff && onCreatePosOrder && (
        <PosOrderModal
          isOpen={showPosModal}
          title={newOrderLabel}
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

      {/* 4-Digit Delivery / Takeaway Verification Modal */}
      <VerifyDeliveryCodeModal
        order={verifyingOrder}
        onClose={() => setVerifyingOrder(null)}
        onVerified={(ord, code) => {
          onUpdateOrderStatus(ord.id, 'Entregado', code);
          setVerifyingOrder(null);
        }}
      />
    </div>
  );
};
