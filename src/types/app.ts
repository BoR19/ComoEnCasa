export type ScreenId =
  | 'welcome'
  | 'menu'
  | 'search'
  | 'favorites'
  | 'dish-detail'
  | 'customize'
  | 'cart'
  | 'tables-select'
  | 'table-qr-welcome'
  | 'tables-qr'
  | 'tables-order'
  | 'delivery-info'
  | 'delivery-tracking'
  | 'delivery-confirm'
  | 'payment-methods'
  | 'payment-qr'
  | 'payment-confirm'
  | 'profile'
  | 'admin-login'
  | 'admin-panel';

export type MenuCategory = 'Platos Fuertes' | 'Guisos' | 'Sopas' | 'Jugos';

export interface DishSizeOption {
  id: string;
  label: string;
  price: number;
}

export interface ExtraOption {
  id: string;
  label: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  description: string;
  priceBadge: string;
  sizes: DishSizeOption[];
  ingredients: string[];
  rating: number;
  prepTime: string;
  available: boolean;
  visualType:
    | 'pollo-horno'
    | 'milanesa'
    | 'picante-carne'
    | 'picante-pollo'
    | 'picante-pata'
    | 'falso'
    | 'saice'
    | 'guiso'
    | 'chanfaina'
    | 'sopa-pollo'
    | 'sopa-mani'
    | 'lagua'
    | 'jugo-pelon'
    | 'jugo-linaza';
}

export interface CartItem {
  cartItemId: string;
  menuItemId: string;
  name: string;
  category: MenuCategory;
  sizeId: string;
  sizeLabel: string;
  unitPrice: number;
  quantity: number;
  extras: ExtraOption[];
  customSummary?: string;
}

export type OrderMode = 'dine-in' | 'takeaway' | 'delivery';

export type TableStatus = 'libre' | 'ocupada';

export interface TableItem {
  id?: string;
  number: number;
  name?: string;
  zone?: string;
  status: TableStatus;
  capacity: number;
  customerPhone?: string;
}

export type OrderStatus =
  | 'Preparando'
  | 'Listo'
  | 'En camino'
  | 'Entregado'
  | 'Cobrado';

export type PaymentMethod = 'Efectivo' | 'QR' | 'Transferencia Bancaria' | 'Tarjeta';

export interface OrderLineItem {
  menuItemId?: string;
  category: MenuCategory;
  name: string;
  sizeLabel: string;
  quantity: number;
  price: number;
  extrasSummary?: string;
}

export interface KitchenOrder {
  id: string;
  code: string;
  customerUid?: string;
  mode: OrderMode;
  tableNumber?: number;
  customerLabel: string;
  pickupNote?: string;
  confirmationCode?: string;
  deliveryAddress?: string;
  deliveryPhone?: string;
  customerPhone?: string;
  items: OrderLineItem[];
  notes: string;
  status: OrderStatus;
  total: number;
  estimatedMinutes: number;
  createdAt: string;
  deliveredAt?: string;
  paid: boolean;
  paymentMethod?: PaymentMethod;
  waiterRequested?: boolean;
  billRequested?: boolean;
  ratingStars?: number;
}

export interface TakeawayInfo {
  customerName: string;
  pickupNote: string;
}

export interface DeliveryInfo {
  address: string;
  reference: string;
  phone: string;
  notes: string;
  payOnDelivery: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  status: 'Stock OK' | 'Bajo stock';
}

export interface AuthorizedStaffItem {
  email: string;
  name: string;
  active: boolean;
}

export interface CustomerContactItem {
  phone: string;
  customerUid?: string;
  lastTableNumber?: number;
  lastMode: OrderMode;
  lastOrderCode?: string;
  lastOrderTotal: number;
  ordersCount: number;
  source: 'qr-table' | 'delivery' | 'takeaway' | 'pos';
  updatedAtLabel?: string;
}

export type AdminTab = 'dashboard' | 'menu' | 'kitchen' | 'reports';
