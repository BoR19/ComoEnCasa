import React from 'react';
import {
  Bike,
  CheckCircle2,
  Minus,
  Pencil,
  Plus,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import { CartItem, MenuItem, OrderMode } from '../../types/app';
import { formatBs, getCartLineTotal, getCartTotal } from '../../utils/appHelpers';
import { MobileHeader } from '../ShellComponents';

interface CartScreenProps {
  cart: CartItem[];
  menuItems: MenuItem[];
  orderMode: OrderMode;
  selectedTable: number;
  onBack: () => void;
  onChangeOrderMode: (mode: OrderMode) => void;
  onEditTable: () => void;
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onChangeItemSize: (cartItemId: string, sizeId: string) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  onProceedOrder: () => void;
  onGoMenu: () => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({
  cart,
  menuItems,
  orderMode,
  selectedTable,
  onBack,
  onChangeOrderMode,
  onEditTable,
  onUpdateQuantity,
  onChangeItemSize,
  onRemoveItem,
  onClearCart,
  onProceedOrder,
  onGoMenu,
}) => {
  const subtotal = getCartTotal(cart);
  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  return (
    <div className="flex-1 flex flex-col bg-[#FFF8E8] min-h-0">
      <MobileHeader
        title="Carrito"
        onBack={onBack}
        rightSlot={
          cart.length > 0 ? (
            <button
              type="button"
              onClick={onClearCart}
              aria-label="Vaciar carrito"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#D9A441] hover:bg-[#4A2C1A] cursor-pointer"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-y-auto phone-scroll">
        <div className="max-w-5xl mx-auto w-full px-4 lg:px-8 pt-3 lg:pt-6 pb-6">
          <div className="space-y-4 lg:grid lg:grid-cols-12 lg:gap-6 lg:space-y-0 lg:items-start">
            {/* Left column on PC: Cart Items */}
            <div className="space-y-3 lg:col-span-7">
              {cart.length === 0 ? (
                <div className="py-12 px-4 text-center rounded-2xl bg-[#FDF2D6] border border-[#D9A441]/55 space-y-3">
                  <p className="font-serif-display text-lg font-bold text-[#3B1F0E]">
                    Tu carrito está vacío
                  </p>
                  <p className="text-xs text-[#7A5A3A]">
                    Agrega platos fuertes, guisos, sopas o jugos tradicionales desde el menú.
                  </p>
                  <button
                    type="button"
                    onClick={onGoMenu}
                    className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-xs cursor-pointer"
                  >
                    Ir al Menú
                  </button>
                </div>
              ) : (
                cart.map((item) => {
                  const sourceMenu = menuItems.find((m) => m.id === item.menuItemId);
                  const lineTotal = getCartLineTotal(item);

                  return (
                    <article
                      key={item.cartItemId}
                      className="rounded-2xl bg-[#FDF2D6] border border-[#D9A441]/70 p-3 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-[#2B1A0E]">
                            {item.name}
                          </h3>
                          <p className="text-xs text-[#7A5A3A]">
                            {item.sizeLabel} · {formatBs(item.unitPrice)} c/u
                          </p>
                          {item.extras.length > 0 && (
                            <p className="text-[11px] text-[#7A5A3A] mt-0.5">
                              Extras:{' '}
                              {item.extras
                                .map((e) => `${e.label} (+Bs ${e.price})`)
                                .join(', ')}
                            </p>
                          )}
                          {item.customSummary && (
                            <p className="text-[11px] text-[#7A5A3A] mt-0.5">
                              {item.customSummary}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-extrabold text-sm text-[#B84A27] tabular-nums">
                            {formatBs(lineTotal)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.cartItemId)}
                            aria-label={`Eliminar ${item.name}`}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#B83227] hover:bg-[#B83227]/10 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Size switchers + Quantity stepper */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#D9A441]/25">
                        {sourceMenu ? (
                          <div className="flex flex-wrap gap-1">
                            {sourceMenu.sizes.map((sz) => {
                              const active = item.sizeId === sz.id;
                              return (
                                <button
                                  key={sz.id}
                                  type="button"
                                  onClick={() => onChangeItemSize(item.cartItemId, sz.id)}
                                  className={`px-2 py-1 rounded-xl text-[11px] font-extrabold border transition-colors cursor-pointer tabular-nums ${
                                    active
                                      ? 'bg-[#B84A27] border-[#B84A27] text-[#FFF8E8]'
                                      : 'bg-[#FFFDF8] border-[#D9A441]/50 text-[#7A5A3A]'
                                  }`}
                                >
                                  {sz.label} Bs {sz.price}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#7A5A3A]">Personalizado</span>
                        )}

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.cartItemId, -1)}
                            aria-label="Disminuir cantidad"
                            className="w-8 h-8 rounded-xl bg-[#FFFDF8] border border-[#D9A441]/70 text-[#3B1F0E] flex items-center justify-center hover:bg-[#E8C87A]/30 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
                          </button>
                          <span className="w-6 text-center text-xs font-extrabold text-[#2B1A0E] tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.cartItemId, 1)}
                            aria-label="Aumentar cantidad"
                            className="w-8 h-8 rounded-xl bg-[#D9A441] text-[#2B1A0E] flex items-center justify-center hover:bg-[#E8C87A] cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            {/* Right column on PC: Order Mode + Summary + Desktop CTA */}
            <div className="space-y-4 lg:col-span-5">
              <section className="rounded-2xl bg-[#3B1F0E] text-[#FFF8E8] p-3.5 space-y-2.5 border border-[#D9A441]/30">
                <p className="text-xs font-bold text-[#E8C87A]">
                  Modo de pedido:{' '}
                  {orderMode === 'dine-in'
                    ? `Comer en local • Mesa ${selectedTable}`
                    : 'Delivery • Entrega a domicilio'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onChangeOrderMode('dine-in')}
                    className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      orderMode === 'dine-in'
                        ? 'bg-[#D9A441] text-[#2B1A0E]'
                        : 'bg-[#4A2C1A] text-[#FFF8E8]/85 hover:bg-[#4A2C1A]/80'
                    }`}
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>En el local</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeOrderMode('delivery')}
                    className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      orderMode === 'delivery'
                        ? 'bg-[#D9A441] text-[#2B1A0E]'
                        : 'bg-[#4A2C1A] text-[#FFF8E8]/85 hover:bg-[#4A2C1A]/80'
                    }`}
                  >
                    <Bike className="w-3.5 h-3.5" />
                    <span>Delivery</span>
                  </button>
                </div>

                {orderMode === 'dine-in' && (
                  <button
                    type="button"
                    onClick={onEditTable}
                    className="w-full min-h-[38px] px-3 py-1.5 rounded-xl bg-[#FFF8E8] text-[#2B1A0E] text-xs font-extrabold flex items-center justify-between cursor-pointer hover:bg-[#FDF2D6]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Pencil className="w-3.5 h-3.5 text-[#B84A27]" />
                      Mesa {selectedTable}
                    </span>
                    <span className="text-[#B84A27] underline">Cambiar</span>
                  </button>
                )}
              </section>

              {cart.length > 0 && (
                <>
                  <section className="rounded-2xl bg-[#FDF2D6] border border-[#D9A441]/60 p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#7A5A3A] font-bold">
                      <span>Subtotal</span>
                      <span className="text-[#2B1A0E] tabular-nums">
                        Bs {subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#7A5A3A] font-bold">
                      <span>Envío</span>
                      <span className="text-[#2E6F32] tabular-nums">
                        {orderMode === 'delivery' ? 'Bs 0.00 (Gratis)' : 'Bs 0.00'}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-[#D9A441]/40 flex items-center justify-between">
                      <span className="font-extrabold text-sm text-[#2B1A0E]">Total</span>
                      <span className="px-3 py-1 rounded-xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-sm tabular-nums">
                        Bs {total.toFixed(2)}
                      </span>
                    </div>
                  </section>

                  <button
                    type="button"
                    onClick={onProceedOrder}
                    className="hidden lg:flex w-full min-h-[52px] px-5 py-3 rounded-2xl bg-[#3B1F0E] text-[#FFF8E8] font-extrabold text-sm items-center justify-center gap-2 shadow-md hover:bg-[#4A2C1A] active:scale-[0.98] transition-all cursor-pointer tabular-nums"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#D9A441]" />
                    <span>
                      {orderMode === 'dine-in'
                        ? `Enviar pedido a Mesa ${selectedTable} • ${formatBs(total)}`
                        : `Continuar a Delivery • ${formatBs(total)}`}
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Order CTA (Mobile) */}
      {cart.length > 0 && (
        <div className="lg:hidden p-3.5 bg-[#FFF8E8] border-t border-[#D9A441]/40 shrink-0">
          <button
            type="button"
            onClick={onProceedOrder}
            className="w-full min-h-[52px] px-5 py-3 rounded-2xl bg-[#3B1F0E] text-[#FFF8E8] font-extrabold text-sm flex items-center justify-center gap-2 shadow-md hover:bg-[#4A2C1A] active:scale-[0.98] transition-all cursor-pointer tabular-nums"
          >
            <CheckCircle2 className="w-4 h-4 text-[#D9A441]" />
            <span>
              {orderMode === 'dine-in'
                ? `Enviar pedido a Mesa ${selectedTable} • ${formatBs(total)}`
                : `Continuar a Delivery • ${formatBs(total)}`}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
