import React, { useState } from 'react';
import {
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Lock,
  Printer,
  QrCode,
  ScanLine,
  UtensilsCrossed,
} from 'lucide-react';
import { KitchenOrder, TableItem } from '../../types/app';
import { formatBs } from '../../utils/appHelpers';
import { OfficialLogo, QrCodeSvg } from '../BrandAssets';
import { MobileHeader } from '../ShellComponents';
import { TicketModal } from '../TicketModal';

interface TableSelectScreenProps {
  tables: TableItem[];
  selectedTable: number;
  allowOccupiedSelection?: boolean;
  onSelectTable: (tableNumber: number) => void;
  onConfirmTable: () => void;
  onBack: () => void;
}

export const TableSelectScreen: React.FC<TableSelectScreenProps> = ({
  tables,
  selectedTable,
  allowOccupiedSelection = false,
  onSelectTable,
  onConfirmTable,
  onBack,
}) => {
  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-canvas)] min-h-0">
      <MobileHeader title="Selecciona tu Mesa" onBack={onBack} />

      <div className="flex-1 overflow-y-auto phone-scroll">
        <div className="max-w-4xl mx-auto w-full px-4 lg:px-8 pt-4 lg:pt-8 pb-20 xl:pb-6 space-y-4 lg:space-y-6">
          <p className="text-center font-bold text-sm lg:text-base text-[var(--ink-primary)]">
            Elige tu mesa para comenzar
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
            {tables.map((table) => {
              const isSelected = table.number === selectedTable;
              const isOccupied = table.status === 'ocupada' && !isSelected;

              return (
                <button
                  key={table.number}
                  type="button"
                  disabled={isOccupied && !allowOccupiedSelection}
                  onClick={() => onSelectTable(table.number)}
                  className={`min-h-[76px] lg:min-h-[104px] p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-[transform,background-color,border-color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] ${
                    isSelected
                      ? 'bg-[var(--accent-gold)] border-[var(--accent-primary)] text-[var(--ink-primary)] cursor-pointer'
                      : isOccupied
                      ? allowOccupiedSelection
                        ? 'bg-[var(--bg-surface)] border-[var(--status-danger)]/55 text-[var(--ink-primary)] hover:border-[var(--accent-primary)] cursor-pointer'
                        : 'bg-[var(--bg-inset)]/70 border-[var(--status-danger)]/35 text-[var(--ink-primary)]/70 cursor-not-allowed'
                      : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--ink-primary)] hover:border-[var(--accent-primary)] cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-[var(--ink-primary)] text-[var(--bg-canvas)] flex items-center justify-center">
                        <Check className="w-3 h-3" strokeWidth={3} />
                      </span>
                    )}
                    <span className="font-bold text-sm lg:text-base">
                      Mesa {table.number}
                    </span>
                  </div>

                  {isSelected ? (
                    <span className="text-xs font-bold text-[var(--ink-primary)]">
                      Tu mesa
                    </span>
                  ) : isOccupied ? (
                    <span className="text-xs font-semibold text-[var(--status-danger)] inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[var(--status-danger)]" />
                      Ocupada
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-[var(--status-ok)] inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[var(--status-ok)]" />
                      Libre
                    </span>
                  )}
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
            onClick={onConfirmTable}
            className="w-full min-h-[50px] px-5 py-3 rounded-2xl bg-[var(--accent-primary)] text-[var(--bg-canvas)] font-bold text-sm flex items-center justify-center hover:opacity-95 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
          >
            Confirmar Mesa {selectedTable}
          </button>
        </div>
      </div>
    </div>
  );
};

interface TableQrScreenProps {
  selectedTable: number;
  onScanQrToMenu: () => void;
  onViewTableOrder: () => void;
  onBack: () => void;
}

export const TableQrScreen: React.FC<TableQrScreenProps> = ({
  selectedTable,
  onScanQrToMenu,
  onViewTableOrder,
  onBack,
}) => {
  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-canvas)] min-h-0">
      <MobileHeader title="Escanea el QR" onBack={onBack} />

      <div className="flex-1 overflow-y-auto phone-scroll flex flex-col">
        <div className="my-auto max-w-3xl mx-auto w-full px-5 lg:px-8 py-6 flex flex-col lg:grid lg:grid-cols-2 lg:gap-10 items-center justify-center text-center space-y-4 lg:space-y-0">
          <div className="flex flex-col items-center space-y-3">
            <OfficialLogo size="md" />
            <div className="space-y-1">
              <h2 className="font-serif-display text-2xl lg:text-3xl font-bold text-[var(--ink-primary)]">
                Mesa {selectedTable}
              </h2>
              <p className="text-xs lg:text-sm text-[var(--ink-muted)] max-w-[260px] leading-relaxed">
                Escanea para ver el menú y pedir desde tu mesa
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-full max-w-[210px] p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center">
              <QrCodeSvg seed={`como-en-casa-mesa-${selectedTable}`} size={176} />
            </div>
          </div>
        </div>
      </div>

      <div className="p-3.5 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] shrink-0">
        <div className="max-w-md mx-auto w-full space-y-2">
          <button
            type="button"
            onClick={onScanQrToMenu}
            className="w-full min-h-[50px] px-5 py-3 rounded-2xl bg-[var(--accent-primary)] text-[var(--bg-canvas)] font-bold text-sm flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
          >
            <ScanLine className="w-4 h-4" />
            <span>Escanear QR e ir al Menú</span>
          </button>

          <button
            type="button"
            onClick={onViewTableOrder}
            className="w-full min-h-[42px] px-4 py-2 rounded-2xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-[var(--ink-primary)] font-bold text-xs flex items-center justify-center gap-1.5 hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Ver pedido en Mesa {selectedTable}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface TableOrderScreenProps {
  selectedTable: number;
  order?: KitchenOrder;
  onBack: () => void;
  onGoMenu: () => void;
  onCallWaiter: (orderId: string) => void;
  onPayAtTable: () => void;
}

export const TableOrderScreen: React.FC<TableOrderScreenProps> = ({
  selectedTable,
  order,
  onBack,
  onGoMenu,
  onCallWaiter,
  onPayAtTable,
}) => {
  const [showTicket, setShowTicket] = useState(false);

  if (!order) {
    return (
      <div className="flex-1 flex flex-col bg-[var(--bg-canvas)] min-h-0">
        <MobileHeader title="Pedido en Mesa" onBack={onBack} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-primary)]">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <h2 className="font-serif-display text-xl font-bold text-[var(--ink-primary)]">
            Mesa {selectedTable} sin pedido activo
          </h2>
          <p className="text-xs text-[var(--ink-muted)] max-w-[260px]">
            Elige tus platillos en el menú y envíalos desde el carrito para ver tu pedido en vivo aquí.
          </p>
          <button
            type="button"
            onClick={onGoMenu}
            className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-[var(--accent-primary)] text-[var(--bg-canvas)] font-bold text-xs active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
          >
            Ir al Menú
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-canvas)] min-h-0">
      <MobileHeader title="Pedido en Mesa" onBack={onBack} />

      <div className="flex-1 overflow-y-auto phone-scroll">
        <div className="max-w-5xl mx-auto w-full px-4 lg:px-8 pt-4 lg:pt-6 pb-20 xl:pb-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-3.5 py-1 rounded-lg bg-[var(--accent-primary)] text-[var(--bg-canvas)] font-bold text-xs">
              Mesa {selectedTable}
            </span>
            <span className="text-xs font-bold text-[var(--ink-muted)] tabular-nums">
              {order.code} · {order.createdAt}
            </span>
          </div>

          <div className="space-y-4 lg:grid lg:grid-cols-12 lg:gap-6 lg:space-y-0 lg:items-start">
            {/* Tu pedido */}
            <section className="space-y-2.5 lg:col-span-7">
              <h2 className="font-serif-display text-xl font-bold text-[var(--ink-primary)]">
                Tu pedido
              </h2>
              <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
                {order.items.map((item, idx) => (
                  <div
                    key={`${item.name}-${idx}`}
                    className="px-3.5 py-3 flex items-center justify-between gap-2 text-sm"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-[var(--ink-primary)] block">
                        {item.quantity > 1 ? `${item.quantity}x ` : ''}
                        {item.name} {item.sizeLabel}
                      </span>
                      {item.extrasSummary && (
                        <span className="text-[11px] text-[var(--ink-muted)] block">
                          {item.extrasSummary}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-[var(--accent-primary)] tabular-nums shrink-0">
                      {formatBs(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Estado, Resumen & Desktop Actions */}
            <div className="space-y-4 lg:col-span-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[var(--ink-primary)]">Estado:</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--accent-gold)] text-[var(--ink-primary)] font-bold text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    {order.status}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                    order.paid
                      ? 'bg-[var(--status-ok)]/12 text-[var(--status-ok)]'
                      : 'bg-[var(--accent-primary)]/12 text-[var(--accent-primary)]'
                  }`}
                >
                  {order.paid ? `Pagado (${order.paymentMethod})` : 'Pendiente de pago'}
                </span>
              </div>

              <section className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-serif-display text-lg font-bold text-[var(--ink-primary)]">
                    Resumen
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowTicket(true)}
                    className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-[11px] font-bold inline-flex items-center gap-1.5 hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    <span>Ticket / WhatsApp</span>
                  </button>
                </div>
                <div className="rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-canvas)] px-4 py-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--accent-gold)]">Total</span>
                  <span className="text-lg font-bold text-[var(--accent-gold)] tabular-nums">
                    {formatBs(order.total)}
                  </span>
                </div>
              </section>

              {order.waiterRequested && (
                <div className="rounded-2xl bg-[var(--status-ok)]/12 border border-[var(--status-ok)] px-3.5 py-2.5 text-xs font-bold text-[var(--status-ok)]">
                  Mesero notificado en Caja/Cocina. Enseguida se acercará a la Mesa{' '}
                  {selectedTable}.
                </div>
              )}

              {/* Desktop inline actions */}
              <div className="hidden lg:grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => onCallWaiter(order.id)}
                  className="min-h-[48px] px-3 py-2.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] font-bold text-xs flex items-center justify-center gap-1.5 hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
                >
                  <Bell className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span>{order.waiterRequested ? 'Mesero en camino' : 'Llamar al mesero'}</span>
                </button>

                {order.paid ? (
                  <button
                    type="button"
                    onClick={onGoMenu}
                    className="min-h-[48px] px-3 py-2.5 rounded-2xl bg-[var(--status-ok)] text-[var(--bg-canvas)] font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform duration-150 ease-[var(--ease-out)] cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Pedir más</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onPayAtTable}
                    className="min-h-[48px] px-3 py-2.5 rounded-2xl bg-[var(--accent-primary)] text-[var(--bg-canvas)] font-bold text-xs flex items-center justify-center gap-1.5 hover:opacity-95 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Pagar en mesa</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Two Buttons (Mobile) */}
      <div className="lg:hidden p-3.5 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] grid grid-cols-2 gap-2.5 shrink-0">
        <button
          type="button"
          onClick={() => onCallWaiter(order.id)}
          className="min-h-[48px] px-3 py-2.5 rounded-2xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-[var(--ink-primary)] font-bold text-xs flex items-center justify-center gap-1.5 hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
        >
          <Bell className="w-4 h-4 text-[var(--accent-primary)]" />
          <span>{order.waiterRequested ? 'Mesero en camino' : 'Llamar al mesero'}</span>
        </button>

        {order.paid ? (
          <button
            type="button"
            onClick={onGoMenu}
            className="min-h-[48px] px-3 py-2.5 rounded-2xl bg-[var(--status-ok)] text-[var(--bg-canvas)] font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform duration-150 ease-[var(--ease-out)] cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Pedir más</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onPayAtTable}
            className="min-h-[48px] px-3 py-2.5 rounded-2xl bg-[var(--accent-primary)] text-[var(--bg-canvas)] font-bold text-xs flex items-center justify-center gap-1.5 hover:opacity-95 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Pagar en mesa</span>
          </button>
        )}
      </div>

      <TicketModal
        order={showTicket ? order : null}
        onClose={() => setShowTicket(false)}
      />
    </div>
  );
};
