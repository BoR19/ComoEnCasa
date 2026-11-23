import React from 'react';
import { User } from 'firebase/auth';
import { Bike, LogIn, LogOut, QrCode, ShieldCheck, UtensilsCrossed } from 'lucide-react';
import { KitchenOrder, OrderMode } from '../../types/app';
import { formatBs } from '../../utils/appHelpers';
import { OfficialLogo } from '../BrandAssets';
import { MobileHeader } from '../ShellComponents';

interface ProfileScreenProps {
  orderMode: OrderMode;
  selectedTable: number;
  activeTableOrder?: KitchenOrder;
  activeDeliveryOrder?: KitchenOrder;
  firebaseUser: User | null;
  authLoading: boolean;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
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
  firebaseUser,
  authLoading,
  onGoogleSignIn,
  onGoogleSignOut,
  onBack,
  onGoTables,
  onGoTableOrder,
  onGoDeliveryTracking,
  onGoAdminLogin,
}) => {
  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-canvas)] min-h-0">
      <MobileHeader title="Perfil" onBack={onBack} />

      <div className="flex-1 overflow-y-auto phone-scroll">
        <div className="max-w-3xl mx-auto w-full px-4 lg:px-8 pt-5 lg:pt-8 pb-6 space-y-5">
          <div className="flex flex-col items-center text-center">
            <OfficialLogo size="sm" />
            <h2 className="font-serif-display text-xl lg:text-2xl font-bold text-[var(--ink-primary)] mt-2">
              {firebaseUser?.displayName || 'Cliente Como en Casa'}
            </h2>
            <p className="text-xs lg:text-sm text-[var(--ink-muted)]">
              {orderMode === 'dine-in'
                ? `Comiendo en el local · Mesa ${selectedTable}`
                : orderMode === 'takeaway'
                ? 'Modo Para llevar activo'
                : 'Modo Delivery activo'}
            </p>

            {/* Google Account Sync Card */}
            <div className="mt-3 w-full max-w-md rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3 flex items-center justify-between gap-2 text-left">
              {firebaseUser ? (
                <>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--status-ok)]">
                      Cuenta Google conectada
                    </p>
                    <p className="text-[11px] font-semibold text-[var(--ink-muted)] truncate">
                      {firebaseUser.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onGoogleSignOut}
                    className="px-3 py-1.5 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-xs font-bold inline-flex items-center gap-1 hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Salir</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--ink-primary)]">
                      Sincroniza tus pedidos
                    </p>
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      Inicia sesión con Google para enviar pedidos en vivo.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={authLoading}
                    onClick={onGoogleSignIn}
                    className="px-3 py-2 rounded-xl bg-[var(--ink-primary)] text-[var(--bg-canvas)] text-xs font-bold inline-flex items-center gap-1.5 hover:opacity-95 disabled:opacity-50 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer shrink-0"
                  >
                    <LogIn className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
                    <span>Conectar</span>
                  </button>
                </>
              )}
            </div>
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

          <section className="pt-2 max-w-md mx-auto w-full">
            <button
              type="button"
              onClick={onGoAdminLogin}
              className="w-full min-h-[52px] px-4 py-3 rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-canvas)] font-bold text-sm flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5 text-[var(--accent-gold)]" />
              <span>Acceso Administrador / Caja</span>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};
