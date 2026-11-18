import React, { useMemo, useState } from 'react';
import { Heart, Plus, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { MenuCategory, MenuItem, OrderMode } from '../../types/app';
import { DishIllustration } from '../BrandAssets';
import { CategoryTabs, MobileHeader } from '../ShellComponents';

interface MenuScreenProps {
  mode: 'menu' | 'search' | 'favorites';
  menuItems: MenuItem[];
  favoriteIds: string[];
  cartCount: number;
  orderMode: OrderMode;
  selectedTable: number;
  onBack: () => void;
  onSelectItem: (item: MenuItem) => void;
  onQuickAdd: (item: MenuItem) => void;
  onToggleFavorite: (id: string) => void;
  onOpenCustomize: () => void;
  onOpenCart: () => void;
  onOpenTables: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
  mode,
  menuItems,
  favoriteIds,
  cartCount,
  orderMode,
  selectedTable,
  onBack,
  onSelectItem,
  onQuickAdd,
  onToggleFavorite,
  onOpenCustomize,
  onOpenCart,
  onOpenTables,
}) => {
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('Platos Fuertes');
  const [query, setQuery] = useState('');

  const availableItems = useMemo(
    () => menuItems.filter((item) => item.available),
    [menuItems]
  );

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return availableItems.filter((item) => {
      if (mode === 'favorites' && !favoriteIds.includes(item.id)) {
        return false;
      }
      if (mode === 'menu' && !q && item.category !== activeCategory) {
        return false;
      }
      if (q) {
        return (
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [availableItems, activeCategory, query, mode, favoriteIds]);

  const headerTitle =
    mode === 'search'
      ? 'Buscar'
      : mode === 'favorites'
      ? 'Favoritos'
      : 'Menú';

  return (
    <div className="flex-1 flex flex-col bg-[#FFF8E8] min-h-0">
      <MobileHeader
        title={headerTitle}
        onBack={onBack}
        showCartBadge
        cartCount={cartCount}
        onCartClick={onOpenCart}
      />

      <div className="flex-1 overflow-y-auto phone-scroll">
        <div className="max-w-5xl mx-auto w-full px-4 lg:px-8 pt-3 lg:pt-6 pb-6 space-y-3.5 lg:space-y-4">
          {/* Active order context strip */}
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#FDF2D6] border border-[#D9A441]/55 text-xs">
            <span className="font-bold text-[#2B1A0E]">
              {orderMode === 'dine-in'
                ? `Comer en el local · Mesa ${selectedTable}`
                : 'Modo Delivery · Envío a domicilio'}
            </span>
            {orderMode === 'dine-in' && (
              <button
                type="button"
                onClick={onOpenTables}
                className="font-extrabold text-[#B84A27] underline decoration-[#B84A27]/60 cursor-pointer whitespace-nowrap"
              >
                Cambiar mesa
              </button>
            )}
          </div>

          {/* Search & Category Controls */}
          <div className="space-y-3 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
            <div className="relative lg:w-72 shrink-0">
              <Search className="w-4 h-4 text-[#7A5A3A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar platillos..."
                aria-label="Buscar platillos"
                className="w-full h-11 pl-10 pr-4 rounded-2xl bg-[#FFFDF8] border border-[#D9A441]/60 text-sm text-[#2B1A0E] placeholder:text-[#7A5A3A]/75 focus:outline-none focus:ring-2 focus:ring-[#B84A27]"
              />
            </div>

            {mode === 'menu' && (
              <div className="min-w-0">
                <CategoryTabs
                  activeCategory={activeCategory}
                  onSelectCategory={setActiveCategory}
                />
              </div>
            )}
          </div>

          {/* Customize banner */}
          {mode === 'menu' && (
            <button
              type="button"
              onClick={onOpenCustomize}
              className="w-full px-3.5 py-2.5 lg:px-4 lg:py-3 rounded-2xl bg-[#3B1F0E] text-[#FFF8E8] flex items-center justify-between gap-2 hover:bg-[#4A2C1A] active:scale-[0.99] transition-all cursor-pointer border border-[#D9A441]/30"
            >
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-8 h-8 rounded-xl bg-[#B84A27] text-[#FFF8E8] flex items-center justify-center shrink-0">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs lg:text-sm font-extrabold text-[#FFF8E8]">
                    Personaliza tu platillo
                  </p>
                  <p className="text-[11px] lg:text-xs text-[#E8C87A]">
                    Elige base, toppings, guisos y sopas
                  </p>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-[#D9A441] shrink-0" />
            </button>
          )}

          {/* Menu List / Grid */}
          {filteredItems.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl bg-[#FDF2D6] border border-[#D9A441]/55">
              <p className="font-serif-display text-base font-bold text-[#3B1F0E]">
                {mode === 'favorites'
                  ? 'Aún no tienes platillos favoritos'
                  : 'No encontramos platillos'}
              </p>
              <p className="text-xs text-[#7A5A3A] mt-1">
                {mode === 'favorites'
                  ? 'Toca el corazón en cualquier plato del menú para guardarlo aquí.'
                  : 'Prueba con otro nombre o revisa otra categoría.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 md:gap-3.5">
              {filteredItems.map((item) => {
                const isFav = favoriteIds.includes(item.id);
                return (
                  <article
                    key={item.id}
                    className="rounded-2xl bg-[#FDF2D6] border border-[#D9A441]/70 p-2.5 md:p-3.5 flex items-center md:flex-col md:items-stretch gap-3 shadow-xs hover:border-[#B84A27]/70 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectItem(item)}
                      className="w-20 h-16 md:w-full md:h-32 rounded-xl overflow-hidden shrink-0 border border-[#D9A441]/35 cursor-pointer focus:outline-none"
                      aria-label={`Ver detalle de ${item.name}`}
                    >
                      <DishIllustration visualType={item.visualType} />
                    </button>

                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => onSelectItem(item)}
                        className="text-left w-full cursor-pointer"
                      >
                        <h2 className="font-bold text-[15px] md:text-base text-[#2B1A0E] truncate">
                          {item.name}
                        </h2>
                        <p className="text-xs text-[#7A5A3A] line-clamp-1 md:line-clamp-2 mt-0.5">
                          {item.description}
                        </p>
                        <p className="text-xs font-extrabold text-[#B84A27] mt-1 md:mt-1.5 tabular-nums">
                          {item.priceBadge}
                        </p>
                      </button>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center items-end justify-between gap-1.5 shrink-0 md:pt-1 md:border-t md:border-[#D9A441]/30">
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(item.id)}
                        aria-label={
                          isFav
                            ? `Quitar ${item.name} de favoritos`
                            : `Guardar ${item.name} en favoritos`
                        }
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-[#3B1F0E] hover:bg-[#E8C87A]/30 cursor-pointer"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isFav ? 'fill-[#B83227] text-[#B83227]' : 'text-[#7A5A3A]'
                          }`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => onQuickAdd(item)}
                        className="min-h-[34px] px-2.5 md:px-3.5 py-1 rounded-xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-xs flex items-center gap-1 hover:bg-[#E8C87A] active:scale-95 transition-transform cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                        <span>Agregar</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
