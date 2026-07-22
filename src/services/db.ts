import {
  User, Customer, Product, Bill, PaymentRecord, AuditLog, ExcelImportLog,
  StockAdjustment, Route, ShopSettings
} from "../types";
import {
  MOCK_USERS, MOCK_ROUTES, MOCK_CUSTOMERS, MOCK_PRODUCTS, MOCK_BILLS,
  MOCK_PAYMENTS, MOCK_AUDIT_LOGS, MOCK_EXCEL_LOGS
} from "../data/mockData";
import { FirebaseSyncService } from "./firebaseDb";

const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  shopName: "KOKILA ENTERPRISES",
  tagline: "Ready-To-Drink Beverage Distribution & Wholesale Suppliers",
  address: "No. 15, Thesan Arulnathan Street, Palaniraja Udayar Nagar, Pakkamuduanpet, Lawspet",
  cityStatePincode: "Puducherry - 605 008",
  phone: "99655 97940, 96299 51333",
  email: "kokilaenterprises.pdy@gmail.com",
  gstin: "",
  fssaiNo: "",
  upiVpa: "9965597940@upi",
  bankName: "HDFC Bank Ltd.",
  accountHolder: "KOKILA ENTERPRISES",
  accountNumber: "",
  ifscCode: "",
  invoiceTitle: "TAX INVOICE & DELIVERY MANIFEST",
  termsAndConditions: "Thank you for your business! Goods once sold will not be returned unless damaged in transit. Interest @18% p.a. will be charged on delayed bills beyond credit period.",
  defaultGstRate: 12,
  showUpiQrOnInvoice: true,
  autoRoundOff: true
};

const STORAGE_KEYS = {
  CURRENT_USER: "rtd_current_user",
  CUSTOMERS: "rtd_customers",
  PRODUCTS: "rtd_products",
  ROUTES: "rtd_routes",
  BILLS: "rtd_bills",
  PAYMENTS: "rtd_payments",
  AUDIT_LOGS: "rtd_audit_logs",
  EXCEL_LOGS: "rtd_excel_logs",
  SHOP_SETTINGS: "rtd_shop_settings",
};

