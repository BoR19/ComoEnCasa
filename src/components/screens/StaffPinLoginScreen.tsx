import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  Delete,
  KeyRound,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { ActiveStaffSession } from '../../types/app';
import { OfficialLogo } from '../BrandAssets';

interface StaffPinLoginScreenProps {
  activeStaffSession: ActiveStaffSession | null;
  hasDefaultPins?: boolean;
  onSubmitPin: (pin: string) => Promise<{
    ok: boolean;
    error?: string;
    session?: ActiveStaffSession;
  }>;
  onEnterWorkspace: () => void;
  onLogoutShift: () => void;
  onBack: () => void;
}

const KEYPAD_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export const StaffPinLoginScreen: React.FC<StaffPinLoginScreenProps> = ({
  activeStaffSession,
  hasDefaultPins = false,
  onSubmitPin,
  onEnterWorkspace,
  onLogoutShift,
  onBack,
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitCandidatePin = useCallback(
    async (candidate: string) => {
      if (candidate.length !== 4 || submitting) return;
      setSubmitting(true);
      setErrorMsg('');
      try {
        const res = await onSubmitPin(candidate);
        if (!res.ok) {
          setErrorMsg(
            res.error || 'PIN incorrecto. Verifica tus 4 dígitos.'
          );
          setPin('');
        }
      } catch {
        setErrorMsg('No se pudo verificar el PIN. Intenta nuevamente.');
        setPin('');
      } finally {
        setSubmitting(false);
      }
    },
    [onSubmitPin, submitting]
  );

  const handleDigitPress = useCallback(
    (digit: string) => {
      if (submitting || pin.length >= 4) return;
      setErrorMsg('');
      const next = `${pin}${digit}`;
      setPin(next);
      if (next.length === 4) {
        void submitCandidatePin(next);
      }
    },
    [pin, submitCandidatePin, submitting]
  );

  const handleBackspace = useCallback(() => {
    if (submitting) return;
    setErrorMsg('');
    setPin((prev) => prev.slice(0, -1));
  }, [submitting]);

  const handleClear = useCallback(() => {
    if (submitting) return;
    setErrorMsg('');
    setPin('');
  }, [submitting]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onBack();
      } else if (e.key === 'Enter' && pin.length === 4) {
        e.preventDefault();
        void submitCandidatePin(pin);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleBackspace, handleDigitPress, onBack, pin, submitCandidatePin]);

  return (
    <div className="flex-1 flex flex-col bg-[var(--ops-canvas)] text-[var(--bg-canvas)] min-h-0">
      <div className="px-3 pt-3 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-2.5 py-1.5 rounded-xl text-xs font-bold text-[var(--accent-gold)] hover:bg-[var(--ops-elevated)] inline-flex items-center gap-1.5 active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          <span>Volver al inicio</span>
        </button>

        {activeStaffSession && (
          <button
            type="button"
            onClick={onLogoutShift}
            className="min-h-[44px] px-3 py-1.5 rounded-xl bg-[var(--ops-surface)] border border-[var(--ops-border)] text-xs font-bold text-[var(--bg-canvas)] hover:border-[var(--ops-accent)] inline-flex items-center gap-1.5 active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ops-accent)]"
          >
            <LogOut className="w-3.5 h-3.5 text-[var(--ops-accent)]" />
            <span>Cerrar turno</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto phone-scroll px-4 sm:px-6 py-4 flex flex-col">
        <div className="my-auto max-w-md w-full mx-auto rounded-3xl border border-[var(--ops-border)] bg-[var(--ops-surface)] p-5 sm:p-7 space-y-5 shadow-2xl">
          {/* Identity Header */}
          <div className="flex flex-col items-center text-center">
            <OfficialLogo size="sm" />
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--ops-elevated)] border border-[var(--ops-border)] text-[11px] font-semibold text-[var(--accent-gold)]">
              <KeyRound className="w-3.5 h-3.5 shrink-0" />
              <span>Acceso por PIN de 4 dígitos</span>
            </div>
            <h1 className="font-serif-display text-2xl font-bold text-[var(--bg-surface)] mt-2.5">
              Acceso personal y administración
            </h1>
            <p className="text-xs text-white/70 mt-1 max-w-xs leading-relaxed">
              Ingresa tu PIN asignado para iniciar turno en Cocina, Caja, Mesas o Administración.
            </p>
          </div>

          {/* Active Shift Banner */}
          {activeStaffSession && (
            <div className="rounded-2xl bg-[var(--ops-elevated)] border border-[var(--status-ok)]/50 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-[var(--status-ok-bright)] shrink-0" />
                  <p className="text-xs font-bold text-[var(--bg-surface)] truncate">
                    Turno: {activeStaffSession.name} — {activeStaffSession.role}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onEnterWorkspace}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-[var(--accent-gold)] text-[var(--ink-primary)] text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:brightness-105 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Ir a mi panel</span>
                </button>
                <button
                  type="button"
                  onClick={onLogoutShift}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-[var(--ops-canvas)] border border-[var(--ops-border)] text-[var(--bg-canvas)] text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:border-[var(--ops-accent)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ops-accent)]"
                >
                  <LogOut className="w-3.5 h-3.5 text-[var(--ops-accent)] shrink-0" />
                  <span>Cerrar turno</span>
                </button>
              </div>
            </div>
          )}

          {/* 4-Digit PIN Slots */}
          <div className="space-y-2.5">
            <div
              role="status"
              aria-label={`${pin.length} de 4 dígitos ingresados`}
              className="grid grid-cols-4 gap-3"
            >
              {[0, 1, 2, 3].map((idx) => {
                const filled = idx < pin.length;
                const isNext = idx === pin.length && !submitting;
                return (
                  <div
                    key={idx}
                    className={`h-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-bold tabular-nums transition-[background-color,border-color,color] duration-150 ease-[var(--ease-out)] ${
                      filled
                        ? 'bg-[var(--ops-accent)] border-[var(--ops-accent)] text-white'
                        : isNext
                        ? 'bg-[var(--ops-canvas)] border-[var(--accent-gold)] text-[var(--accent-gold)]'
                        : 'bg-[var(--ops-canvas)] border-[var(--ops-border)] text-white/30'
                    }`}
                  >
                    {filled ? '●' : ''}
                  </div>
                );
              })}
            </div>

            {errorMsg && (
              <p
                role="alert"
                className="text-xs font-semibold text-white bg-[var(--ops-accent)]/20 border border-[var(--ops-accent)]/55 rounded-xl px-3 py-2 text-center"
              >
                {errorMsg}
              </p>
            )}

            {submitting && (
              <p className="text-xs font-semibold text-[var(--accent-gold)] text-center">
                Verificando credenciales...
              </p>
            )}
          </div>

          {/* Tactile Numeric Keypad (>= 54x54px hit targets) */}
          <div className="grid grid-cols-3 gap-2.5">
            {KEYPAD_DIGITS.map((digit) => (
              <button
                key={digit}
                type="button"
                disabled={submitting}
                onClick={() => handleDigitPress(digit)}
                className="min-h-[56px] min-w-[56px] rounded-2xl bg-[var(--ops-elevated)] border border-[var(--ops-border)] text-xl font-bold text-[var(--bg-surface)] hover:border-[var(--accent-gold)]/70 active:scale-[0.97] transition-[transform,border-color,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer tabular-nums disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              disabled={submitting || pin.length === 0}
              onClick={handleClear}
              className="min-h-[56px] min-w-[56px] rounded-2xl bg-[var(--ops-canvas)] border border-[var(--ops-border)] text-xs font-bold text-white/75 hover:text-white hover:border-[var(--ops-accent)]/60 active:scale-[0.97] transition-[transform,border-color,color] duration-150 ease-[var(--ease-out)] cursor-pointer disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
            >
              Limpiar
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleDigitPress('0')}
              className="min-h-[56px] min-w-[56px] rounded-2xl bg-[var(--ops-elevated)] border border-[var(--ops-border)] text-xl font-bold text-[var(--bg-surface)] hover:border-[var(--accent-gold)]/70 active:scale-[0.97] transition-[transform,border-color,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer tabular-nums disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
            >
              0
            </button>

            <button
              type="button"
              disabled={submitting || pin.length === 0}
              onClick={handleBackspace}
              aria-label="Borrar último dígito"
              className="min-h-[56px] min-w-[56px] rounded-2xl bg-[var(--ops-canvas)] border border-[var(--ops-border)] text-[var(--accent-gold)] flex items-center justify-center hover:border-[var(--ops-accent)]/60 active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          <footer className="text-center space-y-1 pt-1 border-t border-[var(--ops-border)]">
            <p className="text-[11px] font-semibold text-white/65">
              Acceso sin cuenta Google, sincronizado en vivo con Firestore
            </p>
            {hasDefaultPins && (
              <p className="text-[11px] text-[var(--accent-gold)]/90 tabular-nums">
                PIN inicial Admin: 0000 | Mozo inicial: 1234
              </p>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
};
