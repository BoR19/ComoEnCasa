import React, { useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  Bell,
  BellRing,
  CheckCircle2,
  Clock,
  KeyRound,
  Lock,
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
              className="rounded-2xl bg-[#B84A27] text-[#FFF8E8] p-3 flex items-center justify-between gap-2 shadow-sm"
            >
              <div className="flex items-center gap-2 text-xs font-extrabold">
                <BellRing className="w-4 h-4 text-[#D9A441] shrink-0" />
                <span>{req.customerLabel} solicita al mesero</span>
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
        </div>
      )}

      {/* Unified Filter Tabs & Quick Actions Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#FDF2D6] border border-[#D9A441]/55">
          {ORDER_FILTER_TABS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setOrderFilter(f.id)}
              className={`min-h-[34px] px-2.5 sm:px-3 rounded-lg text-[10px] sm:text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
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

          {showCartaShortcut && onGoMenu && (
            <button
              type="button"
              onClick={onGoMenu}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#FDF2D6] border border-[#D9A441]/70 text-[#3B1F0E] text-xs font-extrabold inline-flex items-center gap-1.5 hover:bg-[#E8C87A]/35 cursor-pointer"
            >
              <UtensilsCrossed className="w-3.5 h-3.5 text-[#B84A27]" />
              <span>Carta</span>
            </button>
          )}

          {isStaff && onCreatePosOrder && (
            <button
              type="button"
              onClick={() => setShowPosModal(true)}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#B84A27] text-[#FFF8E8] text-xs font-extrabold inline-flex items-center gap-1.5 hover:bg-[#C95B34] cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span>{newOrderLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* Unified Dark Pro Ticket Cards Grid */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-3xl bg-[#1E1E1E] text-[#FFF8E8] border border-[#2A2A2A] p-6 sm:p-8 text-center max-w-xl mx-auto space-y-4 shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-[#2A2A2A] border border-[#D9A441]/35 flex items-center justify-center text-[#D9A441] mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="font-serif-display text-xl font-bold text-[#FFF8E8]">
              {orderFilter === 'active'
                ? 'Sin comandas activas'
                : orderFilter === 'collected'
                ? 'Sin comandas pagadas en el historial'
                : 'No hay comandas en esta vista'}
            </h2>
            <p className="text-xs text-[#FFF8E8]/70 max-w-sm mx-auto leading-relaxed">
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
                className="min-h-[40px] px-5 py-2 rounded-xl bg-[#D9A441] text-[#2B1A0E] text-xs font-extrabold hover:bg-[#E8C87A] cursor-pointer"
              >
                Ir a Carta Digital
              </button>
            )}
            {isStaff && onCreatePosOrder ? (
              <button
                type="button"
                onClick={() => setShowPosModal(true)}
                className="min-h-[40px] px-5 py-2 rounded-xl bg-[#2A2A2A] border border-[#D9A441]/40 text-[#FFF8E8] text-xs font-extrabold hover:bg-[#333333] cursor-pointer"
              >
                + {newOrderLabel}
              </button>
            ) : (
              onEditTable && (
                <button
                  type="button"
                  onClick={onEditTable}
                  className="min-h-[40px] px-5 py-2 rounded-xl bg-[#2A2A2A] border border-[#D9A441]/40 text-[#FFF8E8] text-xs font-extrabold hover:bg-[#333333] cursor-pointer"
                >
                  Seleccionar Mesa
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
                className={`rounded-3xl bg-[#1E1E1E] text-[#FFF8E8] p-4 sm:p-5 space-y-3.5 shadow-md transition-all border ${
                  isSelectedCard
                    ? 'border-[#D9A441] ring-2 ring-[#D9A441]/35'
                    : 'border-[#2A2A2A] hover:border-[#D9A441]/55'
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
                  className={`group w-full text-left space-y-2 rounded-2xl transition-colors focus:outline-none ${
                    onSelectOrderCard
                      ? 'cursor-pointer hover:bg-[#252525]/80 -m-1.5 p-1.5'
                      : 'cursor-default'
                  }`}
                >
                  {/* Row 1: Order Code + Timestamp */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`font-mono text-xs font-bold truncate transition-colors ${
                        onSelectOrderCard
                          ? 'text-[#D9A441] group-hover:text-[#E64833]'
                          : 'text-[#D9A441]'
                      }`}
                    >
                      {order.code} · {order.id}
                    </span>

                    <div className="flex items-center gap-2 shrink-0 text-xs text-[#FFF8E8]/75 font-semibold tabular-nums">
                      {onSelectOrderCard && (
                        <span className="hidden sm:inline-block text-[10px] font-bold text-[#E64833] opacity-0 group-hover:opacity-100 transition-opacity">
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
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E64833]/20 border border-[#E64833]/60 text-[#FF9B8A] text-[11px] font-extrabold">
                          <ShoppingBag className="w-3.5 h-3.5 text-[#E64833] shrink-0" />
                          <span>Para Llevar • {takeawayName}</span>
                        </span>
                      )}

                      {!isStaff && order.confirmationCode && !settled && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#D9A441]/20 border border-[#D9A441]/60 text-[#D9A441] text-[11px] font-mono font-extrabold tracking-wider">
                          <KeyRound className="w-3 h-3 shrink-0" />
                          <span>Código: {order.confirmationCode}</span>
                        </span>
                      )}

                      {isStaff && requiresDeliveryPin(order) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#2A2A2A] border border-[#D9A441]/40 text-[#E8C87A] text-[10px] font-extrabold">
                          <KeyRound className="w-3 h-3 text-[#D9A441] shrink-0" />
                          <span>PIN al entregar</span>
                        </span>
                      )}

                      {(order.status === 'Entregado' || settled) &&
                        order.confirmationCode && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#2E6F32]/20 border border-[#2E6F32]/50 text-[#9CE5A2] text-[10px] font-extrabold">
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            <span>Entrega verificada</span>
                          </span>
                        )}
                    </div>
                  )}

                  <div className="flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <h3
                        className={`font-serif-display text-lg sm:text-xl font-bold truncate transition-colors ${
                          onSelectOrderCard
                            ? 'text-[#FFF8E8] group-hover:text-[#E64833]'
                            : 'text-[#FFF8E8]'
                        }`}
                      >
                        {order.mode === 'takeaway'
                          ? takeawayName
                          : order.customerLabel}
                      </h3>
                      <p className="text-[11px] text-[#FFF8E8]/65 truncate mt-0.5">
                        {[
                          settled
                            ? `Pagado (${order.paymentMethod || 'Cobrado'})`
                            : 'Pendiente de cobro',
                          order.pickupNote,
                          order.deliveryAddress,
                          order.deliveryPhone,
                          order.notes,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>

                    <span className="text-base sm:text-lg font-extrabold text-[#D9A441] tabular-nums whitespace-nowrap shrink-0">
                      Bs. {order.total.toFixed(2)}
                    </span>
                  </div>
                </button>

                <div className="border-t border-[#2E2E2E]" />

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

                <div className="border-t border-[#2E2E2E]" />

                {/* Bottom Action Bar */}
                {isStaff ? (
                  settled ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                      <span className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#2E6F32]/25 text-[#9CE5A2] text-xs font-extrabold inline-flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          Pagado ({order.paymentMethod || 'Cobrado'})
                        </span>
                      </span>

                      <div className="flex items-center gap-2">
                        {order.mode === 'dine-in' &&
                          order.tableNumber &&
                          isTableOccupied && (
                            <button
                              type="button"
                              onClick={() => onFreeTable(order.tableNumber!)}
                              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#2A2A2A] border border-[#D9A441]/50 text-[#D9A441] text-xs font-extrabold inline-flex items-center justify-center gap-1 hover:bg-[#353535] cursor-pointer whitespace-nowrap"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Liberar Mesa {order.tableNumber}</span>
                            </button>
                          )}

                        <button
                          type="button"
                          onClick={() => setTicketOrder(order)}
                          className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#2A2A2A] border border-[#D9A441]/60 text-[#D9A441] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 hover:bg-[#D9A441] hover:text-[#2B1A0E] transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Ticket / WA</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateOrderStatus(order.id, 'Preparando')
                          }
                          className={`flex-1 min-w-[82px] min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                            order.status === 'Preparando'
                              ? 'bg-[#D9A441] text-[#2B1A0E]'
                              : 'bg-[#2A2A2A] text-[#FFF8E8]/85 hover:bg-[#353535]'
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
                              : 'bg-[#2A2A2A] text-[#FFF8E8]/85 hover:bg-[#353535]'
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
                          className={`flex-1 min-w-[74px] min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap inline-flex items-center justify-center gap-1 ${
                            order.status === 'Entregado'
                              ? 'bg-[#D9A441] text-[#2B1A0E]'
                              : 'bg-[#2A2A2A] text-[#FFF8E8]/85 hover:bg-[#353535]'
                          }`}
                        >
                          {requiresDeliveryPin(order) && (
                            <KeyRound className="w-3 h-3 text-[#E64833] shrink-0" />
                          )}
                          <span>
                            {order.mode === 'dine-in' ? 'Servido' : 'Entregado'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCollectingOrder(order)}
                          className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#2E6F32] text-[#FFF8E8] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 hover:brightness-110 cursor-pointer shrink-0 whitespace-nowrap"
                        >
                          <Banknote className="w-3.5 h-3.5" />
                          <span>Pagado / Cobrar</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {onAddDishesToOrder && (
                          <button
                            type="button"
                            onClick={() => onAddDishesToOrder(order)}
                            className="flex-1 min-h-[36px] px-3 py-1.5 rounded-xl bg-[#2A2A2A] border border-[#3A3A3A] text-[#FFF8E8] text-xs font-extrabold inline-flex items-center justify-center gap-1 hover:bg-[#353535] hover:border-[#E64833]/60 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Plus className="w-3.5 h-3.5 text-[#E64833]" />
                            <span>Agregar platos</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setTicketOrder(order)}
                          className="flex-1 min-h-[36px] px-3 py-1.5 rounded-xl bg-[#2A2A2A] border border-[#D9A441]/55 text-[#D9A441] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 hover:bg-[#D9A441] hover:text-[#2B1A0E] transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Ticket / WA</span>
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <span className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl bg-[#2A2A2A] text-[#E8C87A] text-xs font-bold inline-flex items-center justify-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{order.status}</span>
                    </span>

                    {order.mode === 'dine-in' && onCallWaiter && (
                      <button
                        type="button"
                        onClick={() => onCallWaiter(order.id)}
                        className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl bg-[#2A2A2A] text-[#FFF8E8] text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:bg-[#353535] cursor-pointer whitespace-nowrap"
                      >
                        <Bell className="w-3.5 h-3.5 text-[#D9A441]" />
                        <span>
                          {order.waiterRequested ? 'En camino' : 'Llamar mozo'}
                        </span>
                      </button>
                    )}

                    {!settled && onPayTableOrder ? (
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
