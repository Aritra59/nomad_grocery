import React, { useState, useMemo, useEffect } from "react";
import { InventoryProvider } from "./context/InventoryContext";
import { CatalogProvider } from "./context/CatalogContext";
import TopBar from "./components/layout/TopBar";
import Dashboard from "./modules/dashboard/Dashboard";
import InventoryList from "./modules/inventory/InventoryList";
import AddProduct from "./modules/inventory/AddProduct";
import EditProduct from "./modules/inventory/EditProduct";
import SellerCatalog from "./modules/catalog/SellerCatalog";
import BuyerCatalog from "./modules/catalog/BuyerCatalog";
import OrdersList from "./modules/orders/OrdersList";
import CreateOrder from "./modules/orders/CreateOrder";
import OrderDetail from "./modules/orders/OrderDetail";
import CustomersList from "./modules/customers/CustomersList";
import CustomerDetail from "./modules/customers/CustomerDetail";
import CustomerHistorySharedView from "./modules/customers/CustomerHistorySharedView";
import AddCustomer from "./modules/customers/AddCustomer";
import ProcurementList from "./modules/procurement/ProcurementList";
import { MOCK_SHEET_DATA } from "./utils/mockData";
import { syncSheetByCode, getStoredSheetData } from "./hooks/useSheetSync";
import { syncMasterCache } from "./hooks/useMasterCache";
import { useCustomersData } from "./hooks/useCustomersData";
import { useOrderData } from "./hooks/useOrderData";
import { AppModeProvider } from "./context/AppModeContext";

const SHEET_LOGIN_KEY = "nomad_live_sheet_code_v1";

const VIEWS = {
  DASHBOARD: "dashboard",
  INVENTORY_LIST: "inventoryList",
  INVENTORY_ADD: "inventoryAdd",
  INVENTORY_EDIT: "inventoryEdit",
  SELLER_CATALOG: "sellerCatalog",
  BUYER_CATALOG: "buyerCatalog",
  ORDERS_LIST: "ordersList",
  ORDERS_CREATE: "ordersCreate",
  ORDERS_DETAIL: "ordersDetail",
  CUSTOMERS_LIST: "customersList",
  CUSTOMERS_DETAIL: "customersDetail",
  CUSTOMERS_ADD: "customersAdd",
  PROCUREMENT: "procurement",
  CUSTOMER_HISTORY_SHARED: "customerHistoryShared",
  ORDERS_SELLER_CATALOG: "ordersSellerCatalog",
};

function SharedHistoryView({ customerId }) {
  const { customers } = useCustomersData();
  const { orders } = useOrderData();
  return <CustomerHistorySharedView customers={customers} orders={orders} sharedCustomerId={customerId} />;
}

