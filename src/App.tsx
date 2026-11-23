import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { LogIn, ShoppingBag, X } from 'lucide-react';
import { DesktopSidebar } from './components/DesktopSidebar';
import { LiveCartPanel } from './components/LiveCartPanel';
import { BottomNav } from './components/ShellComponents';
import { hasSplashPlayedInSession, SplashScreen } from './components/SplashScreen';
import { AdminLoginScreen, AdminPanelScreen } from './components/screens/AdminScreens';
import { CartScreen } from './components/screens/CartScreen';
import { CustomizeDishScreen } from './components/screens/CustomizeDishScreen';
import {
  DeliveryConfirmScreen,
  DeliveryInfoScreen,
  DeliveryTrackingScreen,
} from './components/screens/DeliveryScreen';
import { DishDetailScreen } from './components/screens/DishDetailScreen';
import { MenuScreen } from './components/screens/MenuScreen';
import {
  PaymentConfirmScreen,
  PaymentMethodsScreen,
  PaymentQrScreen,
} from './components/screens/PaymentScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import {
  TableOrderScreen,
  TableQrScreen,
  TableSelectScreen,
} from './components/screens/TablesQrScreen';
import { TableQrWelcomeScreen } from './components/screens/TableQrWelcomeScreen';
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { useRestaurant } from './context/RestaurantContext';
import {
  formatBsDecimal,
  getOrderLinesCount,
  getTakeawayCustomerName,
  isOrderSettled,
} from './utils/appHelpers';

