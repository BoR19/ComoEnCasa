import React, { useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Bike,
  CheckCircle2,
  LogIn,
  LogOut,
  Minus,
  Pencil,
  Plus,
  ShoppingBag,
  Trash2,
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
  TakeawayInfo,
} from '../../types/app';
import {
  formatBs,
  getCartLineTotal,
  getCartTotal,
  getTakeawayCustomerName,
} from '../../utils/appHelpers';
import { AppUserRole } from '../LiveCartPanel';
import { OrdersBoard } from '../OrdersBoard';
import { MobileHeader } from '../ShellComponents';

interface CartScreenProps {
  userRole: AppUserRole;
  firebaseUser: User | null;
  isStaff: boolean;
  cart: CartItem[];
  cartCount: number;
  menuItems: MenuItem[];
  kitchenOrders: KitchenOrder[];
  tables: TableItem[];
  orderMode: OrderMode;
  selectedTable: number;
  takeawayInfo: TakeawayInfo;
  linkedTakeawayOrder?: KitchenOrder;
  linkedTakeawayOrderId: string | null;
  linkedDeliveryOrderId: string | null;
  onBack: () => void;
  onChangeOrderMode: (mode: OrderMode) => void;
  onChangeTakeawayInfo: (info: TakeawayInfo) => void;
  onEditTable: () => void;
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onChangeItemSize: (cartItemId: string, sizeId: string) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  onProceedOrder: () => void;
  onGoMenu: () => void;
  onOpenComandaDrawer: () => void;
  onLoadOrderToLivePanel: (
    order: KitchenOrder,
    options?: { openDrawerOnCompact?: boolean; goToMenu?: boolean }
  ) => void;
  onUpdateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    verificationCode?: string
  ) => void;
  onCollectOrderPayment: (orderId: string, method: PaymentMethod) => void;
  onDismissWaiterCall: (orderId: string) => void;
  onFreeTable: (tableNumber: number) => void;
  onCreatePosOrder: (payload: {
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
  onCallWaiter: (orderId: string) => void;
  onPayTableOrder: (order: KitchenOrder) => void;
  onGoogleSignIn: () => void;
  onMozoLogout: () => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({
  userRole,
  firebaseUser,
  isStaff,
  cart,
  cartCount,
  menuItems,
  kitchenOrders,
  tables,
  orderMode,
  selectedTable,
  takeawayInfo,
  linkedTakeawayOrder,
  linkedTakeawayOrderId,
  linkedDeliveryOrderId,
  onBack,
  onChangeOrderMode,
  onChangeTakeawayInfo,
  onEditTable,
  onUpdateQuantity,
  onChangeItemSize,
  onRemoveItem,
  onClearCart,
  onProceedOrder,
  onGoMenu,
  onOpenComandaDrawer,
  onLoadOrderToLivePanel,
  onUpdateOrderStatus,
  onCollectOrderPayment,
  onDismissWaiterCall,
  onFreeTable,
  onCreatePosOrder,
  onCallWaiter,
  onPayTableOrder,
  onGoogleSignIn,
  onMozoLogout,
}) => {
  const isStaffSession = userRole === 'admin' || userRole === 'mozo';
  const [openNewOrderSignal, setOpenNewOrderSignal] = useState(0);
  const [takeawayNameError, setTakeawayNameError] = useState(false);

  const subtotal = useMemo(() => getCartTotal(cart), [cart]);

  const handleProceedClick = () => {
    if (
      orderMode === 'takeaway' &&
      !linkedTakeawayOrder &&
      !takeawayInfo.customerName.trim()
    ) {
      setTakeawayNameError(true);
    }
    onProceedOrder();
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-canvas)] min-h-0">
      <MobileHeader
        title={userRole === 'mozo' ? 'Comandas — Mozo' : 'Comandas'}
        onBack={onBack}
        rightSlot={
          <div className="flex items-center gap-1">
            {isStaffSession && (
              <button
                type="button"
                onClick={() => setOpenNewOrderSignal((n) => n + 1)}
                aria-label="Nueva comanda"
                title="Nueva Comanda"
                className="min-h-[38px] px-2.5 rounded-xl bg-[var(--accent-gold)] text-[var(--ink-primary)] text-xs font-bold inline-flex items-center gap-1 hover:brightness-105 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
              className="xl:hidden relative min-w-[40px] min-h-[40px] px-2 flex items-center justify-center rounded-xl bg-white/10 text-[var(--accent-gold)] hover:bg-white/15 active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="ml-1 text-[10px] font-bold text-[var(--bg-surface)] tabular-nums">
                  {cartCount}
                </span>
              )}
            </button>
            {userRole === 'mozo' && (
              <button
                type="button"
                onClick={onMozoLogout}
                aria-label="Cerrar sesión de mozo"
                title="Cerrar sesión Mozo"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-[var(--accent-gold)] hover:bg-white/10 active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto phone-scroll">
        <div className="max-w-6xl mx-auto w-full px-4 lg:px-8 pt-4 lg:pt-6 pb-24 xl:pb-8 space-y-5">
          {/* Mozo Google Sync Status */}
          {userRole === 'mozo' && (!firebaseUser || !isStaff) && (
            <div className="rounded-2xl bg-[var(--ops-surface)] text-[var(--bg-canvas)] border border-[var(--accent-gold)]/50 p-3.5 flex flex-wrap items-center justify-between gap-2.5 shadow-xs">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[var(--accent-gold)]">
                  {firebaseUser
                    ? `Cuenta (${firebaseUser.email}) sin permiso de personal`
                    : 'Conecta una cuenta Google autorizada para sincronizar en vivo'}
                </p>
                <p className="text-xs text-white/75 truncate">
                  {firebaseUser
                    ? 'Pide al Administrador autorizar este correo en Panel Admin.'
                    : 'Sincroniza mesas y pedidos con Cocina en tiempo real.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onGoogleSignIn}
                className="px-3 py-1.5 rounded-xl bg-[var(--accent-gold)] text-[var(--ink-primary)] text-xs font-bold inline-flex items-center gap-1.5 hover:brightness-105 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{firebaseUser ? 'Cambiar cuenta' : 'Conectar Google'}</span>
              </button>
            </div>
          )}

          {/* Active Draft Comanda Card */}
          {cart.length > 0 && (
            <section
              aria-label="Borrador de comanda listo para enviar"
              className="rounded-3xl bg-[var(--ops-surface)] text-[var(--bg-canvas)] border border-[var(--accent-gold)]/45 p-4 sm:p-5 shadow-md space-y-3.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="font-mono font-bold text-[var(--accent-gold)] shrink-0">
                  Borrador — {cartCount} {cartCount === 1 ? 'ítem' : 'ítems'}
                </span>
                <div className="w-full sm:w-auto max-w-full min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => onChangeOrderMode('dine-in')}
                    className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 shrink-0 whitespace-nowrap active:scale-[0.97] transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] ${
                      orderMode === 'dine-in'
                        ? 'bg-[var(--accent-gold)] text-[var(--ink-primary)]'
                        : 'bg-[var(--ops-elevated)] text-white/80'
                    }`}
                  >
                    <UtensilsCrossed className="w-3 h-3" />
                    <span>Mesa {selectedTable}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeOrderMode('takeaway')}
                    className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 shrink-0 whitespace-nowrap active:scale-[0.97] transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] ${
                      orderMode === 'takeaway'
                        ? 'bg-[var(--accent-gold)] text-[var(--ink-primary)]'
                        : 'bg-[var(--ops-elevated)] text-white/80'
                    }`}
                  >
                    <ShoppingBag className="w-3 h-3" />
                    <span>Para Llevar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeOrderMode('delivery')}
                    className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 shrink-0 whitespace-nowrap active:scale-[0.97] transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] ${
                      orderMode === 'delivery'
                        ? 'bg-[var(--accent-gold)] text-[var(--ink-primary)]'
                        : 'bg-[var(--ops-elevated)] text-white/80'
                    }`}
                  >
                    <Bike className="w-3 h-3" />
                    <span>Delivery</span>
                  </button>
                  {orderMode === 'dine-in' && (
                    <button
                      type="button"
                      onClick={onEditTable}
                      className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[var(--ops-elevated)] text-[var(--accent-gold)] text-xs font-bold inline-flex items-center gap-1 shrink-0 whitespace-nowrap hover:bg-white/10 active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Cambiar</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-serif-display text-xl font-bold text-[var(--bg-surface)]">
                  {orderMode === 'dine-in'
                    ? `Nueva comanda — Mesa ${selectedTable}`
                    : orderMode === 'takeaway'
                    ? linkedTakeawayOrder
                      ? `Sumar a Para Llevar — ${getTakeawayCustomerName(linkedTakeawayOrder)}`
                      : 'Nueva comanda — Para Llevar'
                    : 'Nueva comanda — Delivery'}
                </h2>
                <span className="text-lg font-bold text-[var(--accent-gold)] tabular-nums shrink-0">
                  Bs. {subtotal.toFixed(2)}
                </span>
              </div>

              {orderMode === 'takeaway' && !linkedTakeawayOrder && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--accent-gold)]/90 mb-1">
                      Nombre del cliente *
                    </label>
                    <input
                      type="text"
                      value={takeawayInfo.customerName}
                      onChange={(e) => {
                        setTakeawayNameError(false);
                        onChangeTakeawayInfo({
                          ...takeawayInfo,
                          customerName: e.target.value,
                        });
                      }}
                      placeholder="Ej. Carlos"
                      className={`w-full h-9 px-3 rounded-xl bg-[var(--ops-canvas)] border text-xs font-semibold text-[var(--bg-surface)] placeholder:text-white/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ops-accent)] ${
                        takeawayNameError && !takeawayInfo.customerName.trim()
                          ? 'border-[var(--ops-accent)]'
                          : 'border-[var(--ops-border)]'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--accent-gold)]/90 mb-1">
                      Teléfono o hora de retiro (opcional)
                    </label>
                    <input
                      type="text"
                      value={takeawayInfo.pickupNote}
                      onChange={(e) =>
                        onChangeTakeawayInfo({
                          ...takeawayInfo,
                          pickupNote: e.target.value,
                        })
                      }
                      placeholder="Ej. Retira en 15 min · 724..."
                      className="w-full h-9 px-3 rounded-xl bg-[var(--ops-canvas)] border border-[var(--ops-border)] text-xs font-semibold text-[var(--bg-surface)] placeholder:text-white/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ops-accent)]"
                    />
                  </div>
                </div>
              )}

              <div className="border-t border-[var(--ops-border)] pt-3 space-y-2.5">
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
                        <p className="text-xs sm:text-[13px] font-bold text-[var(--bg-surface)] min-w-0 [overflow-wrap:break-word]">
                          {item.quantity}x {item.name}{' '}
                          <span className="text-[var(--accent-gold)]/85 font-semibold">
                            ({item.sizeLabel})
                          </span>
                        </p>
                        {item.extras.length > 0 && (
                          <p className="text-xs text-[var(--accent-gold)]/80">
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
                                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer tabular-nums ${
                                    active
                                      ? 'bg-[var(--accent-gold)] text-[var(--ink-primary)]'
                                      : 'bg-[var(--ops-elevated)] text-white/80'
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
                        <div className="inline-flex items-center gap-1 rounded-lg bg-[var(--ops-elevated)] p-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity(item.cartItemId, -1)
                            }
                            aria-label={`Disminuir ${item.name}`}
                            className="w-6 h-6 rounded flex items-center justify-center text-[var(--bg-surface)] hover:bg-[var(--ops-canvas)] active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.cartItemId, 1)}
                            aria-label={`Aumentar ${item.name}`}
                            className="w-6 h-6 rounded flex items-center justify-center bg-[var(--accent-gold)] text-[var(--ink-primary)] active:scale-[0.97] transition-transform duration-150 ease-[var(--ease-out)] cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-xs sm:text-[13px] font-bold text-[var(--bg-surface)] tabular-nums w-18 text-right">
                          Bs. {lineTotal.toFixed(2)}
                        </span>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.cartItemId)}
                          aria-label={`Eliminar ${item.name}`}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--accent-gold)]/70 hover:text-[var(--bg-surface)] hover:bg-[var(--ops-accent)]/35 active:scale-[0.97] transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-[var(--ops-border)] pt-3 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onClearCart}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[var(--ops-elevated)] text-white/85 text-xs font-bold hover:text-white active:scale-[0.97] transition-[transform,color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
                >
                  Vaciar borrador
                </button>

                <button
                  type="button"
                  onClick={handleProceedClick}
                  className="flex-1 sm:flex-none min-h-[44px] px-5 py-2 rounded-xl bg-[var(--status-ok)] text-[var(--bg-surface)] text-xs font-bold inline-flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] cursor-pointer tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {orderMode === 'dine-in'
                      ? `Enviar a cocina — Mesa ${selectedTable} (${formatBs(subtotal)})`
                      : orderMode === 'takeaway'
                      ? linkedTakeawayOrder
                        ? `Sumar a ${linkedTakeawayOrder.code} (${formatBs(subtotal)})`
                        : `Enviar Para Llevar (${formatBs(subtotal)})`
                      : `Continuar a Delivery (${formatBs(subtotal)})`}
                  </span>
                </button>
              </div>
            </section>
          )}

          {/* Unified Orders Board */}
          <OrdersBoard
            userRole={userRole}
            orders={kitchenOrders}
            tables={tables}
            menuItems={menuItems}
            orderMode={orderMode}
            selectedTable={selectedTable}
            linkedTakeawayOrderId={linkedTakeawayOrderId}
            linkedDeliveryOrderId={linkedDeliveryOrderId}
            showCartaShortcut
            openNewOrderSignal={openNewOrderSignal}
            onSelectOrderCard={(order) =>
              onLoadOrderToLivePanel(order, { openDrawerOnCompact: true })
            }
            onAddDishesToOrder={(order) =>
              onLoadOrderToLivePanel(order, { goToMenu: true })
            }
            onUpdateOrderStatus={onUpdateOrderStatus}
            onCollectOrderPayment={onCollectOrderPayment}
            onDismissWaiterCall={onDismissWaiterCall}
            onFreeTable={onFreeTable}
            onCreatePosOrder={onCreatePosOrder}
            onCallWaiter={onCallWaiter}
            onPayTableOrder={onPayTableOrder}
            onGoMenu={onGoMenu}
            onEditTable={onEditTable}
          />
        </div>
      </div>
    </div>
  );
};
