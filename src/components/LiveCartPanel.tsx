import React, { useEffect, useMemo, useState } from 'react';
import {
  Ban,
  Banknote,
  Bell,
  BellRing,
  Bike,
  CheckCircle2,
  Clock,
  KeyRound,
  Lock,
  MapPin,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  Printer,
  QrCode,
  ReceiptText,
  ShoppingBag,
  Trash2,
  Unlock,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import {
  ActiveStaffSession,
  CartItem,
  DeliveryInfo,
  KitchenOrder,
  MenuItem,
  OrderMode,
  OrderStatus,
  PaymentMethod,
  StaffPermissions,
  TableItem,
  TakeawayInfo,
} from '../types/app';
import {
  formatBs,
  formatBsDecimal,
  getActiveOrderForTable,
  getCartCount,
  getCartLineTotal,
  getCartTotal,
  getOrderLinesCount,
  getTakeawayCustomerName,
  isOrderSettled,
  requiresDeliveryPin,
} from '../utils/appHelpers';
import {
  buildWhatsAppShareUrl,
  formatBoliviaDisplayPhone,
  maskPhoneNumberForPrivacy,
} from '../utils/ticketHelpers';
import { CollectPaymentModal } from './CollectPaymentModal';
import { TicketModal } from './TicketModal';
import { VerifyDeliveryCodeModal } from './VerifyDeliveryCodeModal';

export type AppUserRole = 'admin' | 'mozo' | 'customer';

interface LiveCartPanelProps {
  userRole: AppUserRole;
  isAdmin?: boolean;
  activeStaffSession?: ActiveStaffSession | null;
  permissions?: StaffPermissions;
  cart: CartItem[];
  menuItems: MenuItem[];
  kitchenOrders: KitchenOrder[];
  orderMode: OrderMode;
  selectedTable: number;
  tables: TableItem[];
  takeawayInfo: TakeawayInfo;
  deliveryInfo: DeliveryInfo;
  activeTableOrder?: KitchenOrder;
  linkedTakeawayOrder?: KitchenOrder;
  linkedDeliveryOrder?: KitchenOrder;
  tableCustomerPhone?: string;
  onChangeOrderMode: (mode: OrderMode) => void;
  onChangeTakeawayInfo: (info: TakeawayInfo) => void;
  onSelectTable: (tableNumber: number) => void;
  onSelectTakeawayOrder: (orderId: string | null) => void;
  onSelectDeliveryOrder: (orderId: string | null) => void;
  onOpenTableQr: () => void;
  onOpenTableOrder: () => void;
  onOpenDeliveryInfo: () => void;
  onGoMenu: () => void;
  onPayAtTable: () => void;
  onPayTakeawayOrder: () => void;
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onChangeItemSize: (cartItemId: string, sizeId: string) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  onProceedOrder: () => void;
  onUpdateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    verificationCode?: string
  ) => void;
  onUpdateOrderItemQty: (orderId: string, itemIndex: number, delta: number) => void;
  onCollectOrderPayment: (orderId: string, method: PaymentMethod) => void;
  onCallWaiter: (orderId: string) => void;
  onRequestBill?: (orderId: string) => void;
  onDismissWaiterCall: (orderId: string) => void;
  onFreeTable: (tableNumber: number) => void;
  onDeleteOrder: (order: KitchenOrder) => void;
  onAttachPhone?: (phone: string) => Promise<boolean>;
  onClose?: () => void;
}

