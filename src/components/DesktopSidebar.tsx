import React from 'react';
import {
  Bike,
  Heart,
  Home,
  LogOut,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  User,
  UtensilsCrossed,
} from 'lucide-react';
import {
  ActiveStaffSession,
  OrderMode,
  ScreenId,
  StaffPermissions,
} from '../types/app';
import { AppIcon } from './BrandAssets';

interface DesktopSidebarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  orderMode: OrderMode;
  selectedTable: number;
  cartCount: number;
  activeOrdersCount: number;
  favoritesCount: number;
  isAdmin: boolean;
  activeStaffSession: ActiveStaffSession | null;
  permissions: StaffPermissions;
  onOpenStaffWorkspace: () => void;
  onLogoutStaffSession: () => void;
}

interface SidebarNavItem {
  id: ScreenId;
  label: string;
  title: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  match: ScreenId[];
  badge?: string | number;
  accentBadge?: boolean;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentScreen,
  onNavigate,
  orderMode,
  selectedTable,
  cartCount,
  activeOrdersCount,
  favoritesCount,
  isAdmin,
  activeStaffSession,
  permissions,
  onOpenStaffWorkspace,
  onLogoutStaffSession,
}) => {
  const isStaffSession = Boolean(activeStaffSession);
  const canTakeOrders = isAdmin || permissions.orders_tables;
  const canComandas =
    !isAdmin && (permissions.kitchen_board || permissions.cashier_billing);
  const canOpenAdminPanel =
    isAdmin ||
    permissions.menu_pricing ||
    permissions.reports_history ||
    permissions.kitchen_board ||
    permissions.cashier_billing;

  const comandaBadge = isStaffSession
    ? cartCount > 0
      ? cartCount
      : activeOrdersCount > 0
      ? activeOrdersCount
      : undefined
    : cartCount > 0
    ? cartCount
    : undefined;

  const customerNavItems: SidebarNavItem[] = [
    {
      id: 'welcome',
      label: 'Inicio',
      title: 'Inicio',
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
      match: [
        'tables-select',
        'tables-qr',
        'tables-order',
        'table-qr-welcome',
      ],
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
      label: 'Comanda',
      title: 'Tu Comanda y Carrito',
      icon: ShoppingBag,
      match: ['cart', 'payment-methods', 'payment-qr', 'payment-confirm'],
      badge: comandaBadge,
      accentBadge: cartCount > 0,
    },
    {
      id: 'profile',
      label: 'Perfil',
      title: 'Perfil y Cuenta',
      icon: User,
      match: ['profile'],
    },
  ];

  const staffNavItems: SidebarNavItem[] = [
    {
      id: 'welcome',
      label: 'Inicio',
      title: 'Inicio',
      icon: Home,
      match: ['welcome'],
    },
    ...(canTakeOrders
      ? [
          {
            id: 'menu' as ScreenId,
            label: 'Carta',
            title: 'Carta Digital',
            icon: UtensilsCrossed,
            match: ['menu', 'search', 'dish-detail', 'customize'] as ScreenId[],
          },
          {
            id: 'tables-select' as ScreenId,
            label: 'Mesas',
            title:
              orderMode === 'dine-in'
                ? `Mapa de Mesas (Mesa ${selectedTable} activa)`
                : 'Mapa de Mesas y QR',
            icon: QrCode,
            match: [
              'tables-select',
              'tables-qr',
              'tables-order',
              'table-qr-welcome',
            ] as ScreenId[],
            badge: orderMode === 'dine-in' ? `M${selectedTable}` : undefined,
          },
        ]
      : []),
    ...(canComandas
      ? [
          {
            id: 'cart' as ScreenId,
            label: 'Comandas',
            title: 'Tablero de Comandas y Cocina',
            icon: ShoppingBag,
            match: [
              'cart',
              'payment-methods',
              'payment-qr',
              'payment-confirm',
            ] as ScreenId[],
            badge: comandaBadge,
            accentBadge: cartCount > 0 || activeOrdersCount > 0,
          },
        ]
      : []),
    {
      id: 'profile',
      label: 'Turno',
      title: 'Estado del turno',
      icon: User,
      match: ['profile'],
    },
  ];

  const visibleNavItems = isStaffSession ? staffNavItems : customerNavItems;
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
        title="Inicio — Como en Casa"
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

                {item.badge === undefined && item.accentBadge && (
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

      {/* Bottom Staff / PIN Entry Switcher */}
      <div className="w-full pt-2.5 border-t border-[var(--accent-gold)]/20 flex flex-col items-center gap-1.5 shrink-0">
        {activeStaffSession ? (
          <>
            {canOpenAdminPanel && (
              <button
                type="button"
                onClick={onOpenStaffWorkspace}
                title={`Panel de trabajo — ${activeStaffSession.name}`}
                aria-current={currentScreen === 'admin-panel' ? 'page' : undefined}
                className={`relative w-full py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-[transform,background-color,border-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] ${
                  currentScreen === 'admin-panel'
                    ? 'bg-[var(--accent-gold)] border-[var(--accent-gold)] text-[var(--ink-primary)]'
                    : 'bg-white/10 border-[var(--accent-gold)]/30 text-[var(--bg-canvas)] hover:border-[var(--accent-gold)]/70'
                }`}
              >
                <span className="relative inline-flex items-center justify-center">
                  <ShieldCheck
                    className={`w-4 h-4 shrink-0 ${
                      currentScreen === 'admin-panel'
                        ? 'text-[var(--ink-primary)]'
                        : 'text-[var(--accent-gold)]'
                    }`}
                  />
                  {activeOrdersCount > 0 && (
                    <span className="absolute -top-1.5 -right-3 min-w-[16px] h-[16px] px-1 rounded-full bg-[var(--ops-accent)] text-[var(--bg-surface)] text-[9px] font-bold flex items-center justify-center tabular-nums leading-none border border-[var(--ink-primary)]">
                      {activeOrdersCount}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-bold leading-none whitespace-nowrap">
                  {isAdmin ? 'Admin' : activeStaffSession.role}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onLogoutStaffSession}
              title={`Cerrar turno (${activeStaffSession.name})`}
              className="w-full py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 bg-white/5 border border-white/15 text-[var(--bg-canvas)]/85 hover:border-[var(--ops-accent)]/60 hover:text-[var(--bg-surface)] active:scale-[0.97] transition-[transform,background-color,border-color,color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
            >
              <LogOut className="w-4 h-4 text-[var(--ops-accent)] shrink-0" />
              <span className="text-[10px] font-semibold leading-none whitespace-nowrap">
                Salir
              </span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onNavigate('admin-login')}
            title="Acceso administrador o personal"
            aria-current={isAdminRoute ? 'page' : undefined}
            className={`relative w-full py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-[transform,background-color,border-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] ${
              isAdminRoute
                ? 'bg-[var(--accent-gold)] border-[var(--accent-gold)] text-[var(--ink-primary)]'
                : 'bg-white/10 border-[var(--accent-gold)]/30 text-[var(--bg-canvas)] hover:border-[var(--accent-gold)]/70'
            }`}
          >
            <ShieldCheck
              className={`w-4 h-4 shrink-0 ${
                isAdminRoute
                  ? 'text-[var(--ink-primary)]'
                  : 'text-[var(--accent-gold)]'
              }`}
            />
            <span className="text-[10px] font-bold leading-none">Acceso</span>
          </button>
        )}
      </div>
    </aside>
  );
};

