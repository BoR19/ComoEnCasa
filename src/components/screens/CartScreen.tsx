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
    <div className="flex-1 flex flex-col bg-[#FFF8E8] min-h-0">
      <MobileHeader
        title={userRole === 'mozo' ? 'Comandas · Mozo' : 'Comandas'}
        onBack={onBack}
        rightSlot={
          <div className="flex items-center gap-1">
            {isStaffSession && (
              <button
                type="button"
                onClick={() => setOpenNewOrderSignal((n) => n + 1)}
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
            {userRole === 'mozo' && (
              <button
                type="button"
                onClick={onMozoLogout}
                aria-label="Cerrar sesión de mozo"
                title="Cerrar sesión Mozo"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-[#D9A441] hover:bg-[#4A2C1A] cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto phone-scroll">
        <div className="max-w-6xl mx-auto w-full px-4 lg:px-8 pt-4 lg:pt-6 pb-8 space-y-5">
          {/* Mozo Google Sync Status (compact, non-duplicated) */}
          {userRole === 'mozo' && (!firebaseUser || !isStaff) && (
            <div className="rounded-2xl bg-[#3B1F0E] text-[#FFF8E8] border border-[#D9A441]/60 p-3 flex flex-wrap items-center justify-between gap-2.5 shadow-xs">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold text-[#D9A441]">
                  {firebaseUser
                    ? `Cuenta (${firebaseUser.email}) sin permiso de personal`
                    : 'Conecta una cuenta Google autorizada para sincronizar en vivo'}
                </p>
                <p className="text-[11px] text-[#FFF8E8]/80 truncate">
                  {firebaseUser
                    ? 'Pide al Administrador autorizar este correo en Panel Admin.'
                    : 'Sincroniza mesas y pedidos con Cocina en tiempo real.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onGoogleSignIn}
                className="px-3 py-1.5 rounded-xl bg-[#D9A441] text-[#2B1A0E] text-xs font-extrabold inline-flex items-center gap-1.5 hover:bg-[#E8C87A] cursor-pointer shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{firebaseUser ? 'Cambiar cuenta' : 'Conectar Google'}</span>
              </button>
            </div>
          )}

          {/* Active Draft Comanda Card (only when user has items queued to send) */}
          {cart.length > 0 && (
            <section
              aria-label="Borrador de comanda listo para enviar"
              className="rounded-3xl bg-[#1E1E1E] text-[#FFF8E8] border border-[#D9A441]/45 p-4 sm:p-5 shadow-md space-y-3.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-mono font-bold text-[#D9A441] tracking-wide">
                  BORRADOR · {cartCount} {cartCount === 1 ? 'ÍTEM' : 'ÍTEMS'}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onChangeOrderMode('dine-in')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer ${
                      orderMode === 'dine-in'
                        ? 'bg-[#D9A441] text-[#2B1A0E]'
                        : 'bg-[#2A2A2A] text-[#FFF8E8]/80'
                    }`}
                  >
                    <UtensilsCrossed className="w-3 h-3" />
                    <span>Mesa {selectedTable}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeOrderMode('takeaway')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer ${
                      orderMode === 'takeaway'
                        ? 'bg-[#D9A441] text-[#2B1A0E]'
                        : 'bg-[#2A2A2A] text-[#FFF8E8]/80'
                    }`}
                  >
                    <ShoppingBag className="w-3 h-3" />
                    <span>Para Llevar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeOrderMode('delivery')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer ${
                      orderMode === 'delivery'
                        ? 'bg-[#D9A441] text-[#2B1A0E]'
                        : 'bg-[#2A2A2A] text-[#FFF8E8]/80'
                    }`}
                  >
                    <Bike className="w-3 h-3" />
                    <span>Delivery</span>
                  </button>
                  {orderMode === 'dine-in' && (
                    <button
                      type="button"
                      onClick={onEditTable}
                      className="px-2.5 py-1 rounded-lg bg-[#2A2A2A] text-[#E8C87A] text-[11px] font-bold inline-flex items-center gap-1 hover:bg-[#353535] cursor-pointer"
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
                    : orderMode === 'takeaway'
                    ? linkedTakeawayOrder
                      ? `Sumar a Para Llevar · ${getTakeawayCustomerName(linkedTakeawayOrder)}`
                      : 'Nueva Comanda · Para Llevar'
                    : 'Nueva Comanda · Delivery'}
                </h2>
                <span className="text-lg font-extrabold text-[#D9A441] tabular-nums shrink-0">
                  Bs. {subtotal.toFixed(2)}
                </span>
              </div>

              {orderMode === 'takeaway' && !linkedTakeawayOrder && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#E8C87A]/80 mb-1">
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
                      className={`w-full h-9 px-3 rounded-xl bg-[#141414] border text-xs font-semibold text-[#FFF8E8] placeholder:text-[#FFF8E8]/35 focus:outline-none focus:border-[#E64833] ${
                        takeawayNameError && !takeawayInfo.customerName.trim()
                          ? 'border-[#E64833]'
                          : 'border-[#2E2E2E]'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#E8C87A]/80 mb-1">
                      Teléfono / Hora de retiro (opcional)
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
                      className="w-full h-9 px-3 rounded-xl bg-[#141414] border border-[#2E2E2E] text-xs font-semibold text-[#FFF8E8] placeholder:text-[#FFF8E8]/35 focus:outline-none focus:border-[#E64833]"
                    />
                  </div>
                </div>
              )}

              <div className="border-t border-[#2E2E2E] pt-3 space-y-2.5">
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
                                      : 'bg-[#2A2A2A] text-[#FFF8E8]/80'
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
                        <div className="inline-flex items-center gap-1 rounded-lg bg-[#2A2A2A] p-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity(item.cartItemId, -1)
                            }
                            aria-label={`Disminuir ${item.name}`}
                            className="w-6 h-6 rounded flex items-center justify-center text-[#FFF8E8] hover:bg-[#141414] cursor-pointer"
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

              <div className="border-t border-[#2E2E2E] pt-3 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onClearCart}
                  className="min-h-[38px] px-3.5 py-2 rounded-xl bg-[#2A2A2A] text-[#FFF8E8]/85 text-xs font-bold hover:text-[#FFF8E8] cursor-pointer"
                >
                  Vaciar borrador
                </button>

                <button
                  type="button"
                  onClick={handleProceedClick}
                  className="flex-1 sm:flex-none min-h-[40px] px-5 py-2 rounded-xl bg-[#2E6F32] text-[#FFF8E8] text-xs font-extrabold inline-flex items-center justify-center gap-2 hover:brightness-110 cursor-pointer tabular-nums"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {orderMode === 'dine-in'
                      ? `Enviar a Cocina · Mesa ${selectedTable} (${formatBs(subtotal)})`
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
