import React, { useEffect, useMemo, useState } from 'react';
import { Check, Minus, Plus, X } from 'lucide-react';
import {
  DishSizeOption,
  KitchenOrder,
  MenuCategory,
  MenuItem,
  OrderLineItem,
  OrderMode,
  PaymentMethod,
  TableItem,
} from '../types/app';
import {
  PAYMENT_METHODS,
  formatBs,
  getOrderLinesTotal,
} from '../utils/appHelpers';
import { CategoryTabs } from './ShellComponents';

interface PosOrderModalProps {
  isOpen: boolean;
  title?: string;
  tables: TableItem[];
  menuItems: MenuItem[];
  initialTable?: number;
  onClose: () => void;
  onCreatePosOrder: (payload: {
    mode: OrderMode;
    tableNumber?: number;
    customerName?: string;
    pickupNote?: string;
    deliveryAddress?: string;
    deliveryPhone?: string;
    notes: string;
    items: OrderLineItem[];
    payNowMethod?: PaymentMethod;
  }) => KitchenOrder;
  onOpenTicket?: (order: KitchenOrder) => void;
}

export const PosOrderModal: React.FC<PosOrderModalProps> = ({
  isOpen,
  title = 'Nueva Comanda',
  tables,
  menuItems,
  initialTable = 1,
  onClose,
  onCreatePosOrder,
  onOpenTicket,
}) => {
  const [mode, setMode] = useState<OrderMode>('dine-in');
  const [tableNumber, setTableNumber] = useState<number>(initialTable);
  const [customerName, setCustomerName] = useState('');
  const [pickupNote, setPickupNote] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<MenuCategory>('Platos Fuertes');
  const [items, setItems] = useState<OrderLineItem[]>([]);
  const [payNow, setPayNow] = useState(false);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Efectivo');
  const [openTicketOnSave, setOpenTicketOnSave] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setMode('dine-in');
    setTableNumber(initialTable);
    setItems([]);
    setCustomerName('');
    setPickupNote('');
    setAddress('');
    setPhone('');
    setNotes('');
    setPayNow(false);
  }, [isOpen, initialTable]);

  const total = useMemo(() => getOrderLinesTotal(items), [items]);

  const availableByCategory = useMemo(
    () => menuItems.filter((m) => m.available && m.category === category),
    [menuItems, category]
  );

  if (!isOpen) return null;

  const addLineItem = (item: MenuItem, size: DishSizeOption) => {
    if (!item.available) return;
    setItems((prev) => {
      const idx = prev.findIndex(
        (l) => l.menuItemId === item.id && l.sizeLabel === size.label
      );
      if (idx >= 0) {
        return prev.map((l, i) =>
          i === idx ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          category: item.category,
          name: item.name,
          sizeLabel: size.label,
          quantity: 1,
          price: size.price,
        },
      ];
    });
  };

  const updateLineQty = (index: number, delta: number) => {
    setItems((prev) =>
      prev
        .map((it, i) =>
          i === index ? { ...it, quantity: it.quantity + delta } : it
        )
        .filter((it) => it.quantity > 0)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const created = onCreatePosOrder({
      mode,
      tableNumber: mode === 'dine-in' ? tableNumber : undefined,
      customerName: mode === 'takeaway' ? customerName : undefined,
      pickupNote: mode === 'takeaway' ? pickupNote : undefined,
      deliveryAddress: mode === 'delivery' ? address : undefined,
      deliveryPhone: mode === 'delivery' ? phone : undefined,
      notes,
      items,
      payNowMethod: payNow ? payMethod : undefined,
    });
    onClose();
    if (openTicketOnSave && onOpenTicket) {
      onOpenTicket(created);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="modal-surface w-full max-w-xl max-h-[92dvh] bg-[var(--bg-surface)] text-[var(--ink-primary)] rounded-2xl border border-[var(--border-subtle)] p-4 flex flex-col gap-3 shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between shrink-0">
          <h3 className="font-serif-display text-lg font-bold text-[var(--ink-primary)]">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--ink-primary)] hover:bg-[var(--bg-inset)] active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto phone-scroll space-y-3 pr-1">
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setMode('dine-in')}
              className={`min-h-[38px] rounded-xl text-xs font-bold active:scale-[0.97] transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                mode === 'dine-in'
                  ? 'bg-[var(--ink-primary)] text-[var(--bg-surface)]'
                  : 'bg-[var(--bg-inset)] text-[var(--ink-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              Mesa (local)
            </button>
            <button
              type="button"
              onClick={() => setMode('takeaway')}
              className={`min-h-[38px] rounded-xl text-xs font-bold active:scale-[0.97] transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                mode === 'takeaway'
                  ? 'bg-[var(--ink-primary)] text-[var(--bg-surface)]'
                  : 'bg-[var(--bg-inset)] text-[var(--ink-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              Para Llevar
            </button>
            <button
              type="button"
              onClick={() => setMode('delivery')}
              className={`min-h-[38px] rounded-xl text-xs font-bold active:scale-[0.97] transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                mode === 'delivery'
                  ? 'bg-[var(--ink-primary)] text-[var(--bg-surface)]'
                  : 'bg-[var(--bg-inset)] text-[var(--ink-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              Delivery
            </button>
          </div>

          {mode === 'dine-in' ? (
            <div>
              <label className="block text-xs font-bold text-[var(--ink-primary)] mb-1">
                Seleccionar mesa
              </label>
              <select
                value={tableNumber}
                onChange={(e) => setTableNumber(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--ink-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              >
                {tables.map((t) => (
                  <option key={t.number} value={t.number}>
                    Mesa {t.number} ({t.status === 'ocupada' ? 'Ocupada' : 'Libre'})
                  </option>
                ))}
              </select>
            </div>
          ) : mode === 'takeaway' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                required
                maxLength={80}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nombre del cliente (Ej. Carlos) *"
                className="px-3 py-2 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--ink-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              />
              <input
                type="text"
                maxLength={120}
                value={pickupNote}
                onChange={(e) => setPickupNote(e.target.value)}
                placeholder="Teléfono / Hora retiro (opcional)"
                className="px-3 py-2 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--ink-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Dirección de entrega"
                className="px-3 py-2 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--ink-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Teléfono / WhatsApp"
                className="px-3 py-2 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--ink-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              />
            </div>
          )}

          <CategoryTabs
            activeCategory={category}
            onSelectCategory={setCategory}
            compact
          />

          <div className="space-y-1.5">
            {availableByCategory.map((item) => (
              <div
                key={item.id}
                className="rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] p-2.5 space-y-1.5"
              >
                <p className="text-xs font-bold text-[var(--ink-primary)]">
                  {item.name}
                </p>
                <div className="flex flex-wrap gap-1">
                  {item.sizes.map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => addLineItem(item, sz)}
                      className="px-2.5 py-1 rounded-lg bg-[var(--accent-gold)] text-[var(--ink-primary)] text-[11px] font-bold hover:brightness-105 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] cursor-pointer tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink-primary)]"
                    >
                      + {sz.label} Bs {sz.price}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {items.length > 0 && (
            <div className="rounded-xl bg-[var(--bg-canvas)] border border-[var(--accent-primary)]/40 p-2.5 space-y-1.5">
              <p className="text-xs font-bold text-[var(--accent-primary)]">
                Ítems en esta comanda:
              </p>
              {items.map((it, idx) => (
                <div
                  key={`${it.name}-${it.sizeLabel}-${idx}`}
                  className="flex items-center justify-between text-xs font-semibold"
                >
                  <span className="truncate pr-2">
                    {it.name} ({it.sizeLabel})
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateLineQty(idx, -1)}
                      aria-label={`Disminuir ${it.name}`}
                      className="w-6 h-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center active:scale-[0.97] cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="tabular-nums">{it.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateLineQty(idx, 1)}
                      aria-label={`Aumentar ${it.name}`}
                      className="w-6 h-6 rounded-lg bg-[var(--accent-gold)] flex items-center justify-center active:scale-[0.97] cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas para cocina (opcional)"
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--ink-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
          />

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => setPayNow((p) => !p)}
              className="flex items-center gap-2 text-xs font-bold text-[var(--ink-primary)] cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
            >
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  payNow
                    ? 'bg-[var(--status-ok)] border-[var(--status-ok)] text-white'
                    : 'border-[var(--ink-muted)]'
                }`}
              >
                {payNow && <Check className="w-3 h-3" strokeWidth={3} />}
              </span>
              <span>Cobrar inmediatamente en caja</span>
            </button>

            {payNow && (
              <div className="grid grid-cols-2 gap-1.5">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPayMethod(m)}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-bold active:scale-[0.97] transition-[transform,background-color,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                      payMethod === m
                        ? 'bg-[var(--accent-gold)] border-[var(--accent-primary)] text-[var(--ink-primary)]'
                        : 'bg-[var(--bg-inset)] border-[var(--border-subtle)]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpenTicketOnSave((p) => !p)}
            className="flex items-center gap-2 text-xs font-bold text-[var(--ink-primary)] cursor-pointer pt-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
          >
            <span
              className={`w-4 h-4 rounded border flex items-center justify-center ${
                openTicketOnSave
                  ? 'bg-[var(--ink-primary)] border-[var(--ink-primary)] text-[var(--accent-gold)]'
                  : 'border-[var(--ink-muted)]'
              }`}
            >
              {openTicketOnSave && <Check className="w-3 h-3" strokeWidth={3} />}
            </span>
            <span>Abrir ticket (Imprimir / WhatsApp) al guardar</span>
          </button>
        </div>

        <button
          type="submit"
          disabled={items.length === 0}
          className="w-full min-h-[44px] rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-surface)] font-bold text-xs disabled:opacity-45 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer shrink-0 tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
        >
          {payNow
            ? `Registrar y cobrar — ${formatBs(total)}`
            : `Enviar comanda a cocina — ${formatBs(total)}`}
        </button>
      </form>
    </div>
  );
};
