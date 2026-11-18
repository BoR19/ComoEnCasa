import React from 'react';
import { Bike, QrCode, ShieldCheck, UtensilsCrossed } from 'lucide-react';
import { KitchenOrder, OrderMode } from '../../types/app';
import { formatBs } from '../../utils/appHelpers';
import { OfficialLogo } from '../BrandAssets';
import { MobileHeader } from '../ShellComponents';

interface ProfileScreenProps {
  orderMode: OrderMode;
  selectedTable: number;
  activeTableOrder?: KitchenOrder;
  activeDeliveryOrder?: KitchenOrder;
  onBack: () => void;
  onGoTables: () => void;
  onGoTableOrder: () => void;
  onGoDeliveryTracking: () => void;
  onGoAdminLogin: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  orderMode,
  selectedTable,
  activeTableOrder,
  activeDeliveryOrder,
  onBack,
  onGoTables,
  onGoTableOrder,
  onGoDeliveryTracking,
  onGoAdminLogin,
}) => {
  return (
    <div className="flex-1 flex flex-col bg-[#FFF8E8] min-h-0">
      <MobileHeader title="Perfil" onBack={onBack} />

      <div className="flex-1 overflow-y-auto phone-scroll">
        <div className="max-w-3xl mx-auto w-full px-4 lg:px-8 pt-5 lg:pt-8 pb-6 space-y-5">
          <div className="flex flex-col items-center text-center">
            <OfficialLogo size="sm" />
            <h2 className="font-serif-display text-xl lg:text-2xl font-bold text-[#2B1A0E] mt-2">
              Cliente Como en Casa
            </h2>
            <p className="text-xs lg:text-sm text-[#7A5A3A]">
              {orderMode === 'dine-in'
                ? `Comiendo en el local · Mesa ${selectedTable}`
                : 'Modo Delivery activo'}
            </p>
          </div>

          <section className="space-y-2.5 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
            <button
              type="button"
              onClick={onGoTables}
              className="w-full min-h-[54px] px-4 py-3 rounded-2xl bg-[#FDF2D6] border border-[#D9A441]/70 flex items-center justify-between text-sm font-bold text-[#2B1A0E] hover:border-[#B84A27] cursor-pointer md:col-span-2"
            >
              <span className="inline-flex items-center gap-2.5">
                <UtensilsCrossed className="w-4 h-4 text-[#B84A27]" />
                <span>Seleccionar Mesa (Actual: Mesa {selectedTable})</span>
              </span>
            </button>

            <button
              type="button"
              onClick={onGoTableOrder}
              className="w-full min-h-[54px] px-4 py-3 rounded-2xl bg-[#FDF2D6] border border-[#D9A441]/70 flex items-center justify-between text-sm font-bold text-[#2B1A0E] hover:border-[#B84A27] cursor-pointer"
            >
              <span className="inline-flex items-center gap-2.5">
                <QrCode className="w-4 h-4 text-[#B84A27]" />
                <span>Ver Pedido en Mesa {selectedTable}</span>
              </span>
              <span className="text-xs font-extrabold text-[#B84A27] tabular-nums">
                {activeTableOrder ? formatBs(activeTableOrder.total) : 'Sin pedido'}
              </span>
            </button>

            <button
              type="button"
              onClick={onGoDeliveryTracking}
              className="w-full min-h-[54px] px-4 py-3 rounded-2xl bg-[#FDF2D6] border border-[#D9A441]/70 flex items-center justify-between text-sm font-bold text-[#2B1A0E] hover:border-[#B84A27] cursor-pointer"
            >
              <span className="inline-flex items-center gap-2.5">
                <Bike className="w-4 h-4 text-[#1E8299]" />
                <span>Seguimiento de Delivery</span>
              </span>
              <span className="text-xs font-extrabold text-[#1E8299] tabular-nums">
                {activeDeliveryOrder ? activeDeliveryOrder.status : 'Sin envío'}
              </span>
            </button>
          </section>

          <section className="pt-2 max-w-md mx-auto w-full">
            <button
              type="button"
              onClick={onGoAdminLogin}
              className="w-full min-h-[52px] px-4 py-3 rounded-2xl bg-[#3B1F0E] text-[#FFF8E8] font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-[#4A2C1A] cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5 text-[#D9A441]" />
              <span>Acceso Administrador / Caja</span>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};
