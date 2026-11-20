import React, { useEffect, useState } from 'react';
import { Check, Clock, Heart, SlidersHorizontal, Star } from 'lucide-react';
import { DISH_EXTRAS } from '../../data/mockData';
import { DishSizeOption, ExtraOption, MenuItem } from '../../types/app';
import { formatBs } from '../../utils/appHelpers';
import { DishIllustration } from '../BrandAssets';
import { MobileHeader } from '../ShellComponents';

interface DishDetailScreenProps {
  item: MenuItem;
  isFavorite: boolean;
  onBack: () => void;
  onToggleFavorite: (id: string) => void;
  onAddToCart: (item: MenuItem, size: DishSizeOption, extras: ExtraOption[]) => void;
  onOpenCustomize: () => void;
}

export const DishDetailScreen: React.FC<DishDetailScreenProps> = ({
  item,
  isFavorite,
  onBack,
  onToggleFavorite,
  onAddToCart,
  onOpenCustomize,
}) => {
  const [selectedSize, setSelectedSize] = useState<DishSizeOption>(item.sizes[0]);
  const [selectedExtras, setSelectedExtras] = useState<ExtraOption[]>([]);

  useEffect(() => {
    setSelectedSize(item.sizes[0]);
    setSelectedExtras([]);
  }, [item]);

  const toggleExtra = (extra: ExtraOption) => {
    setSelectedExtras((prev) =>
      prev.some((e) => e.id === extra.id)
        ? prev.filter((e) => e.id !== extra.id)
        : [...prev, extra]
    );
  };

  const extrasTotal = selectedExtras.reduce((acc, e) => acc + e.price, 0);
  const finalPrice = selectedSize.price + extrasTotal;

  return (
    <div className="flex-1 flex flex-col bg-[#FFF8E8] min-h-0">
      <MobileHeader
        title="Detalle del plato"
        onBack={onBack}
        rightSlot={
          <button
            type="button"
            onClick={() => onToggleFavorite(item.id)}
            aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#D9A441] hover:bg-[#4A2C1A] cursor-pointer"
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorite ? 'fill-[#B84A27] text-[#B84A27]' : 'text-[#FFF8E8]'
              }`}
            />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto phone-scroll">
        <div className="max-w-4xl mx-auto w-full px-4 lg:px-8 pt-4 lg:pt-6 pb-6">
          <div className="space-y-4 lg:grid lg:grid-cols-12 lg:gap-6 lg:space-y-0 lg:items-start">
            {/* Left column on PC: Dish photo + Ingredients */}
            <div className="space-y-4 lg:col-span-5">
              <div className="rounded-2xl overflow-hidden border border-[#D9A441]/60 bg-[#FDF2D6] h-44 lg:h-64 shadow-xs">
                <DishIllustration visualType={item.visualType} dishId={item.id} name={item.name} className="w-full h-full object-cover" />
              </div>

              <section className="rounded-2xl bg-[#FDF2D6] border border-[#D9A441]/55 p-3.5 hidden lg:block">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-sm font-extrabold text-[#2B1A0E]">Ingredientes</h3>
                  <button
                    type="button"
                    onClick={onOpenCustomize}
                    className="text-xs font-extrabold text-[#B84A27] inline-flex items-center gap-1 underline decoration-[#B84A27]/60 cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Personalizar
                  </button>
                </div>
                <p className="text-xs text-[#7A5A3A] leading-relaxed">
                  {item.ingredients.join(', ')}.
                </p>
              </section>
            </div>

            {/* Right column on PC: Details, Size, Extras, CTA */}
            <div className="space-y-4 lg:col-span-7">
              <div>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-serif-display text-2xl lg:text-3xl font-bold text-[#2B1A0E] leading-tight">
                      {item.name}
                    </h2>
                    <p className="text-lg font-extrabold text-[#B84A27] mt-0.5 tabular-nums">
                      {formatBs(selectedSize.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-[#7A5A3A] pt-1 shrink-0">
                    <span className="inline-flex items-center gap-1 text-[#2B1A0E]">
                      <Star className="w-4 h-4 fill-[#D9A441] text-[#D9A441]" />
                      {item.rating.toFixed(1)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-4 h-4 text-[#B84A27]" />
                      {item.prepTime}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-[#7A5A3A] leading-relaxed mt-2">
                  {item.description}
                </p>
              </div>

              {/* Size Selector */}
              <section>
                <h3 className="text-sm font-extrabold text-[#2B1A0E] mb-2">Tamaño</h3>
                <div
                  className={`grid gap-2.5 ${
                    item.sizes.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
                  }`}
                >
                  {item.sizes.map((size) => {
                    const active = selectedSize.id === size.id;
                    return (
                      <button
                        key={size.id}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`min-h-[46px] px-3 py-2 rounded-2xl border text-center transition-all cursor-pointer ${
                          active
                            ? 'bg-[#B84A27] border-[#B84A27] text-[#FFF8E8] font-extrabold shadow-xs'
                            : 'bg-[#FDF2D6] border-[#D9A441]/60 text-[#2B1A0E] font-bold hover:border-[#B84A27]'
                        }`}
                      >
                        <span className="block text-xs">{size.label}</span>
                        <span className="block text-xs font-extrabold tabular-nums">
                          {formatBs(size.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Extras (for food categories) */}
              {item.category !== 'Jugos' && (
                <section>
                  <h3 className="text-sm font-extrabold text-[#2B1A0E] mb-2">Extras</h3>
                  <div className="space-y-2">
                    {DISH_EXTRAS.map((extra) => {
                      const checked = selectedExtras.some((e) => e.id === extra.id);
                      return (
                        <button
                          key={extra.id}
                          type="button"
                          onClick={() => toggleExtra(extra)}
                          className={`w-full min-h-[44px] px-3.5 py-2 rounded-2xl border flex items-center justify-between text-sm transition-colors cursor-pointer ${
                            checked
                              ? 'bg-[#FDF2D6] border-[#B84A27] text-[#2B1A0E]'
                              : 'bg-[#FFFDF8] border-[#D9A441]/50 text-[#2B1A0E]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                                checked
                                  ? 'bg-[#B84A27] border-[#B84A27] text-[#FFF8E8]'
                                  : 'border-[#7A5A3A]/60 bg-white'
                              }`}
                            >
                              {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                            </span>
                            <span className="font-semibold">{extra.label}</span>
                          </div>
                          <span className="font-extrabold text-[#B84A27] tabular-nums">
                            +Bs {extra.price.toFixed(2)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Ingredients on Mobile */}
              <section className="rounded-2xl bg-[#FDF2D6] border border-[#D9A441]/55 p-3.5 lg:hidden">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-sm font-extrabold text-[#2B1A0E]">Ingredientes</h3>
                  <button
                    type="button"
                    onClick={onOpenCustomize}
                    className="text-xs font-extrabold text-[#B84A27] inline-flex items-center gap-1 underline decoration-[#B84A27]/60 cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Personalizar
                  </button>
                </div>
                <p className="text-xs text-[#7A5A3A] leading-relaxed">
                  {item.ingredients.join(', ')}.
                </p>
              </section>

              {/* Desktop Inline CTA */}
              <button
                type="button"
                onClick={() => onAddToCart(item, selectedSize, selectedExtras)}
                className="hidden lg:flex w-full min-h-[52px] px-5 py-3 rounded-2xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-sm items-center justify-center shadow-sm hover:bg-[#E8C87A] active:scale-[0.98] transition-all cursor-pointer tabular-nums"
              >
                Agregar al carrito • {formatBs(finalPrice)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom CTA (Mobile) */}
      <div className="lg:hidden p-3.5 bg-[#FFF8E8] border-t border-[#D9A441]/40 shrink-0">
        <button
          type="button"
          onClick={() => onAddToCart(item, selectedSize, selectedExtras)}
          className="w-full min-h-[50px] px-5 py-3 rounded-2xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-sm flex items-center justify-center shadow-sm hover:bg-[#E8C87A] active:scale-[0.98] transition-all cursor-pointer tabular-nums"
        >
          Agregar al carrito • {formatBs(finalPrice)}
        </button>
      </div>
    </div>
  );
};
