import React from 'react';
import {
  Bike,
  ChefHat,
  Heart,
  Home,
  QrCode,
  Search,
  ShieldCheck,
  ShoppingBag,
  User,
  UtensilsCrossed,
} from 'lucide-react';
import { KitchenOrder, OrderMode, ScreenId, TableItem } from '../types/app';
import { formatBs } from '../utils/appHelpers';
import { AppIcon } from './BrandAssets';

interface DesktopSidebarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  orderMode: OrderMode;
  onChangeOrderMode: (mode: OrderMode) => void;
  selectedTable: number;
  tables: TableItem[];
  cartCount: number;
  cartTotal: number;
  favoritesCount: number;
  kitchenOrders: KitchenOrder[];
  activeTableOrder?: KitchenOrder;
  activeDeliveryOrder?: KitchenOrder;
  isAdminAuthenticated: boolean;
  isMozoAuthenticated: boolean;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentScreen,
  onNavigate,
  orderMode,
  onChangeOrderMode,
  selectedTable,
  tables,
  cartCount,
  cartTotal,
  favoritesCount,
  kitchenOrders,
  activeTableOrder,
  activeDeliveryOrder,
  isAdminAuthenticated,
  isMozoAuthenticated,
}) => {
  const freeTablesCount = tables.filter((t) => t.status === 'libre').length;
  const occupiedTablesCount = tables.length - freeTablesCount;
  const occupancyPct =
    tables.length > 0 ? Math.round((occupiedTablesCount / tables.length) * 100) : 0;

  const activeKitchenCount = kitchenOrders.filter(
    (o) => o.status !== 'Entregado'
  ).length;
  const collectedSalesBs = kitchenOrders
    .filter((o) => o.paid)
    .reduce((sum, o) => sum + o.total, 0);

  const isStaff = isAdminAuthenticated || isMozoAuthenticated;

  const navItems: {
    id: ScreenId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    match: ScreenId[];
    badge?: string | number;
  }[] = [
    {
      id: 'welcome',
      label: 'Inicio',
      icon: Home,
      match: ['welcome'],
    },
    {
      id: 'menu',
      label: 'Menú del Día',
      icon: UtensilsCrossed,
      match: ['menu', 'dish-detail', 'customize'],
    },
    {
      id: 'search',
      label: 'Buscar Platillos',
      icon: Search,
      match: ['search'],
    },
    {
      id: 'favorites',
      label: 'Favoritos',
      icon: Heart,
      match: ['favorites'],
      badge: favoritesCount > 0 ? favoritesCount : undefined,
    },
    {
      id: 'tables-select',
      label: 'Mesas QR',
      icon: QrCode,
      match: ['tables-select', 'tables-qr', 'tables-order'],
      badge: `M${selectedTable}`,
    },
    {
      id: 'cart',
      label: 'Mi Carrito',
      icon: ShoppingBag,
      match: ['cart', 'payment-methods', 'payment-qr', 'payment-confirm'],
      badge: cartCount > 0 ? cartCount : undefined,
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: User,
      match: ['profile'],
    },
  ];

  return (
    <aside className="hidden lg:flex w-72 xl:w-80 shrink-0 flex-col rounded-[24px] bg-[#3B1F0E] text-[#FFF8E8] p-4 shadow-xl border border-[#D9A441]/30 select-none overflow-hidden">
      {/* Brand Header */}
      <div className="pb-3.5 border-b border-[#D9A441]/25 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <AppIcon size="sm" />
          <div className="min-w-0">
            <p className="font-script text-2xl text-[#D9A441] leading-none truncate">
              Como en Casa
            </p>
            <p className="text-[11px] font-bold text-[#E8C87A] mt-1 truncate">
              Tupiza • Comida Tradicional
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Dashboard + Navigation Body */}
      <div className="flex-1 overflow-y-auto phone-scroll py-3.5 space-y-3.5 pr-0.5">
        {/* Live Mini-Dashboard Cards */}
        <section className="space-y-2.5">
          {/* Quick Mode Switcher */}
          <div className="rounded-2xl bg-[#4A2C1A]/85 border border-[#D9A441]/30 p-2.5 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-[#E8C87A]">Modalidad actual</span>
              <span className="font-extrabold text-[#FFF8E8]">
                {orderMode === 'dine-in' ? `Mesa ${selectedTable}` : 'Delivery'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onChangeOrderMode('dine-in');
                  onNavigate('tables-select');
                }}
                className={`min-h-[34px] px-2 py-1 rounded-xl text-[11px] font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  orderMode === 'dine-in'
                    ? 'bg-[#D9A441] text-[#2B1A0E]'
                    : 'bg-[#3B1F0E]/70 text-[#FFF8E8]/85 hover:bg-[#3B1F0E]'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Local</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeOrderMode('delivery');
                  onNavigate(activeDeliveryOrder ? 'delivery-tracking' : 'menu');
                }}
                className={`min-h-[34px] px-2 py-1 rounded-xl text-[11px] font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  orderMode === 'delivery'
                    ? 'bg-[#D9A441] text-[#2B1A0E]'
                    : 'bg-[#3B1F0E]/70 text-[#FFF8E8]/85 hover:bg-[#3B1F0E]'
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Delivery</span>
              </button>
            </div>
          </div>

          {/* 2-Column Live KPI Widgets */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-[#4A2C1A]/75 border border-[#D9A441]/25 p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#E8C87A]">Mesas libres</span>
                <span className="w-2 h-2 rounded-full bg-[#2E6F32]" />
              </div>
              <p className="text-lg font-extrabold text-[#FFF8E8] leading-none tabular-nums">
                {freeTablesCount}
                <span className="text-xs font-bold text-[#E8C87A]/80">
                  /{tables.length}
                </span>
              </p>
              <div className="w-full h-1.5 rounded-full bg-[#3B1F0E] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#D9A441] transition-all"
                  style={{ width: `${occupancyPct}%` }}
                />
              </div>
            </div>

            {isStaff ? (
              <div className="rounded-2xl bg-[#4A2C1A]/75 border border-[#D9A441]/25 p-2.5 space-y-1">
                <span className="text-[10px] font-bold text-[#E8C87A] block">
                  Ventas hoy
                </span>
                <p className="text-lg font-extrabold text-[#D9A441] leading-none tabular-nums">
                  {formatBs(collectedSalesBs)}
                </p>
                <p className="text-[10px] font-bold text-[#FFF8E8]/75 tabular-nums">
                  {activeKitchenCount} en cocina
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('cart')}
                className="rounded-2xl bg-[#4A2C1A]/75 border border-[#D9A441]/25 p-2.5 space-y-1 text-left hover:border-[#D9A441]/60 transition-colors cursor-pointer"
              >
                <span className="text-[10px] font-bold text-[#E8C87A] block">
                  Tu carrito
                </span>
                <p className="text-lg font-extrabold text-[#D9A441] leading-none tabular-nums">
                  {formatBs(cartTotal)}
                </p>
                <p className="text-[10px] font-bold text-[#FFF8E8]/75 tabular-nums">
                  {cartCount} {cartCount === 1 ? 'platillo' : 'platillos'}
                </p>
              </button>
            )}
          </div>

          {/* Active Order Live Banner (only when there is an active order) */}
          {(activeTableOrder || activeDeliveryOrder) && (
            <button
              type="button"
              onClick={() =>
                onNavigate(
                  activeTableOrder && orderMode === 'dine-in'
                    ? 'tables-order'
                    : activeDeliveryOrder
                    ? 'delivery-tracking'
                    : 'tables-order'
                )
              }
              className="w-full rounded-2xl bg-[#B84A27] text-[#FFF8E8] p-2.5 text-left flex items-center justify-between gap-2 shadow-sm hover:bg-[#C95B34] transition-colors cursor-pointer"
            >
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold text-[#E8C87A] uppercase tracking-wider">
                  Pedido activo
                </p>
                <p className="text-xs font-extrabold truncate">
                  {activeTableOrder && orderMode === 'dine-in'
                    ? `${activeTableOrder.customerLabel} · ${activeTableOrder.status}`
                    : `${activeDeliveryOrder?.customerLabel} · ${activeDeliveryOrder?.status}`}
                </p>
              </div>
              <span className="px-2 py-1 rounded-xl bg-[#3B1F0E] text-[#D9A441] text-[11px] font-extrabold tabular-nums shrink-0">
                {formatBs(
                  activeTableOrder && orderMode === 'dine-in'
                    ? activeTableOrder.total
                    : activeDeliveryOrder?.total ?? 0
                )}
              </span>
            </button>
          )}
        </section>

        {/* Clean Primary App Navigation */}
        <nav aria-label="Menú de escritorio" className="space-y-1">
          <p className="px-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#E8C87A]/75 mb-1.5">
            Navegación
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.match.includes(currentScreen);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#D9A441] text-[#2B1A0E] font-extrabold shadow-xs'
                    : 'text-[#FFF8E8]/90 hover:bg-[#4A2C1A]/85'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      active ? 'text-[#2B1A0E]' : 'text-[#D9A441]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold tabular-nums shrink-0 ${
                      active
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
        </nav>
      </div>

      {/* Staff / Role Shortcuts Footer */}
      <div className="pt-3 border-t border-[#D9A441]/25 space-y-2 shrink-0">
        {isMozoAuthenticated && (
          <button
            type="button"
            onClick={() => onNavigate('mozo-panel')}
            className={`w-full px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
              currentScreen === 'mozo-panel'
                ? 'bg-[#D9A441] text-[#2B1A0E]'
                : 'bg-[#2E6F32] text-[#FFF8E8] hover:opacity-95'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <ChefHat className="w-4 h-4 shrink-0" />
              <span>Modo Mozo • Comandas</span>
            </span>
            <span className="text-[10px] opacity-90">Activo</span>
          </button>
        )}

        <button
          type="button"
          onClick={() =>
            onNavigate(isAdminAuthenticated ? 'admin-panel' : 'admin-login')
          }
          className={`w-full px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
            currentScreen === 'admin-panel' || currentScreen === 'admin-login'
              ? 'bg-[#D9A441] text-[#2B1A0E]'
              : 'bg-[#4A2C1A] text-[#FFF8E8] border border-[#D9A441]/35 hover:bg-[#4A2C1A]/80'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <ShieldCheck
              className={`w-4 h-4 shrink-0 ${
                currentScreen === 'admin-panel' || currentScreen === 'admin-login'
                  ? 'text-[#2B1A0E]'
                  : 'text-[#D9A441]'
              }`}
            />
            <span>
              {isAdminAuthenticated ? 'Panel Administrador' : 'Acceso Administrador'}
            </span>
          </span>
          {isAdminAuthenticated && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3B1F0E] text-[#D9A441]">
              Activo
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};
