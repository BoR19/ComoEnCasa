import React from 'react';
import {
  Bike,
  LogOut,
  QrCode,
  ShieldCheck,
  UtensilsCrossed,
} from 'lucide-react';
import { ActiveStaffSession, KitchenOrder, OrderMode } from '../../types/app';
import { formatBs } from '../../utils/appHelpers';
import { OfficialLogo } from '../BrandAssets';
import { MobileHeader } from '../ShellComponents';

interface ProfileScreenProps {
  orderMode: OrderMode;
  selectedTable: number;
  activeTableOrder?: KitchenOrder;
  activeDeliveryOrder?: KitchenOrder;
  activeStaffSession: ActiveStaffSession | null;
  onBack: () => void;
  onGoTables: () => void;
  onGoTableOrder: () => void;
  onGoDeliveryTracking: () => void;
  onOpenStaffPinLogin: () => void;
  onEnterStaffWorkspace: () => void;
  onLogoutStaffSession: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  orderMode,
  selectedTable,
  activeTableOrder,
  activeDeliveryOrder,
  activeStaffSession,
  onBack,
  onGoTables,
  onGoTableOrder,
  onGoDeliveryTracking,
  onOpenStaffPinLogin,
  onEnterStaffWorkspace,
  onLogoutStaffSession,
}) => {
  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-canvas)] min-h-0">
      <MobileHeader title="Perfil" onBack={onBack} />

      <div className="flex-1 overflow-y-auto phone-scroll">
        <div className="max-w-3xl mx-auto w-full px-4 lg:px-8 pt-5 lg:pt-8 pb-6 space-y-5">
          <div className="flex flex-col items-center text-center">
            <OfficialLogo size="sm" />
            <h2 className="font-serif-display text-xl lg:text-2xl font-bold text-[var(--ink-primary)] mt-2">
              {activeStaffSession
                ? activeStaffSession.name
                : 'Cliente Como en Casa'}
            </h2>
            <p className="text-xs lg:text-sm text-[var(--ink-muted)]">
              {activeStaffSession
                ? `Turno activo — ${activeStaffSession.role}`
                : orderMode === 'dine-in'
                ? `Comiendo en el local — Mesa ${selectedTable}`
                : orderMode === 'takeaway'
                ? 'Modo Para llevar activo'
                : 'Modo Delivery activo'}
            </p>
          </div>

          <section className="space-y-2.5 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
            <button
              type="button"
              onClick={onGoTables}
              className="w-full min-h-[54px] px-4 py-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between text-sm font-bold text-[var(--ink-primary)] hover:border-[var(--accent-primary)] active:scale-[0.98] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer md:col-span-2"
            >
              <span className="inline-flex items-center gap-2.5">
                <UtensilsCrossed className="w-4 h-4 text-[var(--accent-primary)]" />
                <span>Seleccionar Mesa (Actual: Mesa {selectedTable})</span>
              </span>
            </button>

            <button
              type="button"
              onClick={onGoTableOrder}
              className="w-full min-h-[54px] px-4 py-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between text-sm font-bold text-[var(--ink-primary)] hover:border-[var(--accent-primary)] active:scale-[0.98] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
            >
              <span className="inline-flex items-center gap-2.5">
                <QrCode className="w-4 h-4 text-[var(--accent-primary)]" />
                <span>Ver Pedido en Mesa {selectedTable}</span>
              </span>
              <span className="text-xs font-bold text-[var(--accent-primary)] tabular-nums">
                {activeTableOrder ? formatBs(activeTableOrder.total) : 'Sin pedido'}
              </span>
            </button>

            <button
              type="button"
              onClick={onGoDeliveryTracking}
              className="w-full min-h-[54px] px-4 py-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between text-sm font-bold text-[var(--ink-primary)] hover:border-[var(--accent-primary)] active:scale-[0.98] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
            >
              <span className="inline-flex items-center gap-2.5">
                <Bike className="w-4 h-4 text-[var(--status-info)]" />
                <span>Seguimiento de Delivery</span>
              </span>
              <span className="text-xs font-bold text-[var(--status-info)] tabular-nums">
                {activeDeliveryOrder ? activeDeliveryOrder.status : 'Sin envío'}
              </span>
            </button>
          </section>

          <section className="pt-2 max-w-md mx-auto w-full space-y-2.5">
            {activeStaffSession ? (
              <div className="rounded-2xl bg-[var(--ops-surface)] text-[var(--bg-surface)] border border-[var(--ops-border)] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[var(--accent-gold)]">
                    Turno: {activeStaffSession.name} — {activeStaffSession.role}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onEnterStaffWorkspace}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-[var(--accent-gold)] text-[var(--ink-primary)] font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-105 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Ir a mi panel</span>
                  </button>
                  <button
                    type="button"
                    onClick={onLogoutStaffSession}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-[var(--ops-canvas)] border border-[var(--ops-border)] text-[var(--bg-canvas)] font-bold text-xs flex items-center justify-center gap-1.5 hover:border-[var(--ops-accent)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-[var(--ops-accent)]" />
                    <span>Cerrar turno</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenStaffPinLogin}
                className="w-full min-h-[52px] px-4 py-3 rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-canvas)] font-bold text-sm flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5 text-[var(--accent-gold)]" />
                <span>Acceso administrador / personal</span>
              </button>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

