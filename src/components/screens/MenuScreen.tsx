import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Heart,
  MapPin,
  Minus,
  Plus,
  QrCode,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import {
  CartItem,
  DishSizeOption,
  MenuItem,
  OrderMode,
} from '../../types/app';
import {
  MENU_FILTER_CATEGORIES,
  MenuFilterCategory,
  formatBs,
  getCategoryCounts,
} from '../../utils/appHelpers';
import { DishIllustration } from '../BrandAssets';
import { CategoryTabs, MobileHeader } from '../ShellComponents';

interface MenuScreenProps {
  mode: 'menu' | 'search' | 'favorites';
  menuItems: MenuItem[];
  favoriteIds: string[];
  cart: CartItem[];
  cartCount: number;
  orderMode: OrderMode;
  selectedTable: number;
  isLiveSynced: boolean;
  onBack: () => void;
  onSelectItem: (item: MenuItem) => void;
  onAddToCart: (item: MenuItem, size: DishSizeOption) => void;
  onUpdateCartQuantity: (cartItemId: string, delta: number) => void;
  onToggleFavorite: (id: string) => void;
  onOpenCustomize: () => void;
  onOpenCart: () => void;
  onOpenTables: () => void;
  onOpenTableQr: () => void;
  onNavigateMode: (mode: 'menu' | 'favorites') => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
  mode,
  menuItems,
  favoriteIds,
  cart,
  cartCount,
  orderMode,
  selectedTable,
  isLiveSynced,
  onBack,
  onSelectItem,
  onAddToCart,
  onUpdateCartQuantity,
  onToggleFavorite,
  onOpenCustomize,
  onOpenCart,
  onOpenTables,
  onOpenTableQr,
  onNavigateMode,
}) => {
  const [activeCategory, setActiveCategory] =
    useState<MenuFilterCategory>('Todas');
  const [query, setQuery] = useState('');
  const [cardSizeByDishId, setCardSizeByDishId] = useState<
    Record<string, string>
  >({});

  const availableItems = useMemo(
    () => menuItems.filter((item) => item.available),
    [menuItems]
  );

  const categoryCounts = useMemo(
    () => getCategoryCounts(availableItems),
    [availableItems]
  );

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return availableItems.filter((item) => {
      if (mode === 'favorites' && !favoriteIds.includes(item.id)) {
        return false;
      }
      if (
        mode === 'menu' &&
        !q &&
        activeCategory !== 'Todas' &&
        item.category !== activeCategory
      ) {
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
      ? 'Buscar Platillos'
      : mode === 'favorites'
      ? 'Mis Favoritos'
      : 'Carta Digital & Pedidos';

  return (
    <div className="flex-1 flex min-h-0 bg-[#FFF8E8]">
      {/* Desktop Secondary Category Column (matching reference layout) */}
      <aside
        aria-label="Categorías de la carta"
        className="hidden lg:flex w-52 xl:w-56 shrink-0 flex-col justify-between bg-[#FFFDF8] border-r border-[#D9A441]/30 select-none"
      >
        <div className="flex-1 overflow-y-auto phone-scroll p-3.5 space-y-4">
          <div>
            <div className="flex items-center justify-between px-2 mb-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7A5A3A]">
                Categorías Carta
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#FDF2D6] text-[10px] font-extrabold text-[#B84A27] tabular-nums">
                {availableItems.length}
              </span>
            </div>

            <div className="space-y-1">
              {MENU_FILTER_CATEGORIES.map((cat) => {
                const isActive = mode === 'menu' && activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat);
                      if (mode !== 'menu') onNavigateMode('menu');
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between gap-2 transition-colors duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-[#B84A27] text-[#FFF8E8] font-extrabold shadow-xs'
                        : 'text-[#2B1A0E] hover:bg-[#FDF2D6]'
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                    <span
                      className={`text-[11px] font-extrabold tabular-nums ${
                        isActive ? 'text-[#FFF8E8]/90' : 'text-[#7A5A3A]'
                      }`}
                    >
                      {categoryCounts[cat]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#D9A441]/25 space-y-1">
            <button
              type="button"
              onClick={() => onNavigateMode('favorites')}
              className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                mode === 'favorites'
                  ? 'bg-[#3B1F0E] text-[#FFF8E8] font-extrabold'
                  : 'text-[#2B1A0E] hover:bg-[#FDF2D6]'
              }`}
            >
              <span className="inline-flex items-center gap-2 truncate">
                <Heart
                  className={`w-3.5 h-3.5 shrink-0 ${
                    mode === 'favorites'
                      ? 'fill-[#D9A441] text-[#D9A441]'
                      : 'text-[#B84A27]'
                  }`}
                />
                <span>Favoritos</span>
              </span>
              <span className="text-[11px] font-extrabold tabular-nums opacity-85">
                {favoriteIds.length}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenCustomize}
              className="w-full px-3 py-2 rounded-xl text-xs font-bold text-[#2B1A0E] hover:bg-[#FDF2D6] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#B84A27] shrink-0" />
              <span className="truncate">Personalizar plato</span>
            </button>
          </div>
        </div>

        {/* Bottom Venue Metadata */}
        <div className="p-3.5 border-t border-[#D9A441]/25 bg-[#FFF8E8]/60 space-y-1 text-[11px] text-[#7A5A3A]">
          <p className="font-bold text-[#3B1F0E] inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#B84A27] shrink-0" />
            <span>Tupiza, Potosí · Bolivia</span>
          </p>
          <p className="font-semibold">Todos los días · Precios en Bs</p>
          <p className="font-bold text-[#2E6F32] inline-flex items-center gap-1 pt-0.5">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span>{isLiveSynced ? 'Sync en vivo · Cloud' : 'Carta en vivo'}</span>
          </p>
        </div>
      </aside>

      {/* Main Menu Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Mobile Header */}
        <div className="lg:hidden">
          <MobileHeader
            title={
              mode === 'search'
                ? 'Buscar'
                : mode === 'favorites'
                ? 'Favoritos'
                : 'Menú'
            }
            onBack={onBack}
            showCartBadge
            cartCount={cartCount}
            onCartClick={onOpenCart}
          />
        </div>

        {/* Desktop Top Utility Bar */}
        <header className="hidden lg:flex flex-wrap items-center justify-between gap-2.5 px-4 xl:px-6 py-2.5 bg-[#FFFDF8] border-b border-[#D9A441]/30 shrink-0">
          <div className="min-w-0">
            <h1 className="font-serif-display text-base xl:text-lg font-bold text-[#2B1A0E] truncate">
              {headerTitle}
            </h1>
            <p className="text-[11px] font-semibold text-[#7A5A3A] truncate">
              {orderMode === 'dine-in'
                ? `Comer en el local · Mesa ${selectedTable}`
                : 'Modo Delivery · Envío a domicilio'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 xl:gap-2 shrink-0 flex-wrap">
            <div className="relative w-40 xl:w-60">
              <Search className="w-4 h-4 text-[#7A5A3A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar plato..."
                aria-label="Buscar platillos"
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#FFF8E8] border border-[#D9A441]/55 text-xs font-semibold text-[#2B1A0E] placeholder:text-[#7A5A3A]/75 focus:outline-none focus:ring-2 focus:ring-[#B84A27]"
              />
            </div>

            <button
              type="button"
              onClick={onOpenTables}
              className="h-9 px-2.5 xl:px-3 rounded-xl bg-[#FDF2D6] border border-[#D9A441]/70 text-xs font-extrabold text-[#3B1F0E] inline-flex items-center gap-1.5 hover:bg-[#E8C87A]/35 transition-colors cursor-pointer whitespace-nowrap"
            >
              <UtensilsCrossed className="w-3.5 h-3.5 text-[#B84A27]" />
              <span>Mesa {selectedTable}</span>
            </button>

            <button
              type="button"
              onClick={onOpenTableQr}
              className="h-9 px-2.5 xl:px-3 rounded-xl bg-[#FFFDF8] border border-[#D9A441]/70 text-xs font-extrabold text-[#3B1F0E] inline-flex items-center gap-1.5 hover:bg-[#FDF2D6] transition-colors cursor-pointer whitespace-nowrap"
            >
              <QrCode className="w-3.5 h-3.5 text-[#3B1F0E]" />
              <span>Ver QR</span>
            </button>

            <button
              type="button"
              onClick={onOpenCart}
              className="xl:hidden h-9 px-3 rounded-xl bg-[#B84A27] text-[#FFF8E8] text-xs font-extrabold inline-flex items-center gap-1.5 hover:bg-[#C95B34] transition-colors cursor-pointer whitespace-nowrap"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Comanda</span>
              <span className="px-1.5 py-0.5 rounded-md bg-[#3B1F0E] text-[#D9A441] text-[10px] tabular-nums leading-none">
                {cartCount}
              </span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto phone-scroll">
          <div className="max-w-6xl mx-auto w-full px-4 lg:px-6 pt-3.5 lg:pt-5 pb-8 space-y-4 lg:space-y-5">
            {/* Mobile Context & Search Controls */}
            <div className="lg:hidden space-y-3">
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

              <div className="relative">
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
            </div>

            {/* Warm Editorial Hero Banner (in Menu mode) */}
            {mode === 'menu' && !query.trim() && (
              <section className="rounded-2xl bg-gradient-to-br from-[#3B1F0E] via-[#4A2C1A] to-[#6E2E16] border border-[#D9A441]/35 p-5 lg:p-6 text-[#FFF8E8] shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1.5 max-w-xl">
                  <p className="text-[11px] font-bold text-[#E8C87A] tracking-wide">
                    Tupiza · Potosí · Cocina Tradicional
                  </p>
                  <h2 className="font-serif-display text-2xl lg:text-3xl font-bold text-[#FFF8E8] leading-tight">
                    Como en Casa
                  </h2>
                  <p className="text-xs lg:text-sm text-[#FFF8E8]/85 leading-relaxed">
                    Sabores auténticos preparados al día: platos fuertes al horno, guisos caseros, sopas tradicionales y jugos naturales.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onOpenCustomize}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-xs inline-flex items-center justify-center gap-2 hover:bg-[#E8C87A] active:scale-[0.98] transition-all cursor-pointer shrink-0 whitespace-nowrap shadow-xs"
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Personaliza tu platillo</span>
                </button>
              </section>
            )}

            {/* Explore Filter Strip */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#7A5A3A]">
                  {mode === 'favorites'
                    ? 'Tus platos favoritos'
                    : query.trim()
                    ? 'Resultados de búsqueda'
                    : 'Explorar la Carta'}
                </h2>
                <span className="text-xs font-bold text-[#7A5A3A] tabular-nums">
                  {filteredItems.length}{' '}
                  {filteredItems.length === 1 ? 'plato' : 'platos'}
                </span>
              </div>

              {mode === 'menu' && (
                <CategoryTabs
                  activeCategory={activeCategory}
                  onSelectCategory={setActiveCategory}
                  includeAll
                />
              )}
            </div>

            {/* Dish Grid */}
            {filteredItems.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-2xl bg-[#FDF2D6] border border-[#D9A441]/55 space-y-2">
                <p className="font-serif-display text-lg font-bold text-[#3B1F0E]">
                  {mode === 'favorites'
                    ? 'Aún no tienes platillos favoritos'
                    : 'No encontramos platillos'}
                </p>
                <p className="text-xs text-[#7A5A3A]">
                  {mode === 'favorites'
                    ? 'Toca el corazón en cualquier plato del menú para guardarlo aquí.'
                    : 'Prueba con otro nombre o selecciona "Todas" en las categorías.'}
                </p>
                {(query.trim() || activeCategory !== 'Todas') && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setActiveCategory('Todas');
                    }}
                    className="mt-2 px-4 py-2 rounded-xl bg-[#3B1F0E] text-[#FFF8E8] text-xs font-extrabold cursor-pointer"
                  >
                    Ver toda la carta
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {filteredItems.map((item) => {
                  const isFav = favoriteIds.includes(item.id);
                  const chosenSizeId =
                    cardSizeByDishId[item.id] || item.sizes[0]?.id;
                  const activeSize =
                    item.sizes.find((s) => s.id === chosenSizeId) ||
                    item.sizes[0];
                  const matchingCartItem = cart.find(
                    (c) =>
                      c.menuItemId === item.id &&
                      c.sizeId === activeSize.id &&
                      c.extras.length === 0 &&
                      !c.customSummary
                  );

                  return (
                    <article
                      key={item.id}
                      className="rounded-2xl bg-[#FFFDF8] border border-[#D9A441]/55 overflow-hidden flex flex-col shadow-xs hover:border-[#B84A27] hover:-translate-y-0.5 transition-all duration-150"
                    >
                      {/* Photo Header with Scrim & Price */}
                      <div className="relative h-40 sm:h-44 bg-[#F4E5C8] overflow-hidden shrink-0">
                        <button
                          type="button"
                          onClick={() => onSelectItem(item)}
                          aria-label={`Ver detalle de ${item.name}`}
                          className="w-full h-full block cursor-pointer focus:outline-none"
                        >
                          <DishIllustration
                            visualType={item.visualType}
                            dishId={item.id}
                            name={item.name}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onToggleFavorite(item.id)}
                          aria-label={
                            isFav
                              ? `Quitar ${item.name} de favoritos`
                              : `Guardar ${item.name} en favoritos`
                          }
                          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-[#FFF8E8]/90 hover:bg-[#FFF8E8] flex items-center justify-center shadow-xs transition-transform active:scale-95 cursor-pointer"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              isFav
                                ? 'fill-[#B83227] text-[#B83227]'
                                : 'text-[#3B1F0E]'
                            }`}
                          />
                        </button>

                        <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between gap-2 pointer-events-none">
                          <span className="text-[11px] font-bold text-[#FFF8E8]/90 truncate">
                            {item.category}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-lg bg-[#3B1F0E]/90 border border-[#D9A441]/50 text-[#FFF8E8] text-xs font-extrabold tabular-nums shrink-0">
                            {formatBs(activeSize.price)}
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => onSelectItem(item)}
                          className="text-left w-full cursor-pointer group"
                        >
                          <h3 className="font-bold text-[15px] text-[#2B1A0E] group-hover:text-[#B84A27] transition-colors truncate">
                            {item.name}
                          </h3>
                          <p className="text-xs text-[#7A5A3A] line-clamp-2 mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        </button>

                        {/* Inline Size Selector */}
                        <div className="space-y-2.5">
                          {item.sizes.length > 1 && (
                            <div className="flex flex-wrap gap-1.5">
                              {item.sizes.map((sz) => {
                                const selected = sz.id === activeSize.id;
                                return (
                                  <button
                                    key={sz.id}
                                    type="button"
                                    onClick={() =>
                                      setCardSizeByDishId((prev) => ({
                                        ...prev,
                                        [item.id]: sz.id,
                                      }))
                                    }
                                    className={`px-2 py-1 rounded-lg text-[11px] font-extrabold border transition-colors cursor-pointer tabular-nums ${
                                      selected
                                        ? 'bg-[#3B1F0E] border-[#3B1F0E] text-[#FFF8E8]'
                                        : 'bg-[#FDF2D6] border-[#D9A441]/50 text-[#3B1F0E] hover:border-[#B84A27]'
                                    }`}
                                  >
                                    {sz.label} · Bs {sz.price}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Action Row */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onSelectItem(item)}
                              aria-label={`Personalizar o ver extras de ${item.name}`}
                              title="Ver detalle y extras"
                              className="w-10 h-10 rounded-xl bg-[#FDF2D6] border border-[#D9A441]/60 text-[#3B1F0E] flex items-center justify-center hover:bg-[#E8C87A]/40 transition-colors cursor-pointer shrink-0"
                            >
                              <SlidersHorizontal className="w-4 h-4" />
                            </button>

                            {matchingCartItem ? (
                              <div className="flex-1 h-10 rounded-xl bg-[#B84A27] text-[#FFF8E8] px-1.5 flex items-center justify-between gap-1 shadow-xs">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateCartQuantity(
                                      matchingCartItem.cartItemId,
                                      -1
                                    )
                                  }
                                  aria-label={`Quitar una unidad de ${item.name}`}
                                  className="w-8 h-8 rounded-lg hover:bg-black/15 flex items-center justify-center cursor-pointer"
                                >
                                  <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
                                </button>
                                <span className="text-xs font-extrabold tabular-nums">
                                  {matchingCartItem.quantity} en comanda
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateCartQuantity(
                                      matchingCartItem.cartItemId,
                                      1
                                    )
                                  }
                                  aria-label={`Agregar otra unidad de ${item.name}`}
                                  className="w-8 h-8 rounded-lg hover:bg-black/15 flex items-center justify-center cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onAddToCart(item, activeSize)}
                                className="flex-1 h-10 px-3 rounded-xl bg-[#B84A27] text-[#FFF8E8] font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-[#C95B34] active:scale-[0.98] transition-all cursor-pointer shadow-xs"
                              >
                                <Plus className="w-4 h-4" strokeWidth={2.5} />
                                <span>Añadir</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
