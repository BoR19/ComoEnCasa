import {
  CartItem,
  DishSizeOption,
  KitchenOrder,
  MenuCategory,
  OrderLineItem,
  PaymentMethod,
} from '../types/app';

export const MENU_CATEGORIES: MenuCategory[] = [
  'Platos Fuertes',
  'Guisos',
  'Sopas',
  'Jugos',
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Efectivo',
  'QR',
  'Transferencia Bancaria',
  'Tarjeta',
];

export function formatBs(amount: number): string {
  return Number.isInteger(amount) ? `Bs ${amount}` : `Bs ${amount.toFixed(2)}`;
}

export function buildPriceBadge(sizes: DishSizeOption[]): string {
  return sizes.map((s) => `${s.label} Bs ${s.price}`).join(' / ');
}

export function getCartLineUnitPrice(item: CartItem): number {
  const extrasSum = item.extras.reduce((sum, e) => sum + e.price, 0);
  return item.unitPrice + extrasSum;
}

export function getCartLineTotal(item: CartItem): number {
  return getCartLineUnitPrice(item) * item.quantity;
}

export function getCartTotal(cart: CartItem[]): number {
  return cart.reduce((acc, item) => acc + getCartLineTotal(item), 0);
}

export function cartItemsToOrderLines(cart: CartItem[]): OrderLineItem[] {
  return cart.map((c) => {
    const extrasSummary = [
      c.extras.length > 0
        ? `Extras: ${c.extras.map((e) => e.label).join(', ')}`
        : '',
      c.customSummary ?? '',
    ]
      .filter(Boolean)
      .join(' · ');

    return {
      menuItemId: c.menuItemId,
      category: c.category,
      name: c.name,
      sizeLabel: c.sizeLabel,
      quantity: c.quantity,
      price: getCartLineUnitPrice(c),
      extrasSummary: extrasSummary || undefined,
    };
  });
}

export function getCurrentTimeLabel(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function computeCategorySalesReport(
  orders: KitchenOrder[]
): { category: MenuCategory; amount: number; percent: number }[] {
  const totals: Record<MenuCategory, number> = {
    'Platos Fuertes': 0,
    Guisos: 0,
    Sopas: 0,
    Jugos: 0,
  };

  for (const order of orders) {
    if (!order.paid) continue;
    for (const item of order.items) {
      totals[item.category] =
        (totals[item.category] || 0) + item.price * item.quantity;
    }
  }

  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

  return MENU_CATEGORIES.map((category) => ({
    category,
    amount: totals[category],
    percent: grandTotal > 0 ? Math.round((totals[category] / grandTotal) * 100) : 0,
  }));
}
