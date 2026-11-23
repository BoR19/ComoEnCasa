import React from 'react';
import {
  ChefHat,
  ChevronLeft,
  Home,
  QrCode,
  ShoppingBag,
  User,
  UtensilsCrossed,
} from 'lucide-react';
import { MenuCategory, OrderMode, ScreenId } from '../types/app';
import {
  MENU_CATEGORIES,
  MENU_FILTER_CATEGORIES,
  MenuFilterCategory,
} from '../utils/appHelpers';
import type { AppUserRole } from './LiveCartPanel';

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

interface BottomNavProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  userRole?: AppUserRole;
  orderMode?: OrderMode;
  selectedTable?: number;
  isAdminAuthenticated?: boolean;
  activeOrdersCount?: number;
  cartCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onNavigate,
  userRole = 'customer',
  orderMode = 'dine-in',
  selectedTable = 1,
  isAdminAuthenticated = false,
  activeOrdersCount = 0,
  cartCount = 0,
}) => {
  const ordersScreenId: ScreenId =
    userRole === 'admin'
      ? isAdminAuthenticated
        ? 'admin-panel'
        : 'admin-login'
      : 'cart';

  const ordersLabel =
    userRole === 'admin'
      ? 'Cocina'
      : userRole === 'mozo'
      ? 'Comandas'
      : 'Comanda';

  const ordersBadge =
    userRole === 'admin'
      ? activeOrdersCount
      : userRole === 'mozo'
      ? cartCount > 0
        ? cartCount
        : activeOrdersCount
      : cartCount;

  const navItems: {
    id: ScreenId;
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    matchScreens: ScreenId[];
    badge?: number | string;
    highlightBadge?: boolean;
  }[] = [
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
      matchScreens: ['menu', 'search', 'favorites', 'dish-detail', 'customize'],
    },
    {
      id: 'tables-select',
      label: 'Mesas',
      icon: QrCode,
      matchScreens: ['tables-select', 'tables-qr', 'tables-order'],
      badge: orderMode === 'dine-in' ? `M${selectedTable}` : undefined,
    },
    {
      id: ordersScreenId,
      label: ordersLabel,
      icon: userRole === 'admin' ? ChefHat : ShoppingBag,
      matchScreens:
        userRole === 'admin'
          ? ['admin-panel', 'admin-login']
          : ['cart', 'payment-methods', 'payment-qr', 'payment-confirm'],
      badge: ordersBadge > 0 ? ordersBadge : undefined,
      highlightBadge: ordersBadge > 0,
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: User,
      matchScreens:
        userRole === 'admin'
          ? ['profile', 'delivery-info', 'delivery-tracking', 'delivery-confirm']
          : [
              'profile',
              'admin-login',
              'admin-panel',
              'delivery-info',
              'delivery-tracking',
              'delivery-confirm',
            ],
    },
  ];

  return (
    <nav
      aria-label="Navegación principal móvil"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--ink-primary)] border-t border-[var(--accent-gold)]/25 px-2 pt-1.5 pb-[max(0.45rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.22)] select-none"
    >
      <div className="max-w-lg mx-auto grid grid-cols-5 items-center gap-1">
        {navItems.map((item) => {
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
