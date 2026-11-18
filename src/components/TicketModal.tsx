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
import { formatBs } from '../utils/appHelpers';
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
    setWhatsappPhone(order.deliveryPhone || '');
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
      <div className="ticket-print-shell w-full max-w-2xl max-h-[92vh] bg-[#FFF8E8] rounded-3xl border-2 border-[#D9A441] shadow-2xl flex flex-col overflow-hidden">
        {/* Top Bar (hidden on print) */}
        <div className="no-print px-4 py-3 bg-[#3B1F0E] text-[#FFF8E8] flex items-center justify-between gap-2 shrink-0 border-b border-[#D9A441]/30">
          <div className="flex items-center gap-2 min-w-0">
            <ReceiptText className="w-5 h-5 text-[#D9A441] shrink-0" />
            <div className="min-w-0">
              <h3 className="font-serif-display text-base sm:text-lg font-bold truncate">
                Ticket / Comprobante {order.code}
              </h3>
              <p className="text-[11px] text-[#E8C87A] truncate">
                {order.customerLabel} · {order.paid ? 'Pagado' : 'Pre-cuenta'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ticket"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#FFF8E8] hover:bg-[#4A2C1A] cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto phone-scroll p-4 sm:p-5 space-y-4">
          {/* Paper size selector (hidden on print) */}
          <div className="no-print flex flex-wrap items-center justify-between gap-2 bg-[#FDF2D6] border border-[#D9A441]/55 rounded-2xl px-3 py-2">
            <span className="text-xs font-extrabold text-[#3B1F0E]">
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
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border transition-colors cursor-pointer ${
                    paperSize === opt.id
                      ? 'bg-[#3B1F0E] border-[#3B1F0E] text-[#FFF8E8]'
                      : 'bg-[#FFFDF8] border-[#D9A441]/60 text-[#3B1F0E] hover:bg-[#E8C87A]/25'
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
              className={`ticket-paper w-full ${paperWidthClass} bg-[#FFFDF8] text-[#2B1A0E] rounded-2xl border border-dashed border-[#7A5A3A]/60 p-4 sm:p-5 shadow-sm space-y-3`}
            >
              {/* Brand Header */}
              <div className="text-center space-y-1 border-b border-dashed border-[#7A5A3A]/50 pb-3">
                <div className="flex justify-center">
                  <OfficialLogo size="sm" />
                </div>
                <p className="font-serif-display font-bold text-sm text-[#3B1F0E]">
                  Comida Tradicional • Tupiza
                </p>
                <p className="text-[10px] font-bold text-[#7A5A3A]">
                  Potosí, Bolivia · Tel: +591 71234567
                </p>
                <div className="pt-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-md border border-[#3B1F0E] text-[10px] font-extrabold uppercase tracking-wider text-[#3B1F0E]">
                    {order.paid ? 'Comprobante de Pago' : 'Pre-Cuenta / Ticket'}
                  </span>
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-[#7A5A3A]/50 pb-2.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[#7A5A3A] font-bold">Ticket Nº:</span>
                  <span className="font-extrabold tabular-nums">{order.code}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#7A5A3A] font-bold">Fecha y Hora:</span>
                  <span className="font-bold tabular-nums">
                    {dateLabel} · {order.createdAt}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#7A5A3A] font-bold">Modalidad:</span>
                  <span className="font-extrabold">
                    {order.mode === 'dine-in'
                      ? `Local (${order.tableNumber ? `Mesa ${order.tableNumber}` : order.customerLabel})`
                      : 'Delivery'}
                  </span>
                </div>
                {order.deliveryAddress && (
                  <div className="flex justify-between gap-2">
                    <span className="text-[#7A5A3A] font-bold shrink-0">Dirección:</span>
                    <span className="font-bold text-right">{order.deliveryAddress}</span>
                  </div>
                )}
                {order.deliveryPhone && (
                  <div className="flex justify-between gap-2">
                    <span className="text-[#7A5A3A] font-bold">Teléfono:</span>
                    <span className="font-bold tabular-nums">{order.deliveryPhone}</span>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <span className="text-[#7A5A3A] font-bold">Estado:</span>
                  <span className="font-extrabold">
                    {order.paid
                      ? `PAGADO (${order.paymentMethod || 'Confirmado'})`
                      : 'PENDIENTE DE COBRO'}
                  </span>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-1.5 border-b border-dashed border-[#7A5A3A]/50 pb-2.5">
                <div className="flex justify-between text-[10px] font-extrabold uppercase text-[#7A5A3A]">
                  <span>Cant. / Platillo</span>
                  <span>Subtotal</span>
                </div>
                {order.items.map((item, idx) => (
                  <div key={`${item.name}-${idx}`} className="space-y-0.5">
                    <div className="flex justify-between items-start gap-2 font-bold">
                      <span className="leading-snug">
                        {item.quantity}x {item.name}{' '}
                        <span className="text-[#7A5A3A]">({item.sizeLabel})</span>
                      </span>
                      <span className="font-extrabold tabular-nums shrink-0">
                        {formatBs(item.price * item.quantity)}
                      </span>
                    </div>
                    {item.extrasSummary && (
                      <p className="text-[10px] text-[#7A5A3A] pl-3 leading-snug">
                        {item.extrasSummary}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {order.notes && (
                <div className="text-[10px] bg-[#FDF2D6]/60 rounded-lg px-2.5 py-1.5 border border-[#D9A441]/30">
                  <span className="font-extrabold text-[#3B1F0E]">Notas: </span>
                  <span className="text-[#2B1A0E]">{order.notes}</span>
                </div>
              )}

              {/* Totals */}
              <div className="space-y-1 pt-0.5">
                <div className="flex justify-between items-center text-sm font-extrabold text-[#3B1F0E]">
                  <span>TOTAL</span>
                  <span className="text-base text-[#B84A27] tabular-nums">
                    {formatBs(order.total)}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-2 border-t border-dashed border-[#7A5A3A]/50 space-y-0.5 text-[10px] text-[#7A5A3A]">
                <p className="font-extrabold text-[#3B1F0E]">
                  ¡Gracias por su preferencia!
                </p>
                <p>Auténtica comida tradicional • Hecho como en casa</p>
              </div>
            </div>
          </div>

          {/* WhatsApp Recipient Box (hidden on print) */}
          <div className="no-print rounded-2xl bg-[#FDF2D6] border border-[#D9A441]/70 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="wa-ticket-phone"
                className="text-xs font-extrabold text-[#3B1F0E] inline-flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4 text-[#2E6F32]" />
                <span>Enviar ticket por WhatsApp</span>
              </label>
              <span className="text-[10px] font-bold text-[#7A5A3A]">
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
                className="flex-1 h-10 px-3 rounded-xl bg-[#FFFDF8] border border-[#D9A441] text-xs font-bold text-[#2B1A0E] placeholder:text-[#7A5A3A]/60 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#2E6F32]"
              />

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#2E6F32] text-[#FFF8E8] font-extrabold text-xs inline-flex items-center justify-center gap-1.5 hover:opacity-95 active:scale-[0.98] transition-all shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Abrir WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Actions (hidden on print) */}
        <div className="no-print p-3.5 bg-[#FFF8E8] border-t border-[#D9A441]/40 grid grid-cols-1 sm:grid-cols-3 gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-[#3B1F0E] text-[#FFF8E8] font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-[#4A2C1A] cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#D9A441]" />
            <span>Imprimir Ticket</span>
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-[#E8C87A] cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#2E6F32]" />
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
            className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-[#FDF2D6] border border-[#3B1F0E] text-[#2B1A0E] font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-[#E8C87A]/30 cursor-pointer"
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
