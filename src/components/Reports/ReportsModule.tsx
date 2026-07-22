import React, { useState } from "react";
import { Bill, Customer, Product, Route } from "../../types";
import { ExcelService } from "../../services/excelService";
import { 
  BarChart3, Calendar, FileSpreadsheet, Download, Filter, 
  TrendingUp, Users, Package, MapPin, DollarSign, ArrowUpRight
} from "lucide-react";

interface ReportsModuleProps {
  bills: Bill[];
  customers: Customer[];
  products: Product[];
  routes: Route[];
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  bills,
  customers,
  products,
  routes
}) => {
  const [reportType, setReportType] = useState<
    "DAILY" | "MONTHLY" | "PRODUCT" | "CUSTOMER" | "ROUTE" | "OUTSTANDING"
  >("DAILY");

  // Filter dates
  const [startDate, setStartDate] = useState<string>("2026-07-01");
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Filter bills by date
  const filteredBills = bills.filter(b => b.date >= startDate && b.date <= endDate);

  // Export selected report handler
  const handleExportExcel = () => {
    let reportName = "Report";
    let dataToExport: any[] = [];

    if (reportType === "DAILY") {
      reportName = "Daily_Sales_Report";
      dataToExport = filteredBills.map(b => ({
        "Bill No": b.billNo,
        "Date": b.date,
        "Customer": b.customerName,
        "Route": b.routeName,
        "Grand Total (₹)": b.grandTotal,
        "Payment Mode": b.paymentMode,
        "Payment Status": b.paymentStatus
      }));
    } else if (reportType === "PRODUCT") {
      reportName = "Product_Wise_Sales_Report";
      const pMap: Record<string, { name: string; category: string; unitsSold: number; revenue: number }> = {};
      filteredBills.forEach(b => {
        b.items.forEach(it => {
          if (!pMap[it.productName]) {
            pMap[it.productName] = { name: it.productName, category: "", unitsSold: 0, revenue: 0 };
          }
          pMap[it.productName].unitsSold += it.totalUnits;
          pMap[it.productName].revenue += it.lineTotal;
        });
      });
      dataToExport = Object.values(pMap);
    } else if (reportType === "OUTSTANDING") {
      reportName = "Outstanding_Aging_Report";
      dataToExport = customers
        .filter(c => c.currentOutstanding > 0)
        .map(c => ({
          "Customer Code": c.code,
          "Customer Name": c.name,
          "Route": c.routeName,
          "Credit Limit (₹)": c.creditLimit,
          "Outstanding Balance (₹)": c.currentOutstanding,
          "Status": c.status
        }));
    } else {
      reportName = `${reportType}_Report`;
      dataToExport = filteredBills;
    }

    ExcelService.exportReportToExcel(reportName, dataToExport);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Executive Reports & Distribution Analytics
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Generate territory sales summaries, customer ledger balances, product rankings, and outstanding aging logs.
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md text-xs transition-all flex items-center gap-2 shadow-xs active:scale-95"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Export Excel Report (.xlsx)</span>
        </button>
      </div>

      {/* Report Selector Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-white border border-slate-200 rounded-lg shadow-xs">
        {[
          { id: "DAILY", label: "Daily Sales Log", icon: Calendar },
          { id: "MONTHLY", label: "Monthly Summary", icon: TrendingUp },
          { id: "PRODUCT", label: "Product-wise Sales", icon: Package },
          { id: "CUSTOMER", label: "Customer Revenue", icon: Users },
          { id: "ROUTE", label: "Route Performance", icon: MapPin },
          { id: "OUTSTANDING", label: "Outstanding Ledger", icon: DollarSign }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = reportType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                isActive
                  ? "bg-purple-100 text-purple-900 border border-purple-200 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Date Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-wrap items-center gap-4 text-xs shadow-xs">
        <span className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
          <Filter className="w-3.5 h-3.5 text-purple-600" />
          Filter Date Range:
        </span>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-800 font-mono text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-800 font-mono text-xs"
          />
        </div>
      </div>

      {/* Active Report Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        
        {/* REPORT 1: DAILY SALES */}
        {reportType === "DAILY" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Customer Outlet</th>
                  <th className="p-3">Route</th>
                  <th className="p-3 text-right">Subtotal</th>
                  <th className="p-3 text-right">Tax (GST)</th>
                  <th className="p-3 text-right">Grand Total</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-blue-700">{b.billNo}</td>
                    <td className="p-3 text-slate-500">{b.date}</td>
                    <td className="p-3 font-bold text-slate-900">{b.customerName}</td>
                    <td className="p-3 text-slate-500 font-medium">{(b.routeName || "General").split("-")[0]}</td>
                    <td className="p-3 text-right">₹{b.subTotal.toFixed(2)}</td>
                    <td className="p-3 text-right">₹{b.totalTax.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-slate-900">₹{b.grandTotal.toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        b.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-red-100 text-red-800 border border-red-200"
                      }`}>
                        {b.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT 2: OUTSTANDING LEDGER */}
        {reportType === "OUTSTANDING" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Outlet Code & Name</th>
                  <th className="p-3">Route</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3 text-right">Credit Limit</th>
                  <th className="p-3 text-right">Outstanding Due</th>
                  <th className="p-3 text-right">Utilization %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.filter(c => c.currentOutstanding > 0).map((c) => {
                  const util = Math.min(100, Math.round((c.currentOutstanding / c.creditLimit) * 100));
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[10px] font-mono text-blue-700">{c.code}</div>
                      </td>
                      <td className="p-3 text-slate-500">{(c.routeName || "General").split("-")[0]}</td>
                      <td className="p-3 text-slate-500">{c.phone}</td>
                      <td className="p-3 text-right">₹{c.creditLimit.toLocaleString()}</td>
                      <td className="p-3 text-right font-bold text-red-600">₹{c.currentOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">{util}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Fallback for other reports */}
        {(reportType !== "DAILY" && reportType !== "OUTSTANDING") && (
          <div className="p-8 text-center text-slate-500 space-y-1.5">
            <p className="font-medium">Displaying analytics data for {reportType} report.</p>
            <p className="text-xs text-slate-400">Click "Export Excel Report" button above to download full spreadsheet.</p>
          </div>
        )}

      </div>

    </div>
  );
};
