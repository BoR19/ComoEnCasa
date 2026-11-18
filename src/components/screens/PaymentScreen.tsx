import React, { useMemo, useState } from 'react';
import {
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
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
    <div className="flex-1 flex flex-col bg-[#FFF8E8] min-h-0">
      <MobileHeader title="Métodos de Pago" onBack={onBack} />

      <div className="flex-1 overflow-y-auto phone-scroll">
        <div className="max-w-xl mx-auto w-full px-4 lg:px-8 pt-4 lg:pt-8 pb-6 space-y-5">
          <div className="text-center space-y-1.5">
            <p className="font-bold text-sm lg:text-base text-[#2B1A0E]">{summaryLabel}</p>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-[#B84A27] text-[#FFF8E8] font-extrabold text-sm tabular-nums">
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
                  className={`w-full min-h-[54px] px-4 py-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                    active
                      ? 'bg-[#D9A441] border-[#B84A27] text-[#2B1A0E] font-extrabold shadow-xs'
                      : 'bg-[#FDF2D6] border-[#D9A441]/60 text-[#2B1A0E] font-bold hover:border-[#B84A27]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        active ? 'border-[#3B1F0E]' : 'border-[#7A5A3A]'
                      }`}
                    >
                      {active && <span className="w-2.5 h-2.5 rounded-full bg-[#3B1F0E]" />}
                    </span>
                    <Icon className="w-5 h-5 text-[#3B1F0E] shrink-0" />
                    <span className="text-sm text-left">{method}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-3.5 bg-[#FFF8E8] border-t border-[#D9A441]/40 shrink-0">
        <div className="max-w-md mx-auto w-full">
          <button
            type="button"
            onClick={onContinue}
            className="w-full min-h-[50px] px-5 py-3 rounded-2xl bg-[#3B1F0E] text-[#FFF8E8] font-extrabold text-sm flex items-center justify-center hover:bg-[#4A2C1A] active:scale-[0.98] transition-all cursor-pointer tabular-nums"
          >
            {selectedMethod === 'QR'
              ? `Pagar con QR • ${formatBs(totalAmount)}`
              : `Confirmar pago (${selectedMethod}) • ${formatBs(totalAmount)}`}
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
    <div className="flex-1 flex flex-col bg-[#FFF8E8] min-h-0">
      <MobileHeader title="Pago con QR" onBack={onBack} />

      <div className="flex-1 overflow-y-auto phone-scroll px-5 py-6 flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 rounded-2xl bg-[#FFFDF8] border border-[#D9A441]/70 shadow-sm">
          <QrCodeSvg seed={`como-en-casa-pago-${totalAmount}`} size={196} />
        </div>

        <div className="space-y-1">
          <h2 className="font-serif-display text-2xl font-bold text-[#2B1A0E]">
            Como en Casa
          </h2>
          <p className="text-lg font-extrabold text-[#B84A27] tabular-nums">
            Total {formatBs(totalAmount)}
          </p>
          <p className="text-xs font-bold text-[#7A5A3A]">
            Instrucciones: Escanea y paga
          </p>
        </div>
      </div>

      <div className="p-3.5 bg-[#FFF8E8] border-t border-[#D9A441]/40 shrink-0">
        <div className="max-w-md mx-auto w-full">
          <button
            type="button"
            onClick={onPaid}
            className="w-full min-h-[50px] px-5 py-3 rounded-2xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-[#E8C87A] active:scale-[0.98] transition-all cursor-pointer"
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
    <div className="relative flex-1 flex flex-col bg-[#FFF8E8] min-h-0">
      <MobileHeader title="Confirmación de Pago" onBack={onBack} />

      <div className="flex-1 overflow-y-auto phone-scroll px-5 py-8 flex flex-col items-center justify-center text-center">
        <div className="max-w-md w-full space-y-4 flex flex-col items-center">
          <div className="w-18 h-18 rounded-full bg-[#2E6F32]/15 flex items-center justify-center">
            <CheckCircle2 className="w-14 h-14 text-[#2E6F32]" strokeWidth={2.2} />
          </div>

          <div className="space-y-1">
            <h2 className="font-serif-display text-2xl font-bold text-[#2B1A0E]">
              Pago Exitoso
            </h2>
            <p className="text-3xl font-extrabold text-[#B84A27] tabular-nums">
              {formatBs(totalAmount)}
            </p>
            <p className="text-sm font-bold text-[#7A5A3A] pt-1">
              {customerThanks}
            </p>
          </div>

          <div className="w-full pt-4 space-y-2.5">
            {onTrackDelivery && (
              <button
                type="button"
                onClick={onTrackDelivery}
                className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-[#1E8299] text-[#FFF8E8] font-extrabold text-sm flex items-center justify-center gap-2 hover:opacity-95 cursor-pointer"
              >
                <span>Seguir mi Delivery</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowReceipt(true)}
              className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-[#E8C87A] cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Ver / Imprimir Ticket (WhatsApp)</span>
            </button>

            <button
              type="button"
              onClick={onBackToMenu}
              className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-[#FDF2D6] border border-[#3B1F0E] text-[#2B1A0E] font-extrabold text-sm flex items-center justify-center hover:bg-[#E8C87A]/25 cursor-pointer"
            >
              ← Volver al Menú
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
