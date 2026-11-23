import React, { useMemo, useState } from 'react';
import {
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
  takeawayCustomerName?: string;
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
  takeawayCustomerName,
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
      ? 'Buscar platillos'
      : mode === 'favorites'
      ? 'Mis favoritos'
      : 'Carta digital';

  return (
    <div className="flex-1 flex min-h-0 bg-[var(--bg-canvas)]">
      {/* Desktop Secondary Category Column */}
      <aside
        aria-label="Categorías de la carta"
        className="hidden lg:flex w-52 xl:w-56 shrink-0 flex-col justify-between bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] select-none"
      >
        <div className="flex-1 overflow-y-auto phone-scroll p-3.5 space-y-4">
          <div>
            <div className="flex items-center justify-between px-2 mb-2.5">
              <span className="text-xs font-bold text-[var(--ink-muted)]">
                Categorías
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[var(--bg-inset)] text-[11px] font-bold text-[var(--accent-primary)] tabular-nums">
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
                    className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                      isActive
                        ? 'bg-[var(--accent-primary)] text-[var(--bg-surface)] font-bold shadow-xs'
                        : 'text-[var(--ink-primary)] hover:bg-[var(--bg-inset)]'
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                    <span
                      className={`text-[11px] font-bold tabular-nums ${
                        isActive
                          ? 'text-white/90'
                          : 'text-[var(--ink-muted)]'
                      }`}
                    >
                      {categoryCounts[cat]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--border-subtle)] space-y-1">
            <button
              type="button"
              onClick={() => onNavigateMode('favorites')}
              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                mode === 'favorites'
                  ? 'bg-[var(--ink-primary)] text-[var(--bg-surface)] font-bold'
                  : 'text-[var(--ink-primary)] hover:bg-[var(--bg-inset)]'
              }`}
            >
              <span className="inline-flex items-center gap-2 truncate">
                <Heart
                  className={`w-3.5 h-3.5 shrink-0 ${
                    mode === 'favorites'
                      ? 'fill-[var(--accent-gold)] text-[var(--accent-gold)]'
                      : 'text-[var(--accent-primary)]'
                  }`}
                />
                <span>Favoritos</span>
              </span>
              <span className="text-[11px] font-bold tabular-nums opacity-85">
                {favoriteIds.length}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenCustomize}
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--bg-inset)] flex items-center gap-2 transition-[transform,background-color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
              <span className="truncate">Personalizar plato</span>
            </button>
          </div>
        </div>

        {/* Bottom Venue Metadata */}
        <div className="p-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)]/70 space-y-1 text-xs text-[var(--ink-muted)]">
          <p className="font-semibold text-[var(--ink-primary)] inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
            <span>Tupiza, Potosí</span>
          </p>
          <p>Todos los días — Precios en Bs.</p>
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
        <header className="hidden lg:flex flex-wrap items-center justify-between gap-2.5 px-4 xl:px-6 py-2.5 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] shrink-0">
          <div className="min-w-0">
            <h1 className="font-serif-display text-base xl:text-lg font-bold text-[var(--ink-primary)] truncate">
              {headerTitle}
            </h1>
            <p className="text-xs font-medium text-[var(--ink-muted)] truncate">
              {orderMode === 'dine-in'
                ? `Comer en el local — Mesa ${selectedTable}`
                : orderMode === 'takeaway'
                ? `Para Llevar — ${
                    takeawayCustomerName?.trim() || 'Retiro en local'
                  }`
                : 'Delivery — Envío a domicilio'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 xl:gap-2 shrink-0 flex-wrap">
            <div className="relative w-40 xl:w-60">
              <Search className="w-4 h-4 text-[var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar plato..."
                aria-label="Buscar platillos"
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)]/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              />
            </div>

            <button
              type="button"
              onClick={onOpenTables}
              className="h-9 px-2.5 xl:px-3 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--ink-primary)] inline-flex items-center gap-1.5 hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
            >
              <UtensilsCrossed className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>Mesa {selectedTable}</span>
            </button>

            <button
              type="button"
              onClick={onOpenTableQr}
              className="h-9 px-2.5 xl:px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--ink-primary)] inline-flex items-center gap-1.5 hover:bg-[var(--bg-inset)] active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
            >
              <QrCode className="w-3.5 h-3.5 text-[var(--ink-primary)]" />
              <span>Ver QR</span>
            </button>

            <button
              type="button"
              onClick={onOpenCart}
              className="xl:hidden h-9 px-3 rounded-xl bg-[var(--accent-primary)] text-[var(--bg-surface)] text-xs font-bold inline-flex items-center gap-1.5 hover:brightness-105 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink-primary)]"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Comanda</span>
              <span className="px-1.5 py-0.5 rounded-md bg-[var(--ink-primary)] text-[var(--accent-gold)] text-[10px] tabular-nums leading-none">
                {cartCount}
              </span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto phone-scroll">
          <div className="max-w-6xl mx-auto w-full px-4 lg:px-6 pt-3.5 lg:pt-5 pb-24 xl:pb-8 space-y-4 lg:space-y-5">
            {/* Mobile & Tablet Context & Search Controls */}
            <div className="lg:hidden space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-xs">
                <span className="font-semibold text-[var(--ink-primary)] min-w-0 truncate">
                  {orderMode === 'dine-in'
                    ? `Comer en el local — Mesa ${selectedTable}`
                    : orderMode === 'takeaway'
                    ? `Para Llevar — ${
                        takeawayCustomerName?.trim() || 'Retiro en local'
                      }`
                    : 'Delivery — Envío a domicilio'}
                </span>
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      onNavigateMode(mode === 'favorites' ? 'menu' : 'favorites')
                    }
                    className={`inline-flex items-center gap-1 font-bold cursor-pointer whitespace-nowrap ${
                      mode === 'favorites'
                        ? 'text-[var(--accent-primary)] underline'
                        : 'text-[var(--ink-primary)] hover:text-[var(--accent-primary)]'
                    }`}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        mode === 'favorites'
                          ? 'fill-[var(--accent-primary)] text-[var(--accent-primary)]'
                          : 'text-[var(--accent-primary)]'
                      }`}
                    />
                    <span>Favoritos ({favoriteIds.length})</span>
                  </button>

                  {orderMode === 'dine-in' ? (
                    <button
                      type="button"
                      onClick={onOpenTables}
                      className="font-bold text-[var(--accent-primary)] underline decoration-[var(--accent-primary)]/60 cursor-pointer whitespace-nowrap"
                    >
                      Cambiar mesa
                    </button>
                  ) : orderMode === 'takeaway' ? (
                    <button
                      type="button"
                      onClick={onOpenCart}
                      className="font-bold text-[var(--accent-primary)] underline decoration-[var(--accent-primary)]/60 cursor-pointer whitespace-nowrap"
                    >
                      Ver comanda
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-[var(--ink-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar platillos..."
                  aria-label="Buscar platillos"
                  className="w-full h-11 pl-10 pr-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)]/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                />
              </div>
            </div>

            {/* Clean Single-Line Editorial Header (in Menu mode) */}
            {mode === 'menu' && !query.trim() && (
              <section className="pb-3.5 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-serif-display text-2xl lg:text-3xl font-bold text-[var(--ink-primary)] leading-tight">
                    Carta del día
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--ink-muted)] mt-0.5">
                    Platos fuertes al horno, guisos caseros, sopas tradicionales y jugos naturales.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onOpenCustomize}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] font-bold text-xs inline-flex items-center justify-center gap-2 hover:border-[var(--accent-primary)] hover:bg-[var(--bg-inset)] active:scale-[0.97] transition-[transform,border-color,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                >
                  <Sparkles className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                  <span>Personaliza tu platillo</span>
                </button>
              </section>
            )}

            {/* Explore Filter Strip */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-[var(--ink-primary)]">
                  {mode === 'favorites'
                    ? 'Tus platos favoritos'
                    : query.trim()
                    ? 'Resultados de búsqueda'
                    : 'Explorar la carta'}
                </h2>
                <span className="text-xs font-semibold text-[var(--ink-muted)] tabular-nums">
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

            {/* Flat Editorial Dish Grid */}
            {filteredItems.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2">
                <p className="font-serif-display text-lg font-bold text-[var(--ink-primary)]">
                  {mode === 'favorites'
                    ? 'Aún no tienes platillos favoritos'
                    : 'No encontramos platillos'}
                </p>
                <p className="text-xs text-[var(--ink-muted)]">
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
                    className="mt-2 px-4 py-2 rounded-xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-xs font-bold active:scale-[0.97] transition-transform duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                  >
                    Ver toda la carta
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
                      className="dish-card-interactive rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden flex flex-col transition-[transform,border-color] duration-200 ease-[var(--ease-out)]"
                    >
                      {/* Clean Photo Header */}
                      <div className="relative h-44 bg-[var(--bg-inset)] overflow-hidden shrink-0">
                        <button
                          type="button"
                          onClick={() => onSelectItem(item)}
                          aria-label={`Ver detalle de ${item.name}`}
                          className="w-full h-full block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent-primary)]"
                        >
                          <DishIllustration
                            visualType={item.visualType}
                            dishId={item.id}
                            name={item.name}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() => onToggleFavorite(item.id)}
                          aria-label={
                            isFav
                              ? `Quitar ${item.name} de favoritos`
                              : `Guardar ${item.name} en favoritos`
                          }
                          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-[var(--bg-surface)]/95 border border-[var(--border-subtle)] flex items-center justify-center shadow-xs active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              isFav
                                ? 'fill-[var(--status-danger)] text-[var(--status-danger)]'
                                : 'text-[var(--ink-primary)]'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Card Content (Flat Editorial Info, No Card-in-Card) */}
                      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => onSelectItem(item)}
                          className="text-left w-full cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] rounded-lg"
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <h3 className="font-serif-display font-bold text-base text-[var(--ink-primary)] group-hover:text-[var(--accent-primary)] transition-colors duration-150 min-w-0 [overflow-wrap:break-word]">
                              {item.name}
                            </h3>
                            <span className="font-bold text-sm text-[var(--accent-primary)] tabular-nums shrink-0">
                              {formatBs(activeSize.price)}
                            </span>
                          </div>
                          <p className="text-[11px] font-medium text-[var(--ink-muted)] mt-0.5">
                            {item.category}
                          </p>
                          <p className="text-xs text-[var(--ink-muted)] line-clamp-2 mt-1.5 leading-relaxed">
                            {item.description}
                          </p>
                        </button>

                        {/* Inline Size Selector & Actions */}
                        <div className="space-y-2.5 pt-2 border-t border-[var(--border-subtle)]/70">
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
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-[transform,background-color,border-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                                      selected
                                        ? 'bg-[var(--ink-primary)] border-[var(--ink-primary)] text-[var(--bg-surface)]'
                                        : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--ink-primary)] hover:border-[var(--accent-primary)]'
                                    }`}
                                  >
                                    {sz.label} · Bs {sz.price}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onSelectItem(item)}
                              aria-label={`Personalizar o ver extras de ${item.name}`}
                              title="Ver detalle y extras"
                              className="w-11 h-11 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-[var(--ink-primary)] flex items-center justify-center hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                            >
                              <SlidersHorizontal className="w-4 h-4" />
                            </button>

                            {matchingCartItem ? (
                              <div className="flex-1 h-11 rounded-xl bg-[var(--accent-primary)] text-[var(--bg-surface)] px-1.5 flex items-center justify-between gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateCartQuantity(
                                      matchingCartItem.cartItemId,
                                      -1
                                    )
                                  }
                                  aria-label={`Quitar una unidad de ${item.name}`}
                                  className="w-9 h-9 rounded-lg hover:bg-black/15 active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                >
                                  <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
                                </button>
                                <span className="text-xs font-bold tabular-nums">
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
                                  className="w-9 h-9 rounded-lg hover:bg-black/15 active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                >
                                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onAddToCart(item, activeSize)}
                                className="flex-1 h-11 px-3 rounded-xl bg-[var(--accent-primary)] text-[var(--bg-surface)] font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-105 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink-primary)]"
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
