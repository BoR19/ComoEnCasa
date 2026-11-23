import {
  CartItem,
  DishSizeOption,
  KitchenOrder,
  MenuCategory,
  MenuItem,
  OrderLineItem,
  PaymentMethod,
  TableItem,
} from '../types/app';

export type MenuFilterCategory = 'Todas' | MenuCategory;

export const MENU_CATEGORIES: MenuCategory[] = [
  'Platos Fuertes',
  'Guisos',
  'Sopas',
  'Jugos',
];

export const MENU_FILTER_CATEGORIES: MenuFilterCategory[] = [
  'Todas',
  ...MENU_CATEGORIES,
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

export function formatBsDecimal(amount: number): string {
  return `Bs ${amount.toFixed(2)}`;
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

export function getCartCount(cart: CartItem[]): number {
  return cart.reduce((acc, item) => acc + item.quantity, 0);
}

export function getOrderLinesTotal(items: OrderLineItem[]): number {
  return items.reduce((acc, it) => acc + it.price * it.quantity, 0);
}

export function getOrderLinesCount(items: OrderLineItem[]): number {
  return items.reduce((acc, it) => acc + it.quantity, 0);
}

export function getTableStats(tables: TableItem[]): {
  freeCount: number;
  occupiedCount: number;
  totalCount: number;
  occupancyPct: number;
} {
  const freeCount = tables.filter((t) => t.status === 'libre').length;
  const totalCount = tables.length;
  const occupiedCount = totalCount - freeCount;
  const occupancyPct =
    totalCount > 0 ? Math.round((occupiedCount / totalCount) * 100) : 0;
  return { freeCount, occupiedCount, totalCount, occupancyPct };
}

export function getTableItemsCount(
  orders: KitchenOrder[],
  tables: TableItem[],
  tableNumber: number
): number {
  const activeOrder = getActiveOrderForTable(orders, tables, tableNumber);
  return activeOrder ? getOrderLinesCount(activeOrder.items) : 0;
}

export function getTableConsumption(
  orders: KitchenOrder[],
  tables: TableItem[],
  tableNumber: number
): number {
  const activeOrder = getActiveOrderForTable(orders, tables, tableNumber);
  return activeOrder ? activeOrder.total : 0;
}

export function computeSalesTotals(orders: KitchenOrder[]): {
  totalPaid: number;
  totalPending: number;
  paidCount: number;
  pendingCount: number;
} {
  let totalPaid = 0;
  let totalPending = 0;
  let paidCount = 0;
  let pendingCount = 0;

  for (const order of orders) {
    if (order.paid) {
      totalPaid += order.total;
      paidCount += 1;
    } else if (!isOrderSettled(order)) {
      totalPending += order.total;
      pendingCount += 1;
    }
  }

  return { totalPaid, totalPending, paidCount, pendingCount };
}

export function getCategoryCounts(
  items: MenuItem[]
): Record<MenuFilterCategory, number> {
  const counts: Record<MenuFilterCategory, number> = {
    Todas: items.length,
    'Platos Fuertes': 0,
    Guisos: 0,
    Sopas: 0,
    Jugos: 0,
  };
  for (const item of items) {
    counts[item.category] = (counts[item.category] || 0) + 1;
  }
  return counts;
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

    const line: OrderLineItem = {
      menuItemId: c.menuItemId,
      category: c.category,
      name: c.name,
      sizeLabel: c.sizeLabel,
      quantity: c.quantity,
      price: getCartLineUnitPrice(c),
    };

    if (extrasSummary) {
      line.extrasSummary = extrasSummary;
    }

    return line;
  });
}

export function getCurrentTimeLabel(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function getActiveOrderForTable(
  orders: KitchenOrder[],
  tables: TableItem[],
  tableNumber: number
): KitchenOrder | undefined {
  const unpaid = orders.find(
    (o) =>
      o.mode === 'dine-in' &&
      o.tableNumber === tableNumber &&
      o.status !== 'Cobrado' &&
      !o.paid
  );
  if (unpaid) return unpaid;

  const tableObj = tables.find((t) => t.number === tableNumber);
  if (tableObj?.status === 'ocupada') {
    return orders.find(
      (o) =>
        o.mode === 'dine-in' &&
        o.tableNumber === tableNumber &&
        o.status !== 'Cobrado'
    );
  }
  return undefined;
}

export function getTakeawayCustomerName(
  order: Pick<KitchenOrder, 'customerLabel'>
): string {
  return (
    order.customerLabel.replace(/^Para\s+Llevar\s*•\s*/i, '').trim() ||
    order.customerLabel
  );
}

export function generateConfirmationCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function requiresDeliveryPin(order: KitchenOrder): boolean {
  return (
    (order.mode === 'takeaway' || order.mode === 'delivery') &&
    Boolean(order.confirmationCode) &&
    order.status !== 'Entregado' &&
    order.status !== 'Cobrado'
  );
}

export type OrderFilterType =
  | 'active'
  | 'dine-in'
  | 'takeaway'
  | 'delivery'
  | 'kitchen'
  | 'served'
  | 'collected';

export const ORDER_FILTER_TABS: { id: OrderFilterType; label: string }[] = [
  { id: 'active', label: 'Activas' },
  { id: 'dine-in', label: 'Mesas' },
  { id: 'takeaway', label: 'Para Llevar' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'kitchen', label: 'En Fogones' },
  { id: 'served', label: 'Servido' },
  { id: 'collected', label: 'Historial / Pagados' },
];

export function isOrderSettled(order: KitchenOrder): boolean {
  return Boolean(order.paid) || order.status === 'Cobrado';
}

export function filterOrdersByType(
  orders: KitchenOrder[],
  filter: OrderFilterType
): KitchenOrder[] {
  return orders.filter((o) => {
    const settled = isOrderSettled(o);
    if (filter === 'collected') return settled;
    if (settled) return false;
    if (filter === 'dine-in') return o.mode === 'dine-in';
    if (filter === 'takeaway') return o.mode === 'takeaway';
    if (filter === 'delivery') return o.mode === 'delivery';
    if (filter === 'kitchen') {
      return (
        o.status === 'Preparando' ||
        o.status === 'Listo' ||
        o.status === 'En camino'
      );
    }
    if (filter === 'served') {
      return o.status === 'Entregado';
    }
    return true;
  });
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
