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
      className="flex-1 flex flex-col bg-[var(--bg-canvas)] min-h-0"
    >
      <MobileHeader title="Datos de Delivery" onBack={onBack} />

      <div className="flex-1 overflow-y-auto phone-scroll">
        <div className="max-w-2xl mx-auto w-full px-4 lg:px-8 pt-3 lg:pt-6 pb-6 space-y-3.5 lg:space-y-4">
          <div className="flex items-center justify-center gap-2">
            <AppIcon size="xs" />
            <p className="text-xs font-bold text-[var(--ink-muted)]">
              Como en Casa · Comida Tradicional
            </p>
          </div>

          <h2 className="font-serif-display text-xl lg:text-2xl font-bold text-[var(--ink-primary)]">
            Información de entrega
          </h2>

          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            <div className="md:col-span-2">
              <label
                htmlFor="del-address"
                className="block text-xs font-bold text-[var(--ink-primary)] mb-1"
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
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm text-[var(--ink-primary)] font-semibold placeholder:text-[var(--ink-muted)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              />
            </div>

            <div>
              <label
                htmlFor="del-phone"
                className="block text-xs font-bold text-[var(--ink-primary)] mb-1"
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
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm text-[var(--ink-primary)] font-semibold placeholder:text-[var(--ink-muted)]/60 tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              />
            </div>

            <div>
              <label
                htmlFor="del-notes"
                className="block text-xs font-bold text-[var(--ink-primary)] mb-1"
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
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm text-[var(--ink-primary)] font-semibold placeholder:text-[var(--ink-muted)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="del-ref"
                className="block text-xs font-bold text-[var(--ink-primary)] mb-1"
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
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm text-[var(--ink-primary)] font-semibold placeholder:text-[var(--ink-muted)]/60 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              />
            </div>

            <div className="md:col-span-2">
              <span className="block text-xs font-bold text-[var(--ink-primary)] mb-1.5">
                Modalidad de pago
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    onChangeInfo({ ...deliveryInfo, payOnDelivery: false })
                  }
                  className={`min-h-[44px] px-3 py-2 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-[transform,background-color,border-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer ${
                    !deliveryInfo.payOnDelivery
                      ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--bg-canvas)]'
                      : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--ink-primary)] hover:border-[var(--accent-primary)]'
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
                  className={`min-h-[44px] px-3 py-2 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-[transform,background-color,border-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer ${
                    deliveryInfo.payOnDelivery
                      ? 'bg-[var(--accent-gold)] border-[var(--accent-primary)] text-[var(--ink-primary)]'
                      : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--ink-primary)] hover:border-[var(--accent-primary)]'
                  }`}
                >
                  {deliveryInfo.payOnDelivery && <Check className="w-3.5 h-3.5" />}
                  <span>Contra entrega</span>
                </button>
              </div>
            </div>

            {errorMsg && (
              <p className="md:col-span-2 text-xs font-bold text-[var(--status-danger)] bg-[var(--status-danger)]/10 border border-[var(--status-danger)]/40 rounded-xl px-3 py-2">
                {errorMsg}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-3.5 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] shrink-0">
        <div className="max-w-md mx-auto w-full">
          <button
            type="submit"
            className="w-full min-h-[50px] px-5 py-3 rounded-2xl bg-[var(--accent-primary)] text-[var(--bg-canvas)] font-bold text-sm flex items-center justify-center hover:opacity-95 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer tabular-nums"
          >
            {deliveryInfo.payOnDelivery
              ? `Confirmar Pedido · ${formatBs(totalAmount)}`
              : `Continuar al Pago · ${formatBs(totalAmount)}`}
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
      <div className="flex-1 flex flex-col bg-[var(--bg-canvas)] min-h-0">
        <MobileHeader title="Repartidor en camino" onBack={onBack} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--status-info)]">
            <Bike className="w-7 h-7" />
          </div>
          <h2 className="font-serif-display text-xl font-bold text-[var(--ink-primary)]">
            Sin envío Delivery activo
          </h2>
          <p className="text-xs text-[var(--ink-muted)] max-w-[260px]">
            Realiza un pedido con modalidad Delivery desde el menú para seguir tu entrega en tiempo real.
          </p>
          <button
            type="button"
            onClick={onGoMenu}
            className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-[var(--accent-primary)] text-[var(--bg-canvas)] font-bold text-xs active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
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
    <div className="flex-1 flex flex-col bg-[var(--bg-canvas)] min-h-0">
      <MobileHeader title="Repartidor en camino" onBack={onBack} />

      <div className="flex-1 overflow-y-auto phone-scroll">
        <div className="max-w-5xl mx-auto w-full px-4 lg:px-8 pt-3 lg:pt-6 pb-6 space-y-3.5 lg:space-y-5">
          <div className="flex items-center justify-center gap-2">
            <AppIcon size="xs" />
            <p className="text-xs font-bold text-[var(--ink-muted)]">
              Como en Casa · {order.code}
            </p>
          </div>

          <div className="space-y-3.5 lg:grid lg:grid-cols-12 lg:gap-6 lg:space-y-0 lg:items-start">
            {/* Left column on PC: Map & Driver details */}
            <div className="space-y-3.5 lg:col-span-7">
              <div className="relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-inset)] overflow-hidden h-40 lg:h-64">
                <svg viewBox="0 0 320 150" className="w-full h-full">
                  <path
                    d="M0,130 Q90,105 170,122 T320,98"
                    fill="none"
                    stroke="var(--status-info)"
                    strokeWidth="11"
                    opacity="0.35"
                  />
                  <path d="M0,38 L320,25" stroke="var(--bg-canvas)" strokeWidth="10" />
                  <path d="M0,95 L320,115" stroke="var(--bg-canvas)" strokeWidth="10" />
                  <path d="M72,0 L56,150" stroke="var(--bg-canvas)" strokeWidth="9" />
                  <path d="M180,0 L195,150" stroke="var(--bg-canvas)" strokeWidth="10" />
                  <path d="M268,0 L250,150" stroke="var(--bg-canvas)" strokeWidth="8" />
                  <rect x="85" y="45" width="75" height="36" rx="6" fill="var(--border-subtle)" opacity="0.65" />
                  <rect x="200" y="38" width="44" height="44" rx="6" fill="var(--border-subtle)" opacity="0.65" />
                  <path
                    d="M68,112 Q125,62 178,70 T250,36"
                    fill="none"
                    stroke="var(--accent-primary)"
                    strokeWidth="3.2"
                    strokeDasharray="5 5"
                    strokeLinecap="round"
                  />
                  <circle cx="68" cy="112" r="7" fill="var(--ink-primary)" />
                  <circle cx="68" cy="112" r="3" fill="var(--accent-gold)" />
                  <circle
                    cx="250"
                    cy="36"
                    r="10"
                    fill="var(--accent-primary)"
                    stroke="var(--bg-canvas)"
                    strokeWidth="2"
                  />
                  <circle cx="250" cy="36" r="3.5" fill="var(--bg-canvas)" />
                </svg>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[var(--ink-primary)] text-[var(--accent-gold)] border-2 border-[var(--accent-gold)] flex items-center justify-center shadow-md">
                  <Bike className="w-5 h-5" />
                </div>
                <div className="absolute bottom-2 right-2 px-2.5 py-0.5 rounded-lg bg-[var(--bg-surface)]/95 text-[10px] font-bold text-[var(--ink-primary)] inline-flex items-center gap-1 border border-[var(--border-subtle)]">
                  <MapPin className="w-3 h-3 text-[var(--accent-primary)]" />
                  <span className="truncate max-w-[160px] lg:max-w-[260px]">
                    {order.deliveryAddress || 'Entrega a domicilio'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <div>
                  <p className="font-bold text-sm text-[var(--ink-primary)]">
                    Repartidor · Juan P.
                  </p>
                  <p className="text-xs font-bold text-[var(--ink-muted)] inline-flex items-center gap-1 tabular-nums">
                    4.9 <Star className="w-3.5 h-3.5 fill-[var(--accent-gold)] text-[var(--accent-gold)]" />
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                    order.paid
                      ? 'bg-[var(--status-ok)]/12 text-[var(--status-ok)]'
                      : 'bg-[var(--accent-primary)]/12 text-[var(--accent-primary)]'
                  }`}
                >
                  {order.paid ? 'Pagado' : `Cobrar ${formatBs(order.total)}`}
                </span>
              </div>

              {contactOpen && (
                <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--accent-primary)]/50 p-3 text-xs space-y-1">
                  <p className="font-bold text-[var(--ink-primary)]">
                    Contacto directo con Juan P.
                  </p>
                  <p className="text-[var(--ink-muted)]">
                    Teléfono: +591 76543210 · "Voy en camino hacia {order.deliveryAddress}."
                  </p>
                </div>
              )}
            </div>

            {/* Right column on PC: Order details, Stepper, Actions */}
            <div className="space-y-4 lg:col-span-5">
              <section className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h3 className="text-xs font-bold text-[var(--ink-primary)]">
                    Tu pedido:
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowTicket(true)}
                    className="px-2.5 py-1 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-[10px] font-bold inline-flex items-center gap-1 hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
                  >
                    <Printer className="w-3 h-3 text-[var(--accent-primary)]" />
                    <span>Ticket / WA</span>
                  </button>
                </div>
                <ul className="space-y-0.5 text-xs font-semibold text-[var(--ink-primary)]">
                  {order.items.map((item, idx) => (
                    <li key={idx}>
                      · {item.quantity > 1 ? `${item.quantity}x ` : ''}
                      {item.name} {item.sizeLabel} ({formatBs(item.price * item.quantity)})
                    </li>
                  ))}
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-bold text-[var(--ink-primary)]">
                  Estado del pedido:
                </h3>
                <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
                  <div className="flex items-center gap-1 text-[var(--ink-primary)]">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        isPreparingDone
                          ? 'bg-[var(--accent-gold)] text-[var(--ink-primary)]'
                          : 'border border-[var(--ink-muted)]'
                      }`}
                    >
                      {isPreparingDone && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                    </span>
                    <span>Preparando</span>
                  </div>

                  <div className="flex items-center gap-1 text-[var(--ink-primary)]">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        isOnTheWayDone
                          ? 'bg-[var(--status-info)] text-white'
                          : 'border border-[var(--ink-muted)]'
                      }`}
                    >
                      {isOnTheWayDone && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                    </span>
                    <span>En camino</span>
                  </div>

                  <div className="flex items-center gap-1 text-[var(--ink-primary)]">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        isDeliveredDone
                          ? 'bg-[var(--status-ok)] text-white'
                          : 'border border-[var(--ink-muted)]'
                      }`}
                    >
                      {isDeliveredDone && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                    </span>
                    <span>Entregado</span>
                  </div>
                </div>
              </section>

              {order.confirmationCode && (
                <div className="rounded-2xl bg-[var(--ops-surface)] text-[var(--bg-canvas)] border border-[var(--ops-border)] p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--accent-gold)] inline-flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[var(--accent-gold)] shrink-0" />
                      <span>Código de entrega</span>
                    </p>
                    <p className="text-[11px] text-[var(--bg-canvas)]/75 mt-0.5 leading-snug">
                      {isDeliveredDone
                        ? 'Entrega verificada con éxito.'
                        : 'Entrega este código de 4 dígitos al repartidor al recibir tu pedido.'}
                    </p>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-[var(--ops-canvas)] border border-[var(--accent-gold)]/55 font-mono text-lg font-bold tracking-widest text-[var(--accent-gold)] tabular-nums shrink-0">
                    {order.confirmationCode}
                  </span>
                </div>
              )}

              <div className="text-center py-2 rounded-2xl bg-[var(--bg-inset)] border border-[var(--border-subtle)]">
                <p className="text-[11px] font-semibold text-[var(--ink-muted)]">Tiempo estimado</p>
                <p className="font-serif-display text-2xl font-bold text-[var(--ink-primary)] tabular-nums">
                  {order.estimatedMinutes || 25} min
                </p>
              </div>

              <div className="hidden lg:block space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => setContactOpen((prev) => !prev)}
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl bg-[var(--accent-gold)] text-[var(--ink-primary)] font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>Contactar al repartidor</span>
                </button>

                <button
                  type="button"
                  onClick={handleTrackingAction}
                  className="w-full min-h-[42px] px-4 py-2 rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-canvas)] font-bold text-xs flex items-center justify-center gap-1.5 hover:opacity-95 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
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

      <div className="lg:hidden p-3.5 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] space-y-2 shrink-0">
        <button
          type="button"
          onClick={() => setContactOpen((prev) => !prev)}
          className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl bg-[var(--accent-gold)] text-[var(--ink-primary)] font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
        >
          <Phone className="w-4 h-4" />
          <span>Contactar al repartidor</span>
        </button>

        <button
          type="button"
          onClick={handleTrackingAction}
          className="w-full min-h-[42px] px-4 py-2 rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-canvas)] font-bold text-xs flex items-center justify-center gap-1.5 hover:opacity-95 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
        >
          <MessageCircle className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
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
      <div className="flex-1 flex flex-col bg-[var(--bg-canvas)] min-h-0">
        <MobileHeader title="Confirmación" onBack={onBack} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-3">
          <p className="font-serif-display text-lg font-bold text-[var(--ink-primary)]">
            No hay entrega reciente
          </p>
          <button
            type="button"
            onClick={onBackToMenu}
            className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-[var(--accent-primary)] text-[var(--bg-canvas)] font-bold text-xs active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
          >
            Volver al Menú
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-canvas)] min-h-0">
      <MobileHeader title="Confirmación" onBack={onBack} />

      <div className="flex-1 overflow-y-auto phone-scroll">
        <div className="max-w-xl mx-auto w-full px-4 lg:px-8 pt-5 lg:pt-8 pb-6 space-y-4">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-[var(--status-ok)]/12 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-[var(--status-ok)]" strokeWidth={2.2} />
            </div>
            <h2 className="font-serif-display text-2xl font-bold text-[var(--ink-primary)]">
              ¡Pedido entregado!
            </h2>
            <p className="text-xs text-[var(--ink-muted)] max-w-[260px]">
              Gracias por tu compra, esperamos que disfrutes tu comida
            </p>
          </div>

          <section className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3.5 space-y-2.5">
            <h3 className="text-xs font-bold text-[var(--ink-primary)]">
              Detalle del pedido ({order.code})
            </h3>
            <div className="space-y-1.5 text-xs font-semibold text-[var(--ink-primary)]">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span>
                    {item.quantity > 1 ? `${item.quantity}x ` : ''}
                    {item.name} {item.sizeLabel}
                  </span>
                  <span className="tabular-nums text-[var(--accent-primary)] font-bold">
                    · {formatBs(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
              <span className="font-bold text-sm text-[var(--ink-primary)]">Total</span>
              <span className="px-3 py-1 rounded-xl bg-[var(--accent-gold)] text-[var(--ink-primary)] font-bold text-sm tabular-nums">
                {formatBs(order.total)}
              </span>
            </div>
          </section>

          <p className="text-center text-xs font-semibold text-[var(--ink-muted)]">
            Entregado hoy · {order.deliveredAt || order.createdAt}
          </p>

          {ratingOpen && (
            <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3 text-center space-y-2">
              <p className="text-xs font-bold text-[var(--ink-primary)]">
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
                    className="p-1 active:scale-[0.9] transition-transform duration-150 ease-[var(--ease-out)] cursor-pointer"
                    aria-label={`${n} estrellas`}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        n <= stars
                          ? 'fill-[var(--accent-gold)] text-[var(--accent-gold)]'
                          : 'text-[var(--ink-muted)]/40'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {ratingSaved && (
                <p className="text-[11px] font-bold text-[var(--status-ok)]">
                  ¡Gracias por calificarnos con {stars} estrellas!
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-3.5 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] shrink-0">
        <div className="max-w-md mx-auto w-full space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRatingOpen(true)}
              className="min-h-[46px] px-3 py-2.5 rounded-2xl bg-[var(--accent-gold)] text-[var(--ink-primary)] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
            >
              <Star className="w-4 h-4 fill-[var(--ink-primary)]" />
              <span>Calificar</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTicket(true)}
              className="min-h-[46px] px-3 py-2.5 rounded-2xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-[var(--ink-primary)] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>Ticket / WA</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onBackToMenu}
            className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-canvas)] font-bold text-sm flex items-center justify-center hover:opacity-95 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
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
