import React, { useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  BarChart3,
  BellRing,
  ChefHat,
  Clock,
  Download,
  KeyRound,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Users,
  Utensils,
  X,
} from 'lucide-react';
import {
  AdminTab,
  AuthorizedStaffItem,
  DishSizeOption,
  InventoryItem,
  KitchenOrder,
  MenuCategory,
  MenuItem,
  OrderLineItem,
  OrderMode,
  OrderStatus,
  PaymentMethod,
  TableItem,
} from '../../types/app';
import {
  MENU_CATEGORIES,
  buildPriceBadge,
  computeCategorySalesReport,
  formatBs,
  getTableStats,
} from '../../utils/appHelpers';
import {
  ImageBackupProgress,
  downloadMenuCsvOnly,
  downloadMenuFullBackupZip,
} from '../../utils/menuImageBackup';
import { OfficialLogo } from '../BrandAssets';
import { CollectPaymentModal } from '../CollectPaymentModal';
import { OrdersBoard } from '../OrdersBoard';
import { CategoryTabs, MobileHeader } from '../ShellComponents';
import { TicketModal } from '../TicketModal';

interface AdminLoginScreenProps {
  firebaseUser: User | null;
  isAdmin: boolean;
  authLoading: boolean;
  authError?: string;
  onGoogleSignIn: () => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
  onEnterAdminPanel: () => void;
  onBack: () => void;
}

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({
  firebaseUser,
  isAdmin,
  authLoading,
  authError,
  onGoogleSignIn,
  onGoogleSignOut,
  onEnterAdminPanel,
  onBack,
}) => {
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleAccess = async () => {
    setErrorMsg('');
    try {
      await onGoogleSignIn();
    } catch {
      setErrorMsg('No se pudo completar el inicio de sesión con Google.');
    }
  };

  const displayedError = errorMsg || authError;

  return (
    <div className="flex-1 flex flex-col bg-[#3B1F0E] text-[#FFF8E8] min-h-0">
      <div className="px-3 pt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-bold text-[#E8C87A] hover:underline px-2 py-1.5 cursor-pointer"
        >
          ← Volver a la app
        </button>
      </div>

      <div className="flex-1 overflow-y-auto phone-scroll px-5 sm:px-6 py-4 flex flex-col">
        <div className="my-auto max-w-md w-full mx-auto lg:rounded-3xl lg:border lg:border-[#D9A441]/30 lg:bg-[#4A2C1A]/45 lg:p-8">
          <div className="flex flex-col items-center">
            <OfficialLogo size="sm" />
            <h1 className="font-serif-display text-2xl font-bold text-[#FFF8E8] mt-3 text-center">
              Acceso Administrador
            </h1>
            <p className="text-xs text-[#E8C87A]/85 text-center mt-1">
              Inicia sesión con tu cuenta Google de administración para sincronizar pedidos, menú y mesas en tiempo real.
            </p>
          </div>

          <div className="space-y-3.5 my-6">
            {firebaseUser && (
              <div className="rounded-2xl bg-[#3B1F0E]/80 border border-[#D9A441]/40 p-3.5 text-center space-y-1">
                <p className="text-[11px] font-bold text-[#E8C87A]">
                  Cuenta actual conectada
                </p>
                <p className="text-sm font-extrabold text-[#FFF8E8] truncate">
                  {firebaseUser.email}
                </p>
                {!isAdmin && !authLoading && (
                  <p className="text-xs font-bold text-[#E8C87A] pt-1">
                    Esta cuenta no tiene permisos de Administrador.
                  </p>
                )}
              </div>
            )}

            {displayedError && (
              <p className="text-xs font-bold text-[#E8C87A] bg-[#4A2C1A] px-3 py-2 rounded-xl border border-[#D9A441]/40">
                {displayedError}
              </p>
            )}

            {isAdmin ? (
              <button
                type="button"
                onClick={onEnterAdminPanel}
                className="w-full min-h-[50px] rounded-2xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-sm shadow-md hover:bg-[#E8C87A] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>Entrar al Panel Administrador</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={authLoading}
                onClick={handleGoogleAccess}
                className="w-full min-h-[50px] rounded-2xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-sm shadow-md hover:bg-[#E8C87A] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>
                  {authLoading
                    ? 'Verificando cuenta...'
                    : firebaseUser
                    ? 'Cambiar a cuenta Administrador'
                    : 'Ingresar con Google'}
                </span>
              </button>
            )}

            {firebaseUser && (
              <button
                type="button"
                onClick={() => void onGoogleSignOut()}
                className="w-full min-h-[42px] rounded-2xl border border-[#D9A441]/50 text-[#FFF8E8] font-bold text-xs hover:bg-[#4A2C1A] cursor-pointer"
              >
                Cerrar cuenta Google actual
              </button>
            )}
          </div>

          <footer className="text-center space-y-1 pt-2">
            <p className="text-xs font-bold text-[#E8C87A]">
              Solo personal autorizado
            </p>
            <p className="text-[11px] text-[#FFF8E8]/70">
              Sincronización en vivo • Firebase Firestore
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

interface AdminPanelScreenProps {
  isAdmin: boolean;
  menuItems: MenuItem[];
  kitchenOrders: KitchenOrder[];
  tables: TableItem[];
  inventory: InventoryItem[];
  authorizedStaff: AuthorizedStaffItem[];
  adminEmail?: string | null;
  cartCount: number;
  orderMode: OrderMode;
  selectedTable: number;
  linkedTakeawayOrderId: string | null;
  linkedDeliveryOrderId: string | null;
  onOpenComanda: () => void;
  onLoadOrderToLivePanel: (
    order: KitchenOrder,
    options?: { openDrawerOnCompact?: boolean; goToMenu?: boolean }
  ) => void;
  onToggleDishAvailability: (id: string) => void;
  onSaveDishEdit: (updated: MenuItem) => void;
  onAddNewDish: (newItem: MenuItem) => void;
  onUpdateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    verificationCode?: string
  ) => void;
  onCollectOrderPayment: (orderId: string, method: PaymentMethod) => void;
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
  onDismissWaiterCall: (orderId: string) => void;
  onFreeTable: (tableNumber: number) => void;
  onUpdateInventory: (updated: InventoryItem[]) => void;
  mozoPin: string;
  onUpdateMozoPin: (newPin: string) => void;
  onAddAuthorizedStaff: (email: string, name: string) => void;
  onToggleAuthorizedStaff: (email: string, active: boolean) => void;
  onRemoveAuthorizedStaff: (email: string) => void;
  onLogout: () => void;
  onBack: () => void;
}

export const AdminPanelScreen: React.FC<AdminPanelScreenProps> = ({
  isAdmin,
  menuItems,
  kitchenOrders,
  tables,
  inventory,
  authorizedStaff,
  adminEmail,
  cartCount,
  orderMode,
  selectedTable,
  linkedTakeawayOrderId,
  linkedDeliveryOrderId,
  onOpenComanda,
  onLoadOrderToLivePanel,
  onToggleDishAvailability,
  onSaveDishEdit,
  onAddNewDish,
  onUpdateOrderStatus,
  onCollectOrderPayment,
  onCreatePosOrder,
  onDismissWaiterCall,
  onFreeTable,
  onUpdateInventory,
  mozoPin,
  onUpdateMozoPin,
  onAddAuthorizedStaff,
  onToggleAuthorizedStaff,
  onRemoveAuthorizedStaff,
  onLogout,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [pinDraft, setPinDraft] = useState(mozoPin);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffName, setNewStaffName] = useState('');

  useEffect(() => {
    setPinDraft(mozoPin);
  }, [mozoPin]);

  const [menuCategory, setMenuCategory] =
    useState<MenuCategory>('Platos Fuertes');
  const [menuQuery, setMenuQuery] = useState('');

  // Dish Edit / Add Modal
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);
  const [isAddingDish, setIsAddingDish] = useState(false);
  const [dishName, setDishName] = useState('');
  const [dishCategory, setDishCategory] =
    useState<MenuCategory>('Platos Fuertes');
  const [dishSizePrices, setDishSizePrices] = useState<DishSizeOption[]>([]);
  const [dishDesc, setDishDesc] = useState('');

  // Collect Payment & Ticket Modals (Dashboard Recent Activity)
  const [collectingOrder, setCollectingOrder] = useState<KitchenOrder | null>(
    null
  );
  const [ticketOrder, setTicketOrder] = useState<KitchenOrder | null>(null);

  // Trigger signal for OrdersBoard POS New Order modal
  const [openKitchenPosSignal, setOpenKitchenPosSignal] = useState(0);

  // Inventory modal
  const [showInvModal, setShowInvModal] = useState(false);
  const [invDraft, setInvDraft] = useState<InventoryItem[]>(inventory);
  const [reportMsg, setReportMsg] = useState('');

  // Admin-only Menu Backup (.zip with imagenes/ + carta-menu.csv, or .csv only)
  const [isBackingUpImages, setIsBackingUpImages] = useState(false);
  const [backupProgress, setBackupProgress] =
    useState<ImageBackupProgress | null>(null);
  const [backupSummary, setBackupSummary] = useState('');

  const handleDownloadFullBackupZip = async () => {
    if (!isAdmin || isBackingUpImages || menuItems.length === 0) return;
    setIsBackingUpImages(true);
    setBackupSummary('');
    setBackupProgress({
      phase: 'downloading',
      current: 0,
      total: menuItems.length,
      currentName: 'Iniciando descarga...',
      percent: 0,
      downloadedCount: 0,
      fallbackCount: 0,
    });
    try {
      const result = await downloadMenuFullBackupZip(menuItems, (prog) => {
        setBackupProgress(prog);
      });
      setBackupSummary(
        `Respaldo completo descargado: ${result.downloadedCount}/${result.total} imágenes en imagenes/ + carta-menu.csv${
          result.fallbackCount > 0
            ? ` (${result.fallbackCount} URLs en lista-imagenes.txt)`
            : ''
        }.`
      );
    } catch {
      setBackupSummary(
        'Ocurrió un error al generar el respaldo .zip. Intenta nuevamente.'
      );
    } finally {
      setIsBackingUpImages(false);
      setBackupProgress(null);
    }
  };

  const handleDownloadCsvOnly = () => {
    if (!isAdmin || menuItems.length === 0) return;
    downloadMenuCsvOnly(menuItems);
    setBackupSummary(
      `Excel descargado: carta-menu.csv (${menuItems.length} platos y bebidas).`
    );
  };

  const switchTab = (next: AdminTab) => {
    setEditingDish(null);
    setIsAddingDish(false);
    setCollectingOrder(null);
    setTicketOrder(null);
    setShowInvModal(false);
    setActiveTab(next);
  };

  // Real-time calculated KPIs
  const totalSalesBs = useMemo(
    () =>
      kitchenOrders
        .filter((o) => o.paid)
        .reduce((acc, o) => acc + o.total, 0),
    [kitchenOrders]
  );

  const pendingSalesBs = useMemo(
    () =>
      kitchenOrders
        .filter((o) => !o.paid)
        .reduce((acc, o) => acc + o.total, 0),
    [kitchenOrders]
  );

  const ordersTodayCount = kitchenOrders.length;

  const { occupiedCount: occupiedTablesCount } = useMemo(
    () => getTableStats(tables),
    [tables]
  );

  const waiterRequests = useMemo(
    () => kitchenOrders.filter((o) => o.waiterRequested),
    [kitchenOrders]
  );

  const categoryReport = useMemo(
    () => computeCategorySalesReport(kitchenOrders),
    [kitchenOrders]
  );

  const filteredMenu = useMemo(() => {
    const q = menuQuery.trim().toLowerCase();
    return menuItems.filter((item) => {
      if (q) return item.name.toLowerCase().includes(q);
      return item.category === menuCategory;
    });
  }, [menuItems, menuCategory, menuQuery]);

  const openEditModal = (dish: MenuItem) => {
    setIsAddingDish(false);
    setEditingDish(dish);
    setDishName(dish.name);
    setDishCategory(dish.category);
    setDishSizePrices(dish.sizes.map((s) => ({ ...s })));
    setDishDesc(dish.description);
  };

  const getDefaultSizesForCategory = (cat: MenuCategory): DishSizeOption[] =>
    cat === 'Jugos'
      ? [
          { id: 'vaso', label: 'Vaso', price: 3 },
          { id: 'medio-litro', label: 'Medio Litro', price: 5 },
          { id: 'litro', label: 'Litro', price: 10 },
        ]
      : cat === 'Platos Fuertes'
      ? [
          { id: 'entero', label: 'Entero', price: 15 },
          { id: 'mini', label: 'Mini', price: 10 },
        ]
      : [
          { id: 'entero', label: 'Entero', price: 9 },
          { id: 'medio', label: 'Medio', price: 5 },
        ];

  const openAddModal = () => {
    setEditingDish(null);
    setIsAddingDish(true);
    setDishName('');
    setDishCategory(menuCategory);
    setDishSizePrices(getDefaultSizesForCategory(menuCategory));
    setDishDesc('Preparado al estilo tradicional de Como en Casa.');
  };

  const handleCategoryChangeInAddModal = (cat: MenuCategory) => {
    setDishCategory(cat);
    setDishSizePrices(getDefaultSizesForCategory(cat));
  };

  const handleSaveDishModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim()) return;

    const cleanSizes = dishSizePrices.map((s) => ({
      ...s,
      price: Math.max(1, Number(s.price) || 1),
    }));
    const badge = buildPriceBadge(cleanSizes);

    if (editingDish) {
      onSaveDishEdit({
        ...editingDish,
        name: dishName.trim(),
        category: dishCategory,
        description: dishDesc.trim(),
        sizes: cleanSizes,
        priceBadge: badge,
      });
      setEditingDish(null);
      return;
    }

    const newItem: MenuItem = {
      id: `custom-${Date.now()}`,
      name: dishName.trim(),
      category: dishCategory,
      description: dishDesc.trim() || 'Platillo tradicional hecho en casa.',
      priceBadge: badge,
      sizes: cleanSizes,
      ingredients: [
        'Ingredientes frescos de temporada',
        'Especias tradicionales',
      ],
      rating: 4.8,
      prepTime: '15 min',
      available: true,
      visualType:
        dishCategory === 'Jugos'
          ? 'jugo-pelon'
          : dishCategory === 'Sopas'
          ? 'sopa-pollo'
          : dishCategory === 'Guisos'
          ? 'guiso'
          : 'pollo-horno',
    };
    onAddNewDish(newItem);
    setIsAddingDish(false);
  };

  const handleDownloadReport = () => {
    const lines = [
      'COMO EN CASA - COMIDA TRADICIONAL (TUPIZA)',
      'REPORTE DIARIO DE VENTAS E INVENTARIO',
      '-----------------------------------------',
      `Ventas cobradas hoy: ${formatBs(totalSalesBs)}`,
      `Pendiente por cobrar: ${formatBs(pendingSalesBs)}`,
      `Pedidos hoy: ${ordersTodayCount}`,
      `Mesas ocupadas: ${occupiedTablesCount}/${tables.length}`,
      '',
      'VENTAS COBRADAS POR CATEGORIA:',
      ...categoryReport.map(
        (c) => `- ${c.category}: ${c.percent}% (${formatBs(c.amount)})`
      ),
      '',
      'INVENTARIO ACTUAL:',
      ...inventory.map(
        (i) => `- ${i.name}: ${i.quantity}${i.unit} (${i.status})`
      ),
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reporte-como-en-casa.txt';
    a.click();
    URL.revokeObjectURL(url);
    setReportMsg('Reporte descargado correctamente.');
    setTimeout(() => setReportMsg(''), 3000);
  };

  const headerTitle =
    activeTab === 'menu'
      ? 'Gestión de Menú'
      : activeTab === 'kitchen'
      ? 'Cocina y Caja'
      : activeTab === 'reports'
      ? 'Reportes'
      : 'Panel Administrador';

  return (
    <div className="relative flex-1 flex flex-col bg-[#FFF8E8] min-h-0">
      <MobileHeader
        title={headerTitle}
        onBack={onBack}
        rightSlot={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenComanda}
              aria-label="Abrir Comanda en Vivo"
              title="Comanda en Vivo"
              className="xl:hidden relative min-w-[40px] min-h-[40px] px-2 flex items-center justify-center rounded-xl bg-[#4A2C1A] text-[#D9A441] hover:bg-[#4A2C1A]/80 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="ml-1 text-[10px] font-extrabold text-[#FFF8E8] tabular-nums">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Cerrar sesión de administrador"
              title="Cerrar sesión"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#D9A441] hover:bg-[#4A2C1A] active:scale-95 transition-transform cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        }
      />

      {/* Admin Sub-Navigation Bar */}
      <div className="bg-[#4A2C1A] px-2 py-2 shrink-0">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-4 gap-1 lg:gap-2">
          {(
            [
              { id: 'dashboard', label: 'Panel', icon: BarChart3 },
              { id: 'menu', label: 'Menú', icon: Utensils },
              { id: 'kitchen', label: 'Cocina/Caja', icon: ChefHat },
              { id: 'reports', label: 'Reportes', icon: BarChart3 },
            ] as {
              id: AdminTab;
              label: string;
              icon: React.ComponentType<{ className?: string }>;
            }[]
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchTab(tab.id)}
                className={`min-h-[36px] lg:min-h-[40px] px-1 sm:px-2 py-1 rounded-xl text-[10px] sm:text-xs font-extrabold flex items-center justify-center gap-1 sm:gap-1.5 transition-colors cursor-pointer min-w-0 ${
                  active
                    ? 'bg-[#D9A441] text-[#2B1A0E]'
                    : 'text-[#FFF8E8]/85 hover:bg-[#3B1F0E]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto phone-scroll">
        <div className="max-w-6xl mx-auto w-full px-4 lg:px-8 pt-4 lg:pt-6 pb-6 space-y-4 lg:space-y-5">
          {activeTab === 'dashboard' && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-serif-display text-2xl lg:text-3xl font-bold text-[#2B1A0E] text-center lg:text-left">
                  Hola Administrador
                </h2>
                {adminEmail && (
                  <span className="text-xs font-bold text-[#2E6F32]">
                    En vivo · {adminEmail}
                  </span>
                )}
              </div>

              {waiterRequests.map((req) => (
                <div
                  key={`waiter-${req.id}`}
                  className="rounded-2xl bg-[#B84A27] text-[#FFF8E8] p-3 flex items-center justify-between gap-2 shadow-sm"
                >
                  <div className="flex items-center gap-2 text-xs font-extrabold">
                    <BellRing className="w-4 h-4 text-[#D9A441] shrink-0" />
                    <span>{req.customerLabel} solicita al mesero</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDismissWaiterCall(req.id)}
                    className="px-2.5 py-1 rounded-xl bg-[#FFF8E8] text-[#2B1A0E] text-[11px] font-extrabold cursor-pointer shrink-0"
                  >
                    Atendido
                  </button>
                </div>
              ))}

              {/* KPI Row */}
              <div className="space-y-2.5 lg:grid lg:grid-cols-12 lg:gap-4 lg:space-y-0">
                <div className="rounded-2xl bg-[#3B1F0E] text-[#FFF8E8] p-4 shadow-sm flex items-center justify-between gap-2 lg:col-span-6">
                  <div>
                    <p className="text-xs font-bold text-[#E8C87A]">
                      Ventas cobradas hoy
                    </p>
                    <p className="text-3xl font-extrabold mt-0.5 tabular-nums">
                      {formatBs(totalSalesBs)}
                    </p>
                  </div>
                  {pendingSalesBs > 0 && (
                    <div className="text-right">
                      <p className="text-[11px] font-bold text-[#E8C87A]">
                        Por cobrar
                      </p>
                      <p className="text-base font-extrabold text-[#D9A441] tabular-nums">
                        {formatBs(pendingSalesBs)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5 lg:col-span-6 lg:gap-4">
                  <div className="rounded-2xl bg-[#FFFDF8] border border-[#D9A441]/60 p-3 lg:p-4 flex flex-col justify-center">
                    <p className="text-xs font-bold text-[#7A5A3A]">
                      Pedidos hoy
                    </p>
                    <p className="text-xl lg:text-2xl font-extrabold text-[#2B1A0E] mt-0.5 tabular-nums">
                      {ordersTodayCount}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#FFFDF8] border border-[#D9A441]/60 p-3 lg:p-4 flex flex-col justify-center">
                    <p className="text-xs font-bold text-[#7A5A3A]">
                      Mesas ocupadas
                    </p>
                    <p className="text-xl lg:text-2xl font-extrabold text-[#2B1A0E] mt-0.5 tabular-nums">
                      {occupiedTablesCount}/{tables.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 lg:grid lg:grid-cols-12 lg:gap-5 lg:space-y-0 lg:items-start">
                {/* Actividad Reciente */}
                <section className="space-y-2 lg:col-span-7">
                  <h3 className="text-sm font-extrabold text-[#2B1A0E] inline-flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#B84A27]" />
                    <span>Actividad Reciente</span>
                  </h3>

                  {kitchenOrders.length === 0 ? (
                    <div className="rounded-2xl bg-[#FDF2D6] border border-[#D9A441]/55 p-4 text-center space-y-1">
                      <p className="text-xs font-extrabold text-[#3B1F0E]">
                        Sin pedidos registrados aún
                      </p>
                      <p className="text-[11px] text-[#7A5A3A]">
                        Crea un pedido desde Cliente (Mesa, Para Llevar o Delivery) o desde Cocina/Caja.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-[#FFFDF8] border border-[#D9A441]/60 divide-y divide-[#D9A441]/30">
                      {kitchenOrders.slice(0, 6).map((ord) => (
                        <div
                          key={ord.id}
                          className="p-3 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="font-extrabold text-sm text-[#2B1A0E] truncate tabular-nums">
                              Pedido {ord.code} - {formatBs(ord.total)}
                            </p>
                            <p className="text-[11px] text-[#7A5A3A]">
                              {ord.customerLabel} · {ord.createdAt} ·{' '}
                              {ord.paid
                                ? `Pagado (${ord.paymentMethod})`
                                : 'Pendiente cobro'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setTicketOrder(ord)}
                              aria-label={`Ver ticket ${ord.code}`}
                              title="Imprimir o enviar ticket por WhatsApp"
                              className="w-8 h-8 rounded-xl bg-[#FDF2D6] border border-[#D9A441] text-[#3B1F0E] flex items-center justify-center hover:bg-[#E8C87A]/35 cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {!ord.paid ? (
                              <button
                                type="button"
                                onClick={() => setCollectingOrder(ord)}
                                className="px-2.5 py-1.5 rounded-xl bg-[#B84A27] text-[#FFF8E8] text-[11px] font-extrabold shrink-0 cursor-pointer"
                              >
                                Cobrar
                              </button>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#2E6F32]/15 text-[#2E6F32] shrink-0">
                                {ord.status}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Quick actions */}
                <div className="space-y-3 lg:col-span-5">
                  <h3 className="hidden lg:block text-sm font-extrabold text-[#2B1A0E]">
                    Acciones rápidas
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => switchTab('menu')}
                      className="min-h-[44px] px-3 py-2 rounded-2xl bg-[#FFFDF8] border border-[#D9A441] text-[#2B1A0E] font-extrabold text-xs hover:bg-[#FDF2D6] cursor-pointer"
                    >
                      Gestión de Menú
                    </button>
                    <button
                      type="button"
                      onClick={() => switchTab('kitchen')}
                      className="min-h-[44px] px-3 py-2 rounded-2xl bg-[#FFFDF8] border border-[#D9A441] text-[#2B1A0E] font-extrabold text-xs hover:bg-[#FDF2D6] cursor-pointer"
                    >
                      Cocina y Caja
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      switchTab('kitchen');
                      setOpenKitchenPosSignal((n) => n + 1);
                    }}
                    className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-sm flex items-center justify-center gap-1.5 hover:bg-[#E8C87A] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                    <span>Nuevo Pedido / Cobro en Caja</span>
                  </button>

                  {/* Ajustes / Configuración (Admin-Only Discrete Backup Tool) */}
                  {isAdmin && (
                    <div className="rounded-2xl bg-[#1E1E1E] border border-[#2A2A2A] p-3.5 space-y-2.5 text-[#F5F5F5]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold tracking-wide text-[#E5E5E5] inline-flex items-center gap-1.5">
                          <Download className="w-3.5 h-3.5 text-[#A3A3A3]" />
                          <span>Ajustes · Respaldo de Carta</span>
                        </span>
                        <span className="text-[10px] font-semibold text-[#A3A3A3] tabular-nums">
                          {menuItems.length} ítems
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          disabled={isBackingUpImages}
                          onClick={() => void handleDownloadFullBackupZip()}
                          className="flex-1 min-h-[38px] px-3 py-2 rounded-xl bg-[#2A2A2A] hover:bg-[#343434] border border-[#3A3A3A] text-[#F5F5F5] text-[11px] font-bold flex items-center justify-center gap-1.5 disabled:opacity-55 cursor-pointer transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-[#D4D4D4] shrink-0" />
                          <span>
                            {isBackingUpImages
                              ? `Exportando ${backupProgress?.percent ?? 0}%`
                              : 'Exportar Respaldo Completo (.zip)'}
                          </span>
                        </button>

                        <button
                          type="button"
                          disabled={isBackingUpImages}
                          onClick={handleDownloadCsvOnly}
                          className="min-h-[38px] px-3 py-2 rounded-xl bg-[#141414] hover:bg-[#252525] border border-[#2A2A2A] text-[#D4D4D4] text-[11px] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-55 cursor-pointer transition-colors shrink-0"
                        >
                          <span>Solo exportar Excel .csv</span>
                        </button>
                      </div>

                      {backupProgress && (
                        <div className="space-y-1 pt-0.5">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-[#D4D4D4] gap-2">
                            <span className="truncate">
                              {backupProgress.phase === 'compressing'
                                ? backupProgress.currentName
                                : `(${backupProgress.current}/${backupProgress.total}) ${backupProgress.currentName}`}
                            </span>
                            <span className="tabular-nums shrink-0 text-[#F5F5F5]">
                              {backupProgress.percent}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-[#141414] overflow-hidden border border-[#2A2A2A]">
                            <div
                              className="h-full rounded-full bg-[#D9A441] transition-all duration-150"
                              style={{ width: `${backupProgress.percent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {backupSummary && !isBackingUpImages && (
                        <p className="text-[11px] font-semibold text-[#A3E6A8] bg-[#141414] border border-[#2A2A2A] px-2.5 py-1.5 rounded-xl">
                          {backupSummary}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="rounded-2xl bg-[#FFFDF8] border border-[#D9A441]/65 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-[#3B1F0E] inline-flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-[#B84A27]" />
                        <span>PIN de Mozo (4 dígitos)</span>
                      </span>
                      <span className="text-[10px] font-bold text-[#7A5A3A]">
                        5 toques al logo
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        value={pinDraft}
                        onChange={(e) =>
                          setPinDraft(
                            e.target.value.replace(/\D/g, '').slice(0, 4)
                          )
                        }
                        placeholder="1234"
                        className="flex-1 h-9 px-3 rounded-xl bg-[#FFF8E8] border border-[#D9A441] text-xs font-extrabold tracking-widest text-center text-[#2B1A0E] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#B84A27]"
                      />
                      <button
                        type="button"
                        disabled={pinDraft.length !== 4 || pinDraft === mozoPin}
                        onClick={() => onUpdateMozoPin(pinDraft)}
                        className="h-9 px-3 rounded-xl bg-[#3B1F0E] text-[#FFF8E8] text-xs font-extrabold disabled:opacity-45 cursor-pointer"
                      >
                        Guardar PIN
                      </button>
                    </div>
                  </div>

                  {/* Authorized Mozos (Google Accounts) */}
                  <div className="rounded-2xl bg-[#FFFDF8] border border-[#D9A441]/65 p-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-[#3B1F0E] inline-flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#B84A27]" />
                        <span>Mozos autorizados (Google)</span>
                      </span>
                      <span className="text-[10px] font-bold text-[#7A5A3A] tabular-nums">
                        {authorizedStaff.length} registrados
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        placeholder="Nombre (Ej. Carlos)"
                        className="h-9 px-2.5 rounded-xl bg-[#FFF8E8] border border-[#D9A441] text-xs font-semibold text-[#2B1A0E]"
                      />
                      <input
                        type="email"
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        placeholder="correo.mozo@gmail.com"
                        className="h-9 px-2.5 rounded-xl bg-[#FFF8E8] border border-[#D9A441] text-xs font-semibold text-[#2B1A0E]"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!newStaffEmail.trim().includes('@')}
                      onClick={() => {
                        onAddAuthorizedStaff(
                          newStaffEmail.trim(),
                          newStaffName.trim() || newStaffEmail.trim()
                        );
                        setNewStaffEmail('');
                        setNewStaffName('');
                      }}
                      className="w-full h-9 rounded-xl bg-[#3B1F0E] text-[#FFF8E8] text-xs font-extrabold disabled:opacity-45 cursor-pointer"
                    >
                      Autorizar Mozo
                    </button>

                    {authorizedStaff.length > 0 && (
                      <div className="space-y-1.5 pt-1 max-h-36 overflow-y-auto phone-scroll">
                        {authorizedStaff.map((staff) => (
                          <div
                            key={staff.email}
                            className="flex items-center justify-between gap-2 rounded-xl bg-[#FDF2D6]/60 border border-[#D9A441]/40 px-2.5 py-1.5 text-[11px]"
                          >
                            <div className="min-w-0">
                              <p className="font-extrabold text-[#2B1A0E] truncate">
                                {staff.name}
                              </p>
                              <p className="text-[10px] text-[#7A5A3A] truncate">
                                {staff.email}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  onToggleAuthorizedStaff(
                                    staff.email,
                                    !staff.active
                                  )
                                }
                                className={`px-2 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer ${
                                  staff.active
                                    ? 'bg-[#2E6F32]/15 text-[#2E6F32]'
                                    : 'bg-[#7A5A3A]/15 text-[#7A5A3A]'
                                }`}
                              >
                                {staff.active ? 'Activo' : 'Pausado'}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onRemoveAuthorizedStaff(staff.email)
                                }
                                aria-label={`Eliminar ${staff.email}`}
                                className="w-6 h-6 rounded-lg text-[#B83227] hover:bg-[#B83227]/10 flex items-center justify-center cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'menu' && (
            <>
              <div className="space-y-3 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
                <div className="relative lg:w-72 shrink-0">
                  <Search className="w-4 h-4 text-[#7A5A3A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={menuQuery}
                    onChange={(e) => setMenuQuery(e.target.value)}
                    placeholder="Buscar plato..."
                    className="w-full h-10 pl-10 pr-4 rounded-2xl bg-[#FFFDF8] border border-[#D9A441]/60 text-xs text-[#2B1A0E] font-semibold focus:outline-none focus:ring-2 focus:ring-[#B84A27]"
                  />
                </div>

                <div className="min-w-0">
                  <CategoryTabs
                    activeCategory={menuCategory}
                    onSelectCategory={setMenuCategory}
                    compact
                  />
                </div>

                <button
                  type="button"
                  onClick={openAddModal}
                  className="hidden lg:inline-flex min-h-[40px] px-4 py-2 rounded-2xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-xs items-center justify-center gap-1.5 hover:bg-[#E8C87A] cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  <span>Agregar nuevo plato</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 lg:gap-3">
                {filteredMenu.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-[#FFFDF8] border border-[#D9A441]/60 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="font-extrabold text-sm text-[#2B1A0E] truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] font-bold text-[#B84A27] tabular-nums">
                        {item.priceBadge}
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="min-h-[34px] px-2.5 py-1 rounded-xl bg-[#D9A441]/40 text-[#2B1A0E] text-[11px] font-extrabold inline-flex items-center gap-1 hover:bg-[#D9A441] cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleDishAvailability(item.id)}
                        className={`min-h-[34px] px-2.5 py-1 rounded-xl text-[11px] font-extrabold cursor-pointer transition-colors ${
                          item.available
                            ? 'bg-[#2E6F32] text-[#FFF8E8]'
                            : 'bg-[#B83227] text-[#FFF8E8]'
                        }`}
                      >
                        {item.available ? 'Disponible' : 'Agotado'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={openAddModal}
                className="lg:hidden w-full min-h-[48px] px-4 py-3 rounded-2xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-sm flex items-center justify-center gap-1.5 hover:bg-[#E8C87A] cursor-pointer"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                <span>Agregar nuevo plato</span>
              </button>
            </>
          )}

          {activeTab === 'kitchen' && (
            <OrdersBoard
              userRole="admin"
              orders={kitchenOrders}
              tables={tables}
              menuItems={menuItems}
              orderMode={orderMode}
              selectedTable={selectedTable}
              linkedTakeawayOrderId={linkedTakeawayOrderId}
              linkedDeliveryOrderId={linkedDeliveryOrderId}
              newOrderLabel="Nuevo Pedido en Caja"
              openNewOrderSignal={openKitchenPosSignal}
              onSelectOrderCard={(order) =>
                onLoadOrderToLivePanel(order, { openDrawerOnCompact: true })
              }
              onAddDishesToOrder={(order) =>
                onLoadOrderToLivePanel(order, { goToMenu: true })
              }
              onUpdateOrderStatus={onUpdateOrderStatus}
              onCollectOrderPayment={onCollectOrderPayment}
              onDismissWaiterCall={onDismissWaiterCall}
              onFreeTable={onFreeTable}
              onCreatePosOrder={onCreatePosOrder}
            />
          )}

          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0 lg:items-start">
                <section className="rounded-2xl bg-[#FFFDF8] border border-[#D9A441]/65 p-3.5 lg:p-5 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-serif-display text-lg font-bold text-[#2B1A0E]">
                      Ventas por categoría
                    </h3>
                    <span className="text-[11px] font-bold text-[#7A5A3A] tabular-nums">
                      Total: {formatBs(totalSalesBs)}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {categoryReport.map((row) => (
                      <div key={row.category} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-extrabold text-[#2B1A0E]">
                          <span>{row.category}</span>
                          <span className="tabular-nums">
                            {row.percent}% ({formatBs(row.amount)})
                          </span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-[#E8C87A]/35 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#B84A27] transition-all"
                            style={{ width: `${row.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl bg-[#FFFDF8] border border-[#D9A441]/65 p-3.5 lg:p-5 space-y-2.5">
                  <h3 className="font-serif-display text-lg font-bold text-[#2B1A0E]">
                    Inventario
                  </h3>
                  <div className="divide-y divide-[#D9A441]/30">
                    {inventory.map((inv) => {
                      const isLow = inv.status === 'Bajo stock';
                      return (
                        <div
                          key={inv.id}
                          className="py-2 flex items-center justify-between text-xs font-bold"
                        >
                          <span className="text-[#2B1A0E] tabular-nums">
                            {inv.name} · {inv.quantity}
                            {inv.unit}
                          </span>
                          <span
                            className={`font-extrabold ${
                              isLow ? 'text-[#B83227]' : 'text-[#2E6F32]'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>

              {reportMsg && (
                <p className="text-xs font-bold text-[#2E6F32] bg-[#2E6F32]/15 px-3 py-2 rounded-xl text-center max-w-md mx-auto">
                  {reportMsg}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md lg:mx-auto">
                <button
                  type="button"
                  onClick={handleDownloadReport}
                  className="min-h-[46px] px-3 py-2.5 rounded-2xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-[#E8C87A] cursor-pointer"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Descargar Reporte</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setInvDraft(inventory);
                    setShowInvModal(true);
                  }}
                  className="min-h-[46px] px-3 py-2.5 rounded-2xl bg-[#FFFDF8] border border-[#3B1F0E] text-[#2B1A0E] font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-[#FDF2D6] cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                  <span>Actualizar Inventario</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Collect Payment (Dashboard Recent Activity) */}
      <CollectPaymentModal
        order={collectingOrder}
        onClose={() => setCollectingOrder(null)}
        onConfirmCollect={(order, method, openTicket) => {
          const paidCopy: KitchenOrder = {
            ...order,
            status: 'Cobrado',
            paid: true,
            paymentMethod: method,
          };
          onCollectOrderPayment(order.id, method);
          setCollectingOrder(null);
          if (openTicket) {
            setTicketOrder(paidCopy);
          }
        }}
      />

      {/* Modal: Edit / Add Dish */}
      {(editingDish || isAddingDish) && (
        <div className="fixed inset-0 z-50 bg-black/60 overflow-y-auto flex p-4">
          <form
            onSubmit={handleSaveDishModal}
            className="my-auto mx-auto w-full max-w-md max-h-[92dvh] overflow-y-auto phone-scroll bg-[#FFF8E8] rounded-2xl border border-[#D9A441] p-4 space-y-3 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif-display text-lg font-bold text-[#3B1F0E]">
                {editingDish ? 'Editar plato' : 'Agregar nuevo plato'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingDish(null);
                  setIsAddingDish(false);
                }}
                aria-label="Cerrar"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#3B1F0E] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3B1F0E] mb-1">
                Nombre del plato
              </label>
              <input
                type="text"
                required
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                placeholder="Ej. Pique Macho"
                className="w-full px-3 py-2 rounded-xl bg-[#FDF2D6] border border-[#D9A441] text-sm font-semibold text-[#2B1A0E]"
              />
            </div>

            {isAddingDish && (
              <div>
                <label className="block text-xs font-bold text-[#3B1F0E] mb-1">
                  Categoría
                </label>
                <select
                  value={dishCategory}
                  onChange={(e) =>
                    handleCategoryChangeInAddModal(
                      e.target.value as MenuCategory
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#FDF2D6] border border-[#D9A441] text-sm font-semibold text-[#2B1A0E]"
                >
                  {MENU_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div
              className={`grid gap-2 ${
                dishSizePrices.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
              }`}
            >
              {dishSizePrices.map((sz, idx) => (
                <div key={sz.id}>
                  <label className="block text-[11px] font-bold text-[#3B1F0E] mb-1 truncate">
                    {sz.label} (Bs)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={sz.price}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setDishSizePrices((prev) =>
                        prev.map((row, rIdx) =>
                          rIdx === idx ? { ...row, price: val } : row
                        )
                      );
                    }}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#FDF2D6] border border-[#D9A441] text-sm font-bold text-[#2B1A0E] tabular-nums"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3B1F0E] mb-1">
                Descripción
              </label>
              <textarea
                rows={2}
                value={dishDesc}
                onChange={(e) => setDishDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FDF2D6] border border-[#D9A441] text-xs font-semibold text-[#2B1A0E] resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[44px] rounded-2xl bg-[#3B1F0E] text-[#FFF8E8] font-extrabold text-xs cursor-pointer"
            >
              Guardar cambios
            </button>
          </form>
        </div>
      )}

      {/* Modal: Update Inventory */}
      {showInvModal && (
        <div className="fixed inset-0 z-50 bg-black/60 overflow-y-auto flex p-4">
          <div className="my-auto mx-auto w-full max-w-md max-h-[92dvh] overflow-y-auto phone-scroll bg-[#FFF8E8] rounded-2xl border border-[#D9A441] p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-serif-display text-lg font-bold text-[#3B1F0E]">
                Actualizar Inventario
              </h3>
              <button
                type="button"
                onClick={() => setShowInvModal(false)}
                aria-label="Cerrar"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#3B1F0E] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {invDraft.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 bg-[#FDF2D6] p-2.5 rounded-xl border border-[#D9A441]/50"
                >
                  <span className="font-bold text-xs text-[#2B1A0E]">
                    {item.name} ({item.unit})
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={item.quantity}
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value) || 0);
                      setInvDraft((prev) =>
                        prev.map((row) =>
                          row.id === item.id
                            ? {
                                ...row,
                                quantity: val,
                                status: val <= 4 ? 'Bajo stock' : 'Stock OK',
                              }
                            : row
                        )
                      );
                    }}
                    className="w-20 px-2.5 py-1 rounded-xl bg-white border border-[#D9A441] text-xs font-extrabold text-center tabular-nums"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                onUpdateInventory(invDraft);
                setShowInvModal(false);
              }}
              className="w-full min-h-[44px] rounded-2xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-xs cursor-pointer"
            >
              Guardar inventario
            </button>
          </div>
        </div>
      )}

      <TicketModal order={ticketOrder} onClose={() => setTicketOrder(null)} />
    </div>
  );
};
