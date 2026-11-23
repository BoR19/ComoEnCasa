import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  BellRing,
  ChefHat,
  Clock,
  Download,
  LogOut,
  MessageCircle,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Users,
  Utensils,
  X,
} from 'lucide-react';
import {
  ActiveStaffSession,
  AdminTab,
  CustomerContactItem,
  DishSizeOption,
  EmployeeRoleTitle,
  InventoryItem,
  KitchenOrder,
  MenuCategory,
  MenuItem,
  OrderLineItem,
  OrderMode,
  OrderStatus,
  PaymentMethod,
  StaffMember,
  StaffPermissions,
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
  downloadCustomerContactsCsv,
  mergeCustomerDirectory,
} from '../../utils/customerExport';
import {
  ImageBackupProgress,
  downloadMenuCsvOnly,
  downloadMenuFullBackupZip,
} from '../../utils/menuImageBackup';
import { formatBoliviaDisplayPhone } from '../../utils/ticketHelpers';
import { CollectPaymentModal } from '../CollectPaymentModal';
import { OrdersBoard } from '../OrdersBoard';
import { CategoryTabs, MobileHeader } from '../ShellComponents';
import { TicketModal } from '../TicketModal';
import { TeamPermissionsTab } from './TeamPermissionsTab';

interface AdminPanelScreenProps {
  isAdmin: boolean;
  activeStaffSession: ActiveStaffSession | null;
  permissions: StaffPermissions;
  menuItems: MenuItem[];
  kitchenOrders: KitchenOrder[];
  tables: TableItem[];
  inventory: InventoryItem[];
  customerContacts?: CustomerContactItem[];
  staffMembers: StaffMember[];
  adminPin: string;
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
  onUpdateAdminPin: (newPin: string) => Promise<boolean>;
  onSaveStaffMember: (payload: {
    id?: string;
    name: string;
    role: EmployeeRoleTitle;
    pin: string;
    active: boolean;
    permissions: StaffPermissions;
  }) => Promise<{ ok: boolean; error?: string }>;
  onToggleStaffActive: (staffId: string, active: boolean) => void;
  onDeleteStaffMember: (staffId: string) => void;
  onGoTables?: () => void;
  onLogout: () => void;
  onBack: () => void;
}

