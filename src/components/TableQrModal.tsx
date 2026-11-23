import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { Check, Copy, Download, Printer, QrCode, X } from 'lucide-react';
import { TableItem } from '../types/app';
import { OfficialLogo } from './BrandAssets';

export function buildTableQrUrl(tableNumber: number): string {
  const origin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://como-en-casa.app';
  return `${origin}/?mesa=${tableNumber}&tableId=mesa-${tableNumber}`;
}

export const ScannableQrCode: React.FC<{
  value: string;
  size?: number;
  alt?: string;
}> = ({ value, size = 200, alt = 'Código QR de mesa' }) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, {
      width: Math.max(256, size * 2),
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#26160C',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        if (active) setDataUrl('');
      });

    return () => {
      active = false;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-xl bg-[var(--bg-inset)] flex items-center justify-center text-[var(--ink-muted)]"
      >
        <QrCode className="w-8 h-8 opacity-50" />
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      width={size}
      height={size}
      alt={alt}
      className="block rounded-lg select-none"
    />
  );
};

interface TableQrModalProps {
  table: TableItem | null;
  onClose: () => void;
}

export const TableQrModal: React.FC<TableQrModalProps> = ({
  table,
  onClose,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);

  const tableUrl = useMemo(
    () => (table ? buildTableQrUrl(table.number) : ''),
    [table]
  );

  useEffect(() => {
    if (!table || !tableUrl) {
      setQrDataUrl('');
      return;
    }

    let active = true;
    setCopiedUrl(false);

    QRCode.toDataURL(tableUrl, {
      width: 640,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#26160C',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });

    return () => {
      active = false;
    };
  }, [table, tableUrl]);

  useEffect(() => {
    if (!table) return;
    document.body.classList.add('printing-ticket');
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.classList.remove('printing-ticket');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [table, onClose]);

  if (!table) return null;

  const displayName = table.name?.trim() || `Mesa ${table.number}`;
  const displayZone = table.zone?.trim() || 'Salón';

  const handlePrint = () => {
    window.print();
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(tableUrl);
      setCopiedUrl(true);
      window.setTimeout(() => setCopiedUrl(false), 2200);
    } catch {
      setCopiedUrl(false);
    }
  };

  const handleDownloadPng = async () => {
    if (!qrDataUrl || downloadingPng) return;
    setDownloadingPng(true);

    const triggerDownload = (href: string) => {
      const a = document.createElement('a');
      a.href = href;
      a.download = `qr-como-en-casa-mesa-${table.number}.png`;
      a.click();
    };

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 900;
      canvas.height = 1220;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        triggerDownload(qrDataUrl);
        return;
      }

      // Warm paper outer background & clean white printable card
      ctx.fillStyle = '#FAF5EC';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cardX = 48;
      const cardY = 48;
      const cardW = canvas.width - 96;
      const cardH = canvas.height - 96;
      const radius = 36;

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, radius);
      ctx.fill();

      ctx.strokeStyle = '#E2D3BA';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Load official logo if available
      const loadImage = (src: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });

      let contentTop = 96;
      try {
        const logoImg = await loadImage('/assets/aistudio/image_c5881e23.png');
        const targetW = 240;
        const targetH = Math.round(
          (logoImg.naturalHeight / Math.max(1, logoImg.naturalWidth)) * targetW
        );
        ctx.drawImage(
          logoImg,
          (canvas.width - targetW) / 2,
          contentTop,
          targetW,
          targetH
        );
        contentTop += targetH + 34;
      } catch {
        ctx.fillStyle = '#26160C';
        ctx.font = 'bold 42px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('Como en Casa', canvas.width / 2, contentTop + 48);
        contentTop += 88;
      }

      // Table name & zone
      ctx.fillStyle = '#26160C';
      ctx.font = 'bold 46px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(displayName, canvas.width / 2, contentTop + 32);

      ctx.fillStyle = '#6E5239';
      ctx.font = '600 24px system-ui, sans-serif';
      ctx.fillText(
        `${displayZone} · ${table.capacity} ${
          table.capacity === 1 ? 'comensal' : 'comensales'
        }`,
        canvas.width / 2,
        contentTop + 74
      );

      // QR Code centered
      const qrImg = await loadImage(qrDataUrl);
      const qrSize = 480;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = contentTop + 114;

      ctx.strokeStyle = '#E2D3BA';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 48, 24);
      ctx.stroke();

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Callout message
      const msgY = qrY + qrSize + 76;
      ctx.fillStyle = '#C84B28';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.fillText(
        'Escanea para ver la carta',
        canvas.width / 2,
        msgY
      );
      ctx.fillText(
        'y pedir desde tu mesa',
        canvas.width / 2,
        msgY + 38
      );

      ctx.fillStyle = '#6E5239';
      ctx.font = '500 20px system-ui, sans-serif';
      ctx.fillText(
        'Comida Tradicional · Tupiza, Potosí',
        canvas.width / 2,
        cardY + cardH - 44
      );

      triggerDownload(canvas.toDataURL('image/png'));
    } catch {
      triggerDownload(qrDataUrl);
    } finally {
      setDownloadingPng(false);
    }
  };

  const modalContent = (
    <div
      className="ticket-print-modal-root fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Código QR de ${displayName}`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="ticket-print-shell modal-surface my-auto w-full max-w-md max-h-[94dvh] bg-[var(--bg-canvas)] rounded-3xl border border-[var(--border-subtle)] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Top Bar (hidden on print) */}
        <div className="no-print px-4 py-3 bg-[var(--ink-primary)] text-[var(--bg-canvas)] flex items-center justify-between gap-2 shrink-0 border-b border-[var(--accent-gold)]/25">
          <div className="flex items-center gap-2 min-w-0">
            <QrCode className="w-5 h-5 text-[var(--accent-gold)] shrink-0" />
            <div className="min-w-0">
              <h3 className="font-serif-display text-base font-bold truncate">
                QR de {displayName}
              </h3>
              <p className="text-xs text-[var(--accent-gold)] truncate">
                {displayZone} · {table.capacity}{' '}
                {table.capacity === 1 ? 'comensal' : 'comensales'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal QR"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--bg-canvas)] hover:bg-white/10 active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable QR Card Preview */}
        <div className="flex-1 overflow-y-auto phone-scroll p-4 sm:p-5 space-y-3">
          <div className="ticket-paper qr-printable-card bg-[var(--bg-surface)] text-[var(--ink-primary)] rounded-2xl border border-[var(--border-subtle)] px-5 py-6 text-center space-y-4">
            <div className="flex justify-center">
              <OfficialLogo size="sm" />
            </div>

            <div className="space-y-0.5">
              <h4 className="font-serif-display text-2xl font-bold text-[var(--ink-primary)] leading-tight">
                {displayName}
              </h4>
              <p className="text-xs font-medium text-[var(--ink-muted)] tabular-nums">
                {displayZone} · {table.capacity}{' '}
                {table.capacity === 1 ? 'comensal' : 'comensales'}
              </p>
            </div>

            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] mx-auto">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`Código QR para ${displayName}`}
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain select-none"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-[var(--ink-muted)]">
                  <QrCode className="w-10 h-10 opacity-45" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-[var(--accent-primary)] leading-snug max-w-[260px] mx-auto">
                Escanea para ver la carta y pedir desde tu mesa
              </p>
              <p className="text-[11px] font-medium text-[var(--ink-muted)]">
                Como en Casa · Comida Tradicional Tupiza
              </p>
            </div>
          </div>

          {/* Copy link utility (hidden on print) */}
          <div className="no-print flex items-center justify-between gap-2 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] px-3 py-2 text-xs">
            <span className="text-[var(--ink-muted)] truncate font-mono text-[11px]">
              {tableUrl}
            </span>
            <button
              type="button"
              onClick={() => void handleCopyUrl()}
              className="min-h-[34px] px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] font-semibold inline-flex items-center gap-1 hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer shrink-0"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[var(--status-ok)]" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar enlace</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bottom Print & PNG Download Buttons (hidden on print) */}
        <div className="no-print p-3.5 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] grid grid-cols-1 sm:grid-cols-2 gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-surface)] font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
          >
            <Printer className="w-4 h-4 text-[var(--accent-gold)]" />
            <span>Imprimir QR</span>
          </button>

          <button
            type="button"
            disabled={!qrDataUrl || downloadingPng}
            onClick={() => void handleDownloadPng()}
            className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-[var(--accent-primary)] text-[var(--bg-surface)] font-bold text-xs flex items-center justify-center gap-2 hover:brightness-105 disabled:opacity-50 active:scale-[0.97] transition-[transform,filter,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink-primary)]"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingPng ? 'Generando...' : 'Descargar PNG'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