export class DatabaseService {
  /**
   * Initializes real-time Firebase synchronization and performs a 0-clean start for live production.
   */
  static initFirebaseSync(): () => void {
    FirebaseSyncService.initializeSeedData({
      shopSettings: this.getShopSettings()
    });

    // Clean start for dynamic live mode if not yet set
    if (!localStorage.getItem("rtd_prod_clean_dynamic_v4")) {
      localStorage.setItem("rtd_prod_clean_dynamic_v4", "true");
      this.clearAllData();
    }

    return FirebaseSyncService.subscribeAll({
      onCustomers: (customers) => {
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers || []));
        window.dispatchEvent(new Event("rtd_db_updated"));
      },
      onProducts: (products) => {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products || []));
        window.dispatchEvent(new Event("rtd_db_updated"));
      },
      onBills: (bills) => {
        localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills || []));
        window.dispatchEvent(new Event("rtd_db_updated"));
      },
      onPayments: (payments) => {
        localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments || []));
        window.dispatchEvent(new Event("rtd_db_updated"));
      },
      onShopSettings: (settings) => {
        if (settings) {
          localStorage.setItem(STORAGE_KEYS.SHOP_SETTINGS, JSON.stringify(settings));
          window.dispatchEvent(new Event("rtd_db_updated"));
        }
      },
      onAuditLogs: (logs) => {
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs || []));
        window.dispatchEvent(new Event("rtd_db_updated"));
      }
    });
  }

  // --- SHOP SETTINGS ---
  static getShopSettings(): ShopSettings {
    const data = localStorage.getItem(STORAGE_KEYS.SHOP_SETTINGS);
    if (!data) return DEFAULT_SHOP_SETTINGS;
    try {
      return { ...DEFAULT_SHOP_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SHOP_SETTINGS;
    }
  }

  static saveShopSettings(settings: ShopSettings): void {
    localStorage.setItem(STORAGE_KEYS.SHOP_SETTINGS, JSON.stringify(settings));
    FirebaseSyncService.saveShopSettingsDoc(settings);
    this.logAudit("UPDATE", "SYSTEM", "SHOP_SETTINGS", "Updated shop details and invoice preferences");
  }
  // --- USER AUTH ---
  static getCurrentUser(): User {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!data) return MOCK_USERS[0];
    try {
      return JSON.parse(data);
    } catch {
      return MOCK_USERS[0];
    }
  }

  static setCurrentUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }

  static getUsers(): User[] {
    return MOCK_USERS;
  }

  // --- CUSTOMERS ---
  static getCustomers(): Customer[] {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveCustomers(customers: Customer[]): void {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    customers.forEach(c => FirebaseSyncService.saveCustomerDoc(c));
  }

  static addCustomer(customerData: Omit<Customer, "id" | "createdAt" | "updatedAt" | "currentOutstanding">): Customer {
    const customers = this.getCustomers();
    const count = customers.length + 1001;
    const newCode = `CUST-${count}`;
    const newCustomer: Customer = {
      ...customerData,
      id: newCode,
      code: newCode,
      currentOutstanding: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [newCustomer, ...customers];
    this.saveCustomers(updated);
    FirebaseSyncService.saveCustomerDoc(newCustomer);
    this.logAudit("CREATE", "CUSTOMER", newCustomer.id, `Created new customer ${newCustomer.name} (${newCustomer.code})`);
    return newCustomer;
  }

  static updateCustomer(id: string, updates: Partial<Customer>): Customer | null {
    const customers = this.getCustomers();
    const idx = customers.findIndex(c => c.id === id);
    if (idx === -1) return null;

    const old = customers[idx];
    const updatedCustomer: Customer = {
      ...old,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    customers[idx] = updatedCustomer;
    this.saveCustomers(customers);
    FirebaseSyncService.saveCustomerDoc(updatedCustomer);
    this.logAudit("UPDATE", "CUSTOMER", id, `Updated customer details for ${updatedCustomer.name}`);
    return updatedCustomer;
  }

  static deleteCustomer(id: string): boolean {
    const customers = this.getCustomers();
    const customer = customers.find(c => c.id === id);
    if (!customer) return false;

    const filtered = customers.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(filtered));
    FirebaseSyncService.deleteCustomerDoc(id);
    this.logAudit("DELETE", "CUSTOMER", id, `Deleted customer ${customer.name} (${customer.code})`);
    return true;
  }

  // --- PRODUCTS ---
  static getProducts(): Product[] {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveProducts(products: Product[]): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    products.forEach(p => FirebaseSyncService.saveProductDoc(p));
  }

  static addProduct(productData: Omit<Product, "id" | "createdAt" | "updatedAt">): Product {
    const products = this.getProducts();
    const count = products.length + 1;
    const newCode = productData.code || `PRD-RTD-${String(count).padStart(3, '0')}`;
    const newProduct: Product = {
      ...productData,
      id: `PRD-${String(count).padStart(3, '0')}`,
      code: newCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [newProduct, ...products];
    this.saveProducts(updated);
    FirebaseSyncService.saveProductDoc(newProduct);
    this.logAudit("CREATE", "PRODUCT", newProduct.id, `Created product ${newProduct.name} (${newProduct.code})`);
    return newProduct;
  }

  static updateProduct(id: string, updates: Partial<Product>): Product | null {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const old = products[idx];
    const updatedProduct: Product = {
      ...old,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    products[idx] = updatedProduct;
    this.saveProducts(products);
    FirebaseSyncService.saveProductDoc(updatedProduct);
    this.logAudit("UPDATE", "PRODUCT", id, `Updated product details for ${updatedProduct.name}`);
    return updatedProduct;
  }

  static adjustStock(id: string, casesChanged: number, unitsChanged: number, reason: string): Product | null {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const old = products[idx];
    let newCases = old.stockCases + casesChanged;
    let newUnits = old.stockUnits + unitsChanged;

    if (newUnits >= old.packSize) {
      newCases += Math.floor(newUnits / old.packSize);
      newUnits = newUnits % old.packSize;
    } else if (newUnits < 0) {
      const casesNeeded = Math.ceil(Math.abs(newUnits) / old.packSize);
      newCases -= casesNeeded;
      newUnits = (newUnits + casesNeeded * old.packSize) % old.packSize;
    }

    if (newCases < 0) newCases = 0;

    const updatedProduct: Product = {
      ...old,
      stockCases: newCases,
      stockUnits: newUnits,
      updatedAt: new Date().toISOString()
    };

    products[idx] = updatedProduct;
    this.saveProducts(products);
    FirebaseSyncService.saveProductDoc(updatedProduct);
    this.logAudit("STOCK_ADJUST", "PRODUCT", id, `Adjusted stock for ${old.name}: ${casesChanged >= 0 ? '+' : ''}${casesChanged} Cases, ${unitsChanged >= 0 ? '+' : ''}${unitsChanged} Units. Reason: ${reason}`);
    return updatedProduct;
  }

  static deleteProduct(id: string): boolean {
    const products = this.getProducts();
    const product = products.find(p => p.id === id);
    if (!product) return false;

    const filtered = products.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));
    FirebaseSyncService.deleteProductDoc(id);
    this.logAudit("DELETE", "PRODUCT", id, `Deleted product SKU ${product.name} (${product.code})`);
    return true;
  }

  // --- ROUTES ---
  static getRoutes(): Route[] {
    const data = localStorage.getItem(STORAGE_KEYS.ROUTES);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  // --- BILLS & INVOICING ---
  static getBills(): Bill[] {
    const data = localStorage.getItem(STORAGE_KEYS.BILLS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveBills(bills: Bill[]): void {
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
    bills.forEach(b => FirebaseSyncService.saveBillDoc(b));
  }

  static createBill(billData: Omit<Bill, "id" | "billNo" | "createdAt" | "updatedAt">): Bill {
    const bills = this.getBills();
    const year = new Date().getFullYear();
    const nextSeq = bills.length + 892;
    const billNo = `INV-${year}-${String(nextSeq).padStart(4, "0")}`;

    const newBill: Bill = {
      ...billData,
      id: `BILL-${year}-${String(nextSeq).padStart(4, "0")}`,
      billNo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 1. Save Bill
    const updatedBills = [newBill, ...bills];
    this.saveBills(updatedBills);
    FirebaseSyncService.saveBillDoc(newBill);

    // 2. Deduct product inventory
    const products = this.getProducts();
    newBill.items.forEach(item => {
      const pIdx = products.findIndex(p => p.id === item.productId);
      if (pIdx !== -1) {
        const prod = products[pIdx];
        let totalUnitsInStock = (prod.stockCases * prod.packSize) + prod.stockUnits;
        totalUnitsInStock = Math.max(0, totalUnitsInStock - item.totalUnits);

        prod.stockCases = Math.floor(totalUnitsInStock / prod.packSize);
        prod.stockUnits = totalUnitsInStock % prod.packSize;
        prod.updatedAt = new Date().toISOString();
        FirebaseSyncService.saveProductDoc(prod);
      }
    });
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

    // 3. Update customer outstanding if pending or partial
    if (newBill.balanceAmount > 0) {
      const customers = this.getCustomers();
      const cIdx = customers.findIndex(c => c.id === newBill.customerId);
      if (cIdx !== -1) {
        customers[cIdx].currentOutstanding += newBill.balanceAmount;
        customers[cIdx].updatedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
        FirebaseSyncService.saveCustomerDoc(customers[cIdx]);
      }
    }

    // 4. Log Audit
    this.logAudit(
      "CREATE",
      "BILL",
      newBill.id,
      `Generated Invoice ${newBill.billNo} for ${newBill.customerName} (Grand Total: ₹${newBill.grandTotal.toFixed(2)}, Payment Mode: ${newBill.paymentMode})`
    );

    return newBill;
  }

  // --- PAYMENTS & COLLECTIONS ---
  static getPayments(): PaymentRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static recordPayment(payment: Omit<PaymentRecord, "id" | "createdAt">): PaymentRecord {
    const payments = this.getPayments();
    const newId = `PAY-${payments.length + 102}`;
    const newRecord: PaymentRecord = {
      ...payment,
      id: newId,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify([newRecord, ...payments]));
    FirebaseSyncService.savePaymentDoc(newRecord);

    // Update Bill
    const bills = this.getBills();
    const bIdx = bills.findIndex(b => b.id === payment.billId || b.billNo === payment.billNo);
    if (bIdx !== -1) {
      const bill = bills[bIdx];
      const newPaid = bill.amountPaid + payment.amount;
      const newBalance = Math.max(0, bill.grandTotal - newPaid);

      bill.amountPaid = newPaid;
      bill.balanceAmount = newBalance;
      bill.paymentStatus = newBalance === 0 ? "PAID" : "PARTIAL";
      bill.updatedAt = new Date().toISOString();

      localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
      FirebaseSyncService.saveBillDoc(bill);

      // Reduce Customer Outstanding
      const customers = this.getCustomers();
      const cIdx = customers.findIndex(c => c.id === bill.customerId);
      if (cIdx !== -1) {
        customers[cIdx].currentOutstanding = Math.max(0, customers[cIdx].currentOutstanding - payment.amount);
        customers[cIdx].updatedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
        FirebaseSyncService.saveCustomerDoc(customers[cIdx]);
      }
    }

    this.logAudit("PAYMENT", "PAYMENT", newId, `Recorded collection of ₹${payment.amount.toFixed(2)} for Bill #${payment.billNo} via ${payment.paymentMode}`);
    return newRecord;
  }

  static deleteBill(id: string): boolean {
    const bills = this.getBills();
    const bill = bills.find(b => b.id === id);
    if (!bill) return false;

    // 1. Restore product inventory stock
    const products = this.getProducts();
    bill.items.forEach(item => {
      const pIdx = products.findIndex(p => p.id === item.productId);
      if (pIdx !== -1) {
        const prod = products[pIdx];
        let totalUnits = (prod.stockCases * prod.packSize) + prod.stockUnits + item.totalUnits;
        prod.stockCases = Math.floor(totalUnits / prod.packSize);
        prod.stockUnits = totalUnits % prod.packSize;
        prod.updatedAt = new Date().toISOString();
        FirebaseSyncService.saveProductDoc(prod);
      }
    });
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

    // 2. Reverse customer outstanding due
    if (bill.balanceAmount > 0) {
      const customers = this.getCustomers();
      const cIdx = customers.findIndex(c => c.id === bill.customerId);
      if (cIdx !== -1) {
        customers[cIdx].currentOutstanding = Math.max(0, customers[cIdx].currentOutstanding - bill.balanceAmount);
        customers[cIdx].updatedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
        FirebaseSyncService.saveCustomerDoc(customers[cIdx]);
      }
    }

    // 3. Remove bill
    const filtered = bills.filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(filtered));
    FirebaseSyncService.deleteBillDoc(id);
    this.logAudit("DELETE", "BILL", id, `Voided/Deleted invoice ${bill.billNo} for ${bill.customerName}`);
    return true;
  }

  static deletePayment(id: string): boolean {
    const payments = this.getPayments();
    const payment = payments.find(p => p.id === id);
    if (!payment) return false;

    // 1. Update bill
    const bills = this.getBills();
    const bIdx = bills.findIndex(b => b.id === payment.billId || b.billNo === payment.billNo);
    if (bIdx !== -1) {
      const bill = bills[bIdx];
      const newPaid = Math.max(0, bill.amountPaid - payment.amount);
      const newBalance = Math.max(0, bill.grandTotal - newPaid);
      bill.amountPaid = newPaid;
      bill.balanceAmount = newBalance;
      bill.paymentStatus = newBalance === 0 ? "PAID" : newPaid > 0 ? "PARTIAL" : "PENDING";
      bill.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
      FirebaseSyncService.saveBillDoc(bill);

      // Restore customer outstanding
      const customers = this.getCustomers();
      const cIdx = customers.findIndex(c => c.id === bill.customerId);
      if (cIdx !== -1) {
        customers[cIdx].currentOutstanding += payment.amount;
        customers[cIdx].updatedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
        FirebaseSyncService.saveCustomerDoc(customers[cIdx]);
      }
    }

    // 2. Delete payment record
    const filtered = payments.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(filtered));
    FirebaseSyncService.deletePaymentDoc(id);
    this.logAudit("DELETE", "PAYMENT", id, `Voided payment collection ₹${payment.amount} for Bill #${payment.billNo}`);
    return true;
  }

  // --- AUDIT LOGS ---
  static getAuditLogs(): AuditLog[] {
    const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static logAudit(
    action: AuditLog["action"],
    entity: AuditLog["entity"],
    entityId: string,
    details: string,
    oldValue?: string,
    newValue?: string
  ): void {
    const currentUser = this.getCurrentUser();
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `AUD-${logs.length + 902}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      entity,
      entityId,
      details,
      oldValue,
      newValue,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([newLog, ...logs]));
    FirebaseSyncService.saveAuditLogDoc(newLog);
  }

  // --- EXCEL IMPORT LOGS ---
  static getExcelLogs(): ExcelImportLog[] {
    const data = localStorage.getItem(STORAGE_KEYS.EXCEL_LOGS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static logExcelActivity(log: Omit<ExcelImportLog, "id" | "timestamp">): void {
    const logs = this.getExcelLogs();
    const newLog: ExcelImportLog = {
      ...log,
      id: `XLS-${logs.length + 102}`,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.EXCEL_LOGS, JSON.stringify([newLog, ...logs]));
  }

  // --- SEED / RESET DATA ---
  static async clearAllData(): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EXCEL_LOGS, JSON.stringify([]));
    await FirebaseSyncService.clearAllFirestoreData();
    window.dispatchEvent(new Event("rtd_db_updated"));
  }

  static resetToSampleData(): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(MOCK_USERS[0]));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(MOCK_CUSTOMERS));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(MOCK_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(MOCK_ROUTES));
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(MOCK_BILLS));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(MOCK_PAYMENTS));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(MOCK_AUDIT_LOGS));
    localStorage.setItem(STORAGE_KEYS.EXCEL_LOGS, JSON.stringify(MOCK_EXCEL_LOGS));
    this.saveShopSettings(DEFAULT_SHOP_SETTINGS);

    // Save to Firestore too
    MOCK_CUSTOMERS.forEach(c => FirebaseSyncService.saveCustomerDoc(c));
    MOCK_PRODUCTS.forEach(p => FirebaseSyncService.saveProductDoc(p));
    MOCK_BILLS.forEach(b => FirebaseSyncService.saveBillDoc(b));
    MOCK_PAYMENTS.forEach(p => FirebaseSyncService.savePaymentDoc(p));
    MOCK_AUDIT_LOGS.forEach(a => FirebaseSyncService.saveAuditLogDoc(a));
    window.dispatchEvent(new Event("rtd_db_updated"));
  }
}