export const AdminPanelScreen: React.FC<AdminPanelScreenProps> = ({
  isAdmin,
  activeStaffSession,
  permissions,
  menuItems,
  kitchenOrders,
  tables,
  inventory,
  customerContacts = [],
  staffMembers,
  adminPin,
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
  onUpdateAdminPin,
  onSaveStaffMember,
  onToggleStaffActive,
  onDeleteStaffMember,
  onGoTables,
  onLogout,
  onBack,
}) => {
  const canViewDashboard =
    isAdmin || permissions.cashier_billing || permissions.reports_history;
  const canEditMenu = isAdmin || permissions.menu_pricing;
  const canViewKitchen =
    isAdmin || permissions.kitchen_board || permissions.cashier_billing;
  const canViewReports = isAdmin || permissions.reports_history;
  const canCollectBilling = isAdmin || permissions.cashier_billing;
  const canCreateOrders =
    isAdmin || permissions.orders_tables || permissions.cashier_billing;

  const availableTabs = useMemo(() => {
    const list: {
      id: AdminTab;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
    }[] = [];
    if (canViewDashboard) {
      list.push({ id: 'dashboard', label: 'Panel', icon: BarChart3 });
    }
    if (canEditMenu) {
      list.push({ id: 'menu', label: 'Menú', icon: Utensils });
    }
    if (canViewKitchen) {
      list.push({ id: 'kitchen', label: 'Cocina/Caja', icon: ChefHat });
    }
    if (canViewReports) {
      list.push({ id: 'reports', label: 'Reportes', icon: BarChart3 });
    }
    if (isAdmin) {
      list.push({ id: 'staff', label: 'Equipo', icon: Users });
    }
    return list;
  }, [canEditMenu, canViewDashboard, canViewKitchen, canViewReports, isAdmin]);

  const [activeTab, setActiveTab] = useState<AdminTab>(
    () => availableTabs[0]?.id ?? 'dashboard'
  );

  useEffect(() => {
    if (
      availableTabs.length > 0 &&
      !availableTabs.some((t) => t.id === activeTab)
    ) {
      setActiveTab(availableTabs[0].id);
    }
  }, [activeTab, availableTabs]);

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

  const customerDirectory = useMemo(
    () => mergeCustomerDirectory(customerContacts, kitchenOrders),
    [customerContacts, kitchenOrders]
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

  const handleDownloadCustomersCsv = () => {
    const count = downloadCustomerContactsCsv(customerContacts, kitchenOrders);
    setReportMsg(
      count > 0
        ? `Base de clientes exportada (${count} contactos WhatsApp en .csv).`
        : 'Aún no hay teléfonos WhatsApp registrados para exportar.'
    );
    setTimeout(() => setReportMsg(''), 3500);
  };

  const headerTitle =
    activeTab === 'menu'
      ? 'Gestión de Menú'
      : activeTab === 'kitchen'
      ? 'Cocina y Caja'
      : activeTab === 'reports'
      ? 'Reportes'
      : activeTab === 'staff'
      ? 'Equipo y Permisos'
      : isAdmin
      ? 'Panel Administrador'
      : `Panel — ${activeStaffSession?.role || 'Personal'}`;

  return (
    <div className="relative flex-1 flex flex-col bg-[var(--bg-canvas)] min-h-0">
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
              className="xl:hidden relative min-w-[40px] min-h-[40px] px-2 flex items-center justify-center rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-[var(--ink-primary)] hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-[var(--accent-primary)]" />
              {cartCount > 0 && (
                <span className="ml-1 text-[10px] font-bold text-[var(--ink-primary)] tabular-nums">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Cerrar turno"
              title="Cerrar turno"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[var(--ink-primary)] hover:bg-[var(--bg-inset)] active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        }
      />

      {/* Admin Sub-Navigation Bar */}
      <div className="bg-[var(--ops-surface)] border-b border-[var(--ops-border)] px-3 py-2 shrink-0">
        <div className="max-w-6xl mx-auto w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar sm:grid sm:grid-flow-col sm:auto-cols-fr sm:gap-2">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchTab(tab.id)}
                className={`min-h-[42px] px-3.5 sm:px-2 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer min-w-0 ${
                  active
                    ? 'bg-[var(--ops-accent)] text-white'
                    : 'text-[var(--bg-canvas)]/80 hover:bg-[var(--ops-elevated)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto phone-scroll">
        <div className="max-w-6xl mx-auto w-full px-4 lg:px-8 pt-4 lg:pt-6 pb-24 xl:pb-8 space-y-4 lg:space-y-5">
          {activeTab === 'dashboard' && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-serif-display text-2xl lg:text-3xl font-bold text-[var(--ink-primary)] text-left">
                    {activeStaffSession
                      ? `Hola, ${activeStaffSession.name}`
                      : 'Hola Administrador'}
                  </h2>
                  {activeStaffSession && (
                    <p className="text-xs font-semibold text-[var(--ink-muted)] mt-0.5">
                      Turno: {activeStaffSession.name} — {activeStaffSession.role}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => switchTab('staff')}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[var(--ops-surface)] text-[var(--accent-gold)] text-xs font-bold inline-flex items-center gap-1.5 hover:opacity-95 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 shrink-0" />
                      <span>Equipo y Permisos</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onLogout}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-xs font-bold inline-flex items-center gap-1.5 hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
                    <span>Cerrar turno</span>
                  </button>
                </div>
              </div>

              {waiterRequests.map((req) => (
                <div
                  key={`waiter-${req.id}`}
                  className="rounded-2xl bg-[var(--accent-primary)] text-[var(--bg-canvas)] p-3 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <BellRing className="w-4 h-4 text-[var(--accent-gold)] shrink-0" />
                    <span>
                      {req.billRequested
                        ? `${req.customerLabel} solicita la cuenta`
                        : `${req.customerLabel} solicita al mesero`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDismissWaiterCall(req.id)}
                    className="px-2.5 py-1 rounded-xl bg-[var(--bg-surface)] text-[var(--ink-primary)] text-[11px] font-bold active:scale-[0.97] transition-transform duration-150 ease-[var(--ease-out)] cursor-pointer shrink-0"
                  >
                    Atendido
                  </button>
                </div>
              ))}

              {/* KPI Row */}
              <div className="space-y-2.5 lg:grid lg:grid-cols-12 lg:gap-4 lg:space-y-0">
                <div className="rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-canvas)] p-4 flex items-center justify-between gap-2 lg:col-span-6">
                  <div>
                    <p className="text-xs font-bold text-[var(--accent-gold)]">
                      Ventas cobradas hoy
                    </p>
                    <p className="text-3xl font-bold mt-0.5 tabular-nums">
                      {formatBs(totalSalesBs)}
                    </p>
                  </div>
                  {pendingSalesBs > 0 && (
                    <div className="text-right">
                      <p className="text-[11px] font-bold text-[var(--accent-gold)]">
                        Por cobrar
                      </p>
                      <p className="text-base font-bold text-[var(--accent-gold)] tabular-nums">
                        {formatBs(pendingSalesBs)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5 lg:col-span-6 lg:gap-4">
                  <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3 lg:p-4 flex flex-col justify-center">
                    <p className="text-xs font-semibold text-[var(--ink-muted)]">
                      Pedidos hoy
                    </p>
                    <p className="text-xl lg:text-2xl font-bold text-[var(--ink-primary)] mt-0.5 tabular-nums">
                      {ordersTodayCount}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3 lg:p-4 flex flex-col justify-center">
                    <p className="text-xs font-semibold text-[var(--ink-muted)]">
                      Mesas ocupadas
                    </p>
                    <p className="text-xl lg:text-2xl font-bold text-[var(--ink-primary)] mt-0.5 tabular-nums">
                      {occupiedTablesCount}/{tables.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 lg:grid lg:grid-cols-12 lg:gap-5 lg:space-y-0 lg:items-start">
                {/* Actividad Reciente */}
                <section className="space-y-2 lg:col-span-7">
                  <h3 className="text-sm font-bold text-[var(--ink-primary)] inline-flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[var(--accent-primary)]" />
                    <span>Actividad Reciente</span>
                  </h3>

                  {kitchenOrders.length === 0 ? (
                    <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 text-center space-y-1">
                      <p className="text-xs font-bold text-[var(--ink-primary)]">
                        Sin pedidos registrados aún
                      </p>
                      <p className="text-[11px] text-[var(--ink-muted)]">
                        Crea un pedido desde Cliente (Mesa, Para llevar o Delivery) o desde Cocina/Caja.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
                      {kitchenOrders.slice(0, 6).map((ord) => (
                        <div
                          key={ord.id}
                          className="p-3 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-[var(--ink-primary)] truncate tabular-nums">
                              Pedido {ord.code} - {formatBs(ord.total)}
                            </p>
                            <p className="text-[11px] text-[var(--ink-muted)]">
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
                              className="w-8 h-8 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-[var(--ink-primary)] flex items-center justify-center hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {!ord.paid ? (
                              canCollectBilling ? (
                                <button
                                  type="button"
                                  onClick={() => setCollectingOrder(ord)}
                                  className="px-2.5 py-1.5 rounded-xl bg-[var(--accent-primary)] text-[var(--bg-canvas)] text-[11px] font-bold shrink-0 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
                                >
                                  Cobrar
                                </button>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[var(--bg-inset)] text-[var(--ink-muted)] shrink-0">
                                  Pendiente
                                </span>
                              )
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[var(--status-ok)]/12 text-[var(--status-ok)] shrink-0">
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
                  <h3 className="hidden lg:block text-sm font-bold text-[var(--ink-primary)]">
                    Acciones rápidas
                  </h3>
                  <div className="flex flex-wrap gap-2.5">
                    {canEditMenu && (
                      <button
                        type="button"
                        onClick={() => switchTab('menu')}
                        className="flex-1 min-w-[110px] min-h-[44px] px-3 py-2 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] font-bold text-xs hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
                      >
                        Gestión de Menú
                      </button>
                    )}
                    {canViewKitchen && (
                      <button
                        type="button"
                        onClick={() => switchTab('kitchen')}
                        className="flex-1 min-w-[110px] min-h-[44px] px-3 py-2 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] font-bold text-xs hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
                      >
                        Cocina y Caja
                      </button>
                    )}
                    {onGoTables && (isAdmin || permissions.orders_tables) && (
                      <button
                        type="button"
                        onClick={onGoTables}
                        className="flex-1 min-w-[110px] min-h-[44px] px-3 py-2 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] font-bold text-xs hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
                      >
                        Mesas y QR
                      </button>
                    )}
                  </div>

                  {canCreateOrders && canViewKitchen && (
                    <button
                      type="button"
                      onClick={() => {
                        switchTab('kitchen');
                        setOpenKitchenPosSignal((n) => n + 1);
                      }}
                      className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-[var(--accent-gold)] text-[var(--ink-primary)] font-bold text-sm flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
                    >
                      <Plus className="w-4 h-4" strokeWidth={2.5} />
                      <span>Nuevo Pedido / Cobro en Caja</span>
                    </button>
                  )}

                  {/* Ajustes / Configuración (Admin-Only Discrete Backup Tool & Staff Link) */}
                  {isAdmin && (
                    <div className="rounded-2xl bg-[var(--ops-surface)] border border-[var(--ops-border)] p-3.5 space-y-2.5 text-[var(--bg-canvas)]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-[var(--bg-canvas)] inline-flex items-center gap-1.5">
                          <Download className="w-3.5 h-3.5 text-[var(--bg-canvas)]/70" />
                          <span>Ajustes · Respaldo de Carta</span>
                        </span>
                        <span className="text-[10px] font-semibold text-[var(--bg-canvas)]/65 tabular-nums">
                          {menuItems.length} ítems
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          disabled={isBackingUpImages}
                          onClick={() => void handleDownloadFullBackupZip()}
                          className="flex-1 min-h-[38px] px-3 py-2 rounded-xl bg-[var(--ops-elevated)] hover:opacity-90 border border-[var(--ops-border)] text-[var(--bg-canvas)] text-[11px] font-bold flex items-center justify-center gap-1.5 disabled:opacity-55 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-[var(--accent-gold)] shrink-0" />
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
                          className="min-h-[38px] px-3 py-2 rounded-xl bg-[var(--ops-canvas)] hover:bg-[var(--ops-elevated)] border border-[var(--ops-border)] text-[var(--bg-canvas)]/85 text-[11px] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-55 active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer shrink-0"
                        >
                          <span>Solo exportar Excel .csv</span>
                        </button>
                      </div>

                      {backupProgress && (
                        <div className="space-y-1 pt-0.5">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-[var(--bg-canvas)]/80 gap-2">
                            <span className="truncate">
                              {backupProgress.phase === 'compressing'
                                ? backupProgress.currentName
                                : `(${backupProgress.current}/${backupProgress.total}) ${backupProgress.currentName}`}
                            </span>
                            <span className="tabular-nums shrink-0 text-[var(--bg-canvas)]">
                              {backupProgress.percent}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-[var(--ops-canvas)] overflow-hidden border border-[var(--ops-border)]">
                            <div
                              className="w-full h-full rounded-full bg-[var(--accent-gold)] origin-left transition-transform duration-150 ease-[var(--ease-out)]"
                              style={{
                                transform: `scaleX(${Math.max(
                                  0,
                                  Math.min(1, backupProgress.percent / 100)
                                )})`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {backupSummary && !isBackingUpImages && (
                        <p className="text-[11px] font-semibold text-[var(--status-ok-bright)] bg-[var(--ops-canvas)] border border-[var(--ops-border)] px-2.5 py-1.5 rounded-xl">
                          {backupSummary}
                        </p>
                      )}

                      <div className="pt-2 border-t border-[var(--ops-border)] flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-white/80 inline-flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
                          <span>
                            {staffMembers.filter((m) => m.active).length} colaboradores activos
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => switchTab('staff')}
                          className="min-h-[34px] px-3 py-1 rounded-xl bg-[var(--ops-accent)] text-white text-xs font-bold hover:brightness-105 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] cursor-pointer"
                        >
                          Gestionar equipo y PINs
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'menu' && (
            <>
              <div className="space-y-3 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
                <div className="relative lg:w-72 shrink-0">
                  <Search className="w-4 h-4 text-[var(--ink-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={menuQuery}
                    onChange={(e) => setMenuQuery(e.target.value)}
                    placeholder="Buscar plato..."
                    className="w-full h-10 pl-10 pr-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--ink-primary)] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
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
                  className="hidden lg:inline-flex min-h-[40px] px-4 py-2 rounded-2xl bg-[var(--accent-gold)] text-[var(--ink-primary)] font-bold text-xs items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  <span>Agregar nuevo plato</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 lg:gap-3">
                {filteredMenu.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-[var(--ink-primary)] truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] font-bold text-[var(--accent-primary)] tabular-nums">
                        {item.priceBadge}
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="min-h-[34px] px-2.5 py-1 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-[11px] font-bold inline-flex items-center gap-1 hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleDishAvailability(item.id)}
                        className={`min-h-[34px] px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] ${
                          item.available
                            ? 'bg-[var(--status-ok)] text-[var(--bg-canvas)]'
                            : 'bg-[var(--status-danger)] text-[var(--bg-canvas)]'
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
                className="lg:hidden w-full min-h-[48px] px-4 py-3 rounded-2xl bg-[var(--accent-gold)] text-[var(--ink-primary)] font-bold text-sm flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                <span>Agregar nuevo plato</span>
              </button>
            </>
          )}

          {activeTab === 'kitchen' && canViewKitchen && (
            <OrdersBoard
              userRole={isAdmin ? 'admin' : 'mozo'}
              canTakeOrders={canCreateOrders}
              canUpdateKitchen={isAdmin || permissions.kitchen_board}
              canCollectBilling={canCollectBilling}
              canViewHistory={canViewReports || canCollectBilling}
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
              onCreatePosOrder={canCreateOrders ? onCreatePosOrder : undefined}
            />
          )}

          {activeTab === 'staff' && isAdmin && (
            <TeamPermissionsTab
              adminPin={adminPin}
              staffMembers={staffMembers}
              onUpdateAdminPin={onUpdateAdminPin}
              onSaveStaffMember={onSaveStaffMember}
              onToggleStaffActive={onToggleStaffActive}
              onDeleteStaffMember={onDeleteStaffMember}
            />
          )}

          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0 lg:items-start">
                <section className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3.5 lg:p-5 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-serif-display text-lg font-bold text-[var(--ink-primary)]">
                      Ventas por categoría
                    </h3>
                    <span className="text-[11px] font-bold text-[var(--ink-muted)] tabular-nums">
                      Total: {formatBs(totalSalesBs)}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {categoryReport.map((row) => (
                      <div key={row.category} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold text-[var(--ink-primary)]">
                          <span>{row.category}</span>
                          <span className="tabular-nums">
                            {row.percent}% ({formatBs(row.amount)})
                          </span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-[var(--bg-inset)] overflow-hidden">
                          <div
                            className="w-full h-full rounded-full bg-[var(--accent-primary)] origin-left transition-transform duration-200 ease-[var(--ease-out)]"
                            style={{
                              transform: `scaleX(${Math.max(
                                0,
                                Math.min(1, row.percent / 100)
                              )})`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3.5 lg:p-5 space-y-2.5">
                  <h3 className="font-serif-display text-lg font-bold text-[var(--ink-primary)]">
                    Inventario
                  </h3>
                  <div className="divide-y divide-[var(--border-subtle)]">
                    {inventory.map((inv) => {
                      const isLow = inv.status === 'Bajo stock';
                      return (
                        <div
                          key={inv.id}
                          className="py-2 flex items-center justify-between text-xs font-bold"
                        >
                          <span className="text-[var(--ink-primary)] tabular-nums">
                            {inv.name} · {inv.quantity}
                            {inv.unit}
                          </span>
                          <span
                            className={`font-bold ${
                              isLow
                                ? 'text-[var(--status-danger)]'
                                : 'text-[var(--status-ok)]'
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

              {/* Base de Clientes WhatsApp */}
              <section className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3.5 lg:p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-serif-display text-lg font-bold text-[var(--ink-primary)] inline-flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-[var(--status-ok)] shrink-0" />
                      <span>Base de Clientes WhatsApp</span>
                    </h3>
                    <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                      Números registrados al escanear el QR de mesa o en pedidos para recibos digitales y promociones.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--ink-primary)] tabular-nums shrink-0">
                    {customerDirectory.length}{' '}
                    {customerDirectory.length === 1 ? 'cliente' : 'clientes'}
                  </span>
                </div>

                {customerDirectory.length === 0 ? (
                  <p className="text-xs text-[var(--ink-muted)] bg-[var(--bg-inset)] border border-[var(--border-subtle)] rounded-xl p-3 text-center">
                    Todavía no se registraron números de WhatsApp en esta jornada.
                  </p>
                ) : (
                  <div className="divide-y divide-[var(--border-subtle)] max-h-64 overflow-y-auto phone-scroll">
                    {customerDirectory.map((contact) => {
                      const modeLabel =
                        contact.lastMode === 'dine-in'
                          ? contact.lastTableNumber
                            ? `Mesa ${contact.lastTableNumber}`
                            : 'En el local'
                          : contact.lastMode === 'takeaway'
                          ? 'Para Llevar'
                          : 'Delivery';
                      return (
                        <div
                          key={contact.phone}
                          className="py-2.5 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-[var(--ink-primary)] tabular-nums">
                              {formatBoliviaDisplayPhone(contact.phone)}
                            </p>
                            <p className="text-[11px] text-[var(--ink-muted)] truncate tabular-nums">
                              {modeLabel} · {contact.ordersCount}{' '}
                              {contact.ordersCount === 1 ? 'pedido' : 'pedidos'}{' '}
                              · {formatBs(contact.lastOrderTotal)}
                            </p>
                          </div>

                          <a
                            href={`https://wa.me/${contact.phone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Escribir por WhatsApp a ${contact.phone}`}
                            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[var(--status-ok)] text-[var(--bg-surface)] text-[11px] font-bold inline-flex items-center gap-1 hover:brightness-105 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] shrink-0"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {reportMsg && (
                <p className="text-xs font-bold text-[var(--status-ok)] bg-[var(--status-ok)]/12 px-3 py-2 rounded-xl text-center max-w-md mx-auto">
                  {reportMsg}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-2xl lg:mx-auto">
                <button
                  type="button"
                  onClick={handleDownloadReport}
                  className="min-h-[46px] px-3 py-2.5 rounded-2xl bg-[var(--accent-gold)] text-[var(--ink-primary)] font-bold text-xs flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Descargar Reporte</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCustomersCsv}
                  className="min-h-[46px] px-3 py-2.5 rounded-2xl bg-[var(--status-ok)] text-[var(--bg-surface)] font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-105 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] cursor-pointer"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Exportar Clientes (.csv)</span>
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setInvDraft(inventory);
                      setShowInvModal(true);
                    }}
                    className="min-h-[46px] px-3 py-2.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] font-bold text-xs flex items-center justify-center gap-1.5 hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                    <span>Actualizar Inventario</span>
                  </button>
                )}
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
            className="modal-surface my-auto mx-auto w-full max-w-md max-h-[92dvh] overflow-y-auto phone-scroll bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-4 space-y-3 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif-display text-lg font-bold text-[var(--ink-primary)]">
                {editingDish ? 'Editar plato' : 'Agregar nuevo plato'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingDish(null);
                  setIsAddingDish(false);
                }}
                aria-label="Cerrar"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--ink-primary)] hover:bg-[var(--bg-inset)] active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--ink-primary)] mb-1">
                Nombre del plato
              </label>
              <input
                type="text"
                required
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                placeholder="Ej. Pique Macho"
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-sm font-semibold text-[var(--ink-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              />
            </div>

            {isAddingDish && (
              <div>
                <label className="block text-xs font-bold text-[var(--ink-primary)] mb-1">
                  Categoría
                </label>
                <select
                  value={dishCategory}
                  onChange={(e) =>
                    handleCategoryChangeInAddModal(
                      e.target.value as MenuCategory
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-sm font-semibold text-[var(--ink-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
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
                  <label className="block text-[11px] font-bold text-[var(--ink-primary)] mb-1 truncate">
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
                    className="w-full px-2.5 py-2 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--ink-primary)] tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--ink-primary)] mb-1">
                Descripción
              </label>
              <textarea
                rows={2}
                value={dishDesc}
                onChange={(e) => setDishDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--ink-primary)] resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[44px] rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-canvas)] font-bold text-xs hover:opacity-95 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
            >
              Guardar cambios
            </button>
          </form>
        </div>
      )}

      {/* Modal: Update Inventory */}
      {showInvModal && (
        <div className="fixed inset-0 z-50 bg-black/60 overflow-y-auto flex p-4">
          <div className="modal-surface my-auto mx-auto w-full max-w-md max-h-[92dvh] overflow-y-auto phone-scroll bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-serif-display text-lg font-bold text-[var(--ink-primary)]">
                Actualizar Inventario
              </h3>
              <button
                type="button"
                onClick={() => setShowInvModal(false)}
                aria-label="Cerrar"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--ink-primary)] hover:bg-[var(--bg-inset)] active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {invDraft.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 bg-[var(--bg-inset)] p-2.5 rounded-xl border border-[var(--border-subtle)]"
                >
                  <span className="font-bold text-xs text-[var(--ink-primary)]">
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
                    className="w-20 px-2.5 py-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-center tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
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
              className="w-full min-h-[44px] rounded-2xl bg-[var(--accent-gold)] text-[var(--ink-primary)] font-bold text-xs hover:opacity-90 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
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
