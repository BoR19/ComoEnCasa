import React, { useState } from 'react';
import {
  Bike,
  Check,
  CheckCircle2,
  KeyRound,
  MapPin,
  MessageCircle,
  Phone,
  Printer,
  Star,
} from 'lucide-react';
import { DeliveryInfo, KitchenOrder, OrderStatus } from '../../types/app';
import { formatBs } from '../../utils/appHelpers';
import { AppIcon } from '../BrandAssets';
import { MobileHeader } from '../ShellComponents';
import { TicketModal } from '../TicketModal';

interface DeliveryInfoScreenProps {
  deliveryInfo: DeliveryInfo;
  totalAmount: number;
  onChangeInfo: (info: DeliveryInfo) => void;
  onContinue: () => void;
  onBack: () => void;
}

export const DeliveryInfoScreen: React.FC<DeliveryInfoScreenProps> = ({
  deliveryInfo,
  totalAmount,
  onChangeInfo,
  onContinue,
  onBack,
}) => {
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryInfo.address.trim() || !deliveryInfo.phone.trim()) {
      setErrorMsg('Por favor ingresa tu dirección y teléfono de contacto.');
      return;
    }
    setErrorMsg('');
    onContinue();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex-1 flex flex-col bg-[#FFF8E8] min-h-0"
    >
      <MobileHeader title="Datos de Delivery" onBack={onBack} />

      <div className="flex-1 overflow-y-auto phone-scroll">
        <div className="max-w-2xl mx-auto w-full px-4 lg:px-8 pt-3 lg:pt-6 pb-6 space-y-3.5 lg:space-y-4">
          <div className="flex items-center justify-center gap-2">
            <AppIcon size="xs" />
            <p className="text-xs font-bold text-[#7A5A3A]">
              Como en Casa • Comida Tradicional
            </p>
          </div>

          <h2 className="font-serif-display text-xl lg:text-2xl font-bold text-[#2B1A0E]">
            Información de entrega
          </h2>

          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            <div className="md:col-span-2">
              <label
                htmlFor="del-address"
                className="block text-xs font-extrabold text-[#3B1F0E] mb-1"
              >
                Dirección
              </label>
              <input
                id="del-address"
                type="text"
                value={deliveryInfo.address}
                placeholder="Ej. Av. 6 de Agosto Nº 1234, Zona Sopocachi"
                onChange={(e) =>
                  onChangeInfo({ ...deliveryInfo, address: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FDF2D6] border border-[#D9A441]/70 text-sm text-[#2B1A0E] font-semibold placeholder:text-[#7A5A3A]/60 focus:outline-none focus:ring-2 focus:ring-[#B84A27]"
              />
            </div>

            <div>
              <label
                htmlFor="del-phone"
                className="block text-xs font-extrabold text-[#3B1F0E] mb-1"
              >
                Teléfono
              </label>
              <input
                id="del-phone"
                type="tel"
                value={deliveryInfo.phone}
                placeholder="Ej. +591 71234567"
                onChange={(e) =>
                  onChangeInfo({ ...deliveryInfo, phone: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FDF2D6] border border-[#D9A441]/70 text-sm text-[#2B1A0E] font-semibold placeholder:text-[#7A5A3A]/60 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#B84A27]"
              />
            </div>

            <div>
              <label
                htmlFor="del-notes"
                className="block text-xs font-extrabold text-[#3B1F0E] mb-1"
              >
                Notas para cocina (opcional)
              </label>
              <input
                id="del-notes"
                type="text"
                value={deliveryInfo.notes}
                placeholder="Ej. Sin picante, llajua aparte"
                onChange={(e) =>
                  onChangeInfo({ ...deliveryInfo, notes: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FDF2D6] border border-[#D9A441]/70 text-sm text-[#2B1A0E] font-semibold placeholder:text-[#7A5A3A]/60 focus:outline-none focus:ring-2 focus:ring-[#B84A27]"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="del-ref"
                className="block text-xs font-extrabold text-[#3B1F0E] mb-1"
              >
                Referencia
              </label>
              <textarea
                id="del-ref"
                rows={2}
                value={deliveryInfo.reference}
                placeholder="Ej. Portón café, al lado de la farmacia"
                onChange={(e) =>
                  onChangeInfo({ ...deliveryInfo, reference: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FDF2D6] border border-[#D9A441]/70 text-sm text-[#2B1A0E] font-semibold placeholder:text-[#7A5A3A]/60 resize-none focus:outline-none focus:ring-2 focus:ring-[#B84A27]"
              />
            </div>

            <div className="md:col-span-2">
              <span className="block text-xs font-extrabold text-[#3B1F0E] mb-1.5">
                Modalidad de pago
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    onChangeInfo({ ...deliveryInfo, payOnDelivery: false })
                  }
                  className={`min-h-[44px] px-3 py-2 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer ${
                    !deliveryInfo.payOnDelivery
                      ? 'bg-[#B84A27] border-[#B84A27] text-[#FFF8E8]'
                      : 'bg-[#FDF2D6] border-[#D9A441]/60 text-[#2B1A0E]'
                  }`}
                >
                  {!deliveryInfo.payOnDelivery && <Check className="w-3.5 h-3.5" />}
                  <span>Pagar ahora</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onChangeInfo({ ...deliveryInfo, payOnDelivery: true })
                  }
                  className={`min-h-[44px] px-3 py-2 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer ${
                    deliveryInfo.payOnDelivery
                      ? 'bg-[#D9A441] border-[#B84A27] text-[#2B1A0E]'
                      : 'bg-[#FDF2D6] border-[#D9A441]/60 text-[#2B1A0E]'
                  }`}
                >
                  {deliveryInfo.payOnDelivery && <Check className="w-3.5 h-3.5" />}
                  <span>Contra entrega</span>
                </button>
              </div>
            </div>

            {errorMsg && (
              <p className="md:col-span-2 text-xs font-bold text-[#B83227] bg-[#B83227]/10 border border-[#B83227]/40 rounded-xl px-3 py-2">
                {errorMsg}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-3.5 bg-[#FFF8E8] border-t border-[#D9A441]/40 shrink-0">
        <div className="max-w-md mx-auto w-full">
          <button
            type="submit"
            className="w-full min-h-[50px] px-5 py-3 rounded-2xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-sm flex items-center justify-center shadow-sm hover:bg-[#E8C87A] active:scale-[0.98] transition-all cursor-pointer tabular-nums"
          >
            {deliveryInfo.payOnDelivery
              ? `Confirmar Pedido • ${formatBs(totalAmount)}`
              : `Continuar al Pago • ${formatBs(totalAmount)}`}
          </button>
        </div>
      </div>
    </form>
  );
};

interface DeliveryTrackingScreenProps {
  order?: KitchenOrder;
  onUpdateOrderStatus: (status: OrderStatus) => void;
  onGoConfirm: () => void;
  onGoMenu: () => void;
  onBack: () => void;
}

export const DeliveryTrackingScreen: React.FC<DeliveryTrackingScreenProps> = ({
  order,
  onUpdateOrderStatus,
  onGoConfirm,
  onGoMenu,
  onBack,
}) => {
  const [contactOpen, setContactOpen] = useState(false);
  const [showTicket, setShowTicket] = useState(false);

  if (!order) {
    return (
      <div className="flex-1 flex flex-col bg-[#FFF8E8] min-h-0">
        <MobileHeader title="Repartidor en camino" onBack={onBack} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#FDF2D6] border border-[#D9A441] flex items-center justify-center text-[#1E8299]">
            <Bike className="w-7 h-7" />
          </div>
          <h2 className="font-serif-display text-xl font-bold text-[#2B1A0E]">
            Sin envío Delivery activo
          </h2>
          <p className="text-xs text-[#7A5A3A] max-w-[260px]">
            Realiza un pedido con modalidad Delivery desde el menú para seguir tu entrega en tiempo real.
          </p>
          <button
            type="button"
            onClick={onGoMenu}
            className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-xs cursor-pointer"
          >
            Ir al Menú
          </button>
        </div>
      </div>
    );
  }

  const isPreparingDone = true;
  const isOnTheWayDone =
    order.status === 'En camino' ||
    order.status === 'Entregado' ||
    order.status === 'Cobrado';
  const isDeliveredDone =
    order.status === 'Entregado' || order.status === 'Cobrado';

  const handleTrackingAction = () => {
    if (isDeliveredDone) {
      onGoConfirm();
    } else if (order.status === 'Preparando' || order.status === 'Listo') {
      onUpdateOrderStatus('En camino');
    } else {
      setShowTicket(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FFF8E8] min-h-0">
      <MobileHeader title="Repartidor en camino" onBack={onBack} />

      <div className="flex-1 overflow-y-auto phone-scroll">
        <div className="max-w-5xl mx-auto w-full px-4 lg:px-8 pt-3 lg:pt-6 pb-6 space-y-3.5 lg:space-y-5">
          <div className="flex items-center justify-center gap-2">
            <AppIcon size="xs" />
            <p className="text-xs font-bold text-[#7A5A3A]">
              Como en Casa • {order.code}
            </p>
          </div>

          <div className="space-y-3.5 lg:grid lg:grid-cols-12 lg:gap-6 lg:space-y-0 lg:items-start">
            {/* Left column on PC: Map & Driver details */}
            <div className="space-y-3.5 lg:col-span-7">
              <div className="relative rounded-2xl border border-[#D9A441]/60 bg-[#F4EAD2] overflow-hidden h-40 lg:h-64">
                <svg viewBox="0 0 320 150" className="w-full h-full">
                  <path
                    d="M0,130 Q90,105 170,122 T320,98"
                    fill="none"
                    stroke="#1E8299"
                    strokeWidth="11"
                    opacity="0.35"
                  />
                  <path d="M0,38 L320,25" stroke="#FFF8E8" strokeWidth="10" />
                  <path d="M0,95 L320,115" stroke="#FFF8E8" strokeWidth="10" />
                  <path d="M72,0 L56,150" stroke="#FFF8E8" strokeWidth="9" />
                  <path d="M180,0 L195,150" stroke="#FFF8E8" strokeWidth="10" />
                  <path d="M268,0 L250,150" stroke="#FFF8E8" strokeWidth="8" />
                  <rect x="85" y="45" width="75" height="36" rx="6" fill="#E9DEC3" />
                  <rect x="200" y="38" width="44" height="44" rx="6" fill="#E9DEC3" />
                  <path
                    d="M68,112 Q125,62 178,70 T250,36"
                    fill="none"
                    stroke="#B84A27"
                    strokeWidth="3.2"
                    strokeDasharray="5 5"
                    strokeLinecap="round"
                  />
                  <circle cx="68" cy="112" r="7" fill="#3B1F0E" />
                  <circle cx="68" cy="112" r="3" fill="#D9A441" />
                  <circle
                    cx="250"
                    cy="36"
                    r="10"
                    fill="#B84A27"
                    stroke="#FFF8E8"
                    strokeWidth="2"
                  />
                  <circle cx="250" cy="36" r="3.5" fill="#FFF8E8" />
                </svg>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#3B1F0E] text-[#D9A441] border-2 border-[#D9A441] flex items-center justify-center shadow-md">
                  <Bike className="w-5 h-5" />
                </div>
                <div className="absolute bottom-2 right-2 px-2.5 py-0.5 rounded-lg bg-[#FFF8E8]/95 text-[10px] font-extrabold text-[#3B1F0E] inline-flex items-center gap-1 border border-[#D9A441]/50">
                  <MapPin className="w-3 h-3 text-[#B84A27]" />
                  <span className="truncate max-w-[160px] lg:max-w-[260px]">
                    {order.deliveryAddress || 'Entrega a domicilio'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <div>
                  <p className="font-extrabold text-sm text-[#2B1A0E]">
                    Repartidor • Juan P.
                  </p>
                  <p className="text-xs font-extrabold text-[#7A5A3A] inline-flex items-center gap-1">
                    4.9 <Star className="w-3.5 h-3.5 fill-[#D9A441] text-[#D9A441]" />
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold ${
                    order.paid
                      ? 'bg-[#2E6F32]/15 text-[#2E6F32]'
                      : 'bg-[#B84A27]/15 text-[#B84A27]'
                  }`}
                >
                  {order.paid ? 'Pagado' : `Cobrar ${formatBs(order.total)}`}
                </span>
              </div>

              {contactOpen && (
                <div className="rounded-2xl bg-[#FDF2D6] border border-[#B84A27]/60 p-3 text-xs space-y-1">
                  <p className="font-extrabold text-[#3B1F0E]">
                    Contacto directo con Juan P.
                  </p>
                  <p className="text-[#7A5A3A]">
                    Teléfono: +591 76543210 · "Voy en camino hacia {order.deliveryAddress}."
                  </p>
                </div>
              )}
            </div>

            {/* Right column on PC: Order details, Stepper, Actions */}
            <div className="space-y-4 lg:col-span-5">
              <section className="rounded-2xl bg-[#FDF2D6] border border-[#D9A441]/55 p-3">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h3 className="text-xs font-extrabold text-[#3B1F0E]">
                    Tu pedido:
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowTicket(true)}
                    className="px-2.5 py-1 rounded-xl bg-[#FFFDF8] border border-[#D9A441] text-[#3B1F0E] text-[10px] font-extrabold inline-flex items-center gap-1 hover:bg-[#E8C87A]/35 cursor-pointer"
                  >
                    <Printer className="w-3 h-3 text-[#B84A27]" />
                    <span>Ticket / WA</span>
                  </button>
                </div>
                <ul className="space-y-0.5 text-xs font-bold text-[#2B1A0E]">
                  {order.items.map((item, idx) => (
                    <li key={idx}>
                      • {item.quantity > 1 ? `${item.quantity}x ` : ''}
                      {item.name} {item.sizeLabel} ({formatBs(item.price * item.quantity)})
                    </li>
                  ))}
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-extrabold text-[#3B1F0E]">
                  Estado del pedido:
                </h3>
                <div className="grid grid-cols-3 gap-1.5 text-[11px] font-extrabold">
                  <div className="flex items-center gap-1 text-[#2B1A0E]">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        isPreparingDone
                          ? 'bg-[#D9A441] text-[#2B1A0E]'
                          : 'border border-[#7A5A3A]'
                      }`}
                    >
                      {isPreparingDone && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                    </span>
                    <span>Preparando</span>
                  </div>

                  <div className="flex items-center gap-1 text-[#2B1A0E]">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        isOnTheWayDone
                          ? 'bg-[#1E8299] text-white'
                          : 'border border-[#7A5A3A]'
                      }`}
                    >
                      {isOnTheWayDone && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                    </span>
                    <span>En camino</span>
                  </div>

                  <div className="flex items-center gap-1 text-[#2B1A0E]">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        isDeliveredDone
                          ? 'bg-[#2E6F32] text-white'
                          : 'border border-[#7A5A3A]'
                      }`}
                    >
                      {isDeliveredDone && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                    </span>
                    <span>Entregado</span>
                  </div>
                </div>
              </section>

              {order.confirmationCode && (
                <div className="rounded-2xl bg-[#1E1E1E] text-[#FFF8E8] border border-[#D9A441]/55 p-3.5 flex items-center justify-between gap-3 shadow-sm">
                  <div className="min-w-0">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#E8C87A] inline-flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[#D9A441] shrink-0" />
                      <span>Código de entrega</span>
                    </p>
                    <p className="text-[11px] text-[#FFF8E8]/75 mt-0.5 leading-snug">
                      {isDeliveredDone
                        ? 'Entrega verificada con éxito.'
                        : 'Entrega este código de 4 dígitos al repartidor al recibir tu pedido.'}
                    </p>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-[#141414] border border-[#D9A441]/60 font-mono text-lg font-extrabold tracking-widest text-[#D9A441] tabular-nums shrink-0">
                    {order.confirmationCode}
                  </span>
                </div>
              )}

              <div className="text-center py-1 rounded-2xl bg-[#FDF2D6]/60 border border-[#D9A441]/30">
                <p className="text-[11px] font-bold text-[#7A5A3A]">Tiempo estimado</p>
                <p className="font-serif-display text-2xl font-bold text-[#2B1A0E] tabular-nums">
                  {order.estimatedMinutes || 25} min
                </p>
              </div>

              <div className="hidden lg:block space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => setContactOpen((prev) => !prev)}
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-[#E8C87A] cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>Contactar al repartidor</span>
                </button>

                <button
                  type="button"
                  onClick={handleTrackingAction}
                  className="w-full min-h-[42px] px-4 py-2 rounded-2xl bg-[#3B1F0E] text-[#FFF8E8] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#4A2C1A] cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#D9A441]" />
                  <span>
                    {isDeliveredDone
                      ? 'Ver confirmación y calificar'
                      : order.status === 'Preparando' || order.status === 'Listo'
                      ? 'Marcar En camino'
                      : 'Ver Ticket y Código de entrega'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden p-3.5 bg-[#FFF8E8] border-t border-[#D9A441]/40 space-y-2 shrink-0">
        <button
          type="button"
          onClick={() => setContactOpen((prev) => !prev)}
          className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-[#E8C87A] cursor-pointer"
        >
          <Phone className="w-4 h-4" />
          <span>Contactar al repartidor</span>
        </button>

        <button
          type="button"
          onClick={handleTrackingAction}
          className="w-full min-h-[42px] px-4 py-2 rounded-2xl bg-[#3B1F0E] text-[#FFF8E8] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#4A2C1A] cursor-pointer"
        >
          <MessageCircle className="w-3.5 h-3.5 text-[#D9A441]" />
          <span>
            {isDeliveredDone
              ? 'Ver confirmación y calificar'
              : order.status === 'Preparando' || order.status === 'Listo'
              ? 'Marcar En camino'
              : 'Ver Ticket y Código de entrega'}
          </span>
        </button>
      </div>

      <TicketModal
        order={showTicket ? order : null}
        onClose={() => setShowTicket(false)}
      />
    </div>
  );
};

interface DeliveryConfirmScreenProps {
  order?: KitchenOrder;
  onRateOrder: (orderId: string, stars: number) => void;
  onBackToMenu: () => void;
  onBack: () => void;
}

export const DeliveryConfirmScreen: React.FC<DeliveryConfirmScreenProps> = ({
  order,
  onRateOrder,
  onBackToMenu,
  onBack,
}) => {
  const [ratingOpen, setRatingOpen] = useState(false);
  const [stars, setStars] = useState(order?.ratingStars || 5);
  const [ratingSaved, setRatingSaved] = useState(Boolean(order?.ratingStars));
  const [showTicket, setShowTicket] = useState(false);

  if (!order) {
    return (
      <div className="flex-1 flex flex-col bg-[#FFF8E8] min-h-0">
        <MobileHeader title="Confirmación" onBack={onBack} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-3">
          <p className="font-serif-display text-lg font-bold text-[#2B1A0E]">
            No hay entrega reciente
          </p>
          <button
            type="button"
            onClick={onBackToMenu}
            className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-xs cursor-pointer"
          >
            Volver al Menú
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#FFF8E8] min-h-0">
      <MobileHeader title="Confirmación" onBack={onBack} />

      <div className="flex-1 overflow-y-auto phone-scroll">
        <div className="max-w-xl mx-auto w-full px-4 lg:px-8 pt-5 lg:pt-8 pb-6 space-y-4">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-[#2E6F32]/15 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-[#2E6F32]" strokeWidth={2.2} />
            </div>
            <h2 className="font-serif-display text-2xl font-bold text-[#2B1A0E]">
              ¡Pedido entregado!
            </h2>
            <p className="text-xs text-[#7A5A3A] max-w-[260px]">
              Gracias por tu compra, esperamos que disfrutes tu comida
            </p>
          </div>

          <section className="rounded-2xl bg-[#FDF2D6] border border-[#D9A441]/70 p-3.5 space-y-2.5">
            <h3 className="text-xs font-extrabold text-[#3B1F0E]">
              Detalle del pedido ({order.code})
            </h3>
            <div className="space-y-1.5 text-xs font-bold text-[#2B1A0E]">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span>
                    {item.quantity > 1 ? `${item.quantity}x ` : ''}
                    {item.name} {item.sizeLabel}
                  </span>
                  <span className="tabular-nums text-[#B84A27]">
                    • {formatBs(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#D9A441]/40 flex items-center justify-between">
              <span className="font-extrabold text-sm text-[#2B1A0E]">Total</span>
              <span className="px-3 py-1 rounded-xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-sm tabular-nums">
                {formatBs(order.total)}
              </span>
            </div>
          </section>

          <p className="text-center text-xs font-bold text-[#7A5A3A]">
            Entregado hoy • {order.deliveredAt || order.createdAt}
          </p>

          {ratingOpen && (
            <div className="rounded-2xl bg-[#FDF2D6] border border-[#D9A441] p-3 text-center space-y-2">
              <p className="text-xs font-extrabold text-[#3B1F0E]">
                ¿Cómo estuvo tu pedido?
              </p>
              <div className="flex items-center justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      setStars(n);
                      setRatingSaved(true);
                      onRateOrder(order.id, n);
                    }}
                    className="p-1 cursor-pointer"
                    aria-label={`${n} estrellas`}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        n <= stars
                          ? 'fill-[#D9A441] text-[#D9A441]'
                          : 'text-[#7A5A3A]/40'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {ratingSaved && (
                <p className="text-[11px] font-bold text-[#2E6F32]">
                  ¡Gracias por calificarnos con {stars} estrellas!
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-3.5 bg-[#FFF8E8] border-t border-[#D9A441]/40 shrink-0">
        <div className="max-w-md mx-auto w-full space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRatingOpen(true)}
              className="min-h-[46px] px-3 py-2.5 rounded-2xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 hover:bg-[#E8C87A] cursor-pointer"
            >
              <Star className="w-4 h-4 fill-[#2B1A0E]" />
              <span>Calificar</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTicket(true)}
              className="min-h-[46px] px-3 py-2.5 rounded-2xl bg-[#FDF2D6] border border-[#D9A441] text-[#3B1F0E] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 hover:bg-[#E8C87A]/30 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#B84A27]" />
              <span>Ticket / WA</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onBackToMenu}
            className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl bg-[#3B1F0E] text-[#FFF8E8] font-extrabold text-sm flex items-center justify-center hover:bg-[#4A2C1A] cursor-pointer"
          >
            Volver al Menú
          </button>
        </div>
      </div>

      <TicketModal
        order={showTicket ? order : null}
        onClose={() => setShowTicket(false)}
      />
    </div>
  );
};