function App() {
  const [mode, setMode] = useState("explore");
  const [sheetData, setSheetData] = useState(MOCK_SHEET_DATA);
  const [currentView, setCurrentView] = useState(VIEWS.DASHBOARD);
  const [viewStack, setViewStack] = useState([VIEWS.DASHBOARD]);
  const [editingProductId, setEditingProductId] = useState(null);
  const [viewingOrderId, setViewingOrderId] = useState(null);
  const [viewingCustomerId, setViewingCustomerId] = useState(null);
  const [productsAdded, setProductsAdded] = useState(0);
  const [isBuyerMode, setIsBuyerMode] = useState(false);
  const [isSharedHistory, setIsSharedHistory] = useState(false);
  const [sharedCustomerId, setSharedCustomerId] = useState(null);

  // On app load — check URL params + restore login + silent sync
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const catalog = params.get("catalog");
    const customerId = params.get("customerId");
    const share = params.get("share");
    const payload = params.get("payload");
    const shareShop = params.get("shop");
    const shareOwner = params.get("owner");
    const shareShopId = params.get("shopId");

    // Shared customer history link
    if (share === "customer" && (customerId || payload)) {
      setIsSharedHistory(true);
      setSharedCustomerId(customerId);
      return;
    }

    // Buyer catalog link
    if (share === "catalog" && (catalog || payload)) {
      // Shared catalog should run in live scope so placed orders land
      // in the same shop-scoped local storage as seller orders.
      // Use minimal sheetData from URL only — no demo packs in live mode.
      setMode("live");
      setSheetData({
        shopName: shareShop || "Shop",
        ownerName: shareOwner || "",
        mobile: catalog || "",
        shopId: shareShopId || catalog || "",
        packs: [],
      });
      setIsBuyerMode(true);
      return;
    }

    // Backward compatibility — old shared links
    if (customerId) {
      setIsSharedHistory(true);
      setSharedCustomerId(customerId);
      return;
    }

    if (catalog) {
      setIsBuyerMode(true);
      return;
    }

    // Restore login if previously logged in
    const savedCode = localStorage.getItem(SHEET_LOGIN_KEY);
    if (savedCode) {
      // Restore from stored sheet data first (instant)
      const stored = getStoredSheetData();
      if (stored) {
        setSheetData(stored);
        setMode("live");
      }
      // Then silently re-sync in background
      syncSheetByCode(savedCode)
        .then((data) => {
          setSheetData(data);
          setMode("live");
        })
        .catch(() => {});
      // Also silently sync master cache
      syncMasterCache().catch(() => {});
    }
  }, []);

  const activeSlots = useMemo(() => {
    return sheetData.packs?.reduce((sum, p) => sum + (p.slots || 0), 0) || 0;
  }, [sheetData]);

  const remainingSlots = activeSlots - productsAdded;
  const isOverLimit = remainingSlots < 0;

  const headerTitle = useMemo(() => {
    switch (currentView) {
      case VIEWS.DASHBOARD:
        return mode === "explore" ? "Explore Demo Mode" : "Dashboard";
      case VIEWS.INVENTORY_LIST:
      case VIEWS.INVENTORY_ADD:
      case VIEWS.INVENTORY_EDIT:
      case VIEWS.SELLER_CATALOG:
        return "Inventory";
      case VIEWS.BUYER_CATALOG:
        return "Shop Catalog";
      case VIEWS.ORDERS_LIST:
      case VIEWS.ORDERS_CREATE:
      case VIEWS.ORDERS_DETAIL:
        return "Orders";
      case VIEWS.CUSTOMERS_LIST:
      case VIEWS.CUSTOMERS_DETAIL:
      case VIEWS.CUSTOMERS_ADD:
        return "Customers";
      case VIEWS.PROCUREMENT:
        return "Procurement";
      default:
        return "Nomad GroceryApp";
    }
  }, [currentView, mode]);

  const pushView = (view) => {
    setCurrentView(view);
    setViewStack((prev) => [...prev, view]);
  };

  const goBack = () => {
    setViewStack((prev) => {
      if (prev.length <= 1) {
        setCurrentView(VIEWS.DASHBOARD);
        return [VIEWS.DASHBOARD];
      }
      const newStack = prev.slice(0, -1);
      setCurrentView(newStack[newStack.length - 1] || VIEWS.DASHBOARD);
      return newStack;
    });
  };

  const handleDashboardNavigate = (target) => {
    if (target === "inventory") pushView(VIEWS.INVENTORY_LIST);
    else if (target === "orders") pushView(VIEWS.ORDERS_LIST);
    else if (target === "customers") pushView(VIEWS.CUSTOMERS_LIST);
    else if (target === "procurement") pushView(VIEWS.PROCUREMENT);
  };

  const handleLogin = async (code, data) => {
    const resolvedData = data || getStoredSheetData();
    if (!resolvedData) return;
    setSheetData(resolvedData);
    setMode("live");
    localStorage.setItem(SHEET_LOGIN_KEY, code);
    // Always return to the first landing page after login
    setCurrentView(VIEWS.DASHBOARD);
    setViewStack([VIEWS.DASHBOARD]);
    syncMasterCache().catch(() => {});
  };

  const handleSlotsActivated = async (code) => {
    const sheetCode = code || localStorage.getItem(SHEET_LOGIN_KEY);
    if (!sheetCode) return;
    try {
      const data = await syncSheetByCode(sheetCode);
      setSheetData(data);
      setMode("live");
      syncMasterCache().catch(() => {});
    } catch {
      // If syncing fails, the UI will simply keep showing the previous cached sheetData.
    }
  };

  const handleLogout = () => {
    setMode("explore");
    setSheetData(MOCK_SHEET_DATA);
    setCurrentView(VIEWS.DASHBOARD);
    setViewStack([VIEWS.DASHBOARD]);
    localStorage.removeItem(SHEET_LOGIN_KEY);
  };
  // Shared customer history — standalone read-only page
  if (isSharedHistory) {
    return (
      <AppModeProvider mode={mode} sheetData={sheetData}>
        <InventoryProvider>
          <CatalogProvider>
            <SharedHistoryView customerId={sharedCustomerId} />
          </CatalogProvider>
        </InventoryProvider>
      </AppModeProvider>
    );
  }

  // Buyer catalog — full screen, no seller shell
  if (isBuyerMode) {
    return (
      <AppModeProvider mode={mode} sheetData={sheetData}>
        <InventoryProvider>
          <CatalogProvider>
            <BuyerCatalog sheetData={sheetData} previewMode={false} onClose={() => setIsBuyerMode(false)} />
          </CatalogProvider>
        </InventoryProvider>
      </AppModeProvider>
    );
  }

  return (
    <AppModeProvider mode={mode} sheetData={sheetData}>
      <InventoryProvider>
        <CatalogProvider>
          <div className="app-shell">
            <div className="app-inner">
              <TopBar mode={mode} headerTitle={headerTitle} sheetData={sheetData} onLogin={handleLogin} onLogout={handleLogout} />

            <div className="status-strip">
              <div className="status-item">
                <span className="status-label">Active Slots</span>
                <span className="status-value">{mode === "explore" ? 100 : activeSlots}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Products</span>
                <span className="status-value">{productsAdded}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Remaining</span>
                <span className={"status-value" + (isOverLimit ? " over-limit" : "")}>{mode === "explore" ? 100 - productsAdded : remainingSlots}</span>
              </div>
            </div>

            {isOverLimit && (
              <div className="over-limit-banner">
                You have {productsAdded} products but only {activeSlots} active slots. Delete products or buy more slots.
              </div>
            )}

            <main className="main-content">
              {currentView === VIEWS.DASHBOARD && (
                <Dashboard
                  mode={mode}
                  sheetData={sheetData}
                  onNavigate={handleDashboardNavigate}
                  onLogin={handleLogin}
                  onLogout={handleLogout}
                  onSlotsActivated={handleSlotsActivated}
                />
              )}

              {currentView === VIEWS.INVENTORY_LIST && (
                <InventoryList
                  mode={mode}
                  onBack={goBack}
                  onAddProduct={() => pushView(VIEWS.INVENTORY_ADD)}
                  onEditProduct={(id) => {
                    setEditingProductId(id);
                    pushView(VIEWS.INVENTORY_EDIT);
                  }}
                  onViewCatalog={() => pushView(VIEWS.SELLER_CATALOG)}
                  isOverLimit={isOverLimit}
                  setProductsAdded={setProductsAdded}
                />
              )}

              {currentView === VIEWS.INVENTORY_ADD && <AddProduct mode={mode} onBack={goBack} isOverLimit={isOverLimit} />}

              {currentView === VIEWS.INVENTORY_EDIT && <EditProduct mode={mode} onBack={goBack} productId={editingProductId} />}

              {currentView === VIEWS.SELLER_CATALOG && <SellerCatalog mode={mode} onBack={goBack} sheetData={sheetData} />}

              {currentView === VIEWS.ORDERS_LIST && (
                <OrdersList
                  mode={mode}
                  onBack={goBack}
                  onAddOrder={() => pushView(VIEWS.ORDERS_SELLER_CATALOG)}
                  onViewOrder={(id) => {
                    setViewingOrderId(id);
                    pushView(VIEWS.ORDERS_DETAIL);
                  }}
                  onViewCustomer={(id) => {
                    setViewingCustomerId(id);
                    pushView(VIEWS.CUSTOMERS_DETAIL);
                  }}
                />
              )}

              {currentView === VIEWS.ORDERS_CREATE && <CreateOrder mode={mode} onBack={goBack} onOrderCreated={goBack} sheetData={sheetData} />}

              {currentView === VIEWS.ORDERS_SELLER_CATALOG && <BuyerCatalog sheetData={sheetData} previewMode={false} sellerMode={true} onClose={goBack} onOrderCreated={goBack} />}

              {currentView === VIEWS.ORDERS_DETAIL && <OrderDetail mode={mode} onBack={goBack} orderId={viewingOrderId} />}

              {currentView === VIEWS.CUSTOMERS_LIST && (
                <CustomersList
                  mode={mode}
                  onBack={goBack}
                  onViewCustomer={(id) => {
                    setViewingCustomerId(id);
                    pushView(VIEWS.CUSTOMERS_DETAIL);
                  }}
                  onAddCustomer={() => pushView(VIEWS.CUSTOMERS_ADD)}
                />
              )}

              {currentView === VIEWS.CUSTOMERS_DETAIL && (
                <CustomerDetail
                  mode={mode}
                  onBack={goBack}
                  customerId={viewingCustomerId}
                  onViewOrder={(id) => {
                    setViewingOrderId(id);
                    pushView(VIEWS.ORDERS_DETAIL);
                  }}
                />
              )}

              {currentView === VIEWS.CUSTOMERS_ADD && <AddCustomer mode={mode} onBack={goBack} onCustomerAdded={goBack} />}

              {currentView === VIEWS.PROCUREMENT && <ProcurementList mode={mode} onBack={goBack} sheetData={sheetData} onGoToInventory={() => pushView(VIEWS.INVENTORY_LIST)} />}
            </main>
            </div>
          </div>
        </CatalogProvider>
      </InventoryProvider>
    </AppModeProvider>
  );
}

export default App;
