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
    <div className="flex-1 flex flex-col bg-[#FFF8E8] min-h-0">
      <MobileHeader title="Selecciona tu Mesa" onBack={onBack} />

      <div className="flex-1 overflow-y-auto phone-scroll">
        <div className="max-w-4xl mx-auto w-full px-4 lg:px-8 pt-4 lg:pt-8 pb-6 space-y-4 lg:space-y-6">
          <p className="text-center font-bold text-sm lg:text-base text-[#2B1A0E]">
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
                  className={`min-h-[76px] lg:min-h-[104px] p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-[#D9A441] border-[#B84A27] text-[#2B1A0E] shadow-sm cursor-pointer'
                      : isOccupied
                      ? allowOccupiedSelection
                        ? 'bg-[#FDF2D6] border-[#B83227]/60 text-[#2B1A0E] hover:border-[#B84A27] cursor-pointer'
                        : 'bg-[#FDF2D6]/65 border-[#B83227]/35 text-[#2B1A0E]/75 cursor-not-allowed'
                      : 'bg-[#FDF2D6] border-[#D9A441]/70 text-[#2B1A0E] hover:border-[#B84A27] cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-[#3B1F0E] text-[#FFF8E8] flex items-center justify-center">
                        <Check className="w-3 h-3" strokeWidth={3} />
                      </span>
                    )}
                    <span className="font-extrabold text-sm lg:text-base">
                      Mesa {table.number}
                    </span>
                  </div>

                  {isSelected ? (
                    <span className="text-xs font-extrabold text-[#3B1F0E]">
                      Tu mesa
                    </span>
                  ) : isOccupied ? (
                    <span className="text-xs font-bold text-[#B83227] inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#B83227]" />
                      Ocupada
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-[#2E6F32] inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#2E6F32]" />
                      Libre
                    </span>
                  )}
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
            onClick={onConfirmTable}
            className="w-full min-h-[50px] px-5 py-3 rounded-2xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-sm flex items-center justify-center shadow-sm hover:bg-[#E8C87A] active:scale-[0.98] transition-all cursor-pointer"
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
    <div className="flex-1 flex flex-col bg-[#FFF8E8] min-h-0">
      <MobileHeader title="Escanea el QR" onBack={onBack} />

      <div className="flex-1 overflow-y-auto phone-scroll flex flex-col">
        <div className="my-auto max-w-3xl mx-auto w-full px-5 lg:px-8 py-6 flex flex-col lg:grid lg:grid-cols-2 lg:gap-10 items-center justify-center text-center space-y-4 lg:space-y-0">
          <div className="flex flex-col items-center space-y-3">
            <OfficialLogo size="md" />
            <div className="space-y-1">
              <h2 className="font-serif-display text-2xl lg:text-3xl font-bold text-[#2B1A0E]">
                Mesa {selectedTable}
              </h2>
              <p className="text-xs lg:text-sm text-[#7A5A3A] max-w-[260px] leading-relaxed">
                Escanea para ver el menú y pedir desde tu mesa
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="p-4 rounded-2xl bg-[#FFFDF8] border border-[#D9A441]/70 shadow-sm">
              <QrCodeSvg seed={`como-en-casa-mesa-${selectedTable}`} size={176} />
            </div>
          </div>
        </div>
      </div>

      <div className="p-3.5 bg-[#FFF8E8] border-t border-[#D9A441]/40 shrink-0">
        <div className="max-w-md mx-auto w-full space-y-2">
          <button
            type="button"
            onClick={onScanQrToMenu}
            className="w-full min-h-[50px] px-5 py-3 rounded-2xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-[#E8C87A] active:scale-[0.98] transition-all cursor-pointer"
          >
            <ScanLine className="w-4 h-4" />
            <span>Escanear QR e ir al Menú</span>
          </button>

          <button
            type="button"
            onClick={onViewTableOrder}
            className="w-full min-h-[42px] px-4 py-2 rounded-2xl bg-[#FDF2D6] border border-[#D9A441]/70 text-[#3B1F0E] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#E8C87A]/25 cursor-pointer"
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
      <div className="flex-1 flex flex-col bg-[#FFF8E8] min-h-0">
        <MobileHeader title="Pedido en Mesa" onBack={onBack} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#FDF2D6] border border-[#D9A441] flex items-center justify-center text-[#B84A27]">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <h2 className="font-serif-display text-xl font-bold text-[#2B1A0E]">
            Mesa {selectedTable} sin pedido activo
          </h2>
          <p className="text-xs text-[#7A5A3A] max-w-[260px]">
            Elige tus platillos en el menú y envíalos desde el carrito para ver tu pedido en vivo aquí.
          </p>
          <button
            type="button"
            onClick={onGoMenu}
            className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-xs cursor-pointer"
          >
            Ir al Menú
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#FFF8E8] min-h-0">
      <MobileHeader title="Pedido en Mesa" onBack={onBack} />

      <div className="flex-1 overflow-y-auto phone-scroll">
        <div className="max-w-5xl mx-auto w-full px-4 lg:px-8 pt-4 lg:pt-6 pb-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-3.5 py-1 rounded-full bg-[#B84A27] text-[#FFF8E8] font-extrabold text-xs">
              Mesa {selectedTable}
            </span>
            <span className="text-xs font-bold text-[#7A5A3A]">
              {order.code} · {order.createdAt}
            </span>
          </div>

          <div className="space-y-4 lg:grid lg:grid-cols-12 lg:gap-6 lg:space-y-0 lg:items-start">
            {/* Tu pedido */}
            <section className="space-y-2.5 lg:col-span-7">
              <h2 className="font-serif-display text-xl font-bold text-[#2B1A0E]">
                Tu pedido
              </h2>
              <div className="rounded-2xl bg-[#FDF2D6] border border-[#D9A441]/60 divide-y divide-[#D9A441]/30">
                {order.items.map((item, idx) => (
                  <div
                    key={`${item.name}-${idx}`}
                    className="px-3.5 py-3 flex items-center justify-between gap-2 text-sm"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-[#2B1A0E] block">
                        {item.quantity > 1 ? `${item.quantity}x ` : ''}
                        {item.name} {item.sizeLabel}
                      </span>
                      {item.extrasSummary && (
                        <span className="text-[11px] text-[#7A5A3A] block">
                          {item.extrasSummary}
                        </span>
                      )}
                    </div>
                    <span className="font-extrabold text-[#B84A27] tabular-nums shrink-0">
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
                  <span className="font-bold text-sm text-[#2B1A0E]">Estado:</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D9A441] text-[#2B1A0E] font-extrabold text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    {order.status}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold ${
                    order.paid
                      ? 'bg-[#2E6F32]/15 text-[#2E6F32]'
                      : 'bg-[#B84A27]/15 text-[#B84A27]'
                  }`}
                >
                  {order.paid ? `Pagado (${order.paymentMethod})` : 'Pendiente de pago'}
                </span>
              </div>

              <section className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-serif-display text-lg font-bold text-[#2B1A0E]">
                    Resumen
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowTicket(true)}
                    className="px-3 py-1.5 rounded-xl bg-[#FDF2D6] border border-[#D9A441] text-[#3B1F0E] text-[11px] font-extrabold inline-flex items-center gap-1.5 hover:bg-[#E8C87A]/35 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#B84A27]" />
                    <span>Ticket / WhatsApp</span>
                  </button>
                </div>
                <div className="rounded-2xl bg-[#3B1F0E] text-[#FFF8E8] px-4 py-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#E8C87A]">Total</span>
                  <span className="text-lg font-extrabold text-[#D9A441] tabular-nums">
                    {formatBs(order.total)}
                  </span>
                </div>
              </section>

              {order.waiterRequested && (
                <div className="rounded-2xl bg-[#2E6F32]/15 border border-[#2E6F32] px-3.5 py-2.5 text-xs font-bold text-[#2E6F32]">
                  Mesero notificado en Caja/Cocina. Enseguida se acercará a la Mesa{' '}
                  {selectedTable}.
                </div>
              )}

              {/* Desktop inline actions */}
              <div className="hidden lg:grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => onCallWaiter(order.id)}
                  className="min-h-[48px] px-3 py-2.5 rounded-2xl bg-[#FDF2D6] border border-[#D9A441] text-[#2B1A0E] font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-[#E8C87A]/30 cursor-pointer"
                >
                  <Bell className="w-4 h-4 text-[#B84A27]" />
                  <span>{order.waiterRequested ? 'Mesero en camino' : 'Llamar al mesero'}</span>
                </button>

                {order.paid ? (
                  <button
                    type="button"
                    onClick={onGoMenu}
                    className="min-h-[48px] px-3 py-2.5 rounded-2xl bg-[#2E6F32] text-[#FFF8E8] font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Pedir más</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onPayAtTable}
                    className="min-h-[48px] px-3 py-2.5 rounded-2xl bg-[#B84A27] text-[#FFF8E8] font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-[#C95B34] cursor-pointer"
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
      <div className="lg:hidden p-3.5 bg-[#FFF8E8] border-t border-[#D9A441]/40 grid grid-cols-2 gap-2.5 shrink-0">
        <button
          type="button"
          onClick={() => onCallWaiter(order.id)}
          className="min-h-[48px] px-3 py-2.5 rounded-2xl bg-[#FDF2D6] border border-[#D9A441] text-[#2B1A0E] font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-[#E8C87A]/30 cursor-pointer"
        >
          <Bell className="w-4 h-4 text-[#B84A27]" />
          <span>{order.waiterRequested ? 'Mesero en camino' : 'Llamar al mesero'}</span>
        </button>

        {order.paid ? (
          <button
            type="button"
            onClick={onGoMenu}
            className="min-h-[48px] px-3 py-2.5 rounded-2xl bg-[#2E6F32] text-[#FFF8E8] font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Pedir más</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onPayAtTable}
            className="min-h-[48px] px-3 py-2.5 rounded-2xl bg-[#B84A27] text-[#FFF8E8] font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-[#C95B34] cursor-pointer"
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
