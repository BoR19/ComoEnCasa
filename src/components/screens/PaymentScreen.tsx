import React, { useMemo, useState } from 'react';
import {
  Banknote,
  Building2,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  KeyRound,
  Printer,
  QrCode,
} from 'lucide-react';
import { KitchenOrder, PaymentMethod } from '../../types/app';
import { PAYMENT_METHODS, formatBs, getCurrentTimeLabel } from '../../utils/appHelpers';
import { QrCodeSvg } from '../BrandAssets';
import { MobileHeader } from '../ShellComponents';
import { TicketModal } from '../TicketModal';

interface PaymentMethodsScreenProps {
  summaryLabel: string;
  totalAmount: number;
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
  onContinue: () => void;
  onBack: () => void;
}

const METHOD_ICONS: Record<
  PaymentMethod,
  React.ComponentType<{ className?: string }>
> = {
  Efectivo: Banknote,
  QR: QrCode,
  'Transferencia Bancaria': Building2,
  Tarjeta: CreditCard,
};

export const PaymentMethodsScreen: React.FC<PaymentMethodsScreenProps> = ({
  summaryLabel,
  totalAmount,
  selectedMethod,
  onSelectMethod,
  onContinue,
  onBack,
}) => {
  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-canvas)] min-h-0">
      <MobileHeader title="Métodos de Pago" onBack={onBack} />

      <div className="flex-1 overflow-y-auto phone-scroll">
        <div className="max-w-xl mx-auto w-full px-4 lg:px-8 pt-4 lg:pt-8 pb-6 space-y-5">
          <div className="text-center space-y-1.5">
            <p className="font-bold text-sm lg:text-base text-[var(--ink-primary)]">{summaryLabel}</p>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-[var(--accent-primary)] text-[var(--bg-canvas)] font-bold text-sm tabular-nums">
              <span>Total {formatBs(totalAmount)}</span>
            </div>
          </div>

          <div className="space-y-2.5 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
            {PAYMENT_METHODS.map((method) => {
              const Icon = METHOD_ICONS[method];
              const active = selectedMethod === method;
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => onSelectMethod(method)}
                  className={`w-full min-h-[54px] px-4 py-3 rounded-2xl border flex items-center justify-between transition-[transform,background-color,border-color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer ${
                    active
                      ? 'bg-[var(--accent-gold)] border-[var(--accent-primary)] text-[var(--ink-primary)] font-bold'
                      : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--ink-primary)] font-semibold hover:border-[var(--accent-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        active ? 'border-[var(--ink-primary)]' : 'border-[var(--ink-muted)]'
                      }`}
                    >
                      {active && <span className="w-2.5 h-2.5 rounded-full bg-[var(--ink-primary)]" />}
                    </span>
                    <Icon className="w-5 h-5 text-[var(--ink-primary)] shrink-0" />
                    <span className="text-sm text-left">{method}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-3.5 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] shrink-0">
        <div className="max-w-md mx-auto w-full">
          <button
            type="button"
            onClick={onContinue}
            className="w-full min-h-[50px] px-5 py-3 rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-canvas)] font-bold text-sm flex items-center justify-center hover:opacity-95 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer tabular-nums"
          >
            {selectedMethod === 'QR'
              ? `Pagar con QR · ${formatBs(totalAmount)}`
              : `Confirmar pago (${selectedMethod}) · ${formatBs(totalAmount)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

interface PaymentQrScreenProps {
  totalAmount: number;
  onPaid: () => void;
  onBack: () => void;
}

export const PaymentQrScreen: React.FC<PaymentQrScreenProps> = ({
  totalAmount,
  onPaid,
  onBack,
}) => {
  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-canvas)] min-h-0">
      <MobileHeader title="Pago con QR" onBack={onBack} />

      <div className="flex-1 overflow-y-auto phone-scroll px-5 py-6 flex flex-col">
        <div className="my-auto mx-auto w-full max-w-md flex flex-col items-center text-center space-y-4">
          <div className="w-full max-w-[228px] p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center">
            <QrCodeSvg seed={`como-en-casa-pago-${totalAmount}`} size={196} />
          </div>

          <div className="space-y-1">
            <h2 className="font-serif-display text-2xl font-bold text-[var(--ink-primary)]">
              Como en Casa
            </h2>
            <p className="text-lg font-bold text-[var(--accent-primary)] tabular-nums">
              Total {formatBs(totalAmount)}
            </p>
            <p className="text-xs font-semibold text-[var(--ink-muted)]">
              Instrucciones: Escanea y paga
            </p>
          </div>
        </div>
      </div>

      <div className="p-3.5 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] shrink-0">
        <div className="max-w-md mx-auto w-full">
          <button
            type="button"
            onClick={onPaid}
            className="w-full min-h-[50px] px-5 py-3 rounded-2xl bg-[var(--accent-primary)] text-[var(--bg-canvas)] font-bold text-sm flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Ya pagué</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface PaymentConfirmScreenProps {
  totalAmount: number;
  customerThanks: string;
  paymentMethod: PaymentMethod;
  paidOrder?: KitchenOrder;
  onTrackDelivery?: () => void;
  onBackToMenu: () => void;
  onBack: () => void;
}

export const PaymentConfirmScreen: React.FC<PaymentConfirmScreenProps> = ({
  totalAmount,
  customerThanks,
  paymentMethod,
  paidOrder,
  onTrackDelivery,
  onBackToMenu,
  onBack,
}) => {
  const [showReceipt, setShowReceipt] = useState(false);

  const ticketOrder: KitchenOrder = useMemo(() => {
    if (paidOrder) return paidOrder;
    return {
      id: 'comprobante-directo',
      code: '#1001',
      mode: 'dine-in',
      customerLabel: customerThanks,
      items: [],
      notes: '',
      status: 'Preparando',
      total: totalAmount,
      estimatedMinutes: 15,
      createdAt: getCurrentTimeLabel(),
      paid: true,
      paymentMethod,
    };
  }, [paidOrder, customerThanks, totalAmount, paymentMethod]);

  return (
    <div className="relative flex-1 flex flex-col bg-[var(--bg-canvas)] min-h-0">
      <MobileHeader title="Confirmación de Pago" onBack={onBack} />

      <div className="flex-1 overflow-y-auto phone-scroll px-5 py-6 sm:py-8 flex flex-col">
        <div className="my-auto mx-auto max-w-md w-full space-y-4 flex flex-col items-center text-center">
          <div className="w-18 h-18 rounded-full bg-[var(--status-ok)]/12 flex items-center justify-center">
            <CheckCircle2 className="w-14 h-14 text-[var(--status-ok)]" strokeWidth={2.2} />
          </div>

          <div className="space-y-1">
            <h2 className="font-serif-display text-2xl font-bold text-[var(--ink-primary)]">
              Pago Exitoso
            </h2>
            <p className="text-3xl font-bold text-[var(--accent-primary)] tabular-nums">
              {formatBs(totalAmount)}
            </p>
            <p className="text-sm font-bold text-[var(--ink-muted)] pt-1">
              {customerThanks}
            </p>
          </div>

          {paidOrder &&
            (paidOrder.mode === 'takeaway' || paidOrder.mode === 'delivery') &&
            paidOrder.confirmationCode && (
              <div className="w-full rounded-2xl bg-[var(--ops-surface)] text-[var(--bg-canvas)] border border-[var(--ops-border)] p-3.5 flex items-center justify-between gap-3 text-left">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--accent-gold)] inline-flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-[var(--accent-gold)] shrink-0" />
                    <span>Código de entrega</span>
                  </p>
                  <p className="text-[11px] text-[var(--bg-canvas)]/75 mt-0.5 leading-snug">
                    Muestra este código al personal al recibir tu pedido.
                  </p>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-[var(--ops-canvas)] border border-[var(--accent-gold)]/55 font-mono text-lg font-bold tracking-widest text-[var(--accent-gold)] tabular-nums shrink-0">
                  {paidOrder.confirmationCode}
                </span>
              </div>
            )}

          <div className="w-full pt-4 space-y-2.5">
            {onTrackDelivery && (
              <button
                type="button"
                onClick={onTrackDelivery}
                className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-[var(--status-info)] text-[var(--bg-canvas)] font-bold text-sm flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
              >
                <span>Seguir mi Delivery</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowReceipt(true)}
              className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-[var(--accent-gold)] text-[var(--ink-primary)] font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Ver / Imprimir Ticket (WhatsApp)</span>
            </button>

            <button
              type="button"
              onClick={onBackToMenu}
              className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] font-bold text-sm flex items-center justify-center gap-1.5 hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Volver al Menú</span>
            </button>
          </div>
        </div>
      </div>

      <TicketModal
        order={showReceipt ? ticketOrder : null}
        onClose={() => setShowReceipt(false)}
      />
    </div>
  );
};
