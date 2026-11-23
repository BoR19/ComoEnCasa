import React from 'react';
import {
  ChefHat,
  ChevronLeft,
  Home,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  User,
  UtensilsCrossed,
} from 'lucide-react';
import {
  ActiveStaffSession,
  MenuCategory,
  OrderMode,
  ScreenId,
  StaffPermissions,
} from '../types/app';
import {
  MENU_CATEGORIES,
  MENU_FILTER_CATEGORIES,
  MenuFilterCategory,
} from '../utils/appHelpers';

interface MobileHeaderProps {
  title: string;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
  showCartBadge?: boolean;
  cartCount?: number;
  onCartClick?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  onBack,
  rightSlot,
  showCartBadge = false,
  cartCount = 0,
  onCartClick,
}) => {
  return (
    <header className="sticky top-0 z-30 h-14 bg-[var(--ink-primary)] text-[var(--bg-canvas)] px-2.5 sm:px-3 flex items-center justify-between gap-2 shrink-0 border-b border-[var(--accent-gold)]/25">
      <div className="min-w-[44px] flex items-center justify-start shrink-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[var(--bg-canvas)] hover:bg-white/10 active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
          </button>
        )}
      </div>

      <h1 className="flex-1 min-w-0 font-serif-display text-base sm:text-lg font-bold text-[var(--bg-canvas)] text-center truncate px-1">
        {title}
      </h1>

      <div className="min-w-[44px] flex items-center justify-end shrink-0">
        {rightSlot
          ? rightSlot
          : showCartBadge && onCartClick && (
              <button
                type="button"
                onClick={onCartClick}
                aria-label="Ver carrito"
                className="relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[var(--accent-gold)] hover:bg-white/10 active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
              >
                <ShoppingBag className="w-5 h-5" strokeWidth={2.2} />
                {cartCount > 0 && (
                  <span className="absolute top-1.5 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--accent-primary)] text-[var(--bg-surface)] text-[10px] font-bold flex items-center justify-center tabular-nums leading-none border border-[var(--accent-gold)]/70">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
      </div>
    </header>
  );
};

interface CategoryTabsProps<T extends MenuFilterCategory = MenuCategory> {
  activeCategory: T;
  onSelectCategory: (cat: T) => void;
  compact?: boolean;
  includeAll?: boolean;
}

export function CategoryTabs<T extends MenuFilterCategory = MenuCategory>({
  activeCategory,
  onSelectCategory,
  compact = false,
  includeAll = false,
}: CategoryTabsProps<T>) {
  const list = (includeAll ? MENU_FILTER_CATEGORIES : MENU_CATEGORIES) as T[];

  return (
    <div className="w-full max-w-full min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
      {list.map((category) => {
        const isActive = activeCategory === category;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onSelectCategory(category)}
            className={`${
              compact
                ? 'min-h-[36px] px-3 text-[11px]'
                : 'min-h-[40px] px-3.5 text-xs'
            } py-1.5 rounded-full font-semibold whitespace-nowrap shrink-0 border transition-[transform,background-color,color,border-color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
              isActive
                ? 'bg-[var(--accent-primary)] text-[var(--bg-surface)] border-[var(--accent-primary)] shadow-xs'
                : 'bg-[var(--bg-surface)] text-[var(--ink-primary)] border-[var(--border-subtle)] hover:bg-[var(--bg-inset)]'
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}

const GRID_COLS_CLASS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
};

interface BottomNavProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  isAdmin?: boolean;
  activeStaffSession?: ActiveStaffSession | null;
  permissions?: StaffPermissions;
  orderMode?: OrderMode;
  selectedTable?: number;
  activeOrdersCount?: number;
  cartCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onNavigate,
  isAdmin = false,
  activeStaffSession = null,
  permissions,
  orderMode = 'dine-in',
  selectedTable = 1,
  activeOrdersCount = 0,
  cartCount = 0,
}) => {
  const isStaffSession = Boolean(activeStaffSession);
  const canTakeOrders = isAdmin || Boolean(permissions?.orders_tables);
  const canComandas =
    !isAdmin &&
    Boolean(permissions?.kitchen_board || permissions?.cashier_billing);
  const canOpenPanel =
    isAdmin ||
    Boolean(
      permissions?.menu_pricing ||
        permissions?.reports_history ||
        permissions?.kitchen_board ||
        permissions?.cashier_billing
    );

  const comandaBadge = isStaffSession
    ? cartCount > 0
      ? cartCount
      : activeOrdersCount
    : cartCount;

  type BottomNavItem = {
    id: ScreenId;
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    matchScreens: ScreenId[];
    badge?: number | string;
    highlightBadge?: boolean;
  };

  const navItems: BottomNavItem[] = !isStaffSession
    ? [
        {
          id: 'welcome',
          label: 'Inicio',
          icon: Home,
          matchScreens: ['welcome'],
        },
        {
          id: 'menu',
          label: 'Carta',
          icon: UtensilsCrossed,
          matchScreens: [
            'menu',
            'search',
            'favorites',
            'dish-detail',
            'customize',
          ],
        },
        {
          id: 'tables-select',
          label: 'Mesas',
          icon: QrCode,
          matchScreens: [
            'tables-select',
            'tables-qr',
            'tables-order',
            'table-qr-welcome',
          ],
          badge: orderMode === 'dine-in' ? `M${selectedTable}` : undefined,
        },
        {
          id: 'cart',
          label: 'Comanda',
          icon: ShoppingBag,
          matchScreens: [
            'cart',
            'payment-methods',
            'payment-qr',
            'payment-confirm',
          ],
          badge: cartCount > 0 ? cartCount : undefined,
          highlightBadge: cartCount > 0,
        },
        {
          id: 'profile',
          label: 'Perfil',
          icon: User,
          matchScreens: [
            'profile',
            'admin-login',
            'admin-panel',
            'delivery-info',
            'delivery-tracking',
            'delivery-confirm',
          ],
        },
      ]
    : [
        {
          id: 'welcome',
          label: 'Inicio',
          icon: Home,
          matchScreens: ['welcome'],
        },
        ...(canTakeOrders
          ? [
              {
                id: 'menu' as ScreenId,
                label: 'Carta',
                icon: UtensilsCrossed,
                matchScreens: [
                  'menu',
                  'search',
                  'favorites',
                  'dish-detail',
                  'customize',
                ] as ScreenId[],
              },
              {
                id: 'tables-select' as ScreenId,
                label: 'Mesas',
                icon: QrCode,
                matchScreens: [
                  'tables-select',
                  'tables-qr',
                  'tables-order',
                  'table-qr-welcome',
                ] as ScreenId[],
                badge:
                  orderMode === 'dine-in' ? `M${selectedTable}` : undefined,
              },
            ]
          : []),
        ...(canComandas
          ? [
              {
                id: 'cart' as ScreenId,
                label: 'Comandas',
                icon: ChefHat,
                matchScreens: [
                  'cart',
                  'payment-methods',
                  'payment-qr',
                  'payment-confirm',
                ] as ScreenId[],
                badge: comandaBadge > 0 ? comandaBadge : undefined,
                highlightBadge: comandaBadge > 0,
              },
            ]
          : []),
        ...(canOpenPanel
          ? [
              {
                id: 'admin-panel' as ScreenId,
                label: isAdmin ? 'Panel' : 'Gestión',
                icon: ShieldCheck,
                matchScreens: ['admin-panel', 'admin-login'] as ScreenId[],
                badge:
                  isAdmin && activeOrdersCount > 0
                    ? activeOrdersCount
                    : undefined,
                highlightBadge: isAdmin && activeOrdersCount > 0,
              },
            ]
          : []),
        ...((!canTakeOrders || !canComandas || !canOpenPanel) &&
        !(canTakeOrders && canComandas && canOpenPanel)
          ? [
              {
                id: 'profile' as ScreenId,
                label: 'Turno',
                icon: User,
                matchScreens: [
                  'profile',
                  'delivery-info',
                  'delivery-tracking',
                  'delivery-confirm',
                ] as ScreenId[],
              },
            ]
          : []),
      ];

  const limitedNavItems = navItems.slice(0, 5);
  const gridColsClass =
    GRID_COLS_CLASS[limitedNavItems.length] || 'grid-cols-4';

  return (
    <nav
      aria-label="Navegación principal móvil"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--ink-primary)] border-t border-[var(--accent-gold)]/25 px-2 pt-1.5 pb-[max(0.45rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.22)] select-none"
    >
      <div className={`max-w-lg mx-auto grid ${gridColsClass} items-center gap-1`}>
        {limitedNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.matchScreens.includes(currentScreen);
          return (
            <button
              key={`${item.id}-${item.label}`}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onNavigate(item.id)}
              className={`relative min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] ${
                isActive
                  ? 'text-[var(--bg-surface)] bg-[var(--accent-primary)]'
                  : 'text-[var(--accent-gold)]/90 hover:bg-white/10 hover:text-[var(--bg-canvas)]'
              }`}
            >
              <span className="relative inline-flex items-center justify-center">
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 2} />
                {item.badge !== undefined && (
                  <span
                    className={`absolute -top-1.5 -right-3 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center tabular-nums leading-none border border-[var(--ink-primary)] ${
                      item.highlightBadge
                        ? 'bg-[var(--accent-gold)] text-[var(--ink-primary)]'
                        : 'bg-[var(--ops-elevated)] text-[var(--bg-canvas)]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-semibold whitespace-nowrap leading-none">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