export const LiveCartPanel: React.FC<LiveCartPanelProps> = ({
  userRole,
  isAdmin = false,
  activeStaffSession = null,
  permissions,
  cart,
  menuItems,
  kitchenOrders,
  orderMode,
  selectedTable,
  tables,
  takeawayInfo,
  deliveryInfo,
  activeTableOrder,
  linkedTakeawayOrder,
  linkedDeliveryOrder,
  tableCustomerPhone = '',
  onChangeOrderMode,
  onChangeTakeawayInfo,
  onSelectTable,
  onSelectTakeawayOrder,
  onSelectDeliveryOrder,
  onOpenTableQr,
  onOpenTableOrder,
  onOpenDeliveryInfo,
  onGoMenu,
  onPayAtTable,
  onPayTakeawayOrder,
  onUpdateQuantity,
  onChangeItemSize,
  onRemoveItem,
  onClearCart,
  onProceedOrder,
  onUpdateOrderStatus,
  onUpdateOrderItemQty,
  onCollectOrderPayment,
  onCallWaiter,
  onRequestBill,
  onDismissWaiterCall,
  onFreeTable,
  onDeleteOrder,
  onAttachPhone,
  onClose,
}) => {
  const [collectingOrder, setCollectingOrder] = useState<KitchenOrder | null>(
    null
  );
  const [ticketOrder, setTicketOrder] = useState<KitchenOrder | null>(null);
  const [verifyingOrder, setVerifyingOrder] = useState<KitchenOrder | null>(
    null
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [takeawayNameAttempted, setTakeawayNameAttempted] = useState(false);
  const [inlinePhone, setInlinePhone] = useState('');
  const [showInlinePhoneForm, setShowInlinePhoneForm] = useState(false);
  const [isSavingInlinePhone, setIsSavingInlinePhone] = useState(false);

  const isStaffRole = userRole === 'admin' || userRole === 'mozo';
  const isAdminRole = Boolean(isAdmin) || userRole === 'admin';
  const canUpdateKitchen =
    isAdminRole || (permissions ? permissions.kitchen_board : isStaffRole);
  const canCollectBilling =
    isAdminRole || (permissions ? permissions.cashier_billing : isStaffRole);
  const canTakeOrders =
    isAdminRole ||
    (permissions ? permissions.orders_tables || permissions.cashier_billing : true);
  const inspectedOrder =
    orderMode === 'dine-in'
      ? activeTableOrder
      : orderMode === 'takeaway'
      ? linkedTakeawayOrder
      : linkedDeliveryOrder;

  useEffect(() => {
    setConfirmDeleteId(null);
    setTakeawayNameAttempted(false);
    setVerifyingOrder(null);
  }, [selectedTable, inspectedOrder?.id, orderMode, userRole]);

  useEffect(() => {
    setCollectingOrder(null);
    setTicketOrder(null);
    setVerifyingOrder(null);
  }, [userRole]);

  const cartCount = useMemo(() => getCartCount(cart), [cart]);
  const total = useMemo(() => getCartTotal(cart), [cart]);

  const activeTakeawayOrders = useMemo(
    () =>
      kitchenOrders.filter(
        (o) => o.mode === 'takeaway' && !isOrderSettled(o)
      ),
    [kitchenOrders]
  );

  const activeDeliveryOrders = useMemo(
    () =>
      kitchenOrders.filter(
        (o) => o.mode === 'delivery' && !isOrderSettled(o)
      ),
    [kitchenOrders]
  );

  const selectedTableObj = tables.find((t) => t.number === selectedTable);
  const isSelectedTableOccupied = selectedTableObj?.status === 'ocupada';
  const effectivePhone =
    inspectedOrder?.customerPhone ||
    inspectedOrder?.deliveryPhone ||
    (orderMode === 'dine-in'
      ? selectedTableObj?.customerPhone || tableCustomerPhone
      : '') ||
    '';

  const activeOrderItemTotalUnits = inspectedOrder
    ? getOrderLinesCount(inspectedOrder.items)
    : 0;

  const activeOrderStatuses: OrderStatus[] =
    inspectedOrder?.mode === 'delivery'
      ? ['Preparando', 'En camino', 'Entregado']
      : ['Preparando', 'Listo', 'Entregado'];

  const roleBadgeLabel = activeStaffSession
    ? activeStaffSession.isAdmin
      ? 'Admin'
      : activeStaffSession.role
    : userRole === 'admin'
    ? 'Admin'
    : userRole === 'mozo'
    ? 'Mozo'
    : null;

  const headerContextBadge =
    orderMode === 'dine-in'
      ? `Mesa ${selectedTable}`
      : orderMode === 'takeaway'
      ? linkedTakeawayOrder
        ? linkedTakeawayOrder.code
        : 'Para Llevar'
      : linkedDeliveryOrder
      ? linkedDeliveryOrder.code
      : 'Delivery';

  return (
    <div className="flex flex-col h-full bg-[var(--bg-surface)] text-[var(--ink-primary)]">
      {/* Top Header */}
      <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between gap-2 shrink-0 bg-[var(--bg-surface)]">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h2 className="text-xs font-bold text-[var(--ink-primary)]">
              Comanda en vivo
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-[10px] font-bold text-[var(--accent-primary)] tabular-nums">
              {headerContextBadge}
            </span>
            {roleBadgeLabel && (
              <span className="px-2 py-0.5 rounded-md bg-[var(--ops-surface)] text-[var(--accent-gold)] text-[10px] font-bold">
                {roleBadgeLabel}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mt-0.5 truncate">
            Como en Casa Tupiza
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar comanda"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--ink-primary)] hover:bg-[var(--bg-inset)] active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Mode Switch & Table / Takeaway / Delivery Selector */}
      <div className="px-4 py-3 border-b border-[var(--border-subtle)] space-y-2.5 bg-[var(--bg-canvas)] shrink-0">
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => onChangeOrderMode('dine-in')}
            className={`min-h-[38px] px-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] cursor-pointer whitespace-nowrap ${
              orderMode === 'dine-in'
                ? 'bg-[var(--ink-primary)] text-[var(--bg-canvas)]'
                : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5 shrink-0" />
            <span>Comer aquí</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeOrderMode('takeaway')}
            className={`min-h-[38px] px-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] cursor-pointer whitespace-nowrap ${
              orderMode === 'takeaway'
                ? 'bg-[var(--ink-primary)] text-[var(--bg-canvas)]'
                : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
            <span>Para llevar</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeOrderMode('delivery')}
            className={`min-h-[38px] px-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] cursor-pointer whitespace-nowrap ${
              orderMode === 'delivery'
                ? 'bg-[var(--ink-primary)] text-[var(--bg-canvas)]'
                : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
            }`}
          >
            <Bike className="w-3.5 h-3.5 shrink-0" />
            <span>Delivery</span>
          </button>
        </div>

        {orderMode === 'dine-in' ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <label
                htmlFor="live-cart-table-select"
                className="block text-[11px] font-semibold text-[var(--ink-muted)] mb-1"
              >
                Mesa seleccionada
              </label>
              <select
                id="live-cart-table-select"
                value={selectedTable}
                onChange={(e) => onSelectTable(Number(e.target.value))}
                className="w-full h-9 px-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--ink-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] cursor-pointer"
              >
                {tables.map((t) => {
                  const tblOrder = isStaffRole
                    ? getActiveOrderForTable(kitchenOrders, tables, t.number)
                    : undefined;
                  const suffix = tblOrder
                    ? `Ocupada ${formatBs(tblOrder.total)}`
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

            <div className="pt-5 shrink-0">
              <button
                type="button"
                onClick={onOpenTableQr}
                title={`Ver QR de Mesa ${selectedTable}`}
                className="h-9 px-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-xs font-bold inline-flex items-center gap-1 hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>QR</span>
              </button>
            </div>
          </div>
        ) : orderMode === 'takeaway' ? (
          <div className="space-y-2">
            {(isStaffRole || activeTakeawayOrders.length > 0) && (
              <div>
                <label
                  htmlFor="live-cart-takeaway-select"
                  className="block text-[11px] font-semibold text-[var(--ink-muted)] mb-1"
                >
                  Pedido Para llevar activo
                </label>
                <select
                  id="live-cart-takeaway-select"
                  value={linkedTakeawayOrder?.id ?? ''}
                  onChange={(e) =>
                    onSelectTakeawayOrder(e.target.value || null)
                  }
                  className="w-full h-9 px-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--ink-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] cursor-pointer"
                >
                  <option value="">
                    {activeTakeawayOrders.length === 0
                      ? 'Nuevo pedido Para llevar'
                      : 'Nuevo pedido Para llevar (sin vincular)'}
                  </option>
                  {activeTakeawayOrders.map((tkOrd) => (
                    <option key={tkOrd.id} value={tkOrd.id}>
                      {getTakeawayCustomerName(tkOrd)} · {tkOrd.code} (
                      {formatBs(tkOrd.total)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {linkedTakeawayOrder ? (
              <div className="rounded-xl bg-[var(--ops-surface)] text-[var(--bg-canvas)] border border-[var(--ops-accent)]/50 p-2.5 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <ShoppingBag className="w-3 h-3 text-[var(--ops-accent)] shrink-0" />
                      <span className="font-mono text-[10px] font-bold text-[var(--accent-gold)]">
                        {linkedTakeawayOrder.code}
                      </span>
                      <span className="text-[10px] text-[var(--bg-canvas)]/65 tabular-nums">
                        · {linkedTakeawayOrder.createdAt}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[var(--bg-canvas)] truncate mt-0.5">
                      Para llevar · {getTakeawayCustomerName(linkedTakeawayOrder)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectTakeawayOrder(null)}
                    aria-label="Desvincular pedido Para llevar"
                    title="Desvincular pedido Para llevar"
                    className="w-7 h-7 rounded-lg bg-[var(--ops-elevated)] text-[var(--accent-gold)] hover:bg-[var(--ops-accent)] hover:text-white flex items-center justify-center transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ops-accent)] cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {linkedTakeawayOrder.pickupNote && (
                  <div className="text-[11px] text-[var(--bg-canvas)]/80 pt-1 border-t border-[var(--ops-border)]">
                    <p className="flex items-center gap-1.5 truncate">
                      <Clock className="w-3 h-3 text-[var(--accent-gold)] shrink-0" />
                      <span className="truncate">
                        {linkedTakeawayOrder.pickupNote}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl bg-[var(--ops-surface)] text-[var(--bg-canvas)] border border-[var(--ops-border)] p-2.5 space-y-2">
                <div>
                  <label
                    htmlFor="live-cart-takeaway-name"
                    className="flex items-center justify-between text-[11px] font-semibold text-[var(--accent-gold)] mb-1"
                  >
                    <span>Nombre del cliente *</span>
                    <span className="text-[10px] text-[var(--ops-accent)] font-bold">
                      Obligatorio
                    </span>
                  </label>
                  <input
                    id="live-cart-takeaway-name"
                    type="text"
                    required
                    maxLength={80}
                    value={takeawayInfo.customerName}
                    onChange={(e) => {
                      setTakeawayNameAttempted(false);
                      onChangeTakeawayInfo({
                        ...takeawayInfo,
                        customerName: e.target.value,
                      });
                    }}
                    placeholder="Ej. Carlos"
                    className={`w-full h-9 px-2.5 rounded-xl bg-[var(--ops-canvas)] border text-xs font-semibold text-[var(--bg-canvas)] placeholder:text-[var(--bg-canvas)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ops-accent)] ${
                      takeawayNameAttempted && !takeawayInfo.customerName.trim()
                        ? 'border-[var(--ops-accent)]'
                        : 'border-[var(--ops-border)]'
                    }`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="live-cart-takeaway-pickup"
                    className="block text-[11px] font-semibold text-[var(--bg-canvas)]/70 mb-1"
                  >
                    Teléfono / Hora de retiro (opcional)
                  </label>
                  <input
                    id="live-cart-takeaway-pickup"
                    type="text"
                    maxLength={120}
                    value={takeawayInfo.pickupNote}
                    onChange={(e) =>
                      onChangeTakeawayInfo({
                        ...takeawayInfo,
                        pickupNote: e.target.value,
                      })
                    }
                    placeholder="Ej. Retira en 15 min · 71234567"
                    className="w-full h-9 px-2.5 rounded-xl bg-[var(--ops-canvas)] border border-[var(--ops-border)] text-xs font-medium text-[var(--bg-canvas)] placeholder:text-[var(--bg-canvas)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {(isStaffRole || activeDeliveryOrders.length > 0) && (
              <div>
                <label
                  htmlFor="live-cart-delivery-select"
                  className="block text-[11px] font-semibold text-[var(--ink-muted)] mb-1"
                >
                  Pedido Delivery activo
                </label>
                <select
                  id="live-cart-delivery-select"
                  value={linkedDeliveryOrder?.id ?? ''}
                  onChange={(e) =>
                    onSelectDeliveryOrder(e.target.value || null)
                  }
                  className="w-full h-9 px-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--ink-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] cursor-pointer"
                >
                  <option value="">
                    {activeDeliveryOrders.length === 0
                      ? 'Sin deliveries activos (nuevo pedido)'
                      : 'Nuevo pedido Delivery (sin vincular)'}
                  </option>
                  {activeDeliveryOrders.map((delOrd) => (
                    <option key={delOrd.id} value={delOrd.id}>
                      {delOrd.customerLabel} · {delOrd.code} (
                      {formatBs(delOrd.total)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {linkedDeliveryOrder ? (
              <div className="rounded-xl bg-[var(--ink-primary)] text-[var(--bg-canvas)] border border-[var(--border-subtle)] p-2.5 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px] font-bold text-[var(--accent-gold)]">
                        {linkedDeliveryOrder.code}
                      </span>
                      <span className="text-[10px] text-[var(--bg-canvas)]/65 tabular-nums">
                        · {linkedDeliveryOrder.createdAt}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[var(--bg-canvas)] truncate">
                      {linkedDeliveryOrder.customerLabel}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectDeliveryOrder(null)}
                    aria-label="Desvincular pedido Delivery"
                    title="Desvincular pedido Delivery"
                    className="w-7 h-7 rounded-lg bg-white/10 text-[var(--accent-gold)] hover:bg-[var(--ops-accent)] hover:text-white flex items-center justify-center transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {(linkedDeliveryOrder.deliveryPhone ||
                  linkedDeliveryOrder.deliveryAddress ||
                  linkedDeliveryOrder.notes) && (
                  <div className="space-y-0.5 text-[11px] text-[var(--bg-canvas)]/80 pt-1 border-t border-white/15">
                    {linkedDeliveryOrder.deliveryPhone && (
                      <p className="flex items-center gap-1.5 truncate">
                        <Phone className="w-3 h-3 text-[var(--accent-gold)] shrink-0" />
                        <span className="tabular-nums">
                          {linkedDeliveryOrder.deliveryPhone}
                        </span>
                      </p>
                    )}
                    {linkedDeliveryOrder.deliveryAddress && (
                      <p className="flex items-start gap-1.5 leading-snug">
                        <MapPin className="w-3 h-3 text-[var(--accent-gold)] shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          {linkedDeliveryOrder.deliveryAddress}
                        </span>
                      </p>
                    )}
                    {linkedDeliveryOrder.notes && (
                      <p className="text-[10px] text-[var(--accent-gold)]/90 truncate">
                        Ref: {linkedDeliveryOrder.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-[var(--ink-muted)]">
                    Entrega a domicilio
                  </p>
                  <p className="text-xs font-bold text-[var(--ink-primary)] truncate">
                    {deliveryInfo.address.trim()
                      ? deliveryInfo.address
                      : 'Completa dirección al continuar'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenDeliveryInfo}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-[11px] font-bold text-[var(--accent-primary)] hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] cursor-pointer shrink-0"
                >
                  Datos
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scrollable Body: Full Selected Order (Mesa, Para Llevar or Delivery) + Draft Cart */}
      <div className="flex-1 overflow-y-auto phone-scroll p-3.5 space-y-3 bg-[var(--bg-canvas)]">
        {(orderMode === 'dine-in' ||
          linkedTakeawayOrder ||
          linkedDeliveryOrder) && (
          <section className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-serif-display text-sm font-bold text-[var(--ink-primary)] truncate">
                  {orderMode === 'dine-in'
                    ? `Mesa ${selectedTable}`
                    : orderMode === 'takeaway' && linkedTakeawayOrder
                    ? getTakeawayCustomerName(linkedTakeawayOrder)
                    : linkedDeliveryOrder?.customerLabel}
                </span>
                {orderMode === 'dine-in' && (
                  <span className="text-[10px] font-semibold text-[var(--ink-muted)] tabular-nums shrink-0">
                    · Cap. {selectedTableObj?.capacity ?? 4}
                  </span>
                )}
              </div>

              {orderMode === 'dine-in' ? (
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                    isSelectedTableOccupied || activeTableOrder
                      ? 'bg-[var(--accent-primary)]/12 text-[var(--accent-primary)]'
                      : 'bg-[var(--status-ok)]/12 text-[var(--status-ok)]'
                  }`}
                >
                  {isSelectedTableOccupied || activeTableOrder
                    ? 'Ocupada'
                    : 'Libre'}
                </span>
              ) : orderMode === 'takeaway' ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[var(--accent-primary)]/12 text-[var(--accent-primary)] inline-flex items-center gap-1 shrink-0">
                  <ShoppingBag className="w-3 h-3" />
                  <span>Para llevar</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[var(--bg-inset)] text-[var(--ink-primary)] shrink-0">
                  Delivery
                </span>
              )}
            </div>

            {inspectedOrder ? (
              <div className="space-y-2.5">
                {/* Order Meta Row */}
                <div className="flex items-center justify-between gap-2 text-[11px] bg-[var(--bg-inset)] border border-[var(--border-subtle)] rounded-xl px-2.5 py-1.5">
                  <div className="min-w-0">
                    <span className="font-bold text-[var(--ink-primary)] tabular-nums">
                      {inspectedOrder.code}
                    </span>
                    <span className="text-[var(--ink-muted)] font-medium">
                      {' '}
                      · {inspectedOrder.createdAt}
                    </span>
                    {effectivePhone && (
                      <span className="block text-[10px] font-bold text-[var(--status-ok)] tabular-nums mt-0.5">
                        WhatsApp:{' '}
                        {isStaffRole
                          ? formatBoliviaDisplayPhone(effectivePhone)
                          : maskPhoneNumberForPrivacy(effectivePhone)}
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                      inspectedOrder.paid
                        ? 'bg-[var(--status-ok)]/12 text-[var(--status-ok)]'
                        : inspectedOrder.billRequested
                        ? 'bg-[var(--accent-gold)]/25 text-[var(--ink-primary)]'
                        : 'bg-[var(--accent-primary)]/12 text-[var(--accent-primary)]'
                    }`}
                  >
                    {inspectedOrder.paid
                      ? `Pagado (${inspectedOrder.paymentMethod})`
                      : inspectedOrder.billRequested
                      ? 'Por pagar'
                      : 'Pendiente'}
                  </span>
                </div>

                {/* Optional discreet WhatsApp prompt for customer without blocking */}
                {!effectivePhone &&
                  !isStaffRole &&
                  !inspectedOrder.paid &&
                  orderMode === 'dine-in' &&
                  onAttachPhone && (
                    <div className="rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] p-2.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <MessageCircle className="w-3.5 h-3.5 text-[var(--status-ok)] shrink-0" />
                          <span className="text-[11px] font-semibold text-[var(--ink-primary)] leading-tight truncate">
                            Añade tu WhatsApp para enviarte el recibo digital
                          </span>
                        </div>
                        {!showInlinePhoneForm && (
                          <button
                            type="button"
                            onClick={() => setShowInlinePhoneForm(true)}
                            className="px-2.5 py-1 rounded-lg bg-[var(--accent-primary)] text-[var(--bg-canvas)] text-[10px] font-bold active:scale-[0.97] transition-transform cursor-pointer shrink-0"
                          >
                            Añadir
                          </button>
                        )}
                      </div>
                      {showInlinePhoneForm && (
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (!inlinePhone.trim() || isSavingInlinePhone) return;
                            setIsSavingInlinePhone(true);
                            const ok = await onAttachPhone(inlinePhone);
                            setIsSavingInlinePhone(false);
                            if (ok) {
                              setShowInlinePhoneForm(false);
                              setInlinePhone('');
                            }
                          }}
                          className="flex items-center gap-1.5 pt-1"
                        >
                          <span className="h-8 px-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] font-bold text-[var(--ink-muted)] flex items-center tabular-nums shrink-0">
                            +591
                          </span>
                          <input
                            type="tel"
                            maxLength={10}
                            value={inlinePhone}
                            onChange={(e) =>
                              setInlinePhone(e.target.value.replace(/\D/g, ''))
                            }
                            placeholder="71234567"
                            autoFocus
                            className="flex-1 h-8 px-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)]/50 focus:outline-none focus:border-[var(--accent-primary)] tabular-nums"
                          />
                          <button
                            type="submit"
                            disabled={isSavingInlinePhone || inlinePhone.length < 8}
                            className="h-8 px-2.5 rounded-lg bg-[var(--accent-primary)] text-[var(--bg-canvas)] text-[11px] font-bold disabled:opacity-40 cursor-pointer active:scale-95 transition-transform shrink-0"
                          >
                            {isSavingInlinePhone ? '...' : 'Guardar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowInlinePhoneForm(false)}
                            className="h-8 px-2 text-xs text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer"
                          >
                            ✕
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                {/* Waiter Call / Bill Request Alert */}
                {inspectedOrder.waiterRequested && (
                  <div className="rounded-xl bg-[var(--accent-primary)] text-[var(--bg-canvas)] px-2.5 py-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold inline-flex items-center gap-1.5">
                      <BellRing className="w-3.5 h-3.5 text-[var(--accent-gold)] shrink-0" />
                      <span>
                        {isStaffRole
                          ? inspectedOrder.billRequested
                            ? '¡Mesa solicita la cuenta!'
                            : '¡Mesa solicita al mesero!'
                          : inspectedOrder.billRequested
                          ? 'Cuenta solicitada a Caja/Mozo'
                          : 'Mesero notificado'}
                      </span>
                    </span>
                    {isStaffRole && (
                      <button
                        type="button"
                        onClick={() => onDismissWaiterCall(inspectedOrder.id)}
                        className="px-2 py-0.5 rounded-lg bg-[var(--bg-surface)] text-[var(--ink-primary)] text-[10px] font-bold active:scale-[0.97] transition-transform duration-150 ease-[var(--ease-out)] cursor-pointer shrink-0"
                      >
                        Atendido
                      </button>
                    )}
                  </div>
                )}

                {/* Complete Itemized Order List */}
                <div className="border-y border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
                  {inspectedOrder.items.map((it, idx) => (
                    <div
                      key={`${inspectedOrder.id}-${it.name}-${it.sizeLabel}-${idx}`}
                      className="py-2 flex items-start justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[var(--ink-primary)] leading-snug">
                          {it.quantity}x {it.name}{' '}
                          <span className="text-[var(--ink-muted)] font-medium">
                            ({it.sizeLabel})
                          </span>
                        </p>
                        {it.extrasSummary && (
                          <p className="text-[10px] text-[var(--ink-muted)] leading-snug">
                            {it.extrasSummary}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isStaffRole &&
                          (canTakeOrders || canUpdateKitchen) &&
                          !inspectedOrder.paid && (
                          <div className="inline-flex items-center gap-0.5 rounded-lg bg-[var(--bg-inset)] border border-[var(--border-subtle)] p-0.5">
                            <button
                              type="button"
                              disabled={
                                activeOrderItemTotalUnits <= 1 &&
                                it.quantity <= 1
                              }
                              onClick={() =>
                                onUpdateOrderItemQty(inspectedOrder.id, idx, -1)
                              }
                              aria-label={`Restar ${it.name}`}
                              className="w-5 h-5 rounded flex items-center justify-center text-[var(--ink-primary)] hover:bg-[var(--bg-surface)] disabled:opacity-35 active:scale-[0.95] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer disabled:cursor-not-allowed"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateOrderItemQty(inspectedOrder.id, idx, 1)
                              }
                              aria-label={`Sumar ${it.name}`}
                              className="w-5 h-5 rounded flex items-center justify-center bg-[var(--accent-gold)] text-[var(--ink-primary)] hover:opacity-90 active:scale-[0.95] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <span className="font-bold text-[var(--accent-primary)] tabular-nums">
                          {formatBs(it.price * it.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {inspectedOrder.notes && (
                  <p className="text-[11px] text-[var(--ink-muted)] bg-[var(--bg-inset)] px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)]">
                    <span className="font-bold text-[var(--ink-primary)]">Notas: </span>
                    {inspectedOrder.notes}
                  </p>
                )}

                <div className="flex items-center justify-between px-1 pt-0.5">
                  <span className="text-xs font-bold text-[var(--ink-primary)]">
                    Total pedido
                  </span>
                  <span className="text-sm font-bold text-[var(--accent-primary)] tabular-nums">
                    {formatBs(inspectedOrder.total)}
                  </span>
                </div>

                {!isStaffRole &&
                  (inspectedOrder.mode === 'takeaway' ||
                    inspectedOrder.mode === 'delivery') &&
                  inspectedOrder.confirmationCode && (
                    <div className="rounded-xl bg-[var(--ops-surface)] text-[var(--bg-canvas)] border border-[var(--ops-border)] px-3 py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-[var(--accent-gold)] flex items-center gap-1">
                          <KeyRound className="w-3 h-3 text-[var(--accent-gold)] shrink-0" />
                          <span>Código de entrega</span>
                        </p>
                        <p className="text-[10px] text-[var(--bg-canvas)]/75 truncate">
                          {inspectedOrder.status === 'Entregado' ||
                          inspectedOrder.paid
                            ? 'Entrega confirmada'
                            : 'Muéstralo al recibir tu pedido'}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-[var(--ops-canvas)] border border-[var(--accent-gold)]/55 font-mono text-sm font-bold tracking-widest text-[var(--accent-gold)] tabular-nums shrink-0">
                        {inspectedOrder.confirmationCode}
                      </span>
                    </div>
                  )}

                {/* Role-Based Operations */}
                {isStaffRole ? (
                  <div className="space-y-2 pt-1.5 border-t border-[var(--border-subtle)]">
                    {requiresDeliveryPin(inspectedOrder) && (
                      <p className="text-[10px] font-semibold text-[var(--accent-primary)] bg-[var(--bg-inset)] border border-[var(--border-subtle)] rounded-lg px-2 py-1 flex items-center gap-1.5">
                        <KeyRound className="w-3 h-3 shrink-0" />
                        <span>
                          Requiere código de 4 dígitos del cliente para marcar Entregado
                        </span>
                      </p>
                    )}

                    {/* Status Switcher */}
                    {canUpdateKitchen && (
                      <div className="grid grid-cols-3 gap-1.5">
                        {activeOrderStatuses.map((st) => {
                          const active = inspectedOrder.status === st;
                          const needsPin =
                            st === 'Entregado' &&
                            requiresDeliveryPin(inspectedOrder);
                          const label =
                            st === 'Entregado'
                              ? inspectedOrder.mode === 'dine-in'
                                ? 'Servido'
                                : 'Entregado'
                              : st;
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => {
                                if (needsPin) {
                                  setVerifyingOrder(inspectedOrder);
                                } else {
                                  onUpdateOrderStatus(inspectedOrder.id, st);
                                }
                              }}
                              className={`min-h-[40px] px-1.5 py-1.5 rounded-xl text-[11px] font-bold border transition-[transform,background-color,border-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] cursor-pointer inline-flex items-center justify-center gap-1 ${
                                active
                                  ? 'bg-[var(--accent-gold)] border-[var(--accent-primary)] text-[var(--ink-primary)]'
                                  : 'bg-[var(--bg-inset)] border-[var(--border-subtle)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
                              }`}
                            >
                              {needsPin && (
                                <KeyRound className="w-3 h-3 text-[var(--ops-accent)] shrink-0" />
                              )}
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Staff Action Grid */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {canCollectBilling && !inspectedOrder.paid && (
                        <button
                          type="button"
                          onClick={() => setCollectingOrder(inspectedOrder)}
                          className="col-span-2 min-h-[44px] px-3 py-2 rounded-xl bg-[var(--status-ok)] text-[var(--bg-canvas)] text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-95 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] cursor-pointer tabular-nums"
                        >
                          <Banknote className="w-4 h-4" />
                          <span>Cobrar {formatBs(inspectedOrder.total)}</span>
                        </button>
                      )}

                      <a
                        href={buildWhatsAppShareUrl(
                          inspectedOrder,
                          effectivePhone
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="col-span-2 min-h-[40px] px-2.5 py-1.5 rounded-xl bg-[var(--status-ok)] text-[var(--bg-surface)] text-xs font-bold flex items-center justify-center gap-1.5 hover:brightness-105 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink-primary)]"
                      >
                        <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Enviar recibo por WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => setTicketOrder(inspectedOrder)}
                        className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-[var(--accent-gold)] text-[var(--ink-primary)] text-xs font-bold flex items-center justify-center gap-1 hover:opacity-90 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Ticket / WA</span>
                      </button>

                      <button
                        type="button"
                        onClick={onGoMenu}
                        className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-xs font-bold flex items-center justify-center gap-1 hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                        <span>Carta</span>
                      </button>

                      {canCollectBilling &&
                        orderMode === 'dine-in' &&
                        isSelectedTableOccupied && (
                          <button
                            type="button"
                            onClick={() => onFreeTable(selectedTable)}
                            className="col-span-2 min-h-[40px] px-2.5 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--ink-primary)] text-[var(--ink-primary)] text-xs font-bold flex items-center justify-center gap-1 hover:bg-[var(--bg-inset)] active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] cursor-pointer"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Liberar Mesa {selectedTable}</span>
                          </button>
                        )}
                    </div>

                    {/* Admin-Only Cancel / Delete Order */}
                    {isAdminRole && (
                      <div className="pt-1">
                        {confirmDeleteId === inspectedOrder.id ? (
                          <div className="rounded-xl bg-[var(--status-danger)]/10 border border-[var(--status-danger)]/40 p-2 flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold text-[var(--status-danger)]">
                              ¿Anular {inspectedOrder.code}?
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteOrder(inspectedOrder);
                                  setConfirmDeleteId(null);
                                }}
                                className="px-2 py-1 rounded-lg bg-[var(--status-danger)] text-white text-[10px] font-bold active:scale-[0.97] transition-transform duration-150 ease-[var(--ease-out)] cursor-pointer"
                              >
                                Anular
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-[10px] font-bold active:scale-[0.97] transition-transform duration-150 ease-[var(--ease-out)] cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(inspectedOrder.id)}
                            className="w-full py-1 text-[11px] font-bold text-[var(--status-danger)] hover:underline flex items-center justify-center gap-1 cursor-pointer"
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
                  <div className="space-y-1.5 pt-1.5 border-t border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[var(--ink-primary)]">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                        Estado: {inspectedOrder.status}
                      </span>
                      <button
                        type="button"
                        onClick={onOpenTableOrder}
                        className="text-[var(--accent-primary)] underline font-bold cursor-pointer"
                      >
                        Ver detalle
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {orderMode === 'dine-in' && (
                        <button
                          type="button"
                          onClick={() => onCallWaiter(inspectedOrder.id)}
                          className="min-h-[34px] px-2 py-1 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-[11px] font-bold flex items-center justify-center gap-1 hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
                        >
                          <Bell className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                          <span>
                            {inspectedOrder.waiterRequested
                              ? 'En camino'
                              : 'Llamar mozo'}
                          </span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setTicketOrder(inspectedOrder)}
                        className={`${
                          orderMode !== 'dine-in' ? 'col-span-2' : ''
                        } min-h-[34px] px-2 py-1 rounded-xl bg-[var(--accent-gold)] text-[var(--ink-primary)] text-[11px] font-bold flex items-center justify-center gap-1 hover:opacity-90 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer`}
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Ticket / WA</span>
                      </button>

                      {!inspectedOrder.paid && orderMode === 'dine-in' && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              onRequestBill
                                ? onRequestBill(inspectedOrder.id)
                                : onCallWaiter(inspectedOrder.id)
                            }
                            className="col-span-2 min-h-[36px] px-3 py-1.5 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-xs font-bold flex items-center justify-center gap-1.5 hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
                          >
                            <ReceiptText className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                            <span>
                              {inspectedOrder.billRequested
                                ? 'Cuenta solicitada'
                                : 'Solicitar cuenta'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={onPayAtTable}
                            className="col-span-2 min-h-[36px] px-3 py-1.5 rounded-xl bg-[var(--accent-primary)] text-[var(--bg-canvas)] text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-95 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer tabular-nums"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>
                              Pagar en mesa · {formatBs(inspectedOrder.total)}
                            </span>
                          </button>
                        </>
                      )}

                      {!inspectedOrder.paid && orderMode === 'takeaway' && (
                        <button
                          type="button"
                          onClick={onPayTakeawayOrder}
                          className="col-span-2 min-h-[36px] px-3 py-1.5 rounded-xl bg-[var(--accent-primary)] text-[var(--bg-canvas)] text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-95 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer tabular-nums"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>
                            Pagar pedido · {formatBs(inspectedOrder.total)}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : isSelectedTableOccupied && !isStaffRole ? (
              <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
                Mesa {selectedTable} está ocupada actualmente. Elige una mesa libre en el selector superior o escanea el QR de tu mesa.
              </p>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--ink-muted)]">
                  <span>Sin pedido activo en Mesa {selectedTable}.</span>
                  {isStaffRole &&
                    canCollectBilling &&
                    isSelectedTableOccupied && (
                      <button
                        type="button"
                        onClick={() => onFreeTable(selectedTable)}
                        className="px-2 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--ink-primary)] text-[var(--ink-primary)] text-[10px] font-bold inline-flex items-center gap-1 active:scale-[0.97] transition-transform duration-150 ease-[var(--ease-out)] cursor-pointer shrink-0"
                      >
                        <Unlock className="w-3 h-3" />
                        <span>Liberar</span>
                      </button>
                    )}
                </div>
                {effectivePhone && (
                  <p className="text-[10px] font-bold text-[var(--status-ok)] tabular-nums">
                    WhatsApp registrado: {formatBoliviaDisplayPhone(effectivePhone)}
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {/* Draft Cart Items (New / Additional dishes to add to Table, Takeaway or Delivery) */}
        {/* Draft Cart Items (New / Additional dishes to add to Table, Takeaway or Delivery) - Shown only when cart has items */}
        {cart.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] font-bold text-[var(--ink-muted)]">
                {inspectedOrder && !inspectedOrder.paid
                  ? orderMode === 'dine-in'
                    ? `Agregar platos a Mesa ${selectedTable}`
                    : `Agregar platos a ${inspectedOrder.code}`
                  : 'Borrador de pedido'}
              </h3>
              {cartCount > 0 && (
                <span className="text-[11px] font-bold text-[var(--accent-primary)] tabular-nums">
                  {cartCount} {cartCount === 1 ? 'ítem' : 'ítems'}
                </span>
              )}
            </div>

            {cart.map((item) => {
              const sourceMenu = menuItems.find(
                (m) => m.id === item.menuItemId
              );
              const lineTotal = getCartLineTotal(item);

              return (
                <article
                  key={item.cartItemId}
                  className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-[var(--ink-primary)] leading-snug">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-[var(--ink-muted)] tabular-nums">
                        {item.sizeLabel} · {formatBs(item.unitPrice)} c/u
                      </p>
                      {item.extras.length > 0 && (
                        <p className="text-[10px] text-[var(--ink-muted)] mt-0.5">
                          +{item.extras.map((e) => e.label).join(', ')}
                        </p>
                      )}
                      {item.customSummary && (
                        <p className="text-[10px] text-[var(--ink-muted)] mt-0.5">
                          {item.customSummary}
                        </p>
                      )}
                    </div>

                    <span className="font-bold text-xs text-[var(--accent-primary)] tabular-nums shrink-0">
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
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-[transform,background-color,border-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer tabular-nums ${
                              active
                                ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--bg-canvas)]'
                                : 'bg-[var(--bg-inset)] border-[var(--border-subtle)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
                            }`}
                          >
                            {sz.label} Bs {sz.price}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1.5 border-t border-[var(--border-subtle)]">
                    <div className="inline-flex items-center gap-1 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] p-0.5">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.cartItemId, -1)}
                        aria-label={`Disminuir ${item.name}`}
                        className="w-7 h-7 rounded-lg bg-[var(--bg-surface)] text-[var(--ink-primary)] flex items-center justify-center hover:bg-[var(--bg-canvas)] active:scale-[0.95] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
                      >
                        <Minus className="w-3 h-3" strokeWidth={2.5} />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-[var(--ink-primary)] tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.cartItemId, 1)}
                        aria-label={`Aumentar ${item.name}`}
                        className="w-7 h-7 rounded-lg bg-[var(--accent-gold)] text-[var(--ink-primary)] flex items-center justify-center hover:opacity-90 active:scale-[0.95] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
                      >
                        <Plus className="w-3 h-3" strokeWidth={2.5} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.cartItemId)}
                      aria-label={`Quitar ${item.name}`}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--ink-muted)] hover:text-[var(--status-danger)] hover:bg-[var(--status-danger)]/10 active:scale-[0.95] transition-[transform,color,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Totals & Checkout Actions Footer */}
      <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3 shrink-0">
        {cart.length > 0 && (
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-[var(--ink-muted)] font-semibold">
              <span>
                Borrador ({cartCount} {cartCount === 1 ? 'ítem' : 'ítems'})
              </span>
              <span className="text-[var(--ink-primary)] tabular-nums">
                {formatBsDecimal(total)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[var(--ink-muted)] font-semibold">
              <span>Envío / Servicio</span>
              <span className="text-[var(--status-ok)] font-bold tabular-nums">
                Bs 0.00 (Gratis)
              </span>
            </div>
            <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
              <span className="text-sm font-bold text-[var(--ink-primary)]">
                Total a enviar
              </span>
              <span className="text-lg font-bold text-[var(--accent-primary)] tabular-nums">
                {formatBsDecimal(total)}
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          disabled={cart.length === 0}
          onClick={() => {
            if (
              orderMode === 'takeaway' &&
              !linkedTakeawayOrder &&
              !takeawayInfo.customerName.trim()
            ) {
              setTakeawayNameAttempted(true);
            }
            onProceedOrder();
          }}
          className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl bg-[var(--accent-primary)] text-[var(--bg-canvas)] font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-45 disabled:cursor-not-allowed active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] cursor-pointer tabular-nums"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            {orderMode === 'dine-in'
              ? activeTableOrder && !activeTableOrder.paid
                ? `Agregar a Mesa ${selectedTable} · ${formatBs(total)}`
                : `Enviar a Cocina · Mesa ${selectedTable}`
              : orderMode === 'takeaway'
              ? linkedTakeawayOrder && !linkedTakeawayOrder.paid
                ? `Agregar a ${linkedTakeawayOrder.code} · ${formatBs(total)}`
                : `Enviar Para llevar · ${formatBs(total)}`
              : isStaffRole && linkedDeliveryOrder && !linkedDeliveryOrder.paid
              ? `Guardar en ${linkedDeliveryOrder.code} · ${formatBs(total)}`
              : `Continuar a Delivery · ${formatBs(total)}`}
          </span>
        </button>

        {cart.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="w-full py-1 text-[11px] font-semibold text-[var(--ink-muted)] hover:text-[var(--status-danger)] transition-colors duration-150 ease-[var(--ease-out)] cursor-pointer"
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

      {/* Ticket / WhatsApp Modal */}
      <TicketModal order={ticketOrder} onClose={() => setTicketOrder(null)} />

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
