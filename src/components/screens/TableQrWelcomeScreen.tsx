import React, { useEffect, useState } from 'react';
import { ChevronLeft, MapPin, MessageCircle, QrCode, UtensilsCrossed } from 'lucide-react';
import { TableItem } from '../../types/app';
import { validateBoliviaPhone } from '../../utils/ticketHelpers';
import { OfficialLogo } from '../BrandAssets';

interface TableQrWelcomeScreenProps {
  tableNumber: number;
  table?: TableItem;
  initialPhone?: string;
  onConfirmWithPhone: (phone: string) => void;
  onSkipToMenu: () => void;
  onGoHome: () => void;
}

export const TableQrWelcomeScreen: React.FC<TableQrWelcomeScreenProps> = ({
  tableNumber,
  table,
  initialPhone = '',
  onConfirmWithPhone,
  onSkipToMenu,
  onGoHome,
}) => {
  const [phoneInput, setPhoneInput] = useState(initialPhone);
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    setPhoneInput(initialPhone);
    setPhoneError('');
  }, [initialPhone, tableNumber]);

  const tableLabel = table?.name?.trim() || `Mesa ${tableNumber}`;
  const tableZone = table?.zone?.trim() || 'Salón Principal';
  const normalizedTableLabel = tableLabel.includes('-')
    ? tableLabel
    : `${tableLabel} — ${tableZone}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateBoliviaPhone(phoneInput);
    if (!result.valid) {
      setPhoneError(
        result.error ||
          'Ingresa un número celular válido de Bolivia (8 dígitos, empezando en 6 o 7).'
      );
      return;
    }
    setPhoneError('');
    onConfirmWithPhone(result.localDigits);
  };

  return (
    <div className="relative flex-1 min-h-0 overflow-y-auto phone-scroll bg-[var(--bg-canvas)] text-[var(--ink-primary)]">
      <div className="min-h-[100dvh] md:min-h-full flex flex-col justify-between px-5 py-4 sm:py-7">
        <div className="w-full max-w-lg mx-auto flex items-center justify-start pb-2">
          <button
            type="button"
            onClick={onGoHome}
            className="min-h-[44px] px-2.5 -ml-2 rounded-xl inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-inset)]/60 active:scale-[0.97] transition-[transform,color,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
          >
            <ChevronLeft className="w-4 h-4 shrink-0" />
            <span>Volver al inicio</span>
          </button>
        </div>

        <div className="my-auto w-full max-w-lg mx-auto flex flex-col items-center gap-6 py-2">
          {/* Bloque 1: Identidad y mesa detectada */}
          <header className="w-full flex flex-col items-center text-center">
            <button
              type="button"
              onClick={onGoHome}
              aria-label="Como en Casa — Ir al inicio"
              className="rounded-2xl active:scale-[0.97] transition-transform duration-150 ease-[var(--ease-out)] cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
            >
              <OfficialLogo size="sm" />
            </button>

            <span className="mt-2 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--ink-muted)]">
              <MapPin className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
              <span>Tupiza, Potosí</span>
            </span>

            <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--ink-primary)]">
              <QrCode className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
              <span>Estás en {normalizedTableLabel}</span>
            </div>

            <h1 className="mt-4 font-serif-display text-[1.75rem] sm:text-4xl font-bold text-[var(--ink-primary)] leading-[1.12] tracking-tight [overflow-wrap:break-word]">
              Bienvenido a tu mesa, cocina tupiceña al momento
            </h1>

            <p className="mt-2.5 text-sm text-[var(--ink-muted)] leading-relaxed max-w-md">
              Ingresa tu número para enviarte tu recibo digital y ofertas especiales
            </p>
          </header>

          {/* Bloque 2: Formulario limpio de WhatsApp Bolivia */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="w-full rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 sm:p-6 shadow-xs space-y-4"
          >
            <div className="space-y-1.5">
              <label
                htmlFor="qr-table-whatsapp"
                className="flex items-center justify-between gap-2 text-xs font-bold text-[var(--ink-primary)]"
              >
                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-[var(--status-ok)] shrink-0" />
                  <span>Número de WhatsApp (Bolivia)</span>
                </span>
                <span className="text-[11px] font-semibold text-[var(--ink-muted)] tabular-nums">
                  8 dígitos (6 o 7)
                </span>
              </label>

              <div
                className={`flex items-center rounded-2xl bg-[var(--bg-canvas)] border overflow-hidden transition-[border-color] duration-150 ease-[var(--ease-out)] focus-within:ring-2 focus-within:ring-[var(--accent-primary)] ${
                  phoneError
                    ? 'border-[var(--status-danger)]'
                    : 'border-[var(--border-subtle)]'
                }`}
              >
                <span className="h-12 px-3.5 bg-[var(--bg-inset)] border-r border-[var(--border-subtle)] flex items-center text-sm font-bold text-[var(--ink-primary)] tabular-nums shrink-0">
                  +591
                </span>
                <input
                  id="qr-table-whatsapp"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={12}
                  value={phoneInput}
                  onChange={(e) => {
                    setPhoneError('');
                    setPhoneInput(e.target.value.replace(/[^\d+\s-]/g, ''));
                  }}
                  placeholder="71234567"
                  className="flex-1 h-12 px-3.5 bg-transparent text-base font-bold text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)]/55 tabular-nums focus:outline-none"
                />
              </div>

              {phoneError && (
                <p
                  role="alert"
                  className="text-xs font-semibold text-[var(--status-danger)] pt-0.5"
                >
                  {phoneError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-[var(--accent-primary)] text-[var(--bg-surface)] font-bold text-sm flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink-primary)]"
            >
              <UtensilsCrossed className="w-4 h-4 shrink-0" />
              <span>Ver la carta y pedir</span>
            </button>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={onSkipToMenu}
                className="min-h-[40px] px-3 py-1.5 text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--ink-primary)] underline decoration-[var(--border-subtle)] underline-offset-4 active:scale-[0.97] transition-[transform,color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] rounded-lg"
              >
                Continuar sin registrar número
              </button>
            </div>
          </form>
        </div>

        <footer className="w-full max-w-lg mx-auto pt-4 text-center text-[11px] text-[var(--ink-muted)]">
          Como en Casa — Tu pedido va directo a cocina para {tableLabel}
        </footer>
      </div>
    </div>
  );
};
