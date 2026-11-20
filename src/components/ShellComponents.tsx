import React from 'react';
import {
  ChevronLeft,
  Heart,
  Home,
  Search,
  ShoppingBag,
  User,
  UtensilsCrossed,
} from 'lucide-react';
import { MenuCategory, ScreenId } from '../types/app';
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
    <header className="sticky top-0 z-30 h-14 bg-[#3B1F0E] text-[#FFF8E8] px-2.5 sm:px-3 flex items-center justify-between gap-2 shrink-0 shadow-sm border-b border-[#D9A441]/25">
      <div className="min-w-[44px] flex items-center justify-start shrink-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#FFF8E8] hover:bg-[#4A2C1A] active:scale-95 transition-transform cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
          </button>
        )}
      </div>

      <h1 className="flex-1 min-w-0 font-serif-display text-base sm:text-lg font-bold tracking-wide text-[#FFF8E8] text-center truncate px-1">
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
                className="relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#D9A441] hover:bg-[#4A2C1A] active:scale-95 transition-transform cursor-pointer"
              >
                <ShoppingBag className="w-5 h-5" strokeWidth={2.2} />
                {cartCount > 0 && (
                  <span className="absolute top-1.5 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#B84A27] text-[#FFF8E8] text-[10px] font-extrabold flex items-center justify-center tabular-nums leading-none border border-[#D9A441]/70">
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
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
      {list.map((category) => {
        const isActive = activeCategory === category;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onSelectCategory(category)}
            className={`${
              compact
                ? 'min-h-[34px] px-3 text-[11px]'
                : 'min-h-[38px] px-3.5 text-xs'
            } py-1.5 rounded-full font-extrabold whitespace-nowrap shrink-0 border transition-colors duration-150 cursor-pointer ${
              isActive
                ? 'bg-[#B84A27] text-[#FFF8E8] border-[#B84A27] shadow-xs'
                : 'bg-[#FFFDF8] text-[#3B1F0E] border-[#D9A441]/55 hover:bg-[#FDF2D6]'
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
  favoritesCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onNavigate,
  favoritesCount = 0,
}) => {
  const navItems: {
    id: ScreenId;
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    matchScreens: ScreenId[];
  }[] = [
    {
      id: 'welcome',
      label: 'Inicio',
      icon: Home,
      matchScreens: ['welcome'],
    },
    {
      id: 'search',
      label: 'Buscar',
      icon: Search,
      matchScreens: ['search'],
    },
    {
      id: 'favorites',
      label: 'Favoritos',
      icon: Heart,
      matchScreens: ['favorites'],
    },
    {
      id: 'menu',
      label: 'Menú',
      icon: UtensilsCrossed,
      matchScreens: ['menu', 'dish-detail', 'customize', 'cart'],
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: User,
      matchScreens: ['profile', 'admin-login', 'admin-panel'],
    },
  ];

  return (
    <nav
      aria-label="Navegación principal"
      className="lg:hidden sticky bottom-0 z-30 bg-[#3B1F0E] border-t border-[#D9A441]/30 px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shrink-0"
    >
      <div className="max-w-2xl mx-auto grid grid-cols-5 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.matchScreens.includes(currentScreen);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`relative min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors cursor-pointer ${
                isActive
                  ? 'text-[#E8C87A] bg-[#4A2C1A]'
                  : 'text-[#D9A441]/80 hover:text-[#E8C87A]'
              }`}
            >
              <span className="relative inline-flex items-center justify-center">
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                {item.id === 'favorites' && favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-2.5 min-w-[15px] h-[15px] px-1 rounded-full bg-[#B84A27] text-[#FFF8E8] text-[9px] font-extrabold flex items-center justify-center tabular-nums leading-none">
                    {favoritesCount}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-bold tracking-tight whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
