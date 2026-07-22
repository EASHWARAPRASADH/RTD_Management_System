import * as XLSX from "xlsx";
import { Customer, Product, Bill, AuditLog } from "../types";
import { DatabaseService } from "./db";

export interface ImportValidationResult<T> {
  validRows: T[];
  invalidRows: { rowNumber: number; data: Record<string, any>; errors: string[] }[];
  summary: {
    total: number;
    validCount: number;
    invalidCount: number;
  };
}

export class ExcelService {
  // --- DOWNLOAD TEMPLATES ---
  static downloadCustomerTemplate(): void {
    const templateData = [
      {
        "Customer Code (Optional)": "CUST-9001",
        "Customer Name*": "Apex Food Mart",
        "Contact Person": "John Doe",
        "Address": "123 Main Street",
        "City": "Downtown",
        "Phone*": "+91 98765 43210",
        "GST Number": "GST27AAAPA1234F1Z1",
        "Route Name": "Route 01 - Central Business District & Kiosks",
        "Credit Limit (₹)": 100000,
        "Status (ACTIVE/INACTIVE)": "ACTIVE"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customer_Import_Template");

    XLSX.writeFile(workbook, "RTD_Customer_Import_Template.xlsx");
  }

  static downloadProductTemplate(): void {
    const templateData = [
      {
        "Product Code (Optional)": "RTD-SAMPLE-001",
        "Product Name*": "Sample Cold Brew Coffee 300ml",
        "Category*": "Iced Coffee",
        "MRP (₹)*": 120.00,
        "Selling Price (₹)*": 95.00,
        "Units Per Case*": 24,
        "Unit Container": "300ml Can",
        "Stock Cases": 100,
        "Loose Units": 0,
        "Min Stock Alert Cases": 20,
        "Status": "ACTIVE",
        "Barcode": "8901234567999"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Product_Import_Template");

    XLSX.writeFile(workbook, "RTD_Product_Import_Template.xlsx");
  }

  // --- PARSE AND VALIDATE CUSTOMER IMPORT ---
  static parseCustomerExcel(file: File): Promise<ImportValidationResult<Omit<Customer, "id" | "createdAt" | "updatedAt" | "currentOutstanding">>> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

          const validRows: Omit<Customer, "id" | "createdAt" | "updatedAt" | "currentOutstanding">[] = [];
          const invalidRows: { rowNumber: number; data: Record<string, any>; errors: string[] }[] = [];

          const existingCustomers = DatabaseService.getCustomers();
          const routes = DatabaseService.getRoutes();

          jsonRows.forEach((row, idx) => {
            const rowNum = idx + 2; // Row 1 is header
            const errors: string[] = [];

            const name = String(row["Customer Name*"] || row["Customer Name"] || row["Name"] || "").trim();
            const phone = String(row["Phone*"] || row["Phone"] || "").trim();
            const contactPerson = String(row["Contact Person"] || "").trim();
            const address = String(row["Address"] || "").trim();
            const city = String(row["City"] || "").trim();
            const gstNo = String(row["GST Number"] || row["GST"] || "").trim();
            const routeNameInput = String(row["Route Name"] || row["Route"] || "").trim();
            const creditLimit = parseFloat(row["Credit Limit (₹)"] || row["Credit Limit ($)"] || row["Credit Limit"] || "50000") || 50000;
            const statusInput = String(row["Status (ACTIVE/INACTIVE)"] || row["Status"] || "ACTIVE").toUpperCase().trim();
            const status = statusInput === "INACTIVE" ? "INACTIVE" : "ACTIVE";

            if (!name) errors.push("Customer Name is required.");
            if (!phone) errors.push("Phone number is required.");

            // Match route
            const matchedRoute = routes.find(r =>
              r.name.toLowerCase().includes(routeNameInput.toLowerCase()) ||
              r.code.toLowerCase() === routeNameInput.toLowerCase()
            ) || routes[0];

            if (errors.length === 0) {
              validRows.push({
                code: String(row["Customer Code (Optional)"] || row["Customer Code"] || "").trim(),
                name,
                contactPerson: contactPerson || "Store Manager",
                address: address || "City Center",
                city: city || "Metro Area",
                phone,
                gstNo: gstNo || "UNREGISTERED",
                routeId: matchedRoute.id,
                routeName: matchedRoute.name,
                status,
                creditLimit
              });
            } else {
              invalidRows.push({ rowNumber: rowNum, data: row, errors });
            }
          });

          resolve({
            validRows,
            invalidRows,
            summary: {
              total: jsonRows.length,
              validCount: validRows.length,
              invalidCount: invalidRows.length
            }
          });
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  // --- PARSE AND VALIDATE PRODUCT IMPORT ---
  static parseProductExcel(file: File): Promise<ImportValidationResult<Omit<Product, "id" | "createdAt" | "updatedAt">>> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

          const validRows: Omit<Product, "id" | "createdAt" | "updatedAt">[] = [];
          const invalidRows: { rowNumber: number; data: Record<string, any>; errors: string[] }[] = [];

          jsonRows.forEach((row, idx) => {
            const rowNum = idx + 2;
            const errors: string[] = [];

            const name = String(row["Product Name*"] || row["Product Name"] || row["Name"] || "").trim();
            const categoryInput = String(row["Category*"] || row["Category"] || "Energy Drink").trim();
            const mrp = parseFloat(row["MRP (₹)*"] || row["MRP ($)*"] || row["MRP"] || "0");
            const sellingPrice = parseFloat(row["Selling Price (₹)*"] || row["Selling Price ($)*"] || row["Selling Price"] || "0");
            const packSize = parseInt(row["Units Per Case*"] || row["Pack Size"] || "24", 10);
            const unit = String(row["Unit Container"] || row["Unit"] || "350ml Can").trim();
            const stockCases = parseInt(row["Stock Cases"] || "0", 10);
            const stockUnits = parseInt(row["Loose Units"] || "0", 10);
            const minStockAlertCases = parseInt(row["Min Stock Alert Cases"] || "20", 10);
            const barcode = String(row["Barcode"] || "").trim() || `890${Math.floor(1000000000 + Math.random() * 9000000000)}`;

            if (!name) errors.push("Product Name is required.");
            if (isNaN(mrp) || mrp <= 0) errors.push("Valid MRP price is required.");
            if (isNaN(sellingPrice) || sellingPrice <= 0) errors.push("Valid Selling Price is required.");

            // Valid Category fallback
            const validCategories: Product["category"][] = [
              "Energy Drink", "Iced Coffee", "Iced Tea", "Sparkling Soda", "Flavored Milk", "Juice RTD", "Isotonic / Sports"
            ];
            const matchedCategory = validCategories.find(c => c.toLowerCase() === categoryInput.toLowerCase()) || "Energy Drink";

            if (errors.length === 0) {
              validRows.push({
                code: String(row["Product Code (Optional)"] || row["Product Code"] || "").trim(),
                name,
                category: matchedCategory,
                mrp,
                sellingPrice,
                packSize: packSize > 0 ? packSize : 24,
                unit,
                stockCases: stockCases >= 0 ? stockCases : 0,
                stockUnits: stockUnits >= 0 ? stockUnits : 0,
                minStockAlertCases: minStockAlertCases >= 0 ? minStockAlertCases : 15,
                status: "ACTIVE",
                barcode
              });
            } else {
              invalidRows.push({ rowNumber: rowNum, data: row, errors });
            }
          });

          resolve({
            validRows,
            invalidRows,
            summary: {
              total: jsonRows.length,
              validCount: validRows.length,
              invalidCount: invalidRows.length
            }
          });
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  // --- EXPORT DATABASE TO MULTI-SHEET EXCEL WORKBOOK ---
  static exportFullDatabaseToExcel(): void {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Customers
    const customers = DatabaseService.getCustomers();
    const custSheetData = customers.map(c => ({
      "Customer Code": c.code,
      "Name": c.name,
      "Contact Person": c.contactPerson,
      "Phone": c.phone,
      "GST Number": c.gstNo,
      "Address": c.address,
      "City": c.city,
      "Route": c.routeName,
      "Credit Limit (₹)": c.creditLimit,
      "Outstanding Balance (₹)": c.currentOutstanding,
      "Status": c.status
    }));
    const custSheet = XLSX.utils.json_to_sheet(custSheetData);
    XLSX.utils.book_append_sheet(workbook, custSheet, "Customers");

    // Sheet 2: Products
    const products = DatabaseService.getProducts();
    const prodSheetData = products.map(p => ({
      "Product Code": p.code,
      "Product Name": p.name,
      "Category": p.category,
      "MRP (₹)": p.mrp,
      "Selling Price (₹)": p.sellingPrice,
      "Pack Size (Units/Case)": p.packSize,
      "Unit Type": p.unit,
      "Stock (Cases)": p.stockCases,
      "Stock (Loose Units)": p.stockUnits,
      "Min Alert Cases": p.minStockAlertCases,
      "Barcode": p.barcode,
      "Status": p.status
    }));
    const prodSheet = XLSX.utils.json_to_sheet(prodSheetData);
    XLSX.utils.book_append_sheet(workbook, prodSheet, "Products");

    // Sheet 3: Sales Invoices
    const bills = DatabaseService.getBills();
    const billsSheetData = bills.map(b => ({
      "Bill No": b.billNo,
      "Date": b.date,
      "Customer": b.customerName,
      "Route": b.routeName,
      "Subtotal (₹)": b.subTotal,
      "Tax (₹)": b.totalTax,
      "Discount (₹)": b.totalDiscount,
      "Grand Total (₹)": b.grandTotal,
      "Amount Paid (₹)": b.amountPaid,
      "Balance Due (₹)": b.balanceAmount,
      "Payment Mode": b.paymentMode,
      "Payment Status": b.paymentStatus,
      "Billed By": b.createdBy
    }));
    const billsSheet = XLSX.utils.json_to_sheet(billsSheetData);
    XLSX.utils.book_append_sheet(workbook, billsSheet, "Sales_Invoices");

    // Sheet 4: Audit Logs
    const auditLogs = DatabaseService.getAuditLogs();
    const auditSheetData = auditLogs.map(l => ({
      "Log ID": l.id,
      "Timestamp": new Date(l.timestamp).toLocaleString(),
      "User": l.userName,
      "Role": l.userRole,
      "Action": l.action,
      "Entity": l.entity,
      "Details": l.details
    }));
    const auditSheet = XLSX.utils.json_to_sheet(auditSheetData);
    XLSX.utils.book_append_sheet(workbook, auditSheet, "Audit_Logs");

    const fileName = `RTD_Distribution_Full_Database_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    DatabaseService.logExcelActivity({
      filename: fileName,
      type: "EXPORT",
      target: "FULL_DATABASE",
      status: "SUCCESS",
      rowsProcessed: customers.length + products.length + bills.length,
      rowsFailed: 0,
      uploadedBy: DatabaseService.getCurrentUser().name
    });
  }

  static exportReportToExcel(reportName: string, data: any[]): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, reportName);

    const fileName = `RTD_Report_${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }
}
