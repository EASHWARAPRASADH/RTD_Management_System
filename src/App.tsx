import React, { useState, useEffect } from "react";
import { NavigationTab, User, Customer, Product, Bill, PaymentRecord } from "./types";
import { DatabaseService } from "./services/db";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { GlobalSearchModal } from "./components/GlobalSearchModal";
import { DashboardView } from "./components/Dashboard/DashboardView";
import { CustomerManagement } from "./components/Customers/CustomerManagement";
import { ProductManagement } from "./components/Products/ProductManagement";
import { BillingModule } from "./components/Billing/BillingModule";
import { ReportsModule } from "./components/Reports/ReportsModule";
import { PaymentsModule } from "./components/Payments/PaymentsModule";
import { ExcelHub } from "./components/ExcelHub/ExcelHub";
import { AuditLogView } from "./components/AuditLog/AuditLogView";
import { SettingsModule } from "./components/Settings/SettingsModule";
import { StockAdjustmentModal } from "./components/Inventory/StockAdjustmentModal";
import { InvoiceModal } from "./components/Billing/InvoiceModal";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(DatabaseService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<NavigationTab>("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("sidebar_collapsed") === "true";
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Data State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedProductForRestock, setSelectedProductForRestock] = useState<Product | null>(null);
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<Bill | null>(null);

  // Load Data
  const loadData = () => {
    setCustomers(DatabaseService.getCustomers());
    setProducts(DatabaseService.getProducts());
    setBills(DatabaseService.getBills());
    setPayments(DatabaseService.getPayments());
  };

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("sidebar_collapsed", String(next));
      return next;
    });
  };

  useEffect(() => {
    loadData();

    // Initialize real-time Cloud Firestore synchronization
    const unsubscribeFirebase = DatabaseService.initFirebaseSync();

    const handleDbUpdated = () => {
      loadData();
    };

    window.addEventListener("rtd_db_updated", handleDbUpdated);

    // Keyboard shortcut for Cmd+K search
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      unsubscribeFirebase();
      window.removeEventListener("rtd_db_updated", handleDbUpdated);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleUserChange = (usr: User) => {
    setCurrentUser(usr);
    DatabaseService.setCurrentUser(usr);
  };

  const handleResetData = () => {
    if (confirm("Reset application to sample RTD distribution seed data?")) {
      DatabaseService.resetToSampleData();
      setCurrentUser(DatabaseService.getCurrentUser());
      loadData();
    }
  };

  const pendingAmount = customers.reduce((acc, c) => acc + c.currentOutstanding, 0);
  const lowStockCount = products.filter(p => p.stockCases <= p.minStockAlertCases).length;
  const routes = DatabaseService.getRoutes();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Navbar */}
      <Navbar
        currentUser={currentUser}
        onUserChange={handleUserChange}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNewBill={() => setActiveTab("billing")}
        onResetData={handleResetData}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      {/* Main Content Layout */}
      <div className="flex-1 flex w-full">
        
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          currentUser={currentUser}
          pendingAmount={pendingAmount}
          lowStockCount={lowStockCount}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main View Router */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {activeTab === "dashboard" && (
            <DashboardView
              bills={bills}
              customers={customers}
              products={products}
              onTabChange={setActiveTab}
              onOpenNewBill={() => setActiveTab("billing")}
              onViewInvoice={(bill) => setSelectedInvoiceForModal(bill)}
              onOpenRestock={(product) => setSelectedProductForRestock(product)}
            />
          )}

          {activeTab === "billing" && (
            <BillingModule
              customers={customers}
              products={products}
              currentUser={currentUser}
              onBillCreated={loadData}
            />
          )}

          {activeTab === "customers" && (
            <CustomerManagement
              customers={customers}
              routes={routes}
              onRefresh={loadData}
            />
          )}

          {activeTab === "products" && (
            <ProductManagement
              products={products}
              onRefresh={loadData}
              onOpenRestockModal={(product) => setSelectedProductForRestock(product)}
            />
          )}

          {activeTab === "reports" && (
            <ReportsModule
              bills={bills}
              customers={customers}
              products={products}
              routes={routes}
            />
          )}

          {activeTab === "payments" && (
            <PaymentsModule
              bills={bills}
              payments={payments}
              currentUser={currentUser}
              onRefresh={loadData}
            />
          )}

          {activeTab === "excel" && (
            <ExcelHub
              currentUser={currentUser}
              onRefreshData={loadData}
            />
          )}

          {activeTab === "audit" && (
            <AuditLogView />
          )}

          {activeTab === "settings" && (
            <SettingsModule currentUser={currentUser} />
          )}
        </main>

      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={(type, item) => {
          if (type === "customer") setActiveTab("customers");
          else if (type === "product") setActiveTab("products");
          else if (type === "bill") setSelectedInvoiceForModal(item);
        }}
      />

      {/* Stock Adjustment Modal */}
      {selectedProductForRestock && (
        <StockAdjustmentModal
          product={selectedProductForRestock}
          isOpen={!!selectedProductForRestock}
          onClose={() => setSelectedProductForRestock(null)}
          onRefresh={loadData}
        />
      )}

      {/* Invoice Viewer Modal */}
      {selectedInvoiceForModal && (
        <InvoiceModal
          bill={selectedInvoiceForModal}
          isOpen={!!selectedInvoiceForModal}
          onClose={() => setSelectedInvoiceForModal(null)}
        />
      )}

    </div>
  );
}
