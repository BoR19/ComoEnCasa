import React, { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import {
  CUSTOMIZE_BASES,
  CUSTOMIZE_SIDES,
  CUSTOMIZE_TOPPINGS,
} from '../../data/mockData';
import { DishSizeOption, MenuItem } from '../../types/app';
import { formatBs } from '../../utils/appHelpers';
import { MobileHeader } from '../ShellComponents';

interface CustomizeDishScreenProps {
  menuItems: MenuItem[];
  onBack: () => void;
  onSaveAndContinue: (payload: {
    base: string;
    toppings: string[];
    side: string;
    selectedAdditions: { item: MenuItem; size: DishSizeOption }[];
  }) => void;
}

export const CustomizeDishScreen: React.FC<CustomizeDishScreenProps> = ({
  menuItems,
  onBack,
  onSaveAndContinue,
}) => {
  const [selectedBase, setSelectedBase] = useState<string>('Arroz');
  const [selectedToppings, setSelectedToppings] = useState<string[]>(['Pollo']);
  const [selectedSide, setSelectedSide] = useState<string>('Papa dorada');
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});

  const guisos = menuItems.filter((m) => m.category === 'Guisos' && m.available);
  const sopas = menuItems.filter((m) => m.category === 'Sopas' && m.available);
  const jugos = menuItems.filter((m) => m.category === 'Jugos' && m.available);

  const selectedAdditions = useMemo(() => {
    const result: { item: MenuItem; size: DishSizeOption }[] = [];
    for (const [itemId, sizeId] of Object.entries(selectedSizes)) {
      const foundItem = menuItems.find((m) => m.id === itemId);
      const foundSize = foundItem?.sizes.find((s) => s.id === sizeId);
      if (foundItem && foundSize) {
        result.push({ item: foundItem, size: foundSize });
      }
    }
    return result;
  }, [selectedSizes, menuItems]);

  const livePrice = useMemo(() => {
    if (selectedAdditions.length === 0) return 15;
    return selectedAdditions.reduce((acc, a) => acc + a.size.price, 0);
  }, [selectedAdditions]);

  const toggleTopping = (topping: string) => {
    setSelectedToppings((prev) =>
      prev.includes(topping)
        ? prev.filter((t) => t !== topping)
        : [...prev, topping]
    );
  };

  const toggleItemSize = (itemId: string, sizeId: string) => {
    setSelectedSizes((prev) => {
      if (prev[itemId] === sizeId) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: sizeId };
    });
  };

  const handleSave = () => {
    onSaveAndContinue({
      base: selectedBase,
      toppings: selectedToppings,
      side: selectedSide,
      selectedAdditions,
    });
  };

  const renderSizeSelectorRow = (item: MenuItem) => {
    const chosenSizeId = selectedSizes[item.id];
    return (
      <div
        key={item.id}
        className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3 space-y-2"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-sm text-[var(--ink-primary)]">{item.name}</span>
          {chosenSizeId && (
            <span className="text-[11px] font-bold text-[var(--status-ok)] inline-flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Seleccionado
            </span>
          )}
        </div>
        <div
          className={`grid gap-2 ${
            item.sizes.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
          }`}
        >
          {item.sizes.map((size) => {
            const active = chosenSizeId === size.id;
            return (
              <button
                key={size.id}
                type="button"
                onClick={() => toggleItemSize(item.id, size.id)}
                className={`min-h-[38px] px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-[transform,background-color,border-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer tabular-nums ${
                  active
                    ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--bg-canvas)]'
                    : 'bg-[var(--bg-inset)] border-[var(--border-subtle)] text-[var(--ink-primary)] hover:border-[var(--accent-primary)]'
                }`}
              >
                {size.label} Bs {size.price}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-canvas)] min-h-0">
      <MobileHeader title="Personaliza tu platillo" onBack={onBack} />

      <div className="flex-1 overflow-y-auto phone-scroll">
        <div className="max-w-5xl mx-auto w-full px-4 lg:px-8 pt-4 lg:pt-6 pb-6">
          <div className="space-y-5 lg:grid lg:grid-cols-12 lg:gap-6 lg:space-y-0 lg:items-start">
            {/* Left column on PC: Base, Toppings, Acompañamiento */}
            <div className="space-y-5 lg:col-span-5">
              {/* Base */}
              <section>
                <h2 className="font-serif-display text-base font-bold text-[var(--ink-primary)] mb-2">
                  1. Elige tu base
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {CUSTOMIZE_BASES.map((base) => {
                    const active = selectedBase === base;
                    return (
                      <button
                        key={base}
                        type="button"
                        onClick={() => setSelectedBase(base)}
                        className={`min-h-[42px] px-3 rounded-2xl border text-xs font-bold transition-[transform,background-color,border-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer ${
                          active
                            ? 'bg-[var(--ink-primary)] border-[var(--ink-primary)] text-[var(--bg-canvas)]'
                            : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--ink-primary)] hover:border-[var(--accent-primary)]'
                        }`}
                      >
                        {base}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Toppings */}
              <section>
                <h2 className="font-serif-display text-base font-bold text-[var(--ink-primary)] mb-2">
                  2. Toppings
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {CUSTOMIZE_TOPPINGS.map((topping) => {
                    const active = selectedToppings.includes(topping);
                    return (
                      <button
                        key={topping}
                        type="button"
                        onClick={() => toggleTopping(topping)}
                        className={`min-h-[42px] px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-[transform,background-color,border-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer ${
                          active
                            ? 'bg-[var(--accent-gold)] border-[var(--accent-gold)] text-[var(--ink-primary)]'
                            : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--ink-primary)] hover:border-[var(--accent-primary)]'
                        }`}
                      >
                        {active && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                        <span>{topping}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Acompañamiento */}
              <section>
                <h2 className="font-serif-display text-base font-bold text-[var(--ink-primary)] mb-2">
                  3. Acompañamiento
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {CUSTOMIZE_SIDES.map((side) => {
                    const active = selectedSide === side;
                    return (
                      <button
                        key={side}
                        type="button"
                        onClick={() => setSelectedSide(side)}
                        className={`min-h-[42px] px-3 rounded-2xl border text-xs font-bold transition-[transform,background-color,border-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer ${
                          active
                            ? 'bg-[var(--ink-primary)] border-[var(--ink-primary)] text-[var(--bg-canvas)]'
                            : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--ink-primary)] hover:border-[var(--accent-primary)]'
                        }`}
                      >
                        {side}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Desktop inline save CTA */}
              <button
                type="button"
                onClick={handleSave}
                className="hidden lg:flex w-full min-h-[52px] px-5 py-3 rounded-2xl bg-[var(--accent-primary)] text-[var(--bg-canvas)] font-bold text-sm items-center justify-center hover:opacity-95 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer tabular-nums"
              >
                Guardar · Continuar ({formatBs(livePrice)})
              </button>
            </div>

            {/* Right column on PC: Guisos, Sopas, Jugos */}
            <div className="space-y-5 lg:col-span-7">
              <section>
                <div className="flex items-baseline justify-between mb-2">
                  <h2 className="font-serif-display text-lg font-bold text-[var(--ink-primary)]">
                    Guisos
                  </h2>
                  <span className="text-[11px] font-bold text-[var(--accent-primary)]">
                    Chanfaina Entero Bs 10
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {guisos.map(renderSizeSelectorRow)}
                </div>
              </section>

              <section>
                <h2 className="font-serif-display text-lg font-bold text-[var(--ink-primary)] mb-2">
                  Sopas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {sopas.map(renderSizeSelectorRow)}
                </div>
              </section>

              <section>
                <h2 className="font-serif-display text-lg font-bold text-[var(--ink-primary)] mb-2">
                  Jugos
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {jugos.map(renderSizeSelectorRow)}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Save Button (Mobile) */}
      <div className="lg:hidden p-3.5 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] shrink-0">
        <button
          type="button"
          onClick={handleSave}
          className="w-full min-h-[50px] px-5 py-3 rounded-2xl bg-[var(--accent-primary)] text-[var(--bg-canvas)] font-bold text-sm flex items-center justify-center hover:opacity-95 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer tabular-nums"
        >
          Guardar · Continuar ({formatBs(livePrice)})
        </button>
      </div>
    </div>
  );
};
