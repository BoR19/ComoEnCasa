import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  Delete,
  KeyRound,
  ShoppingBag,
  Truck,
  X,
} from 'lucide-react';
import { KitchenOrder } from '../types/app';
import { getTakeawayCustomerName } from '../utils/appHelpers';

interface VerifyDeliveryCodeModalProps {
  order: KitchenOrder | null;
  onClose: () => void;
  onVerified: (order: KitchenOrder, code: string) => void;
}

export const VerifyDeliveryCodeModal: React.FC<VerifyDeliveryCodeModalProps> = ({
  order,
  onClose,
  onVerified,
}) => {
  const [digits, setDigits] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!order) return;
    setDigits('');
    setErrorMsg('');
  }, [order]);

  const submitCode = (candidate: string) => {
    if (!order) return;
    if (candidate.length !== 4) {
      setErrorMsg('Ingresa los 4 dígitos del código de confirmación.');
      return;
    }
    if (order.confirmationCode && candidate !== order.confirmationCode) {
      setErrorMsg(
        'Código incorrecto. Verifica los 4 dígitos directamente con el cliente.'
      );
      setDigits('');
      return;
    }
    setErrorMsg('');
    onVerified(order, candidate);
  };

  const handleDigitPress = (digit: string) => {
    if (digits.length >= 4) return;
    setErrorMsg('');
    const next = digits + digit;
    setDigits(next);
    if (next.length === 4) {
      submitCode(next);
    }
  };

  const handleBackspace = () => {
    setErrorMsg('');
    setDigits((prev) => prev.slice(0, -1));
  };

  useEffect(() => {
    if (!order) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' && digits.length === 4) {
        e.preventDefault();
        submitCode(digits);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (!order) return null;

  const isTakeaway = order.mode === 'takeaway';
  const customerTitle = isTakeaway
    ? `Para Llevar • ${getTakeawayCustomerName(order)}`
    : order.customerLabel;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Confirmar entrega ${order.code}`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-surface my-auto w-full max-w-sm max-h-[92dvh] overflow-y-auto phone-scroll rounded-3xl bg-[var(--ops-surface)] text-[var(--bg-canvas)] border border-[var(--accent-gold)]/55 p-4 sm:p-5 shadow-2xl space-y-4"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--ops-accent)] text-[var(--bg-surface)] flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif-display text-lg font-bold text-[var(--bg-surface)] leading-tight">
                Confirmar entrega
              </h3>
              <p className="text-xs font-medium text-[var(--accent-gold)] truncate">
                Pide al cliente su código de 4 dígitos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 rounded-xl bg-[var(--ops-elevated)] flex items-center justify-center text-white/80 hover:text-white active:scale-[0.97] transition-[transform,color] duration-150 ease-[var(--ease-out)] cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Order Context Badge */}
        <div className="rounded-2xl bg-[var(--ops-canvas)] border border-[var(--ops-border)] px-3.5 py-2.5 flex items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-2">
            {isTakeaway ? (
              <ShoppingBag className="w-4 h-4 text-[var(--ops-accent)] shrink-0" />
            ) : (
              <Truck className="w-4 h-4 text-[var(--accent-gold)] shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-mono font-bold text-[var(--accent-gold)]">
                {order.code}
              </p>
              <p className="text-xs font-bold text-[var(--bg-surface)] truncate">
                {customerTitle}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-[var(--accent-gold)] tabular-nums shrink-0">
            Bs. {order.total.toFixed(2)}
          </span>
        </div>

        {/* 4-Digit Visual Slots */}
        <div className="grid grid-cols-4 gap-2.5">
          {[0, 1, 2, 3].map((idx) => {
            const char = digits[idx] || '';
            const isCurrent = idx === digits.length;
            return (
              <div
                key={idx}
                className={`h-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-mono font-bold tabular-nums transition-colors duration-150 ease-[var(--ease-out)] ${
                  errorMsg
                    ? 'bg-[var(--ops-canvas)] border-[var(--ops-accent)] text-[var(--ops-accent)]'
                    : char
                    ? 'bg-[var(--ops-canvas)] border-[var(--accent-gold)] text-[var(--accent-gold)]'
                    : isCurrent
                    ? 'bg-[var(--ops-canvas)] border-[var(--ops-accent)]/75 text-[var(--bg-surface)]'
                    : 'bg-[var(--ops-canvas)] border-[var(--ops-border)] text-white/30'
                }`}
              >
                {char || '•'}
              </div>
            );
          })}
        </div>

        {errorMsg && (
          <p className="text-xs font-bold text-white bg-[var(--ops-accent)]/20 border border-[var(--ops-accent)]/50 rounded-xl px-3 py-2 text-center">
            {errorMsg}
          </p>
        )}

        {/* Touch & Keyboard Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitPress(digit)}
              className="h-12 rounded-2xl bg-[var(--ops-elevated)] border border-[var(--ops-border)] text-base font-bold text-[var(--bg-surface)] hover:bg-white/10 hover:border-[var(--accent-gold)]/60 active:scale-[0.97] transition-[transform,background-color,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={() => {
              setDigits('');
              setErrorMsg('');
            }}
            className="h-12 rounded-2xl bg-[var(--ops-canvas)] border border-[var(--ops-border)] text-xs font-bold text-white/70 hover:text-white hover:bg-[var(--ops-elevated)] active:scale-[0.97] transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
          >
            Limpiar
          </button>

          <button
            type="button"
            onClick={() => handleDigitPress('0')}
            className="h-12 rounded-2xl bg-[var(--ops-elevated)] border border-[var(--ops-border)] text-base font-bold text-[var(--bg-surface)] hover:bg-white/10 hover:border-[var(--accent-gold)]/60 active:scale-[0.97] transition-[transform,background-color,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Borrar último dígito"
            className="h-12 rounded-2xl bg-[var(--ops-canvas)] border border-[var(--ops-border)] text-[var(--accent-gold)] flex items-center justify-center hover:bg-[var(--ops-elevated)] active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Manual Submit CTA */}
        <button
          type="button"
          disabled={digits.length < 4}
          onClick={() => submitCode(digits)}
          className="w-full min-h-[46px] rounded-2xl bg-[var(--status-ok)] text-[var(--bg-surface)] font-bold text-sm flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-45 disabled:cursor-not-allowed active:scale-[0.97] cursor-pointer transition-[transform,filter,opacity] duration-150 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Verificar y marcar entregado</span>
        </button>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