export default function App() {
  const shouldReduceMotion = useReducedMotion();
  const [showSplash, setShowSplash] = useState<boolean>(
    () => !hasSplashPlayedInSession()
  );
  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 767px)').matches
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = (e: MediaQueryListEvent) => setIsMobileViewport(e.matches);
    setIsMobileViewport(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const {
    currentScreen,
    navDirection,
    navigate,
    goBack,
    showGooglePrompt,
    setShowGooglePrompt,
    showCartDrawer,
    setShowCartDrawer,
    clearPendingAuthAction,
    toastMsg,
    showToast,
    firebaseUser,
    authLoading,
    authError,
    setAuthError,
    isAdminUser,
    isStaff,
    isAdminAuthenticated,
    isMozoAuthenticated,
    userRole,
    isStaffSession,
    setActiveRole,
    enterAdminPanel,
    handleGoogleSignIn,
    handleGoogleSignOut,
    handleAdminLogout,
    handleMozoLoginSuccess,
    handleMozoLogout,
    menuItems,
    tables,
    orders: kitchenOrders,
    inventory,
    authorizedStaff,
    customerContacts,
    mozoPin,
    setSelectedDishId,
    selectedDish,
    favoriteIds,
    handleToggleFavorite,
    orderMode,
    setOrderMode,
    selectedTable,
    handleSelectTable,
    tableCustomerPhone,
    cart,
    setCart,
    cartCount,
    cartTotal,
    takeawayInfo,
    setTakeawayInfo,
    deliveryInfo,
    setDeliveryInfo,
    activeTableOrder,
    activeDeliveryOrder,
    linkedTakeawayOrder,
    selectedTakeawayOrderId,
    linkedDeliveryOrder,
    selectedDeliveryOrderId,
    lastPaidOrder,
    paymentMethod,
    setPaymentMethod,
    paymentContext,
    setPaymentContext,
    lastPaidAmount,
    handleAddToCart,
    handleUpdateCartQuantity,
    handleChangeCartItemSize,
    handleRemoveCartItem,
    handleSaveCustomize,
    handleCartProceedOrder,
    handleDeliveryInfoContinue,
    handleCompletePayment,
    handleUpdateOrderStatus,
    handleCallWaiter,
    handleRequestBill,
    handleDismissWaiterCall,
    handleCollectOrderPayment,
    handleCreatePosOrder,
    handleFreeTable,
    handleCreateTable,
    handleDeleteTable,
    handleMoveTableOrder,
    handleSelectTakeawayOrder,
    handleSelectDeliveryOrder,
    loadOrderIntoLivePanel,
    handleUpdateOrderItemQty,
    handleDeleteOrder,
    handleRateOrder,
    handlePayTableOrder,
    handleToggleDishAvailability,
    handleSaveDishEdit,
    handleAddNewDish,
    handleUpdateInventory,
    handleUpdateMozoPin,
    handleAddAuthorizedStaff,
    handleToggleAuthorizedStaff,
    handleRemoveAuthorizedStaff,
    handleConfirmQrTableWelcome,
    exitQrTableMode,
  } = useRestaurant();

  const showBottomNav =
    currentScreen !== 'welcome' &&
    currentScreen !== 'table-qr-welcome' &&
    currentScreen !== 'admin-login';

  const showRightCartPanel =
    currentScreen !== 'welcome' &&
    currentScreen !== 'table-qr-welcome' &&
    currentScreen !== 'admin-login' &&
    (isStaffSession ||
      currentScreen === 'menu' ||
      currentScreen === 'search' ||
      currentScreen === 'favorites' ||
      currentScreen === 'dish-detail' ||
      currentScreen === 'customize' ||
      currentScreen === 'cart' ||
      currentScreen === 'tables-select' ||
      currentScreen === 'tables-qr' ||
      currentScreen === 'tables-order' ||
      currentScreen === 'delivery-info' ||
      currentScreen === 'delivery-tracking' ||
      currentScreen === 'delivery-confirm');

  const paymentTotal =
    paymentContext === 'table'
      ? activeTableOrder?.total ?? 0
      : paymentContext === 'takeaway'
      ? linkedTakeawayOrder?.total ?? 0
      : cartTotal;

  const paymentSummaryLabel =
    paymentContext === 'table'
      ? `Resumen Mesa ${selectedTable}`
      : paymentContext === 'takeaway'
      ? `Resumen Para Llevar · ${
          linkedTakeawayOrder
            ? getTakeawayCustomerName(linkedTakeawayOrder)
            : 'Retiro en local'
        }`
      : 'Resumen Pedido Delivery';

  const paymentThanks =
    lastPaidOrder?.mode === 'delivery'
      ? 'Gracias por tu pedido Delivery'
      : lastPaidOrder?.mode === 'takeaway'
      ? `Gracias, ${getTakeawayCustomerName(lastPaidOrder)}`
      : `Gracias, Mesa ${lastPaidOrder?.tableNumber ?? selectedTable}`;

  const activeOrdersCount = useMemo(
    () => kitchenOrders.filter((o) => !isOrderSettled(o)).length,
    [kitchenOrders]
  );

  const liveComandaSummary = useMemo(() => {
    const activeOrder =
      orderMode === 'dine-in'
        ? activeTableOrder
        : orderMode === 'takeaway'
        ? linkedTakeawayOrder
        : linkedDeliveryOrder;

    const orderCount = activeOrder ? getOrderLinesCount(activeOrder.items) : 0;
    const orderTotal = activeOrder ? activeOrder.total : 0;
    const totalItems = cartCount + orderCount;
    const totalAmount = cartTotal + orderTotal;

    const label = activeOrder
      ? `Comanda ${activeOrder.code}`
      : orderMode === 'dine-in'
      ? `Mesa ${selectedTable}`
      : orderMode === 'takeaway'
      ? 'Para Llevar'
      : 'Delivery';

    return {
      label,
      totalItems,
      totalAmount,
      hasActive: totalItems > 0 || Boolean(activeOrder),
    };
  }, [
    orderMode,
    activeTableOrder,
    linkedTakeawayOrder,
    linkedDeliveryOrder,
    cartCount,
    cartTotal,
    selectedTable,
  ]);

  const screenHasBottomBar =
    currentScreen === 'dish-detail' ||
    currentScreen === 'customize' ||
    currentScreen === 'tables-select' ||
    currentScreen === 'tables-qr' ||
    currentScreen === 'tables-order' ||
    currentScreen === 'delivery-info' ||
    currentScreen === 'delivery-tracking';

  const goMozoComandas = () => {
    setActiveRole('mozo');
    navigate('cart');
  };

  const renderLiveCartPanel = (onCloseDrawer?: () => void) => (
    <LiveCartPanel
      userRole={userRole}
      cart={cart}
      menuItems={menuItems}
      kitchenOrders={kitchenOrders}
      orderMode={orderMode}
      selectedTable={selectedTable}
      tables={tables}
      takeawayInfo={takeawayInfo}
      deliveryInfo={deliveryInfo}
      activeTableOrder={activeTableOrder}
      linkedTakeawayOrder={linkedTakeawayOrder}
      linkedDeliveryOrder={linkedDeliveryOrder}
      tableCustomerPhone={tableCustomerPhone}
      onChangeOrderMode={(m) => setOrderMode(m)}
      onChangeTakeawayInfo={setTakeawayInfo}
      onSelectTable={handleSelectTable}
      onSelectTakeawayOrder={handleSelectTakeawayOrder}
      onSelectDeliveryOrder={handleSelectDeliveryOrder}
      onOpenTableQr={() => navigate('tables-qr')}
      onOpenTableOrder={() => navigate('tables-order')}
      onOpenDeliveryInfo={() => navigate('delivery-info')}
      onGoMenu={() => navigate('menu')}
      onPayAtTable={() => {
        setOrderMode('dine-in');
        setPaymentContext('table');
        navigate('payment-methods');
      }}
      onPayTakeawayOrder={() => {
        setOrderMode('takeaway');
        setPaymentContext('takeaway');
        navigate('payment-methods');
      }}
      onUpdateQuantity={handleUpdateCartQuantity}
      onChangeItemSize={handleChangeCartItemSize}
      onRemoveItem={handleRemoveCartItem}
      onClearCart={() => setCart([])}
      onProceedOrder={handleCartProceedOrder}
      onUpdateOrderStatus={handleUpdateOrderStatus}
      onUpdateOrderItemQty={handleUpdateOrderItemQty}
      onCollectOrderPayment={handleCollectOrderPayment}
      onCallWaiter={handleCallWaiter}
      onRequestBill={handleRequestBill}
      onDismissWaiterCall={handleDismissWaiterCall}
      onFreeTable={handleFreeTable}
      onDeleteOrder={handleDeleteOrder}
      onClose={onCloseDrawer}
    />
  );

  return (
    <div className="h-dvh w-full flex flex-col md:flex-row overflow-hidden bg-[var(--bg-canvas)]">
      {/* Left Compact Icon Rail (Tablet md+ & Desktop) */}
      <DesktopSidebar
        currentScreen={currentScreen}
        onNavigate={navigate}
        orderMode={orderMode}
        selectedTable={selectedTable}
        cartCount={cartCount}
        activeOrdersCount={activeOrdersCount}
        favoritesCount={favoriteIds.length}
        firebaseUser={firebaseUser}
        userRole={userRole}
        isAdminAuthenticated={isAdminAuthenticated}
        isMozoAuthenticated={isMozoAuthenticated}
        onGoMozoComandas={goMozoComandas}
      />

      {/* Main Responsive App Frame */}
      <main
        className={`relative flex-1 min-w-0 h-full bg-[var(--bg-canvas)] overflow-hidden flex flex-col ${
          showBottomNav
            ? 'pb-[calc(4.125rem+env(safe-area-inset-bottom))] md:pb-0'
            : ''
        }`}
      >
        {/* Global Feedback Toast */}
        {toastMsg && (
          <div className="absolute top-14 sm:top-16 left-3 right-3 z-50 pointer-events-none flex justify-center">
            <div className="max-w-md px-3.5 py-2 rounded-xl bg-[var(--ink-primary)] text-[var(--bg-canvas)] border border-[var(--accent-gold)] text-xs font-bold shadow-lg text-center">
              {toastMsg}
            </div>
          </div>
        )}

        {/* Active Screen with Smooth Lateral Slide Transitions */}
        <div className="relative flex-1 min-h-0 overflow-hidden">
          <AnimatePresence initial={false} custom={navDirection} mode="sync">
            <motion.div
              key={currentScreen}
              custom={navDirection}
              variants={{
                enter: (dir: number) => ({
                  x: shouldReduceMotion ? '0%' : dir >= 0 ? '26%' : '-26%',
                  opacity: shouldReduceMotion ? 1 : 0,
                }),
                center: {
                  x: '0%',
                  opacity: 1,
                },
                exit: (dir: number) => ({
                  x: shouldReduceMotion ? '0%' : dir >= 0 ? '-20%' : '26%',
                  opacity: shouldReduceMotion ? 1 : 0,
                }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: shouldReduceMotion ? 0 : 0.2,
                ease: [0.23, 1, 0.32, 1],
              }}
              className="absolute inset-0 flex flex-col min-h-0"
            >
              {currentScreen === 'welcome' && (
                <WelcomeScreen
                  mozoPin={mozoPin}
                  isMozoLoggedIn={isMozoAuthenticated}
                  firebaseUser={firebaseUser}
                  isStaff={isStaff}
                  takeawayInfo={takeawayInfo}
                  onGoogleSignIn={() => void handleGoogleSignIn()}
                  onMozoLoginSuccess={handleMozoLoginSuccess}
                  onMozoLogout={handleMozoLogout}
                  onGoMozoComandas={goMozoComandas}
                  onSelectDineIn={() => {
                    setOrderMode('dine-in');
                    navigate('tables-select');
                  }}
                  onSelectTakeaway={(info) => {
                    setOrderMode('takeaway');
                    handleSelectTakeawayOrder(null);
                    setTakeawayInfo(info);
                    navigate('menu');
                    showToast(
                      info.customerName
                        ? `Modo Para Llevar · ${info.customerName}`
                        : 'Modo Para Llevar · Retiro en local'
                    );
                  }}
                  onSelectDelivery={() => {
                    setOrderMode('delivery');
                    navigate('menu');
                  }}
                  onGoAdminLogin={() =>
                    navigate(isAdminAuthenticated ? 'admin-panel' : 'admin-login')
                  }
                />
              )}

              {currentScreen === 'table-qr-welcome' && (
                <TableQrWelcomeScreen
                  tableNumber={selectedTable}
                  table={tables.find((t) => t.number === selectedTable)}
                  initialPhone={tableCustomerPhone}
                  onConfirmWithPhone={(phone) =>
                    handleConfirmQrTableWelcome(phone)
                  }
                  onSkipToMenu={() => handleConfirmQrTableWelcome('')}
                  onGoHome={exitQrTableMode}
                />
              )}

              {(currentScreen === 'menu' ||
                currentScreen === 'search' ||
                currentScreen === 'favorites') && (
                <MenuScreen
                  mode={currentScreen}
                  menuItems={menuItems}
                  favoriteIds={favoriteIds}
                  cart={cart}
                  cartCount={cartCount}
                  orderMode={orderMode}
                  selectedTable={selectedTable}
                  takeawayCustomerName={takeawayInfo.customerName}
                  isLiveSynced={Boolean(firebaseUser)}
                  onBack={goBack}
                  onSelectItem={(item) => {
                    setSelectedDishId(item.id);
                    navigate('dish-detail');
                  }}
                  onAddToCart={(item, size) => handleAddToCart(item, size, [])}
                  onUpdateCartQuantity={handleUpdateCartQuantity}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenCustomize={() => navigate('customize')}
                  onOpenCart={() => setShowCartDrawer(true)}
                  onOpenTables={() => navigate('tables-select')}
                  onOpenTableQr={() => navigate('tables-qr')}
                  onNavigateMode={(m) => navigate(m)}
                />
              )}

              {currentScreen === 'dish-detail' && selectedDish && (
                <DishDetailScreen
                  item={selectedDish}
                  isFavorite={favoriteIds.includes(selectedDish.id)}
                  onBack={goBack}
                  onToggleFavorite={handleToggleFavorite}
                  onAddToCart={(item, size, extras) => {
                    handleAddToCart(item, size, extras);
                    navigate('cart');
                  }}
                  onOpenCustomize={() => navigate('customize')}
                />
              )}

              {currentScreen === 'customize' && (
                <CustomizeDishScreen
                  menuItems={menuItems}
                  onBack={goBack}
                  onSaveAndContinue={handleSaveCustomize}
                />
              )}

              {currentScreen === 'cart' && (
                <CartScreen
                  userRole={userRole}
                  firebaseUser={firebaseUser}
                  isStaff={isStaff}
                  cart={cart}
                  cartCount={cartCount}
                  menuItems={menuItems}
                  kitchenOrders={kitchenOrders}
                  tables={tables}
                  orderMode={orderMode}
                  selectedTable={selectedTable}
                  takeawayInfo={takeawayInfo}
                  linkedTakeawayOrder={linkedTakeawayOrder}
                  linkedTakeawayOrderId={selectedTakeawayOrderId}
                  linkedDeliveryOrderId={selectedDeliveryOrderId}
                  onBack={goBack}
                  onChangeOrderMode={(m) => setOrderMode(m)}
                  onChangeTakeawayInfo={setTakeawayInfo}
                  onEditTable={() => navigate('tables-select')}
                  onUpdateQuantity={handleUpdateCartQuantity}
                  onChangeItemSize={handleChangeCartItemSize}
                  onRemoveItem={handleRemoveCartItem}
                  onClearCart={() => setCart([])}
                  onProceedOrder={handleCartProceedOrder}
                  onGoMenu={() => navigate('menu')}
                  onOpenComandaDrawer={() => setShowCartDrawer(true)}
                  onLoadOrderToLivePanel={loadOrderIntoLivePanel}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onCollectOrderPayment={handleCollectOrderPayment}
                  onDismissWaiterCall={handleDismissWaiterCall}
                  onFreeTable={handleFreeTable}
                  onCreatePosOrder={handleCreatePosOrder}
                  onCallWaiter={handleCallWaiter}
                  onPayTableOrder={handlePayTableOrder}
                  onGoogleSignIn={() => void handleGoogleSignIn()}
                  onMozoLogout={handleMozoLogout}
                />
              )}

              {currentScreen === 'tables-select' && (
                <TableSelectScreen
                  tables={tables}
                  orders={kitchenOrders}
                  selectedTable={selectedTable}
                  userRole={userRole}
                  allowOccupiedSelection={isStaffSession}
                  onSelectTable={handleSelectTable}
                  onConfirmTable={(tableNum) => {
                    if (typeof tableNum === 'number') {
                      handleSelectTable(tableNum);
                    }
                    setOrderMode('dine-in');
                    if (isStaffSession) {
                      navigate('menu');
                    } else {
                      navigate('tables-qr');
                    }
                  }}
                  onCreateTable={handleCreateTable}
                  onDeleteTable={handleDeleteTable}
                  onMoveTableOrder={handleMoveTableOrder}
                  onBack={goBack}
                />
              )}

              {currentScreen === 'tables-qr' && (
                <TableQrScreen
                  selectedTable={selectedTable}
                  onScanQrToMenu={() => {
                    setOrderMode('dine-in');
                    navigate('menu');
                  }}
                  onViewTableOrder={() => navigate('tables-order')}
                  onBack={goBack}
                />
              )}

              {currentScreen === 'tables-order' && (
                <TableOrderScreen
                  selectedTable={selectedTable}
                  order={activeTableOrder}
                  onBack={goBack}
                  onGoMenu={() => navigate('menu')}
                  onCallWaiter={handleCallWaiter}
                  onRequestBill={handleRequestBill}
                  onPayAtTable={() => {
                    setOrderMode('dine-in');
                    setPaymentContext('table');
                    navigate('payment-methods');
                  }}
                />
              )}

              {currentScreen === 'delivery-info' && (
                <DeliveryInfoScreen
                  deliveryInfo={deliveryInfo}
                  totalAmount={cartTotal}
                  onChangeInfo={setDeliveryInfo}
                  onContinue={handleDeliveryInfoContinue}
                  onBack={goBack}
                />
              )}

              {currentScreen === 'delivery-tracking' && (
                <DeliveryTrackingScreen
                  order={activeDeliveryOrder}
                  onUpdateOrderStatus={(status) => {
                    if (activeDeliveryOrder) {
                      handleUpdateOrderStatus(activeDeliveryOrder.id, status);
                    }
                  }}
                  onGoConfirm={() => navigate('delivery-confirm')}
                  onGoMenu={() => navigate('menu')}
                  onBack={goBack}
                />
              )}

              {currentScreen === 'delivery-confirm' && (
                <DeliveryConfirmScreen
                  order={activeDeliveryOrder}
                  onRateOrder={handleRateOrder}
                  onBackToMenu={() => navigate('menu')}
                  onBack={goBack}
                />
              )}

              {currentScreen === 'payment-methods' && (
                <PaymentMethodsScreen
                  summaryLabel={paymentSummaryLabel}
                  totalAmount={paymentTotal}
                  selectedMethod={paymentMethod}
                  onSelectMethod={setPaymentMethod}
                  onContinue={() => {
                    if (paymentTotal <= 0) {
                      showToast('No hay monto pendiente por pagar');
                      return;
                    }
                    if (paymentMethod === 'QR') {
                      navigate('payment-qr');
                    } else {
                      handleCompletePayment();
                    }
                  }}
                  onBack={goBack}
                />
              )}

              {currentScreen === 'payment-qr' && (
                <PaymentQrScreen
                  totalAmount={paymentTotal}
                  onPaid={handleCompletePayment}
                  onBack={goBack}
                />
              )}

              {currentScreen === 'payment-confirm' && (
                <PaymentConfirmScreen
                  totalAmount={lastPaidAmount}
                  customerThanks={paymentThanks}
                  paymentMethod={lastPaidOrder?.paymentMethod || paymentMethod}
                  paidOrder={lastPaidOrder}
                  onTrackDelivery={
                    lastPaidOrder?.mode === 'delivery'
                      ? () => navigate('delivery-tracking')
                      : undefined
                  }
                  onBackToMenu={() => navigate('menu')}
                  onBack={goBack}
                />
              )}

              {currentScreen === 'profile' && (
                <ProfileScreen
                  orderMode={orderMode}
                  selectedTable={selectedTable}
                  activeTableOrder={activeTableOrder}
                  activeDeliveryOrder={activeDeliveryOrder}
                  firebaseUser={firebaseUser}
                  authLoading={authLoading}
                  onGoogleSignIn={() => void handleGoogleSignIn()}
                  onGoogleSignOut={() => void handleGoogleSignOut()}
                  onBack={goBack}
                  onGoTables={() => navigate('tables-select')}
                  onGoTableOrder={() => navigate('tables-order')}
                  onGoDeliveryTracking={() => navigate('delivery-tracking')}
                  onGoAdminLogin={() =>
                    navigate(isAdminAuthenticated ? 'admin-panel' : 'admin-login')
                  }
                />
              )}

              {currentScreen === 'admin-login' && (
                <AdminLoginScreen
                  firebaseUser={firebaseUser}
                  isAdmin={isAdminUser}
                  authLoading={authLoading}
                  authError={authError}
                  onGoogleSignIn={handleGoogleSignIn}
                  onGoogleSignOut={handleGoogleSignOut}
                  onEnterAdminPanel={enterAdminPanel}
                  onBack={goBack}
                />
              )}

              {currentScreen === 'admin-panel' && isAdminAuthenticated && (
                <AdminPanelScreen
                  isAdmin={isAdminAuthenticated && isAdminUser}
                  menuItems={menuItems}
                  kitchenOrders={kitchenOrders}
                  tables={tables}
                  inventory={inventory}
                  authorizedStaff={authorizedStaff}
                  customerContacts={customerContacts}
                  adminEmail={firebaseUser?.email}
                  cartCount={cartCount}
                  orderMode={orderMode}
                  selectedTable={selectedTable}
                  linkedTakeawayOrderId={selectedTakeawayOrderId}
                  linkedDeliveryOrderId={selectedDeliveryOrderId}
                  onOpenComanda={() => setShowCartDrawer(true)}
                  onLoadOrderToLivePanel={loadOrderIntoLivePanel}
                  onToggleDishAvailability={handleToggleDishAvailability}
                  onSaveDishEdit={handleSaveDishEdit}
                  onAddNewDish={handleAddNewDish}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onCollectOrderPayment={handleCollectOrderPayment}
                  onCreatePosOrder={handleCreatePosOrder}
                  onDismissWaiterCall={handleDismissWaiterCall}
                  onFreeTable={handleFreeTable}
                  onUpdateInventory={handleUpdateInventory}
                  mozoPin={mozoPin}
                  onUpdateMozoPin={handleUpdateMozoPin}
                  onAddAuthorizedStaff={handleAddAuthorizedStaff}
                  onToggleAuthorizedStaff={handleToggleAuthorizedStaff}
                  onRemoveAuthorizedStaff={handleRemoveAuthorizedStaff}
                  onGoTables={() => navigate('tables-select')}
                  onLogout={() => void handleAdminLogout()}
                  onBack={goBack}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Customer Google Sign-In Modal for live order sync */}
        {showGooglePrompt && (
          <div className="fixed inset-0 z-50 bg-black/65 overflow-y-auto flex p-4">
            <div className="modal-surface my-auto mx-auto w-full max-w-sm max-h-[92dvh] overflow-y-auto phone-scroll rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 shadow-2xl space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-serif-display text-lg font-bold text-[var(--ink-primary)]">
                    Conecta tu cuenta Google
                  </h2>
                  <p className="text-xs text-[var(--ink-muted)] mt-1 leading-relaxed">
                    Para enviar tu pedido a Cocina y sincronizarlo en tiempo real con tu mesa o delivery, inicia sesión con Google en un toque.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    clearPendingAuthAction();
                    setAuthError('');
                    setShowGooglePrompt(false);
                  }}
                  aria-label="Cerrar"
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--ink-primary)] hover:bg-[var(--bg-inset)] active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {authError && (
                <p className="text-xs font-bold text-[var(--accent-primary)] bg-[var(--bg-inset)] border border-[var(--border-subtle)] rounded-xl px-3 py-2">
                  {authError}
                </p>
              )}

              <button
                type="button"
                disabled={authLoading}
                onClick={() => void handleGoogleSignIn()}
                className="w-full min-h-[48px] rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-canvas)] font-bold text-sm flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-[var(--accent-gold)]" />
                <span>{authLoading ? 'Conectando...' : 'Continuar con Google'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Floating Live Comanda Button (< XL: hidden on Welcome and only shown when there are active items/order) */}
        {showRightCartPanel && liveComandaSummary.hasActive && (
          <button
            type="button"
            onClick={() => setShowCartDrawer(true)}
            aria-label={`Abrir ${liveComandaSummary.label} — ${formatBsDecimal(liveComandaSummary.totalAmount)}`}
            className={`xl:hidden fixed right-4 md:right-5 z-35 min-h-[46px] px-3.5 py-2 rounded-2xl bg-[var(--ops-surface)] text-[var(--bg-canvas)] border border-[var(--accent-gold)]/70 shadow-[0_8px_24px_rgba(0,0,0,0.28)] text-xs font-bold inline-flex items-center gap-2.5 hover:border-[var(--ops-accent)] active:scale-[0.97] transition-[transform,border-color,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] ${
              screenHasBottomBar
                ? showBottomNav
                  ? 'bottom-[calc(9.1rem+env(safe-area-inset-bottom))] md:bottom-20'
                  : 'bottom-20'
                : showBottomNav
                ? 'bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-5'
                : 'bottom-5'
            }`}
          >
            <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-xl bg-[var(--ops-accent)] text-[var(--bg-surface)] shrink-0">
              <ShoppingBag className="w-3.5 h-3.5" />
              {liveComandaSummary.totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[var(--accent-gold)] text-[var(--ink-primary)] text-[9px] font-bold flex items-center justify-center tabular-nums leading-none border border-[var(--ops-surface)]">
                  {liveComandaSummary.totalItems}
                </span>
              )}
            </span>
            <span className="flex flex-col items-start text-left leading-tight">
              <span className="text-[11px] font-semibold text-white/85 whitespace-nowrap">
                {liveComandaSummary.label}
              </span>
              <span className="text-xs font-bold text-[var(--accent-gold)] tabular-nums whitespace-nowrap">
                {formatBsDecimal(liveComandaSummary.totalAmount)}
              </span>
            </span>
          </button>
        )}

        {/* Fixed Mobile Bottom Navigation (< 768px) */}
        {showBottomNav && (
          <BottomNav
            currentScreen={currentScreen}
            onNavigate={navigate}
            userRole={userRole}
            orderMode={orderMode}
            selectedTable={selectedTable}
            isAdminAuthenticated={isAdminAuthenticated}
            activeOrdersCount={activeOrdersCount}
            cartCount={cartCount}
          />
        )}
      </main>

      {/* Persistent Desktop Right Comanda Panel (XL+) */}
      {showRightCartPanel && (
        <aside
          aria-label="Comanda en vivo"
          className="hidden xl:flex w-[340px] 2xl:w-[370px] shrink-0 h-full border-l border-[var(--border-subtle)] flex-col overflow-hidden"
        >
          {renderLiveCartPanel()}
        </aside>
      )}

      {/* Responsive Slide-Over Comanda Sheet (Mobile < 768px) / Collapsible Drawer (Tablet & < XL) */}
      <AnimatePresence>
        {showCartDrawer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.18,
              ease: [0.23, 1, 0.32, 1],
            }}
            className="xl:hidden fixed inset-0 z-50 bg-black/55 flex items-end md:items-stretch md:justify-end"
            onClick={() => setShowCartDrawer(false)}
          >
            <motion.aside
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : isMobileViewport
                  ? { y: '100%' }
                  : { x: '100%' }
              }
              animate={{ x: 0, y: 0, opacity: 1 }}
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : isMobileViewport
                  ? { y: '100%' }
                  : { x: '100%' }
              }
              transition={{
                duration: shouldReduceMotion ? 0 : 0.28,
                ease: [0.32, 0.72, 0, 1],
              }}
              onClick={(e) => e.stopPropagation()}
              aria-label="Comanda en vivo deslizable"
              className="w-full h-[88dvh] max-h-[88dvh] rounded-t-3xl border-t md:rounded-none md:border-t-0 md:max-w-sm md:h-full md:max-h-dvh shadow-2xl border-[var(--border-subtle)] overflow-hidden bg-[var(--bg-surface)]"
            >
              {renderLiveCartPanel(() => setShowCartDrawer(false))}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
    </div>
  );
}
