import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Banknote,
  Check,
  CheckCircle2,
  Plus,
  Printer,
  Unlock,
  X,
} from 'lucide-react';
import {
  KitchenOrder,
  OrderStatus,
  PaymentMethod,
} from '../types/app';
import { PAYMENT_METHODS, formatBs } from '../utils/appHelpers';

interface OrderKdsCardProps {
  order: KitchenOrder;
  isTableOccupied: boolean;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onOpenTicket: (order: KitchenOrder) => void;
  onStartCollect: (order: KitchenOrder) => void;
  onFreeTable: (tableNumber: number) => void;
  onAppendItems?: (order: KitchenOrder) => void;
}

export const OrderKdsCard: React.FC<OrderKdsCardProps> = ({
  order,
  isTableOccupied,
  onUpdateStatus,
  onOpenTicket,
  onStartCollect,
  onFreeTable,
  onAppendItems,
}) => {
  const statuses: OrderStatus[] =
    order.mode === 'delivery'
      ? ['Preparando', 'En camino', 'Entregado']
      : ['Preparando', 'Listo', 'Entregado'];

  return (
    <article className="rounded-2xl bg-[#FFFDF8] border border-[#D9A441]/60 p-3.5 space-y-3 shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-serif-display text-lg font-bold text-[#2B1A0E] truncate">
            {order.customerLabel}
          </h3>
          <p className="text-[11px] font-bold text-[#7A5A3A] tabular-nums">
            {order.code} · {order.createdAt}
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="font-extrabold text-sm text-[#B84A27] tabular-nums block">
            {formatBs(order.total)}
          </span>
          <span
            className={`inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
              order.paid
                ? 'bg-[#2E6F32]/15 text-[#2E6F32]'
                : 'bg-[#B84A27]/15 text-[#B84A27]'
            }`}
          >
            {order.paid
              ? `Pagado (${order.paymentMethod})`
              : 'Pendiente de cobro'}
          </span>
        </div>
      </div>

      <div className="text-xs font-bold text-[#2B1A0E] space-y-0.5 bg-[#FDF2D6]/55 rounded-xl p-2.5 border border-[#D9A441]/30">
        {order.items.map((it, idx) => (
          <p key={`${it.name}-${it.sizeLabel}-${idx}`} className="tabular-nums">
            • {it.quantity > 1 ? `${it.quantity}x ` : ''}
            {it.name} {it.sizeLabel} ({formatBs(it.price * it.quantity)})
          </p>
        ))}
      </div>

      {order.deliveryAddress && (
        <p className="text-[11px] font-semibold text-[#1E8299]">
          Dirección: {order.deliveryAddress} ({order.deliveryPhone})
        </p>
      )}

      {order.notes && (
        <div className="text-xs text-[#7A5A3A] bg-[#FFF8E8] px-3 py-1.5 rounded-xl border border-[#D9A441]/30">
          <span className="font-extrabold text-[#3B1F0E]">Notas: </span>
          {order.notes}
        </div>
      )}

      <div className="space-y-1.5">
        <p className="text-[11px] font-extrabold text-[#3B1F0E]">Estado:</p>
        <div className="grid grid-cols-3 gap-1.5">
          {statuses.map((st) => {
            const active = order.status === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => onUpdateStatus(order.id, st)}
                className={`min-h-[34px] px-2 py-1 rounded-xl text-[11px] font-extrabold border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#D9A441] border-[#B84A27] text-[#2B1A0E]'
                    : 'bg-[#FFF8E8] border-[#D9A441]/45 text-[#7A5A3A] hover:text-[#2B1A0E]'
                }`}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => onOpenTicket(order)}
          className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-[#E8C87A] cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Ticket / WA</span>
        </button>

        {!order.paid && onAppendItems && (
          <button
            type="button"
            onClick={() => onAppendItems(order)}
            className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-[#FDF2D6] border border-[#D9A441] text-[#3B1F0E] font-extrabold text-xs flex items-center justify-center gap-1 hover:bg-[#E8C87A]/25 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar</span>
          </button>
        )}

        {!order.paid && (
          <button
            type="button"
            onClick={() => onStartCollect(order)}
            className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl bg-[#2E6F32] text-[#FFF8E8] font-extrabold text-xs flex items-center justify-center gap-1.5 hover:opacity-95 cursor-pointer tabular-nums"
          >
            <Banknote className="w-4 h-4" />
            <span>Cobrar {formatBs(order.total)}</span>
          </button>
        )}

        {order.mode === 'dine-in' &&
          order.tableNumber &&
          isTableOccupied && (
            <button
              type="button"
              onClick={() => onFreeTable(order.tableNumber!)}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#FFF8E8] border border-[#3B1F0E] text-[#3B1F0E] font-extrabold text-xs flex items-center justify-center gap-1 hover:bg-[#E8C87A]/30 cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Liberar Mesa {order.tableNumber}</span>
            </button>
          )}
      </div>
    </article>
  );
};

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
