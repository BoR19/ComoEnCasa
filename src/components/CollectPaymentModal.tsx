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
      <div className="modal-surface w-full max-w-md max-h-[92dvh] overflow-y-auto phone-scroll bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-4 space-y-3 shadow-xl text-[var(--ink-primary)]">
        <div className="flex items-center justify-between">
          <h3 className="font-serif-display text-lg font-bold text-[var(--ink-primary)]">
            Cobrar {order.customerLabel}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--ink-primary)] hover:bg-[var(--bg-inset)] active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] p-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--ink-muted)]">
            Pedido {order.code}
          </span>
          <span className="text-lg font-bold text-[var(--accent-primary)] tabular-nums">
            {formatBs(order.total)}
          </span>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-bold text-[var(--ink-primary)]">
            Método de cobro:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setCollectMethod(m)}
                className={`min-h-[40px] px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-[transform,background-color,border-color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                  collectMethod === m
                    ? 'bg-[var(--accent-gold)] border-[var(--accent-primary)] text-[var(--ink-primary)]'
                    : 'bg-[var(--bg-inset)] border-[var(--border-subtle)] text-[var(--ink-primary)]'
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
          className="flex items-center gap-2 text-xs font-bold text-[var(--ink-primary)] cursor-pointer pt-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
        >
          <span
            className={`w-4 h-4 rounded border flex items-center justify-center ${
              openTicketOnCollect
                ? 'bg-[var(--ink-primary)] border-[var(--ink-primary)] text-[var(--accent-gold)]'
                : 'border-[var(--ink-muted)]'
            }`}
          >
            {openTicketOnCollect && <Check className="w-3 h-3" strokeWidth={3} />}
          </span>
          <span>Abrir ticket (Imprimir / WhatsApp) al cobrar</span>
        </button>

        {order.mode === 'dine-in' && order.tableNumber && (
          <p className="text-xs font-semibold text-[var(--status-ok)] bg-[var(--status-ok)]/10 border border-[var(--status-ok)]/25 rounded-xl px-3 py-1.5">
            Al confirmar el cobro, la Mesa {order.tableNumber} pasará a estado Libre automáticamente.
          </p>
        )}

        <button
          type="button"
          onClick={() => onConfirmCollect(order, collectMethod, openTicketOnCollect)}
          className="w-full min-h-[46px] rounded-2xl bg-[var(--status-ok)] text-[var(--bg-surface)] font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-105 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink-primary)]"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Confirmar cobro — {formatBs(order.total)}</span>
        </button>
      </div>
    </div>,
    document.body
  );
};
