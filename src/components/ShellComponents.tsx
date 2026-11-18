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
import { MENU_CATEGORIES } from '../utils/appHelpers';

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
    <header className="sticky top-0 z-30 h-14 bg-[#3B1F0E] text-[#FFF8E8] px-3 flex items-center justify-between shrink-0 shadow-sm border-b border-[#D9A441]/25">
      <div className="w-11 flex items-center justify-start">
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

      <h1 className="font-serif-display text-lg font-bold tracking-wide text-[#FFF8E8] text-center truncate px-2">
        {title}
      </h1>

      <div className="w-11 flex items-center justify-end">
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

interface CategoryTabsProps {
  activeCategory: MenuCategory;
  onSelectCategory: (cat: MenuCategory) => void;
  compact?: boolean;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  activeCategory,
  onSelectCategory,
  compact = false,
}) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
      {MENU_CATEGORIES.map((category) => {
        const isActive = activeCategory === category;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onSelectCategory(category)}
            className={`${
              compact ? 'min-h-[34px] px-3 text-[11px]' : 'min-h-[38px] px-3.5 text-xs'
            } py-1.5 rounded-2xl font-extrabold whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
              isActive
                ? 'bg-[#B84A27] text-[#FFF8E8] border-[#B84A27] shadow-xs'
                : 'bg-[#FDF2D6] text-[#3B1F0E] border-[#D9A441]/55 hover:bg-[#E8C87A]/35'
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
};

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
      className="lg:hidden sticky bottom-0 z-30 bg-[#3B1F0E] border-t border-[#D9A441]/30 px-2 py-1.5 shrink-0"
    >
      <div className="grid grid-cols-5 items-center">
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
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              {item.id === 'favorites' && favoritesCount > 0 && (
                <span className="absolute top-1 right-3.5 min-w-[14px] h-[14px] px-1 rounded-full bg-[#B84A27] text-[#FFF8E8] text-[9px] font-extrabold flex items-center justify-center tabular-nums leading-none">
                  {favoritesCount}
                </span>
              )}
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
