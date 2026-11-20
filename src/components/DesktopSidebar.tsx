import React from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  Bike,
  ChefHat,
  Cloud,
  Heart,
  Home,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  User,
  UtensilsCrossed,
} from 'lucide-react';
import { ScreenId } from '../types/app';
import { AppUserRole } from './LiveCartPanel';
import { AppIcon } from './BrandAssets';

interface DesktopSidebarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  selectedTable: number;
  cartCount: number;
  favoritesCount: number;
  firebaseUser: FirebaseUser | null;
  userRole: AppUserRole;
  isAdminAuthenticated: boolean;
  isMozoAuthenticated: boolean;
  onGoMozoComandas: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentScreen,
  onNavigate,
  selectedTable,
  cartCount,
  favoritesCount,
  firebaseUser,
  userRole,
  isAdminAuthenticated,
  isMozoAuthenticated,
  onGoMozoComandas,
}) => {
  const navItems: {
    id: ScreenId;
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    match: ScreenId[];
    badge?: string | number;
    accentBadge?: boolean;
  }[] = [
    {
      id: 'welcome',
      label: 'Inicio',
      icon: Home,
      match: ['welcome'],
    },
    {
      id: 'menu',
      label: 'Carta',
      icon: UtensilsCrossed,
      match: ['menu', 'search', 'dish-detail', 'customize'],
    },
    {
      id: 'tables-select',
      label: 'Mesas',
      icon: QrCode,
      match: ['tables-select', 'tables-qr', 'tables-order'],
      badge: `M${selectedTable}`,
    },
    {
      id: 'delivery-tracking',
      label: 'Delivery',
      icon: Bike,
      match: ['delivery-info', 'delivery-tracking', 'delivery-confirm'],
    },
    {
      id: 'favorites',
      label: 'Favoritos',
      icon: Heart,
      match: ['favorites'],
      badge: favoritesCount > 0 ? favoritesCount : undefined,
    },
    {
      id: 'cart',
      label: 'Comanda',
      icon: ShoppingBag,
      match: ['cart', 'payment-methods', 'payment-qr', 'payment-confirm'],
      badge: cartCount > 0 ? cartCount : undefined,
      accentBadge: cartCount > 0,
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: User,
      match: ['profile'],
    },
  ];

  const visibleNavItems =
    userRole === 'admin'
      ? navItems.filter((item) => item.id !== 'cart')
      : navItems;

  return (
    <aside
      aria-label="Barra lateral de navegación"
      className="hidden lg:flex w-[84px] shrink-0 flex-col items-center justify-between bg-[#3B1F0E] text-[#FFF8E8] py-3.5 px-2 border-r border-[#D9A441]/25 select-none"
    >
      {/* Top Brand Mark */}
      <button
        type="button"
        onClick={() => onNavigate('welcome')}
        title="Inicio · Como en Casa"
        className="flex flex-col items-center gap-1 group cursor-pointer focus:outline-none"
      >
        <div className="rounded-2xl ring-2 ring-[#D9A441]/45 group-hover:ring-[#D9A441] transition-all">
          <AppIcon size="md" />
        </div>
        <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#D9A441] text-center leading-tight mt-0.5">
          Como en Casa
        </span>
      </button>

      {/* Center Vertical Icon Rail */}
      <nav className="flex-1 w-full overflow-y-auto phone-scroll py-3 space-y-1.5 flex flex-col items-center">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const active = item.match.includes(currentScreen);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`relative w-full py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors duration-150 cursor-pointer ${
                active
                  ? 'bg-[#B84A27] text-[#FFF8E8] shadow-xs'
                  : 'text-[#E8C87A]/80 hover:bg-[#4A2C1A] hover:text-[#FFF8E8]'
              }`}
            >
              <Icon
                className={`w-[18px] h-[18px] shrink-0 ${
                  active ? 'text-[#FFF8E8]' : 'text-[#D9A441]'
                }`}
                strokeWidth={active ? 2.4 : 2}
              />
              <span className="text-[10px] font-bold leading-none whitespace-nowrap">
                {item.label}
              </span>

              {item.badge !== undefined && (
                <span
                  className={`absolute top-1 right-1.5 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-extrabold flex items-center justify-center tabular-nums leading-none ${
                    item.accentBadge
                      ? 'bg-[#D9A441] text-[#2B1A0E]'
                      : active
                      ? 'bg-[#3B1F0E] text-[#FFF8E8]'
                      : 'bg-[#4A2C1A] text-[#E8C87A] border border-[#D9A441]/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {isMozoAuthenticated && (
          <button
            type="button"
            onClick={onGoMozoComandas}
            className={`w-full py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors duration-150 cursor-pointer ${
              userRole === 'mozo' && currentScreen === 'cart'
                ? 'bg-[#D9A441] text-[#2B1A0E] shadow-xs'
                : 'bg-[#2E6F32]/85 text-[#FFF8E8] hover:bg-[#2E6F32]'
            }`}
          >
            <ChefHat className="w-[18px] h-[18px] shrink-0" />
            <span className="text-[10px] font-extrabold leading-none whitespace-nowrap">
              Mozo
            </span>
          </button>
        )}
      </nav>

      {/* Bottom Sync + Admin Role Access */}
      <div className="w-full pt-2.5 border-t border-[#D9A441]/20 flex flex-col items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onNavigate('profile')}
          title={
            firebaseUser
              ? `Sincronizado: ${firebaseUser.email}`
              : 'Conectar cuenta Google'
          }
          className="w-full py-1.5 rounded-xl flex flex-col items-center gap-1 text-[#E8C87A]/80 hover:bg-[#4A2C1A] transition-colors cursor-pointer"
        >
          <Cloud
            className={`w-4 h-4 ${
              firebaseUser ? 'text-[#2E9E5B]' : 'text-[#E8C87A]/70'
            }`}
          />
          <span className="text-[9px] font-bold leading-none">
            {firebaseUser ? 'Sync OK' : 'Cuenta'}
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            onNavigate(isAdminAuthenticated ? 'admin-panel' : 'admin-login')
          }
          title={
            isAdminAuthenticated
              ? 'Ir al Panel Administrador'
              : 'Acceso Administrador'
          }
          className={`w-full py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
            currentScreen === 'admin-panel' || currentScreen === 'admin-login'
              ? 'bg-[#D9A441] text-[#2B1A0E]'
              : 'bg-[#4A2C1A] text-[#FFF8E8] border border-[#D9A441]/30 hover:border-[#D9A441]/70'
          }`}
        >
          <ShieldCheck
            className={`w-4 h-4 ${
              currentScreen === 'admin-panel' || currentScreen === 'admin-login'
                ? 'text-[#2B1A0E]'
                : 'text-[#D9A441]'
            }`}
          />
          <span className="text-[10px] font-extrabold leading-none">
            Admin
          </span>
        </button>
      </div>
    </aside>
  );
};
