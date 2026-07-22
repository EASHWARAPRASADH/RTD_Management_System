export type UserRole = "ADMIN" | "SALES_MANAGER" | "BILLING_EXEC" | "DELIVERY_AGENT";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
}

export interface Route {
  id: string;
  code: string;
  name: string;
  salesman: string;
  region: string;
  activeCustomersCount?: number;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  address: string;
  city: string;
  phone: string;
  gstNo: string;
  routeId: string;
  routeName: string;
  status: "ACTIVE" | "INACTIVE";
  creditLimit: number;
  currentOutstanding: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: "Energy Drink" | "Iced Coffee" | "Iced Tea" | "Sparkling Soda" | "Flavored Milk" | "Juice RTD" | "Isotonic / Sports";
  mrp: number;
  sellingPrice: number;
  packSize: number; // Units per case (e.g. 24 cans/case)
  unit: string; // e.g., "355ml Can", "250ml Bottle"
  stockCases: number;
  stockUnits: number; // Remaining loose units
  minStockAlertCases: number;
  status: "ACTIVE" | "INACTIVE";
  barcode: string;
  createdAt: string;
  updatedAt: string;
}

export type UnitType = "CASE" | "UNIT";

export interface BillItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  unitType: UnitType;
  packSize: number;
  quantity: number; // Cases or Units depending on unitType
  totalUnits: number; // Exact calculated units
  unitPrice: number; // Price per case or price per unit
  taxRate: number; // GST percentage (e.g. 12 or 18)
  taxAmount: number;
  discountRate: number; // %
  discountAmount: number;
  lineTotal: number;
}

export type PaymentStatus = "PAID" | "PENDING" | "PARTIAL";
export type PaymentMode = "CASH" | "UPI" | "CREDIT" | "CHEQUE" | "BANK_TRANSFER";

export interface Bill {
  id: string;
  billNo: string;
  date: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  customerPhone: string;
  customerGst: string;
  routeId: string;
  routeName: string;
  items: BillItem[];
  subTotal: number;
  totalTax: number;
  totalDiscount: number;
  roundOff: number;
  grandTotal: number;
  paymentStatus: PaymentStatus;
  paymentMode: PaymentMode;
  amountPaid: number;
  balanceAmount: number;
  dueDate: string;
  createdBy: string;
  createdById: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  billId: string;
  billNo: string;
  customerId: string;
  customerName: string;
  paymentDate: string;
  amount: number;
  paymentMode: PaymentMode;
  referenceNo?: string;
  recordedBy: string;
  notes?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: "CREATE" | "UPDATE" | "DELETE" | "IMPORT" | "EXPORT" | "STOCK_ADJUST" | "PAYMENT";
  entity: "CUSTOMER" | "PRODUCT" | "BILL" | "PAYMENT" | "SYSTEM";
  entityId: string;
  details: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface ExcelImportLog {
  id: string;
  filename: string;
  type: "IMPORT" | "EXPORT";
  target: "CUSTOMERS" | "PRODUCTS" | "BILLS" | "FULL_DATABASE";
  status: "SUCCESS" | "FAILED" | "PARTIAL";
  rowsProcessed: number;
  rowsFailed: number;
  uploadedBy: string;
  timestamp: string;
  errorMessages?: string[];
}

export interface StockAdjustment {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  adjustmentType: "ADD" | "REMOVE" | "CORRECTION";
  casesChanged: number;
  unitsChanged: number;
  reason: string;
  adjustedBy: string;
  timestamp: string;
}

export interface ShopSettings {
  shopName: string;
  tagline: string;
  address: string;
  cityStatePincode: string;
  phone: string;
  email: string;
  gstin: string;
  fssaiNo: string;
  
  // Payment / Bank Details
  upiVpa: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;

  // Invoice Preferences
  invoiceTitle: string;
  termsAndConditions: string;
  defaultGstRate: number;
  showUpiQrOnInvoice: boolean;
  autoRoundOff: boolean;
}

export type NavigationTab = 
  | "dashboard"
  | "billing"
  | "customers"
  | "products"
  | "reports"
  | "payments"
  | "excel"
  | "audit"
  | "settings";
