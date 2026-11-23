import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  Copy,
  Download,
  MessageCircle,
  Printer,
  ReceiptText,
  X,
} from 'lucide-react';
import { KitchenOrder } from '../types/app';
import { formatBs, getTakeawayCustomerName } from '../utils/appHelpers';
import {
  TicketPaperSize,
  buildPlainTextTicket,
  buildWhatsAppShareUrl,
  buildWhatsAppTicketText,
  getTodayDateLabel,
} from '../utils/ticketHelpers';
import { OfficialLogo } from './BrandAssets';

interface TicketModalProps {
  order: KitchenOrder | null;
  onClose: () => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({ order, onClose }) => {
  const [paperSize, setPaperSize] = useState<TicketPaperSize>('80mm');
  const [whatsappPhone, setWhatsappPhone] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!order) return;
    const takeawayPhone =
      order.mode === 'takeaway' && order.pickupNote
        ? order.pickupNote.match(/\b[67]\d{7}\b/)?.[0] || ''
        : '';
    setWhatsappPhone(order.deliveryPhone || takeawayPhone);
    setCopied(false);
  }, [order]);

  useEffect(() => {
    if (!order) return;
    document.body.classList.add('printing-ticket');
    return () => {
      document.body.classList.remove('printing-ticket');
    };
  }, [order]);

  const dateLabel = useMemo(() => getTodayDateLabel(), []);

  const waUrl = useMemo(
    () => (order ? buildWhatsAppShareUrl(order, whatsappPhone) : '#'),
    [order, whatsappPhone]
  );

  const waText = useMemo(
    () => (order ? buildWhatsAppTicketText(order, { dateLabel }) : ''),
    [order, dateLabel]
  );

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(waText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = waText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadTxt = () => {
    const content = buildPlainTextTicket(order);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanCode = order.code.replace(/[^a-zA-Z0-9_-]/g, '');
    a.download = `ticket-${cleanCode || 'como-en-casa'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const paperWidthClass =
    paperSize === '58mm'
      ? 'max-w-[260px] ticket-size-58 text-[11px]'
      : paperSize === '80mm'
      ? 'max-w-[330px] ticket-size-80 text-xs'
      : 'max-w-lg ticket-size-carta text-xs sm:text-sm';

  const modalContent = (
    <div
      className="ticket-print-modal-root fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={`Ticket ${order.code}`}
    >
      <div className="ticket-print-shell modal-surface w-full max-w-2xl max-h-[92dvh] bg-[var(--bg-canvas)] rounded-3xl border border-[var(--border-subtle)] shadow-2xl flex flex-col overflow-hidden">
        {/* Top Bar (hidden on print) */}
        <div className="no-print px-4 py-3 bg-[var(--ink-primary)] text-[var(--bg-canvas)] flex items-center justify-between gap-2 shrink-0 border-b border-[var(--accent-gold)]/25">
          <div className="flex items-center gap-2 min-w-0">
            <ReceiptText className="w-5 h-5 text-[var(--accent-gold)] shrink-0" />
            <div className="min-w-0">
              <h3 className="font-serif-display text-base sm:text-lg font-bold truncate">
                Ticket / Comprobante {order.code}
              </h3>
              <p className="text-xs text-[var(--accent-gold)] truncate">
                {order.customerLabel} — {order.paid ? 'Pagado' : 'Pre-cuenta'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ticket"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--bg-canvas)] hover:bg-white/10 active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto phone-scroll p-4 sm:p-5 space-y-4">
          {/* Paper size selector (hidden on print) */}
          <div className="no-print flex flex-wrap items-center justify-between gap-2 bg-[var(--bg-inset)] border border-[var(--border-subtle)] rounded-2xl px-3 py-2">
            <span className="text-xs font-bold text-[var(--ink-primary)]">
              Formato de impresión:
            </span>
            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: '80mm', label: 'Térmica 80mm' },
                  { id: '58mm', label: 'Mini 58mm' },
                  { id: 'carta', label: 'Carta / PDF' },
                ] as { id: TicketPaperSize; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPaperSize(opt.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                    paperSize === opt.id
                      ? 'bg-[var(--ink-primary)] border-[var(--ink-primary)] text-[var(--bg-surface)]'
                      : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--ink-primary)] hover:bg-[var(--bg-canvas)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Printable Ticket Sheet */}
          <div className="flex justify-center">
            <div
              className={`ticket-paper w-full ${paperWidthClass} bg-[var(--bg-surface)] text-[var(--ink-primary)] rounded-2xl border border-dashed border-[var(--ink-muted)]/60 p-4 sm:p-5 shadow-sm space-y-3`}
            >
              {/* Brand Header */}
              <div className="text-center space-y-1 border-b border-dashed border-[var(--ink-muted)]/50 pb-3">
                <div className="flex justify-center">
                  <OfficialLogo size="sm" />
                </div>
                <p className="font-serif-display font-bold text-sm text-[var(--ink-primary)]">
                  Comida Tradicional · Tupiza
                </p>
                <p className="text-[11px] font-semibold text-[var(--ink-muted)]">
                  Potosí, Bolivia · Tel: +591 71234567
                </p>
                <div className="pt-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-md border border-[var(--ink-primary)] text-[11px] font-bold text-[var(--ink-primary)]">
                    {order.paid ? 'Comprobante de pago' : 'Pre-cuenta / Ticket'}
                  </span>
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-[var(--ink-muted)]/50 pb-2.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[var(--ink-muted)] font-semibold">Ticket Nº:</span>
                  <span className="font-bold tabular-nums">{order.code}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[var(--ink-muted)] font-semibold">Fecha y hora:</span>
                  <span className="font-semibold tabular-nums">
                    {dateLabel} · {order.createdAt}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[var(--ink-muted)] font-semibold">Modalidad:</span>
                  <span className="font-bold text-right">
                    {order.mode === 'dine-in'
                      ? `Local (${order.tableNumber ? `Mesa ${order.tableNumber}` : order.customerLabel})`
                      : order.mode === 'takeaway'
                      ? `Para Llevar • ${getTakeawayCustomerName(order)}`
                      : 'Delivery'}
                  </span>
                </div>
                {order.pickupNote && (
                  <div className="flex justify-between gap-2">
                    <span className="text-[var(--ink-muted)] font-semibold shrink-0">Retiro / Tel:</span>
                    <span className="font-semibold text-right">{order.pickupNote}</span>
                  </div>
                )}
                {order.deliveryAddress && (
                  <div className="flex justify-between gap-2">
                    <span className="text-[var(--ink-muted)] font-semibold shrink-0">Dirección:</span>
                    <span className="font-semibold text-right">{order.deliveryAddress}</span>
                  </div>
                )}
                {order.deliveryPhone && (
                  <div className="flex justify-between gap-2">
                    <span className="text-[var(--ink-muted)] font-semibold">Teléfono:</span>
                    <span className="font-semibold tabular-nums">{order.deliveryPhone}</span>
                  </div>
                )}
                {order.confirmationCode &&
                  (order.mode === 'takeaway' || order.mode === 'delivery') && (
                    <div className="flex justify-between gap-2">
                      <span className="text-[var(--ink-muted)] font-semibold">
                        Código entrega:
                      </span>
                      <span className="font-mono font-bold tracking-wider text-[var(--accent-primary)] tabular-nums">
                        {order.confirmationCode}
                      </span>
                    </div>
                  )}
                <div className="flex justify-between gap-2">
                  <span className="text-[var(--ink-muted)] font-semibold">Estado:</span>
                  <span className="font-bold">
                    {order.paid
                      ? `PAGADO (${order.paymentMethod || 'Confirmado'})`
                      : 'PENDIENTE DE COBRO'}
                  </span>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-1.5 border-b border-dashed border-[var(--ink-muted)]/50 pb-2.5">
                <div className="flex justify-between text-[11px] font-bold text-[var(--ink-muted)]">
                  <span>Cant. / Platillo</span>
                  <span>Subtotal</span>
                </div>
                {order.items.map((item, idx) => (
                  <div key={`${item.name}-${idx}`} className="space-y-0.5">
                    <div className="flex justify-between items-start gap-2 font-bold">
                      <span className="leading-snug">
                        {item.quantity}x {item.name}{' '}
                        <span className="text-[var(--ink-muted)]">({item.sizeLabel})</span>
                      </span>
                      <span className="font-bold tabular-nums shrink-0">
                        {formatBs(item.price * item.quantity)}
                      </span>
                    </div>
                    {item.extrasSummary && (
                      <p className="text-[11px] text-[var(--ink-muted)] pl-3 leading-snug">
                        {item.extrasSummary}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {order.notes && (
                <div className="text-[11px] bg-[var(--bg-inset)] rounded-lg px-2.5 py-1.5 border border-[var(--border-subtle)]">
                  <span className="font-bold text-[var(--ink-primary)]">Notas: </span>
                  <span className="text-[var(--ink-primary)]">{order.notes}</span>
                </div>
              )}

              {/* Totals */}
              <div className="space-y-1 pt-0.5">
                <div className="flex justify-between items-center text-sm font-bold text-[var(--ink-primary)]">
                  <span>Total</span>
                  <span className="text-base text-[var(--accent-primary)] tabular-nums">
                    {formatBs(order.total)}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-2 border-t border-dashed border-[var(--ink-muted)]/50 space-y-0.5 text-[11px] text-[var(--ink-muted)]">
                <p className="font-bold text-[var(--ink-primary)]">
                  ¡Gracias por su preferencia!
                </p>
                <p>Auténtica comida tradicional · Hecho como en casa</p>
              </div>
            </div>
          </div>

          {/* WhatsApp Recipient Box (hidden on print) */}
          <div className="no-print rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="wa-ticket-phone"
                className="text-xs font-bold text-[var(--ink-primary)] inline-flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4 text-[var(--status-ok)]" />
                <span>Enviar ticket por WhatsApp</span>
              </label>
              <span className="text-[11px] font-semibold text-[var(--ink-muted)]">
                Bolivia (+591) automático
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="wa-ticket-phone"
                type="tel"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="Ej. 71234567 (o deja vacío para elegir contacto)"
                className="flex-1 h-10 px-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)]/60 tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--status-ok)]"
              />

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[var(--status-ok)] text-[var(--bg-surface)] font-bold text-xs inline-flex items-center justify-center gap-1.5 hover:brightness-105 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink-primary)]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Abrir WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Actions (hidden on print) */}
        <div className="no-print p-3.5 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] grid grid-cols-1 sm:grid-cols-3 gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-surface)] font-bold text-xs flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
          >
            <Printer className="w-4 h-4 text-[var(--accent-gold)]" />
            <span>Imprimir ticket</span>
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-[var(--accent-gold)] text-[var(--ink-primary)] font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-105 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink-primary)]"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[var(--status-ok)]" />
                <span>¡Texto copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar para WhatsApp</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadTxt}
            className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-[var(--ink-primary)] font-bold text-xs flex items-center justify-center gap-1.5 hover:border-[var(--ink-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
          >
            <Download className="w-4 h-4" />
            <span>Descargar .TXT</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
