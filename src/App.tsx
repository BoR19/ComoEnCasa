import { useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { LogIn, ShoppingBag, X } from 'lucide-react';
import { DesktopSidebar } from './components/DesktopSidebar';
import { LiveCartPanel } from './components/LiveCartPanel';
import { BottomNav } from './components/ShellComponents';
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
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { useRestaurant } from './context/RestaurantContext';
import { getTakeawayCustomerName, isOrderSettled } from './utils/appHelpers';

export default function App() {
  const shouldReduceMotion = useReducedMotion();
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
    mozoPin,
    setSelectedDishId,
    selectedDish,
    favoriteIds,
    handleToggleFavorite,
    orderMode,
    setOrderMode,
    selectedTable,
    handleSelectTable,
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
    handleDismissWaiterCall,
    handleCollectOrderPayment,
    handleCreatePosOrder,
    handleFreeTable,
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
  } = useRestaurant();

  const showBottomNav =
    currentScreen !== 'welcome' && currentScreen !== 'admin-login';

  const showRightCartPanel = isStaffSession
    ? currentScreen !== 'admin-login'
    : currentScreen === 'menu' ||
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
      currentScreen === 'delivery-confirm';

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
      onDismissWaiterCall={handleDismissWaiterCall}
      onFreeTable={handleFreeTable}
      onDeleteOrder={handleDeleteOrder}
      onClose={onCloseDrawer}
    />
  );

  return (
    <div className="h-dvh w-full flex flex-col lg:flex-row overflow-hidden bg-[#FFF8E8]">
      {/* Desktop Far-Left Compact Icon Rail */}
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
      <main className="relative flex-1 min-w-0 h-full bg-[#FFF8E8] overflow-hidden flex flex-col">
        {/* Global Feedback Toast */}
        {toastMsg && (
          <div className="absolute top-14 sm:top-16 left-3 right-3 z-50 pointer-events-none flex justify-center">
            <div className="max-w-md px-3.5 py-2 rounded-xl bg-[#3B1F0E] text-[#FFF8E8] border border-[#D9A441] text-xs font-extrabold shadow-lg text-center">
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
                ease: [0.16, 1, 0.3, 1],
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
                  selectedTable={selectedTable}
                  allowOccupiedSelection={isStaffSession}
                  onSelectTable={handleSelectTable}
                  onConfirmTable={() => {
                    setOrderMode('dine-in');
                    if (isStaffSession) {
                      navigate('menu');
                    } else {
                      navigate('tables-qr');
                    }
                  }}
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
            <div className="my-auto mx-auto w-full max-w-sm max-h-[92dvh] overflow-y-auto phone-scroll rounded-3xl bg-[#FFF8E8] border-2 border-[#D9A441] p-5 shadow-2xl space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-serif-display text-lg font-bold text-[#3B1F0E]">
                    Conecta tu cuenta Google
                  </h2>
                  <p className="text-xs text-[#7A5A3A] mt-1 leading-relaxed">
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
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-[#3B1F0E] hover:bg-[#FDF2D6] cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {authError && (
                <p className="text-xs font-bold text-[#B84A27] bg-[#FDF2D6] border border-[#D9A441] rounded-xl px-3 py-2">
                  {authError}
                </p>
              )}

              <button
                type="button"
                disabled={authLoading}
                onClick={() => void handleGoogleSignIn()}
                className="w-full min-h-[48px] rounded-2xl bg-[#3B1F0E] text-[#FFF8E8] font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-[#4A2C1A] disabled:opacity-50 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-[#D9A441]" />
                <span>{authLoading ? 'Conectando...' : 'Continuar con Google'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick <XL Comanda trigger on lg (1024px–1279px) screens without a dedicated header Comanda button */}
        {showRightCartPanel &&
          currentScreen !== 'menu' &&
          currentScreen !== 'search' &&
          currentScreen !== 'favorites' &&
          currentScreen !== 'cart' &&
          currentScreen !== 'admin-panel' && (
            <button
              type="button"
              onClick={() => setShowCartDrawer(true)}
              aria-label="Abrir Comanda en Vivo"
              className="hidden lg:inline-flex xl:hidden fixed bottom-5 right-5 z-30 min-h-[42px] px-3.5 py-2 rounded-2xl bg-[#3B1F0E] text-[#FFF8E8] border border-[#D9A441] shadow-lg text-xs font-extrabold items-center gap-2 hover:bg-[#4A2C1A] active:scale-95 transition-transform cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-[#D9A441]" />
              <span>Comanda</span>
              {cartCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#B84A27] text-[#FFF8E8] text-[10px] font-extrabold tabular-nums leading-none">
                  {cartCount}
                </span>
              )}
            </button>
          )}

        {/* Shared Bottom Nav on interior client/panel screens */}
        {showBottomNav && (
          <BottomNav
            currentScreen={currentScreen}
            onNavigate={navigate}
            favoritesCount={favoriteIds.length}
            cartCount={cartCount}
          />
        )}
      </main>

      {/* Persistent Desktop Right Comanda Panel (XL+) */}
      {showRightCartPanel && (
        <aside
          aria-label="Comanda en vivo"
          className="hidden xl:flex w-[340px] 2xl:w-[370px] shrink-0 h-full border-l border-[#D9A441]/30 flex-col overflow-hidden"
        >
          {renderLiveCartPanel()}
        </aside>
      )}

      {/* Responsive Slide-Over Comanda Drawer (< XL: mobile, tablet & compact laptop) */}
      <AnimatePresence>
        {showCartDrawer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="xl:hidden fixed inset-0 z-50 bg-black/55 flex justify-end"
            onClick={() => setShowCartDrawer(false)}
          >
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              aria-label="Comanda deslizable"
              className="w-[min(100vw,24rem)] h-full max-h-dvh shadow-2xl border-l border-[#D9A441]/40 overflow-hidden"
            >
              {renderLiveCartPanel(() => setShowCartDrawer(false))}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
