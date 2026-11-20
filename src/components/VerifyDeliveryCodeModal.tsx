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
        className="my-auto w-full max-w-sm max-h-[92dvh] overflow-y-auto phone-scroll rounded-3xl bg-[#1E1E1E] text-[#FFF8E8] border border-[#D9A441]/55 p-4 sm:p-5 shadow-2xl space-y-4"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#E64833] text-[#FFF8E8] flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif-display text-lg font-bold text-[#FFF8E8] leading-tight">
                Confirmar Entrega
              </h3>
              <p className="text-[11px] font-semibold text-[#E8C87A] truncate">
                Pide al cliente su código de 4 dígitos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 rounded-xl bg-[#2A2A2A] flex items-center justify-center text-[#FFF8E8]/80 hover:text-[#FFF8E8] cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Order Context Badge */}
        <div className="rounded-2xl bg-[#141414] border border-[#2E2E2E] px-3.5 py-2.5 flex items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-2">
            {isTakeaway ? (
              <ShoppingBag className="w-4 h-4 text-[#E64833] shrink-0" />
            ) : (
              <Truck className="w-4 h-4 text-[#D9A441] shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-mono font-bold text-[#D9A441]">
                {order.code}
              </p>
              <p className="text-xs font-extrabold text-[#FFF8E8] truncate">
                {customerTitle}
              </p>
            </div>
          </div>
          <span className="text-xs font-extrabold text-[#D9A441] tabular-nums shrink-0">
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
                className={`h-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-mono font-extrabold tabular-nums transition-colors ${
                  errorMsg
                    ? 'bg-[#141414] border-[#E64833] text-[#E64833]'
                    : char
                    ? 'bg-[#141414] border-[#D9A441] text-[#D9A441]'
                    : isCurrent
                    ? 'bg-[#141414] border-[#E64833]/75 text-[#FFF8E8]'
                    : 'bg-[#141414] border-[#2E2E2E] text-[#FFF8E8]/30'
                }`}
              >
                {char || '•'}
              </div>
            );
          })}
        </div>

        {errorMsg && (
          <p className="text-xs font-extrabold text-[#FF9B8A] bg-[#E64833]/15 border border-[#E64833]/45 rounded-xl px-3 py-2 text-center">
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
              className="h-12 rounded-2xl bg-[#2A2A2A] border border-[#3A3A3A] text-base font-extrabold text-[#FFF8E8] hover:bg-[#353535] hover:border-[#D9A441]/60 active:scale-95 transition-all cursor-pointer tabular-nums"
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
            className="h-12 rounded-2xl bg-[#141414] border border-[#2E2E2E] text-xs font-extrabold text-[#FFF8E8]/70 hover:text-[#FFF8E8] hover:bg-[#252525] cursor-pointer"
          >
            Limpiar
          </button>

          <button
            type="button"
            onClick={() => handleDigitPress('0')}
            className="h-12 rounded-2xl bg-[#2A2A2A] border border-[#3A3A3A] text-base font-extrabold text-[#FFF8E8] hover:bg-[#353535] hover:border-[#D9A441]/60 active:scale-95 transition-all cursor-pointer tabular-nums"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Borrar último dígito"
            className="h-12 rounded-2xl bg-[#141414] border border-[#2E2E2E] text-[#D9A441] flex items-center justify-center hover:bg-[#252525] active:scale-95 cursor-pointer"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Manual Submit CTA */}
        <button
          type="button"
          disabled={digits.length < 4}
          onClick={() => submitCode(digits)}
          className="w-full min-h-[46px] rounded-2xl bg-[#2E6F32] text-[#FFF8E8] font-extrabold text-sm flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer transition-all"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Verificar y Marcar Entregado</span>
        </button>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
