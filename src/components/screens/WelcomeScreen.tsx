import React, { useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import {
  ArrowRight,
  Bike,
  CheckCircle2,
  Clock,
  Delete,
  KeyRound,
  LogIn,
  LogOut,
  MapPin,
  ShoppingBag,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { TakeawayInfo } from '../../types/app';
import { OfficialLogo } from '../BrandAssets';

interface WelcomeScreenProps {
  mozoPin: string;
  isMozoLoggedIn: boolean;
  firebaseUser: User | null;
  isStaff: boolean;
  takeawayInfo: TakeawayInfo;
  onGoogleSignIn: () => void;
  onMozoLoginSuccess: () => void;
  onMozoLogout: () => void;
  onGoMozoComandas: () => void;
  onSelectDineIn: () => void;
  onSelectTakeaway: (info: TakeawayInfo) => void;
  onSelectDelivery: () => void;
  onGoAdminLogin: () => void;
}

const PICKUP_TIME_CHIPS = ['15 min', '30 min', '45 min'];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  mozoPin,
  isMozoLoggedIn,
  firebaseUser,
  isStaff,
  takeawayInfo,
  onGoogleSignIn,
  onMozoLoginSuccess,
  onMozoLogout,
  onGoMozoComandas,
  onSelectDineIn,
  onSelectTakeaway,
  onSelectDelivery,
  onGoAdminLogin,
}) => {
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [showTakeawayModal, setShowTakeawayModal] = useState(false);
  const [takeawayNameDraft, setTakeawayNameDraft] = useState('');
  const [takeawayPickupDraft, setTakeawayPickupDraft] = useState('');
  const [takeawayError, setTakeawayError] = useState('');

  // 5-tap secret trigger on OfficialLogo for Mozo PIN popup
  const [logoTapCount, setLogoTapCount] = useState(0);
  const tapTimerRef = useRef<number | null>(null);
  const [showMozoModal, setShowMozoModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    return () => {
      if (tapTimerRef.current) window.clearTimeout(tapTimerRef.current);
    };
  }, []);

  const handleLogoTap = () => {
    if (tapTimerRef.current) {
      window.clearTimeout(tapTimerRef.current);
    }

    const nextCount = logoTapCount + 1;
    if (nextCount >= 5) {
      setLogoTapCount(0);
      setPinInput('');
      setPinError('');
      setShowMozoModal(true);
      return;
    }

    setLogoTapCount(nextCount);
    tapTimerRef.current = window.setTimeout(() => {
      setLogoTapCount(0);
    }, 2200);
  };

  const validateAndSubmitPin = (candidate: string) => {
    if (candidate.length < 4) return;
    if (candidate !== mozoPin) {
      setPinError('PIN incorrecto. Verifica los 4 números de Mozo.');
      setPinInput('');
      return;
    }

    setPinError('');
    setPinInput('');
    setShowMozoModal(false);

    if (isMozoLoggedIn) {
      onMozoLogout();
    } else {
      onMozoLoginSuccess();
    }
  };

  const handleDigitPress = (digit: string) => {
    if (pinInput.length >= 4) return;
    setPinError('');
    const next = pinInput + digit;
    setPinInput(next);
    if (next.length === 4) {
      validateAndSubmitPin(next);
    }
  };

  const handleBackspace = () => {
    setPinError('');
    setPinInput((prev) => prev.slice(0, -1));
  };

  useEffect(() => {
    if (!showMozoModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowMozoModal(false);
      } else if (e.key === 'Enter' && pinInput.length === 4) {
        e.preventDefault();
        validateAndSubmitPin(pinInput);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const openTakeawayModal = () => {
    const defaultName =
      takeawayInfo.customerName.trim() ||
      firebaseUser?.displayName?.split(' ')[0] ||
      '';
    setTakeawayNameDraft(defaultName);
    setTakeawayPickupDraft(takeawayInfo.pickupNote);
    setTakeawayError('');
    setShowTakeawayModal(true);
  };

  const applyPickupChip = (chip: string) => {
    const label = `Retira en ${chip}`;
    setTakeawayPickupDraft((prev) => {
      const cleaned = prev
        .replace(/Retira en \d+\s*min\s*·?\s*/gi, '')
        .trim();
      return cleaned ? `${label} · ${cleaned}` : label;
    });
  };

  const handleConfirmTakeaway = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = takeawayNameDraft.trim();
    if (!cleanName) {
      setTakeawayError('Ingresa tu nombre para identificar tu pedido.');
      return;
    }
    setShowTakeawayModal(false);
    onSelectTakeaway({
      customerName: cleanName.slice(0, 80),
      pickupNote: takeawayPickupDraft.trim().slice(0, 120),
    });
  };

  const handleBrowseTakeawayMenu = () => {
    setShowTakeawayModal(false);
    onSelectTakeaway({
      customerName: takeawayNameDraft.trim().slice(0, 80),
      pickupNote: takeawayPickupDraft.trim().slice(0, 120),
    });
  };

  return (
    <div className="relative flex-1 min-h-0 overflow-y-auto phone-scroll bg-[var(--bg-canvas)] text-[var(--ink-primary)]">
      <div className="min-h-[100dvh] md:min-h-full flex flex-col justify-between px-5 py-8">
        {/* Centered 3-Block Minimalist Welcome Container */}
        <div className="my-auto w-full max-w-xl lg:max-w-3xl mx-auto flex flex-col gap-6 sm:gap-8">
          {/* Bloque 1: Cabecera de identidad */}
          <header className="flex flex-col items-start min-w-0">
            <div className="w-full flex flex-col items-center text-center gap-2">
              <button
                type="button"
                onClick={handleLogoTap}
                aria-label="Como en Casa"
                className="rounded-2xl active:scale-[0.97] transition-transform duration-150 ease-[var(--ease-out)] cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              >
                <OfficialLogo size="sm" />
              </button>

              <span className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--ink-muted)]">
                <MapPin className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
                <span>Tupiza, Potosí</span>
              </span>

              {logoTapCount >= 2 && (
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-[11px] font-semibold text-[var(--ink-primary)] tabular-nums">
                  Acceso personal: {logoTapCount}/5
                </span>
              )}

              {isMozoLoggedIn && (
                <button
                  type="button"
                  onClick={onGoMozoComandas}
                  className="min-h-[36px] px-3 py-1 rounded-xl bg-[var(--status-ok)]/12 border border-[var(--status-ok)]/30 text-[var(--status-ok)] text-xs font-bold hover:bg-[var(--status-ok)]/20 active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                >
                  Sesión Mozo activa — Ir a Comandas
                </button>
              )}
            </div>

            <h1 className="mt-5 font-serif-display text-[1.75rem] sm:text-4xl lg:text-[2.65rem] font-bold text-[var(--ink-primary)] leading-[1.12] tracking-tight min-w-0 [overflow-wrap:break-word]">
              Cocina tradicional de Tupiza, hecha al día
            </h1>

            <p className="mt-2.5 text-sm sm:text-base text-[var(--ink-muted)] leading-relaxed max-w-xl">
              Elige cómo prefieres disfrutar nuestros platos caseros y sopas del día con precios claros en Bs.
            </p>
          </header>

          {/* Bloque 2: Selector Bento de 3 vías */}
          <section
            aria-label="Modalidad de pedido"
            className="w-full grid grid-cols-1 lg:grid-cols-12 gap-3"
          >
            {/* Botón protagonista: Comer en el local */}
            <button
              type="button"
              onClick={onSelectDineIn}
              className="lg:col-span-7 rounded-2xl bg-[var(--accent-primary)] text-[var(--bg-surface)] p-5 text-left flex flex-col justify-between gap-4 min-h-[124px] lg:min-h-[172px] hover:brightness-105 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink-primary)]"
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <UtensilsCrossed className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <ArrowRight className="w-5 h-5 opacity-90 shrink-0" />
              </div>

              <div className="min-w-0">
                <span className="block font-serif-display text-xl sm:text-2xl font-bold leading-snug">
                  Comer en el local
                </span>
                <span className="block text-xs sm:text-sm text-white/90 mt-1 font-medium leading-relaxed">
                  Selecciona tu mesa y envía tu pedido directo a cocina
                </span>
              </div>
            </button>

            {/* Accesos secundarios: 2 columnas compactas en móvil, apilados a la derecha en escritorio */}
            <div className="lg:col-span-5 grid grid-cols-2 lg:grid-cols-1 gap-3">
              <button
                type="button"
                onClick={openTakeawayModal}
                className="min-h-[104px] lg:min-h-0 flex-1 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] p-3.5 sm:p-4 text-left flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 lg:gap-3 hover:border-[var(--accent-primary)] hover:bg-[var(--bg-inset)]/40 active:scale-[0.97] transition-[transform,border-color,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              >
                <div className="flex items-center justify-between lg:justify-start lg:gap-3 w-full lg:w-auto min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[var(--bg-inset)] text-[var(--accent-primary)] flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-4 h-4" strokeWidth={2.2} />
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--ink-muted)] shrink-0 lg:hidden" />
                  <div className="hidden lg:block min-w-0">
                    <span className="block text-sm font-bold leading-tight">
                      Para Llevar
                    </span>
                    <span className="block text-xs text-[var(--ink-muted)] mt-0.5 leading-snug">
                      Retiro rápido en local
                    </span>
                  </div>
                </div>

                <div className="lg:hidden min-w-0">
                  <span className="block text-sm font-bold leading-tight">
                    Para Llevar
                  </span>
                  <span className="block text-xs text-[var(--ink-muted)] mt-0.5 leading-snug [overflow-wrap:break-word]">
                    Retiro rápido en local
                  </span>
                </div>

                <ArrowRight className="hidden lg:block w-4 h-4 text-[var(--ink-muted)] shrink-0" />
              </button>

              <button
                type="button"
                onClick={onSelectDelivery}
                className="min-h-[104px] lg:min-h-0 flex-1 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] p-3.5 sm:p-4 text-left flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 lg:gap-3 hover:border-[var(--accent-primary)] hover:bg-[var(--bg-inset)]/40 active:scale-[0.97] transition-[transform,border-color,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              >
                <div className="flex items-center justify-between lg:justify-start lg:gap-3 w-full lg:w-auto min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[var(--bg-inset)] text-[var(--accent-gold)] flex items-center justify-center shrink-0">
                    <Bike className="w-4 h-4" strokeWidth={2.3} />
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--ink-muted)] shrink-0 lg:hidden" />
                  <div className="hidden lg:block min-w-0">
                    <span className="block text-sm font-bold leading-tight">
                      Delivery
                    </span>
                    <span className="block text-xs text-[var(--ink-muted)] mt-0.5 leading-snug">
                      Envío a tu dirección
                    </span>
                  </div>
                </div>

                <div className="lg:hidden min-w-0">
                  <span className="block text-sm font-bold leading-tight">
                    Delivery
                  </span>
                  <span className="block text-xs text-[var(--ink-muted)] mt-0.5 leading-snug [overflow-wrap:break-word]">
                    Envío a tu dirección
                  </span>
                </div>

                <ArrowRight className="hidden lg:block w-4 h-4 text-[var(--ink-muted)] shrink-0" />
              </button>
            </div>
          </section>
        </div>

        {/* Bloque 3: Pie de página discreto en flujo normal (sin position fixed/absolute ni puntos medios) */}
        <footer className="w-full max-w-xl lg:max-w-3xl mx-auto mt-6 border-t border-[var(--border-subtle)]/70 flex flex-wrap items-center justify-center gap-6 pt-6 pb-4 text-center text-xs text-[var(--ink-muted)]">
          <button
            type="button"
            onClick={() => setShowLegalModal(true)}
            className="underline decoration-[var(--border-subtle)] underline-offset-4 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] active:scale-[0.97] transition-[transform,color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] rounded-sm py-1"
          >
            Términos y privacidad
          </button>

          <button
            type="button"
            onClick={onGoAdminLogin}
            className="underline decoration-[var(--border-subtle)] underline-offset-4 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] active:scale-[0.97] transition-[transform,color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] rounded-sm py-1"
          >
            Acceso administrador
          </button>
        </footer>
      </div>

      {/* Modal: Pedido Para Llevar (Retiro en local) */}
      {showTakeawayModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Pedido Para Llevar"
          onClick={() => setShowTakeawayModal(false)}
        >
          <form
            onSubmit={handleConfirmTakeaway}
            onClick={(e) => e.stopPropagation()}
            className="modal-surface my-auto w-full max-w-sm max-h-[92dvh] overflow-y-auto phone-scroll bg-[var(--ops-surface)] text-[var(--bg-canvas)] rounded-3xl border border-[var(--accent-gold)]/45 p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[var(--ops-accent)] text-[var(--bg-surface)] flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif-display text-lg font-bold text-[var(--bg-surface)] leading-tight">
                    Pedido para llevar
                  </h2>
                  <p className="text-xs font-medium text-[var(--accent-gold)]">
                    Retiro directo en el restaurante
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTakeawayModal(false)}
                aria-label="Cerrar"
                className="w-8 h-8 rounded-xl bg-[var(--ops-elevated)] flex items-center justify-center text-[var(--bg-canvas)]/80 hover:text-[var(--bg-surface)] active:scale-[0.97] transition-[transform,color] duration-150 ease-[var(--ease-out)] cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="welcome-takeaway-name"
                  className="block text-xs font-semibold text-[var(--accent-gold)] mb-1.5"
                >
                  ¿A qué nombre va el pedido? *
                </label>
                <input
                  id="welcome-takeaway-name"
                  type="text"
                  autoFocus
                  maxLength={80}
                  value={takeawayNameDraft}
                  onChange={(e) => {
                    setTakeawayError('');
                    setTakeawayNameDraft(e.target.value);
                  }}
                  placeholder="Ej. Carlos"
                  className={`w-full h-11 px-3.5 rounded-xl bg-[var(--ops-canvas)] border text-sm font-semibold text-[var(--bg-surface)] placeholder:text-white/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ops-accent)] ${
                    takeawayError
                      ? 'border-[var(--ops-accent)]'
                      : 'border-[var(--ops-border)]'
                  }`}
                />
                {takeawayError && (
                  <p className="text-xs font-semibold text-[var(--ops-accent)] mt-1">
                    {takeawayError}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="welcome-takeaway-pickup"
                  className="block text-xs font-semibold text-white/75 mb-1.5"
                >
                  Teléfono o hora de retiro (opcional)
                </label>
                <input
                  id="welcome-takeaway-pickup"
                  type="text"
                  maxLength={120}
                  value={takeawayPickupDraft}
                  onChange={(e) => setTakeawayPickupDraft(e.target.value)}
                  placeholder="Ej. Retira en 15 min · 71234567"
                  className="w-full h-10 px-3.5 rounded-xl bg-[var(--ops-canvas)] border border-[var(--ops-border)] text-xs font-medium text-[var(--bg-surface)] placeholder:text-white/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
                />

                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent-gold)]/85 mr-0.5">
                    <Clock className="w-3 h-3" />
                    Rápido:
                  </span>
                  {PICKUP_TIME_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => applyPickupChip(chip)}
                      className="px-2.5 py-1 rounded-lg bg-[var(--ops-elevated)] border border-[var(--ops-border)] text-[11px] font-semibold text-[var(--accent-gold)] hover:border-[var(--accent-gold)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                className="w-full min-h-[46px] rounded-2xl bg-[var(--ops-accent)] text-[var(--bg-surface)] font-bold text-sm flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] cursor-pointer shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Ir a la Carta — Para Llevar</span>
              </button>

              <button
                type="button"
                onClick={handleBrowseTakeawayMenu}
                className="w-full min-h-[40px] rounded-2xl bg-[var(--ops-elevated)] text-white/85 font-semibold text-xs hover:text-[var(--bg-surface)] hover:bg-white/10 active:scale-[0.97] cursor-pointer transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
              >
                Explorar carta primero
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Términos y Privacidad */}
      {showLegalModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowLegalModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="modal-surface my-auto w-full max-w-md bg-[var(--bg-surface)] text-[var(--ink-primary)] rounded-2xl border border-[var(--border-subtle)] p-5 shadow-xl"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif-display text-lg font-bold text-[var(--ink-primary)]">
                Términos y privacidad
              </h2>
              <button
                type="button"
                onClick={() => setShowLegalModal(false)}
                aria-label="Cerrar"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--ink-primary)] hover:bg-[var(--bg-inset)] active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
              Como en Casa - Comida Tradicional utiliza tus datos de mesa o entrega únicamente para
              gestionar tu pedido del día. Todos los precios están expresados en Bolivianos (Bs).
            </p>
            <button
              type="button"
              onClick={() => setShowLegalModal(false)}
              className="mt-4 w-full min-h-[44px] rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-surface)] font-bold text-sm active:scale-[0.97] transition-transform duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Modal: Acceso Mozo (4-digit PIN Login / Logout) */}
      {showMozoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Acceso Mozo"
        >
          <div className="modal-surface my-auto w-full max-w-sm max-h-[92dvh] overflow-y-auto phone-scroll bg-[var(--bg-surface)] text-[var(--ink-primary)] rounded-3xl border border-[var(--border-subtle)] p-4 sm:p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[var(--ink-primary)] text-[var(--accent-gold)] flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-serif-display text-lg font-bold text-[var(--ink-primary)] leading-tight">
                    {isMozoLoggedIn ? 'Sesión Mozo activa' : 'Acceso Mozo'}
                  </h2>
                  <p className="text-xs font-medium text-[var(--ink-muted)]">
                    {isMozoLoggedIn
                      ? 'Ingresa 4 números para cerrar sesión'
                      : 'Introduce tu PIN de 4 números'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMozoModal(false)}
                aria-label="Cerrar"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--ink-primary)] hover:bg-[var(--bg-inset)] active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isMozoLoggedIn && (
              <button
                type="button"
                onClick={() => {
                  setShowMozoModal(false);
                  onGoMozoComandas();
                }}
                className="w-full min-h-[42px] rounded-2xl bg-[var(--accent-gold)] text-[var(--ink-primary)] font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-105 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>Entrar a Comandas</span>
              </button>
            )}

            {/* Google Staff Sync Status inside PIN Modal */}
            {firebaseUser && isStaff ? (
              <div className="rounded-xl bg-[var(--status-ok)]/10 border border-[var(--status-ok)]/30 px-3 py-2 flex items-center gap-2 text-xs font-semibold text-[var(--status-ok)]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  Sincronizado en vivo: {firebaseUser.email}
                </span>
              </div>
            ) : (
              <div className="rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] px-3 py-2 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[var(--ink-muted)] leading-tight">
                  {firebaseUser
                    ? `Cuenta (${firebaseUser.email}) sin rol de personal`
                    : 'Conecta Google autorizado para sincronizar en vivo'}
                </span>
                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  className="px-2.5 py-1.5 rounded-lg bg-[var(--ink-primary)] text-[var(--bg-surface)] text-xs font-semibold inline-flex items-center gap-1 hover:opacity-90 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                >
                  <LogIn className="w-3 h-3 text-[var(--accent-gold)]" />
                  <span>{firebaseUser ? 'Cambiar' : 'Conectar'}</span>
                </button>
              </div>
            )}

            {/* 4-digit visual slots */}
            <div className="grid grid-cols-4 gap-2.5 py-1">
              {[0, 1, 2, 3].map((idx) => {
                const filled = idx < pinInput.length;
                return (
                  <div
                    key={idx}
                    className={`h-13 rounded-2xl border-2 flex items-center justify-center text-xl font-bold tabular-nums transition-colors duration-150 ease-[var(--ease-out)] ${
                      filled
                        ? 'bg-[var(--ink-primary)] border-[var(--ink-primary)] text-[var(--accent-gold)]'
                        : 'bg-[var(--bg-inset)] border-[var(--border-subtle)] text-[var(--ink-muted)]'
                    }`}
                  >
                    {filled ? '●' : ''}
                  </div>
                );
              })}
            </div>

            {pinError && (
              <p className="text-xs font-semibold text-[var(--status-danger)] bg-[var(--status-danger)]/10 border border-[var(--status-danger)]/35 rounded-xl px-3 py-2 text-center">
                {pinError}
              </p>
            )}

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigitPress(digit)}
                  className="h-12 rounded-2xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-base font-bold text-[var(--ink-primary)] hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setPinInput('');
                  setPinError('');
                }}
                className="h-12 rounded-2xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--ink-muted)] hover:text-[var(--ink-primary)] active:scale-[0.97] transition-[transform,color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              >
                Limpiar
              </button>

              <button
                type="button"
                onClick={() => handleDigitPress('0')}
                className="h-12 rounded-2xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-base font-bold text-[var(--ink-primary)] hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                aria-label="Borrar último dígito"
                className="h-12 rounded-2xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-[var(--ink-primary)] flex items-center justify-center hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs font-medium text-[var(--ink-muted)] pt-1">
              <span>
                PIN por defecto: {mozoPin === '1234' ? '1234' : '4 dígitos'}
              </span>
              {isMozoLoggedIn && (
                <span className="inline-flex items-center gap-1 text-[var(--accent-primary)] font-bold">
                  <LogOut className="w-3 h-3" />
                  Modo logout
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
