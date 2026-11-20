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
  appendTargetOrder?: KitchenOrder | null;
  draftItems?: OrderLineItem[];
  onClose: () => void;
  onCreatePosOrder: (payload: {
    mode: OrderMode;
    tableNumber?: number;
    deliveryAddress?: string;
    deliveryPhone?: string;
    notes: string;
    items: OrderLineItem[];
    payNowMethod?: PaymentMethod;
  }) => KitchenOrder;
  onAppendOrderItems?: (
    orderId: string,
    items: OrderLineItem[]
  ) => KitchenOrder | undefined;
  onOpenTicket?: (order: KitchenOrder) => void;
  onClearDraftItems?: () => void;
}

export const PosOrderModal: React.FC<PosOrderModalProps> = ({
  isOpen,
  title = 'Nueva Comanda',
  tables,
  menuItems,
  initialTable = 1,
  appendTargetOrder = null,
  draftItems = [],
  onClose,
  onCreatePosOrder,
  onAppendOrderItems,
  onOpenTicket,
  onClearDraftItems,
}) => {
  const [mode, setMode] = useState<OrderMode>('dine-in');
  const [tableNumber, setTableNumber] = useState<number>(initialTable);
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
    if (appendTargetOrder) {
      setMode(appendTargetOrder.mode);
      setTableNumber(appendTargetOrder.tableNumber ?? initialTable);
      setItems([]);
    } else {
      setMode('dine-in');
      setTableNumber(initialTable);
      setItems(draftItems);
    }
    setAddress('');
    setPhone('');
    setNotes('');
    setPayNow(false);
  }, [isOpen, appendTargetOrder, initialTable, draftItems]);

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

    if (appendTargetOrder && onAppendOrderItems) {
      const updated = onAppendOrderItems(appendTargetOrder.id, items);
      onClose();
      if (updated && openTicketOnSave && onOpenTicket) {
        onOpenTicket(updated);
      }
      return;
    }

    const created = onCreatePosOrder({
      mode,
      tableNumber: mode === 'dine-in' ? tableNumber : undefined,
      deliveryAddress: mode === 'delivery' ? address : undefined,
      deliveryPhone: mode === 'delivery' ? phone : undefined,
      notes,
      items,
      payNowMethod: payNow ? payMethod : undefined,
    });
    onClearDraftItems?.();
    onClose();
    if (openTicketOnSave && onOpenTicket) {
      onOpenTicket(created);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl max-h-[92dvh] bg-[#FFF8E8] rounded-2xl border border-[#D9A441] p-4 flex flex-col gap-3 shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between shrink-0">
          <h3 className="font-serif-display text-lg font-bold text-[#3B1F0E]">
            {appendTargetOrder
              ? `Agregar platos · ${appendTargetOrder.customerLabel} (${appendTargetOrder.code})`
              : title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#3B1F0E] hover:bg-[#FDF2D6] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto phone-scroll space-y-3 pr-1">
          {!appendTargetOrder && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('dine-in')}
                  className={`min-h-[38px] rounded-xl text-xs font-extrabold cursor-pointer ${
                    mode === 'dine-in'
                      ? 'bg-[#3B1F0E] text-[#FFF8E8]'
                      : 'bg-[#FDF2D6] text-[#3B1F0E] border border-[#D9A441]/55'
                  }`}
                >
                  Mesa (Local)
                </button>
                <button
                  type="button"
                  onClick={() => setMode('delivery')}
                  className={`min-h-[38px] rounded-xl text-xs font-extrabold cursor-pointer ${
                    mode === 'delivery'
                      ? 'bg-[#3B1F0E] text-[#FFF8E8]'
                      : 'bg-[#FDF2D6] text-[#3B1F0E] border border-[#D9A441]/55'
                  }`}
                >
                  Delivery
                </button>
              </div>

              {mode === 'dine-in' ? (
                <div>
                  <label className="block text-xs font-bold text-[#3B1F0E] mb-1">
                    Seleccionar Mesa
                  </label>
                  <select
                    value={tableNumber}
                    onChange={(e) => setTableNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#FDF2D6] border border-[#D9A441] text-xs font-bold text-[#2B1A0E]"
                  >
                    {tables.map((t) => (
                      <option key={t.number} value={t.number}>
                        Mesa {t.number} ({t.status === 'ocupada' ? 'Ocupada' : 'Libre'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Dirección de entrega"
                    className="px-3 py-2 rounded-xl bg-[#FDF2D6] border border-[#D9A441] text-xs font-semibold text-[#2B1A0E]"
                  />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Teléfono / WhatsApp"
                    className="px-3 py-2 rounded-xl bg-[#FDF2D6] border border-[#D9A441] text-xs font-semibold text-[#2B1A0E]"
                  />
                </div>
              )}
            </>
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
                className="rounded-xl bg-[#FDF2D6] border border-[#D9A441]/45 p-2 space-y-1.5"
              >
                <p className="text-xs font-extrabold text-[#2B1A0E]">
                  {item.name}
                </p>
                <div className="flex flex-wrap gap-1">
                  {item.sizes.map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => addLineItem(item, sz)}
                      className="px-2 py-1 rounded-lg bg-[#D9A441] text-[#2B1A0E] text-[10px] font-extrabold hover:bg-[#E8C87A] cursor-pointer tabular-nums"
                    >
                      + {sz.label} Bs {sz.price}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {items.length > 0 && (
            <div className="rounded-xl bg-[#FFFDF8] border border-[#B84A27]/40 p-2.5 space-y-1.5">
              <p className="text-xs font-extrabold text-[#B84A27]">
                Ítems en esta comanda:
              </p>
              {items.map((it, idx) => (
                <div
                  key={`${it.name}-${it.sizeLabel}-${idx}`}
                  className="flex items-center justify-between text-xs font-bold"
                >
                  <span className="truncate pr-2">
                    {it.name} ({it.sizeLabel})
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateLineQty(idx, -1)}
                      aria-label={`Disminuir ${it.name}`}
                      className="w-6 h-6 rounded-lg bg-[#FDF2D6] border border-[#D9A441] flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="tabular-nums">{it.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateLineQty(idx, 1)}
                      aria-label={`Aumentar ${it.name}`}
                      className="w-6 h-6 rounded-lg bg-[#D9A441] flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!appendTargetOrder && (
            <>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas para cocina (opcional)"
                className="w-full px-3 py-2 rounded-xl bg-[#FDF2D6] border border-[#D9A441]/60 text-xs font-semibold text-[#2B1A0E]"
              />

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPayNow((p) => !p)}
                  className="flex items-center gap-2 text-xs font-extrabold text-[#3B1F0E] cursor-pointer"
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      payNow
                        ? 'bg-[#2E6F32] border-[#2E6F32] text-white'
                        : 'border-[#7A5A3A]'
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
                        className={`py-1.5 px-2 rounded-lg border text-[11px] font-extrabold cursor-pointer ${
                          payMethod === m
                            ? 'bg-[#D9A441] border-[#B84A27] text-[#2B1A0E]'
                            : 'bg-[#FDF2D6] border-[#D9A441]/55'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => setOpenTicketOnSave((p) => !p)}
            className="flex items-center gap-2 text-xs font-extrabold text-[#3B1F0E] cursor-pointer pt-1"
          >
            <span
              className={`w-4 h-4 rounded border flex items-center justify-center ${
                openTicketOnSave
                  ? 'bg-[#3B1F0E] border-[#3B1F0E] text-[#D9A441]'
                  : 'border-[#7A5A3A]'
              }`}
            >
              {openTicketOnSave && <Check className="w-3 h-3" strokeWidth={3} />}
            </span>
            <span>Abrir Ticket (Imprimir / WhatsApp) al guardar</span>
          </button>
        </div>

        <button
          type="submit"
          disabled={items.length === 0}
          className="w-full min-h-[44px] rounded-2xl bg-[#3B1F0E] text-[#FFF8E8] font-extrabold text-xs disabled:opacity-45 cursor-pointer shrink-0 tabular-nums"
        >
          {appendTargetOrder
            ? `Agregar a ${appendTargetOrder.customerLabel} • ${formatBs(total)}`
            : payNow
            ? `Registrar y Cobrar • ${formatBs(total)}`
            : `Enviar Comanda a Cocina • ${formatBs(total)}`}
        </button>
      </form>
    </div>
  );
};
