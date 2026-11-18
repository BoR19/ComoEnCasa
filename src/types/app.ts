export type ScreenId =
  | 'welcome'
  | 'menu'
  | 'search'
  | 'favorites'
  | 'dish-detail'
  | 'customize'
  | 'cart'
  | 'tables-select'
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
  | 'admin-panel'
  | 'mozo-panel';

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

export type OrderMode = 'dine-in' | 'delivery';

export type TableStatus = 'libre' | 'ocupada' | 'seleccionada';

export interface TableItem {
  number: number;
  status: TableStatus;
  capacity: number;
}

export type OrderStatus = 'Preparando' | 'Listo' | 'En camino' | 'Entregado';

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
  mode: OrderMode;
  tableNumber?: number;
  customerLabel: string;
  deliveryAddress?: string;
  deliveryPhone?: string;
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
  ratingStars?: number;
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

export type AdminTab = 'dashboard' | 'menu' | 'kitchen' | 'reports';
