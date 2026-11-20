import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, CheckCircle2, X } from 'lucide-react';
import { KitchenOrder, PaymentMethod } from '../types/app';
import { PAYMENT_METHODS, formatBs } from '../utils/appHelpers';

interface CollectPaymentModalProps {
  order: KitchenOrder | null;
  onClose: () => void;
  onConfirmCollect: (
    order: KitchenOrder,
    method: PaymentMethod,
    openTicket: boolean
  ) => void;
}

export const CollectPaymentModal: React.FC<CollectPaymentModalProps> = ({
  order,
  onClose,
  onConfirmCollect,
}) => {
  const [collectMethod, setCollectMethod] = useState<PaymentMethod>('Efectivo');
  const [openTicketOnCollect, setOpenTicketOnCollect] = useState(true);

  if (!order) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md max-h-[92dvh] overflow-y-auto phone-scroll bg-[#FFF8E8] rounded-2xl border border-[#D9A441] p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-serif-display text-lg font-bold text-[#3B1F0E]">
            Cobrar {order.customerLabel}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#3B1F0E] hover:bg-[#FDF2D6] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-xl bg-[#FDF2D6] border border-[#D9A441]/55 p-3 flex items-center justify-between">
          <span className="text-xs font-bold text-[#7A5A3A]">
            Pedido {order.code}
          </span>
          <span className="text-lg font-extrabold text-[#B84A27] tabular-nums">
            {formatBs(order.total)}
          </span>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-extrabold text-[#3B1F0E]">
            Método de cobro:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setCollectMethod(m)}
                className={`min-h-[40px] px-2.5 py-1.5 rounded-xl border text-xs font-extrabold cursor-pointer transition-colors ${
                  collectMethod === m
                    ? 'bg-[#D9A441] border-[#B84A27] text-[#2B1A0E]'
                    : 'bg-[#FDF2D6] border-[#D9A441]/55 text-[#2B1A0E]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpenTicketOnCollect((p) => !p)}
          className="flex items-center gap-2 text-xs font-extrabold text-[#3B1F0E] cursor-pointer pt-1"
        >
          <span
            className={`w-4 h-4 rounded border flex items-center justify-center ${
              openTicketOnCollect
                ? 'bg-[#3B1F0E] border-[#3B1F0E] text-[#D9A441]'
                : 'border-[#7A5A3A]'
            }`}
          >
            {openTicketOnCollect && <Check className="w-3 h-3" strokeWidth={3} />}
          </span>
          <span>Abrir Ticket (Imprimir / WhatsApp) al cobrar</span>
        </button>

        {order.mode === 'dine-in' && order.tableNumber && (
          <p className="text-[11px] font-bold text-[#2E6F32] bg-[#2E6F32]/10 border border-[#2E6F32]/25 rounded-xl px-3 py-1.5">
            Al confirmar el cobro, la Mesa {order.tableNumber} pasará a estado Libre automáticamente.
          </p>
        )}

        <button
          type="button"
          onClick={() => onConfirmCollect(order, collectMethod, openTicketOnCollect)}
          className="w-full min-h-[46px] rounded-2xl bg-[#2E6F32] text-[#FFF8E8] font-extrabold text-xs flex items-center justify-center gap-1.5 hover:opacity-95 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Confirmar Cobro • {formatBs(order.total)}</span>
        </button>
      </div>
    </div>,
    document.body
  );
};
