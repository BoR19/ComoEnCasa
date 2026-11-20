import React, { useEffect, useState } from 'react';
import {
  Ban,
  Banknote,
  Bell,
  BellRing,
  Bike,
  CheckCircle2,
  Clock,
  Lock,
  Minus,
  Plus,
  Printer,
  QrCode,
  ShoppingBag,
  Trash2,
  Unlock,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import {
  CartItem,
  DeliveryInfo,
  KitchenOrder,
  MenuItem,
  OrderMode,
  OrderStatus,
  PaymentMethod,
  TableItem,
} from '../types/app';
import {
  formatBs,
  formatBsDecimal,
  getActiveOrderForTable,
  getCartCount,
  getCartLineTotal,
  getCartTotal,
  getOrderLinesCount,
} from '../utils/appHelpers';
import { CollectPaymentModal } from './OrderKdsCard';
import { TicketModal } from './TicketModal';

export type AppUserRole = 'admin' | 'mozo' | 'customer';

interface LiveCartPanelProps {
  userRole: AppUserRole;
  cart: CartItem[];
  menuItems: MenuItem[];
  kitchenOrders: KitchenOrder[];
  orderMode: OrderMode;
  selectedTable: number;
  tables: TableItem[];
  deliveryInfo: DeliveryInfo;
  activeTableOrder?: KitchenOrder;
  onChangeOrderMode: (mode: OrderMode) => void;
  onSelectTable: (tableNumber: number) => void;
  onOpenTableQr: () => void;
  onOpenTableOrder: () => void;
  onOpenDeliveryInfo: () => void;
  onGoMenu: () => void;
  onPayAtTable: () => void;
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onChangeItemSize: (cartItemId: string, sizeId: string) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  onProceedOrder: () => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onUpdateOrderItemQty: (orderId: string, itemIndex: number, delta: number) => void;
  onCollectOrderPayment: (orderId: string, method: PaymentMethod) => void;
  onCallWaiter: (orderId: string) => void;
  onDismissWaiterCall: (orderId: string) => void;
  onFreeTable: (tableNumber: number) => void;
  onDeleteOrder: (order: KitchenOrder) => void;
  onClose?: () => void;
}

export const LiveCartPanel: React.FC<LiveCartPanelProps> = ({
  userRole,
  cart,
  menuItems,
  kitchenOrders,
  orderMode,
  selectedTable,
  tables,
  deliveryInfo,
  activeTableOrder,
  onChangeOrderMode,
  onSelectTable,
  onOpenTableQr,
  onOpenTableOrder,
  onOpenDeliveryInfo,
  onGoMenu,
  onPayAtTable,
  onUpdateQuantity,
  onChangeItemSize,
  onRemoveItem,
  onClearCart,
  onProceedOrder,
  onUpdateOrderStatus,
  onUpdateOrderItemQty,
  onCollectOrderPayment,
  onCallWaiter,
  onDismissWaiterCall,
  onFreeTable,
  onDeleteOrder,
  onClose,
}) => {
  const [collectingOrder, setCollectingOrder] = useState<KitchenOrder | null>(
    null
  );
  const [ticketOrder, setTicketOrder] = useState<KitchenOrder | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setConfirmDeleteId(null);
  }, [selectedTable, activeTableOrder?.id, userRole]);

  const isStaffRole = userRole === 'admin' || userRole === 'mozo';
  const cartCount = getCartCount(cart);
  const total = getCartTotal(cart);

  const selectedTableObj = tables.find((t) => t.number === selectedTable);
  const isSelectedTableOccupied = selectedTableObj?.status === 'ocupada';

  const activeOrderItemTotalUnits = activeTableOrder
    ? getOrderLinesCount(activeTableOrder.items)
    : 0;

  const activeOrderStatuses: OrderStatus[] =
    activeTableOrder?.mode === 'delivery'
      ? ['Preparando', 'En camino', 'Entregado']
      : ['Preparando', 'Listo', 'Entregado'];

  const roleBadgeLabel =
    userRole === 'admin' ? 'Admin' : userRole === 'mozo' ? 'Mozo' : null;

  return (
    <div className="flex flex-col h-full bg-[#FFFDF8] text-[#2B1A0E]">
      {/* Top Header */}
      <div className="px-4 py-3 border-b border-[#D9A441]/30 flex items-center justify-between gap-2 shrink-0 bg-[#FFFDF8]">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#3B1F0E]">
              Comanda en Vivo
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-[#FDF2D6] border border-[#D9A441]/55 text-[10px] font-extrabold text-[#B84A27] tabular-nums">
              {orderMode === 'dine-in' ? `Mesa ${selectedTable}` : 'Delivery'}
            </span>
            {roleBadgeLabel && (
              <span className="px-2 py-0.5 rounded-md bg-[#3B1F0E] text-[#D9A441] text-[10px] font-extrabold">
                {roleBadgeLabel}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#7A5A3A] mt-0.5 truncate">
            Como en Casa · Tupiza
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar comanda"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#3B1F0E] hover:bg-[#FDF2D6] cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Mode Switch & Table Combobox */}
      <div className="px-4 py-3 border-b border-[#D9A441]/25 space-y-2.5 bg-[#FFF8E8]/60 shrink-0">
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#FDF2D6] border border-[#D9A441]/45">
          <button
            type="button"
            onClick={() => onChangeOrderMode('dine-in')}
            className={`min-h-[34px] px-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              orderMode === 'dine-in'
                ? 'bg-[#3B1F0E] text-[#FFF8E8] shadow-xs'
                : 'text-[#7A5A3A] hover:text-[#2B1A0E]'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Comer Aquí</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeOrderMode('delivery')}
            className={`min-h-[34px] px-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              orderMode === 'delivery'
                ? 'bg-[#3B1F0E] text-[#FFF8E8] shadow-xs'
                : 'text-[#7A5A3A] hover:text-[#2B1A0E]'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Delivery</span>
          </button>
        </div>

        {orderMode === 'dine-in' ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <label
                htmlFor="live-cart-table-select"
                className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7A5A3A] mb-1"
              >
                Mesa seleccionada
              </label>
              <select
                id="live-cart-table-select"
                value={selectedTable}
                onChange={(e) => onSelectTable(Number(e.target.value))}
                className="w-full h-9 px-2.5 rounded-xl bg-[#FFFDF8] border border-[#D9A441]/70 text-xs font-extrabold text-[#2B1A0E] focus:outline-none focus:ring-2 focus:ring-[#B84A27] cursor-pointer"
              >
                {tables.map((t) => {
                  const tblOrder = isStaffRole
                    ? getActiveOrderForTable(kitchenOrders, tables, t.number)
                    : undefined;
                  const suffix = tblOrder
                    ? `Ocupada · ${formatBs(tblOrder.total)}`
                    : t.status === 'ocupada'
                    ? 'Ocupada'
                    : 'Libre';
                  return (
                    <option key={t.number} value={t.number}>
                      Mesa {t.number} ({suffix})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="pt-4 shrink-0">
              <button
                type="button"
                onClick={onOpenTableQr}
                title={`Ver QR de Mesa ${selectedTable}`}
                className="h-9 px-2.5 rounded-xl bg-[#FDF2D6] border border-[#D9A441]/70 text-[#3B1F0E] text-xs font-extrabold inline-flex items-center gap-1 hover:bg-[#E8C87A]/35 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-[#B84A27]" />
                <span>QR</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-[#FFFDF8] border border-[#D9A441]/55 p-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#7A5A3A]">
                Entrega a domicilio
              </p>
              <p className="text-xs font-bold text-[#2B1A0E] truncate">
                {deliveryInfo.address.trim()
                  ? deliveryInfo.address
                  : 'Completa dirección al continuar'}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenDeliveryInfo}
              className="px-2.5 py-1 rounded-lg bg-[#FDF2D6] border border-[#D9A441]/60 text-[11px] font-extrabold text-[#B84A27] hover:bg-[#E8C87A]/30 cursor-pointer shrink-0"
            >
              Datos
            </button>
          </div>
        )}
      </div>

      {/* Scrollable Body: Full Selected Table Order + Draft Cart */}
      <div className="flex-1 overflow-y-auto phone-scroll p-3.5 space-y-3 bg-[#FFF8E8]/50">
        {/* Selected Table Active Order Inspector & Role Operations */}
        {orderMode === 'dine-in' && (
          <section className="rounded-2xl bg-[#FFFDF8] border border-[#D9A441]/65 p-3 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-serif-display text-sm font-bold text-[#3B1F0E]">
                  Mesa {selectedTable}
                </span>
                <span className="text-[10px] font-bold text-[#7A5A3A] tabular-nums">
                  · Cap. {selectedTableObj?.capacity ?? 4}
                </span>
              </div>

              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold shrink-0 ${
                  isSelectedTableOccupied || activeTableOrder
                    ? 'bg-[#B84A27]/15 text-[#B84A27]'
                    : 'bg-[#2E6F32]/15 text-[#2E6F32]'
                }`}
              >
                {isSelectedTableOccupied || activeTableOrder
                  ? 'Ocupada'
                  : 'Libre'}
              </span>
            </div>

            {activeTableOrder ? (
              <div className="space-y-2.5">
                {/* Order Meta Row */}
                <div className="flex items-center justify-between gap-2 text-[11px] bg-[#FDF2D6]/70 border border-[#D9A441]/35 rounded-xl px-2.5 py-1.5">
                  <div className="min-w-0">
                    <span className="font-extrabold text-[#3B1F0E] tabular-nums">
                      {activeTableOrder.code}
                    </span>
                    <span className="text-[#7A5A3A] font-semibold">
                      {' '}
                      · {activeTableOrder.createdAt}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold shrink-0 ${
                      activeTableOrder.paid
                        ? 'bg-[#2E6F32]/15 text-[#2E6F32]'
                        : 'bg-[#B84A27]/15 text-[#B84A27]'
                    }`}
                  >
                    {activeTableOrder.paid
                      ? `Pagado (${activeTableOrder.paymentMethod})`
                      : 'Pendiente'}
                  </span>
                </div>

                {/* Waiter Call Alert */}
                {activeTableOrder.waiterRequested && (
                  <div className="rounded-xl bg-[#B84A27] text-[#FFF8E8] px-2.5 py-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold inline-flex items-center gap-1.5">
                      <BellRing className="w-3.5 h-3.5 text-[#D9A441] shrink-0" />
                      <span>
                        {isStaffRole
                          ? '¡Mesa solicita al mesero!'
                          : 'Mesero notificado'}
                      </span>
                    </span>
                    {isStaffRole && (
                      <button
                        type="button"
                        onClick={() => onDismissWaiterCall(activeTableOrder.id)}
                        className="px-2 py-0.5 rounded-lg bg-[#FFF8E8] text-[#2B1A0E] text-[10px] font-extrabold cursor-pointer shrink-0"
                      >
                        Atendido
                      </button>
                    )}
                  </div>
                )}

                {/* Complete Itemized Order List */}
                <div className="rounded-xl bg-[#FFF8E8] border border-[#D9A441]/40 divide-y divide-[#D9A441]/25">
                  {activeTableOrder.items.map((it, idx) => (
                    <div
                      key={`${activeTableOrder.id}-${it.name}-${it.sizeLabel}-${idx}`}
                      className="px-2.5 py-2 flex items-start justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[#2B1A0E] leading-snug">
                          {it.quantity}x {it.name}{' '}
                          <span className="text-[#7A5A3A] font-semibold">
                            ({it.sizeLabel})
                          </span>
                        </p>
                        {it.extrasSummary && (
                          <p className="text-[10px] text-[#7A5A3A] leading-snug">
                            {it.extrasSummary}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isStaffRole && !activeTableOrder.paid && (
                          <div className="inline-flex items-center gap-0.5 rounded-lg bg-[#FDF2D6] border border-[#D9A441]/50 p-0.5">
                            <button
                              type="button"
                              disabled={
                                activeOrderItemTotalUnits <= 1 && it.quantity <= 1
                              }
                              onClick={() =>
                                onUpdateOrderItemQty(activeTableOrder.id, idx, -1)
                              }
                              aria-label={`Restar ${it.name}`}
                              className="w-5 h-5 rounded flex items-center justify-center text-[#3B1F0E] hover:bg-[#FFFDF8] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateOrderItemQty(activeTableOrder.id, idx, 1)
                              }
                              aria-label={`Sumar ${it.name}`}
                              className="w-5 h-5 rounded flex items-center justify-center bg-[#D9A441] text-[#2B1A0E] hover:bg-[#E8C87A] cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <span className="font-extrabold text-[#B84A27] tabular-nums">
                          {formatBs(it.price * it.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {activeTableOrder.notes && (
                  <p className="text-[11px] text-[#7A5A3A] bg-[#FDF2D6]/55 px-2.5 py-1.5 rounded-xl border border-[#D9A441]/30">
                    <span className="font-extrabold text-[#3B1F0E]">Notas: </span>
                    {activeTableOrder.notes}
                  </p>
                )}

                <div className="flex items-center justify-between px-1 pt-0.5">
                  <span className="text-xs font-extrabold text-[#3B1F0E]">
                    Total pedido
                  </span>
                  <span className="text-sm font-extrabold text-[#B84A27] tabular-nums">
                    {formatBs(activeTableOrder.total)}
                  </span>
                </div>

                {/* Role-Based Operations */}
                {isStaffRole ? (
                  <div className="space-y-2 pt-1.5 border-t border-[#D9A441]/25">
                    {/* Status Switcher */}
                    <div className="grid grid-cols-3 gap-1">
                      {activeOrderStatuses.map((st) => {
                        const active = activeTableOrder.status === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() =>
                              onUpdateOrderStatus(activeTableOrder.id, st)
                            }
                            className={`min-h-[30px] px-1.5 py-1 rounded-lg text-[10px] font-extrabold border transition-colors cursor-pointer ${
                              active
                                ? 'bg-[#D9A441] border-[#B84A27] text-[#2B1A0E]'
                                : 'bg-[#FFF8E8] border-[#D9A441]/45 text-[#7A5A3A] hover:text-[#2B1A0E]'
                            }`}
                          >
                            {st}
                          </button>
                        );
                      })}
                    </div>

                    {/* Staff Action Grid */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {!activeTableOrder.paid && (
                        <button
                          type="button"
                          onClick={() => setCollectingOrder(activeTableOrder)}
                          className="col-span-2 min-h-[36px] px-3 py-1.5 rounded-xl bg-[#2E6F32] text-[#FFF8E8] text-xs font-extrabold flex items-center justify-center gap-1.5 hover:opacity-95 cursor-pointer tabular-nums"
                        >
                          <Banknote className="w-3.5 h-3.5" />
                          <span>Cobrar {formatBs(activeTableOrder.total)}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setTicketOrder(activeTableOrder)}
                        className="min-h-[34px] px-2.5 py-1 rounded-xl bg-[#D9A441] text-[#2B1A0E] text-[11px] font-extrabold flex items-center justify-center gap-1 hover:bg-[#E8C87A] cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Ticket / WA</span>
                      </button>

                      <button
                        type="button"
                        onClick={onGoMenu}
                        className="min-h-[34px] px-2.5 py-1 rounded-xl bg-[#FDF2D6] border border-[#D9A441]/70 text-[#3B1F0E] text-[11px] font-extrabold flex items-center justify-center gap-1 hover:bg-[#E8C87A]/30 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#B84A27]" />
                        <span>Carta</span>
                      </button>

                      {isSelectedTableOccupied && (
                        <button
                          type="button"
                          onClick={() => onFreeTable(selectedTable)}
                          className="col-span-2 min-h-[34px] px-2.5 py-1 rounded-xl bg-[#FFF8E8] border border-[#3B1F0E] text-[#3B1F0E] text-[11px] font-extrabold flex items-center justify-center gap-1 hover:bg-[#E8C87A]/25 cursor-pointer"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Liberar Mesa {selectedTable}</span>
                        </button>
                      )}
                    </div>

                    {/* Admin-Only Cancel / Delete Order */}
                    {userRole === 'admin' && (
                      <div className="pt-1">
                        {confirmDeleteId === activeTableOrder.id ? (
                          <div className="rounded-xl bg-[#B83227]/10 border border-[#B83227]/40 p-2 flex items-center justify-between gap-2">
                            <span className="text-[10px] font-extrabold text-[#B83227]">
                              ¿Anular {activeTableOrder.code}?
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteOrder(activeTableOrder);
                                  setConfirmDeleteId(null);
                                }}
                                className="px-2 py-1 rounded-lg bg-[#B83227] text-white text-[10px] font-extrabold cursor-pointer"
                              >
                                Anular
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 rounded-lg bg-[#FFFDF8] border border-[#D9A441]/60 text-[#3B1F0E] text-[10px] font-bold cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(activeTableOrder.id)}
                            className="w-full py-1 text-[11px] font-bold text-[#B83227] hover:underline flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Ban className="w-3 h-3" />
                            <span>Anular pedido (Admin)</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Customer Operations on own Table Order */
                  <div className="space-y-1.5 pt-1.5 border-t border-[#D9A441]/25">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#3B1F0E]">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#B84A27]" />
                        Estado: {activeTableOrder.status}
                      </span>
                      <button
                        type="button"
                        onClick={onOpenTableOrder}
                        className="text-[#B84A27] underline font-extrabold cursor-pointer"
                      >
                        Ver detalle
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => onCallWaiter(activeTableOrder.id)}
                        className="min-h-[34px] px-2 py-1 rounded-xl bg-[#FDF2D6] border border-[#D9A441] text-[#3B1F0E] text-[11px] font-extrabold flex items-center justify-center gap-1 hover:bg-[#E8C87A]/30 cursor-pointer"
                      >
                        <Bell className="w-3.5 h-3.5 text-[#B84A27]" />
                        <span>
                          {activeTableOrder.waiterRequested
                            ? 'En camino'
                            : 'Llamar mozo'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTicketOrder(activeTableOrder)}
                        className="min-h-[34px] px-2 py-1 rounded-xl bg-[#D9A441] text-[#2B1A0E] text-[11px] font-extrabold flex items-center justify-center gap-1 hover:bg-[#E8C87A] cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Ticket / WA</span>
                      </button>

                      {!activeTableOrder.paid && (
                        <button
                          type="button"
                          onClick={onPayAtTable}
                          className="col-span-2 min-h-[36px] px-3 py-1.5 rounded-xl bg-[#B84A27] text-[#FFF8E8] text-xs font-extrabold flex items-center justify-center gap-1.5 hover:bg-[#C95B34] cursor-pointer tabular-nums"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Pagar en mesa · {formatBs(activeTableOrder.total)}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : isSelectedTableOccupied && !isStaffRole ? (
              <p className="text-[11px] text-[#7A5A3A] leading-relaxed">
                Mesa {selectedTable} está ocupada actualmente. Elige una mesa libre en el selector superior o escanea el QR de tu mesa.
              </p>
            ) : (
              <div className="flex items-center justify-between gap-2 text-[11px] text-[#7A5A3A]">
                <span>Sin pedido activo en Mesa {selectedTable}.</span>
                {isStaffRole && isSelectedTableOccupied && (
                  <button
                    type="button"
                    onClick={() => onFreeTable(selectedTable)}
                    className="px-2 py-1 rounded-lg bg-[#FFF8E8] border border-[#3B1F0E] text-[#3B1F0E] text-[10px] font-extrabold inline-flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Unlock className="w-3 h-3" />
                    <span>Liberar</span>
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        {/* Draft Cart Items (New / Additional dishes to send) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#7A5A3A]">
              {orderMode === 'dine-in' &&
              activeTableOrder &&
              !activeTableOrder.paid
                ? `Agregar platos a Mesa ${selectedTable}`
                : 'Borrador de pedido'}
            </h3>
            {cartCount > 0 && (
              <span className="text-[11px] font-extrabold text-[#B84A27] tabular-nums">
                {cartCount} {cartCount === 1 ? 'ítem' : 'ítems'}
              </span>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="rounded-2xl bg-[#FFFDF8] border border-dashed border-[#D9A441]/60 p-4 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#FDF2D6] border border-[#D9A441]/60 flex items-center justify-center text-[#B84A27]">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-[#3B1F0E]">
                Sin platos en el borrador
              </p>
              <p className="text-[11px] text-[#7A5A3A] leading-relaxed">
                Toca <span className="font-extrabold text-[#B84A27]">+ Añadir</span> en la carta para armar o sumar platos a esta mesa.
              </p>
              <button
                type="button"
                onClick={onGoMenu}
                className="px-3 py-1.5 rounded-xl bg-[#FDF2D6] border border-[#D9A441]/70 text-[#3B1F0E] text-[11px] font-extrabold hover:bg-[#E8C87A]/35 cursor-pointer"
              >
                Ir a Carta Digital
              </button>
            </div>
          ) : (
            cart.map((item) => {
              const sourceMenu = menuItems.find(
                (m) => m.id === item.menuItemId
              );
              const lineTotal = getCartLineTotal(item);

              return (
                <article
                  key={item.cartItemId}
                  className="rounded-2xl bg-[#FFFDF8] border border-[#D9A441]/55 p-3 space-y-2 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-[#2B1A0E] leading-snug">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-[#7A5A3A] tabular-nums">
                        {item.sizeLabel} · {formatBs(item.unitPrice)} c/u
                      </p>
                      {item.extras.length > 0 && (
                        <p className="text-[10px] text-[#7A5A3A] mt-0.5">
                          +{item.extras.map((e) => e.label).join(', ')}
                        </p>
                      )}
                      {item.customSummary && (
                        <p className="text-[10px] text-[#7A5A3A] mt-0.5">
                          {item.customSummary}
                        </p>
                      )}
                    </div>

                    <span className="font-extrabold text-xs text-[#B84A27] tabular-nums shrink-0">
                      {formatBsDecimal(lineTotal)}
                    </span>
                  </div>

                  {sourceMenu && sourceMenu.sizes.length > 1 && (
                    <div className="flex flex-wrap gap-1">
                      {sourceMenu.sizes.map((sz) => {
                        const active = item.sizeId === sz.id;
                        return (
                          <button
                            key={sz.id}
                            type="button"
                            onClick={() =>
                              onChangeItemSize(item.cartItemId, sz.id)
                            }
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border transition-colors cursor-pointer tabular-nums ${
                              active
                                ? 'bg-[#B84A27] border-[#B84A27] text-[#FFF8E8]'
                                : 'bg-[#FDF2D6] border-[#D9A441]/50 text-[#7A5A3A] hover:text-[#2B1A0E]'
                            }`}
                          >
                            {sz.label} Bs {sz.price}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-[#D9A441]/25">
                    <div className="inline-flex items-center gap-1 rounded-xl bg-[#FDF2D6] border border-[#D9A441]/50 p-0.5">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.cartItemId, -1)}
                        aria-label={`Disminuir ${item.name}`}
                        className="w-7 h-7 rounded-lg bg-[#FFFDF8] text-[#3B1F0E] flex items-center justify-center hover:bg-[#E8C87A]/35 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" strokeWidth={2.5} />
                      </button>
                      <span className="w-6 text-center text-xs font-extrabold text-[#2B1A0E] tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.cartItemId, 1)}
                        aria-label={`Aumentar ${item.name}`}
                        className="w-7 h-7 rounded-lg bg-[#D9A441] text-[#2B1A0E] flex items-center justify-center hover:bg-[#E8C87A] cursor-pointer"
                      >
                        <Plus className="w-3 h-3" strokeWidth={2.5} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.cartItemId)}
                      aria-label={`Quitar ${item.name}`}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[#7A5A3A] hover:text-[#B83227] hover:bg-[#B83227]/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      {/* Totals & Checkout Actions Footer */}
      <div className="p-4 border-t border-[#D9A441]/35 bg-[#FFFDF8] space-y-3 shrink-0">
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-[#7A5A3A] font-bold">
            <span>
              Borrador ({cartCount} {cartCount === 1 ? 'ítem' : 'ítems'})
            </span>
            <span className="text-[#2B1A0E] tabular-nums">
              {formatBsDecimal(total)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[#7A5A3A] font-bold">
            <span>Envío / Servicio</span>
            <span className="text-[#2E6F32] font-extrabold tabular-nums">
              Bs 0.00 (Gratis)
            </span>
          </div>
          <div className="pt-2 border-t border-[#D9A441]/35 flex items-center justify-between">
            <span className="text-sm font-extrabold text-[#2B1A0E]">
              Total a Enviar
            </span>
            <span className="text-lg font-extrabold text-[#B84A27] tabular-nums">
              {formatBsDecimal(total)}
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled={cart.length === 0}
          onClick={onProceedOrder}
          className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl bg-[#B84A27] text-[#FFF8E8] font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm hover:bg-[#C95B34] disabled:opacity-45 disabled:cursor-not-allowed active:scale-[0.98] transition-all cursor-pointer tabular-nums"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            {orderMode === 'dine-in'
              ? activeTableOrder && !activeTableOrder.paid
                ? `Agregar a Mesa ${selectedTable} · ${formatBs(total)}`
                : `Enviar a Cocina · Mesa ${selectedTable}`
              : `Continuar a Delivery · ${formatBs(total)}`}
          </span>
        </button>

        {cart.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="w-full py-1 text-[11px] font-bold text-[#7A5A3A] hover:text-[#B83227] transition-colors cursor-pointer"
          >
            Vaciar borrador actual
          </button>
        )}
      </div>

      {/* Collect Payment Modal (for Staff directly inside Comanda en Vivo) */}
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

      {/* Ticket / WhatsApp Modal */}
      <TicketModal order={ticketOrder} onClose={() => setTicketOrder(null)} />
    </div>
  );
};
