import React from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  Bike,
  ChefHat,
  Heart,
  Home,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  User,
  UtensilsCrossed,
} from 'lucide-react';
import { OrderMode, ScreenId } from '../types/app';
import { AppIcon } from './BrandAssets';
import { AppUserRole } from './LiveCartPanel';

interface DesktopSidebarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  orderMode: OrderMode;
  selectedTable: number;
  cartCount: number;
  activeOrdersCount: number;
  favoritesCount: number;
  firebaseUser: FirebaseUser | null;
  userRole: AppUserRole;
  isAdminAuthenticated: boolean;
  isMozoAuthenticated: boolean;
  onGoMozoComandas: () => void;
}

interface SidebarNavItem {
  id: ScreenId;
  label: string;
  title: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  match: ScreenId[];
  badge?: string | number;
  accentBadge?: boolean;
  showVerifiedDot?: boolean;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentScreen,
  onNavigate,
  orderMode,
  selectedTable,
  cartCount,
  activeOrdersCount,
  favoritesCount,
  firebaseUser,
  userRole,
  isAdminAuthenticated,
  isMozoAuthenticated,
  onGoMozoComandas,
}) => {
  const isVerifiedUser = Boolean(firebaseUser?.emailVerified);
  const comandaBadge =
    userRole === 'mozo'
      ? cartCount > 0
        ? cartCount
        : activeOrdersCount > 0
        ? activeOrdersCount
        : undefined
      : cartCount > 0
      ? cartCount
      : undefined;

  const navItems: SidebarNavItem[] = [
    {
      id: 'welcome',
      label: 'Inicio',
      title: 'Inicio · Modo de pedido',
      icon: Home,
      match: ['welcome'],
    },
    {
      id: 'menu',
      label: 'Carta',
      title: 'Carta Digital',
      icon: UtensilsCrossed,
      match: ['menu', 'search', 'dish-detail', 'customize'],
    },
    {
      id: 'tables-select',
      label: 'Mesas',
      title:
        orderMode === 'dine-in'
          ? `Mapa de Mesas (Mesa ${selectedTable} activa)`
          : 'Mapa de Mesas y QR',
      icon: QrCode,
      match: ['tables-select', 'tables-qr', 'tables-order'],
      badge: orderMode === 'dine-in' ? `M${selectedTable}` : undefined,
    },
    {
      id: 'delivery-tracking',
      label: 'Delivery',
      title: 'Seguimiento Delivery',
      icon: Bike,
      match: ['delivery-info', 'delivery-tracking', 'delivery-confirm'],
      accentBadge: orderMode === 'delivery',
    },
    {
      id: 'favorites',
      label: 'Favoritos',
      title: 'Platos Favoritos',
      icon: Heart,
      match: ['favorites'],
      badge: favoritesCount > 0 ? favoritesCount : undefined,
    },
    {
      id: 'cart',
      label: userRole === 'mozo' ? 'Comandas' : 'Comanda',
      title:
        userRole === 'mozo'
          ? 'Tablero de Comandas y Cocina'
          : 'Tu Comanda y Carrito',
      icon: ShoppingBag,
      match: ['cart', 'payment-methods', 'payment-qr', 'payment-confirm'],
      badge: comandaBadge,
      accentBadge: cartCount > 0 || (userRole === 'mozo' && activeOrdersCount > 0),
    },
    {
      id: 'profile',
      label: 'Perfil',
      title: isVerifiedUser
        ? `Perfil conectado (${firebaseUser?.email || 'Google'})`
        : 'Perfil y Cuenta',
      icon: User,
      match: ['profile'],
      showVerifiedDot: isVerifiedUser,
    },
  ];

  // Admin manages orders inside Cocina/Caja (admin-panel), so hide duplicate Comanda link
  const visibleNavItems =
    userRole === 'admin'
      ? navItems.filter((item) => item.id !== 'cart')
      : navItems;

  const isAdminRoute =
    currentScreen === 'admin-panel' || currentScreen === 'admin-login';

  return (
    <aside
      aria-label="Barra lateral de navegación"
      className="hidden md:flex w-[76px] lg:w-[86px] shrink-0 flex-col items-center justify-between bg-[var(--ink-primary)] text-[var(--bg-canvas)] py-3.5 px-1.5 lg:px-2 border-r border-[var(--accent-gold)]/20 select-none"
    >
      {/* Top Brand Mark */}
      <button
        type="button"
        onClick={() => onNavigate('welcome')}
        title="Inicio · Como en Casa"
        className="w-full flex flex-col items-center gap-1.5 group cursor-pointer rounded-xl py-1 active:scale-[0.97] transition-transform duration-150 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
      >
        <div className="rounded-2xl ring-2 ring-[var(--accent-gold)]/45 group-hover:ring-[var(--accent-gold)] transition-shadow duration-150 ease-[var(--ease-out)]">
          <AppIcon size="md" />
        </div>
        <span className="text-[10px] font-semibold text-[var(--accent-gold)] text-center leading-tight">
          Como en Casa
        </span>
      </button>

      {/* Primary Destination Rail */}
      <nav
        aria-label="Secciones principales"
        className="flex-1 w-full overflow-y-auto phone-scroll py-3 space-y-1 flex flex-col items-center"
      >
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const active = item.match.includes(currentScreen);

          return (
            <button
              key={item.id}
              type="button"
              title={item.title}
              aria-current={active ? 'page' : undefined}
              onClick={() => onNavigate(item.id)}
              className={`relative w-full py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] ${
                active
                  ? 'bg-[var(--accent-primary)] text-[var(--bg-surface)] shadow-xs'
                  : 'text-[var(--bg-canvas)]/80 hover:bg-white/10 hover:text-[var(--bg-surface)]'
              }`}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--accent-gold)]"
                />
              )}

              <span className="relative inline-flex items-center justify-center">
                <Icon
                  className={`w-[18px] h-[18px] shrink-0 transition-colors duration-150 ${
                    active ? 'text-[var(--bg-surface)]' : 'text-[var(--accent-gold)]'
                  }`}
                  strokeWidth={active ? 2.4 : 2}
                />

                {item.badge !== undefined && (
                  <span
                    className={`absolute -top-1.5 -right-3 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center tabular-nums leading-none border ${
                      item.accentBadge
                        ? 'bg-[var(--accent-gold)] text-[var(--ink-primary)] border-[var(--ink-primary)]'
                        : active
                        ? 'bg-[var(--ink-primary)] text-[var(--bg-surface)] border-white/25'
                        : 'bg-white/10 text-[var(--bg-canvas)] border-[var(--accent-gold)]/35'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {item.badge === undefined && item.showVerifiedDot && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-[var(--status-ok-bright)] ring-2 ring-[var(--ink-primary)]"
                  />
                )}

                {item.badge === undefined &&
                  !item.showVerifiedDot &&
                  item.accentBadge && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-0.5 -right-1.5 w-2 h-2 rounded-full bg-[var(--accent-gold)] ring-2 ring-[var(--ink-primary)]"
                    />
                  )}
              </span>

              <span className="text-[10px] font-semibold leading-none whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Role Switcher (Separated from Primary Nav) */}
      <div className="w-full pt-2.5 border-t border-[var(--accent-gold)]/20 flex flex-col items-center gap-1.5 shrink-0">
        {isMozoAuthenticated && (
          <button
            type="button"
            onClick={onGoMozoComandas}
            title={
              userRole === 'mozo'
                ? 'Modo Mozo activo · Ir a Comandas'
                : 'Cambiar a modo Mozo'
            }
            className={`relative w-full py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-[transform,background-color,border-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] ${
              userRole === 'mozo'
                ? 'bg-[var(--status-ok)] border-[var(--status-ok-bright)]/55 text-[var(--bg-surface)] shadow-xs'
                : 'bg-white/10 border-[var(--accent-gold)]/25 text-[var(--bg-canvas)]/90 hover:border-[var(--status-ok-bright)]/60 hover:text-[var(--bg-surface)]'
            }`}
          >
            <ChefHat
              className={`w-4 h-4 shrink-0 ${
                userRole === 'mozo'
                  ? 'text-[var(--bg-surface)]'
                  : 'text-[var(--status-ok-bright)]'
              }`}
            />
            <span className="text-[10px] font-bold leading-none whitespace-nowrap">
              Mozo
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() =>
            onNavigate(isAdminAuthenticated ? 'admin-panel' : 'admin-login')
          }
          title={
            isAdminAuthenticated
              ? 'Panel Administrador · Cocina y Caja'
              : 'Acceso Administrador'
          }
          aria-current={isAdminRoute ? 'page' : undefined}
          className={`relative w-full py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-[transform,background-color,border-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] ${
            isAdminRoute || userRole === 'admin'
              ? 'bg-[var(--accent-gold)] border-[var(--accent-gold)] text-[var(--ink-primary)]'
              : 'bg-white/10 border-[var(--accent-gold)]/30 text-[var(--bg-canvas)] hover:border-[var(--accent-gold)]/70'
          }`}
        >
          <span className="relative inline-flex items-center justify-center">
            <ShieldCheck
              className={`w-4 h-4 shrink-0 ${
                isAdminRoute || userRole === 'admin'
                  ? 'text-[var(--ink-primary)]'
                  : 'text-[var(--accent-gold)]'
              }`}
            />
            {isAdminAuthenticated && activeOrdersCount > 0 && (
              <span className="absolute -top-1.5 -right-3 min-w-[16px] h-[16px] px-1 rounded-full bg-[var(--ops-accent)] text-[var(--bg-surface)] text-[9px] font-bold flex items-center justify-center tabular-nums leading-none border border-[var(--ink-primary)]">
                {activeOrdersCount}
              </span>
            )}
          </span>
          <span className="text-[10px] font-bold leading-none">Admin</span>
        </button>
      </div>
    </aside>
  );
};
