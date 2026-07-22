import React from "react";
import { Bill, Customer, Product, NavigationTab } from "../../types";
import { 
  DollarSign, TrendingUp, AlertTriangle, Users, Package, 
  ShoppingCart, ArrowUpRight, ArrowDownRight, FileText, Download,
  Plus, Layers, ShieldCheck
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, Legend 
} from "recharts";
import { PDFService } from "../../services/pdfService";

interface DashboardViewProps {
  bills: Bill[];
  customers: Customer[];
  products: Product[];
  onTabChange: (tab: NavigationTab) => void;
  onOpenNewBill: () => void;
  onViewInvoice: (bill: Bill) => void;
  onOpenRestock: (product: Product) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  bills,
  customers,
  products,
  onTabChange,
  onOpenNewBill,
  onViewInvoice,
  onOpenRestock
}) => {
  // Calculations
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayBills = bills.filter(b => b.date === todayStr);
  const todaySales = todayBills.reduce((acc, b) => acc + b.grandTotal, 0);

  const monthSales = bills.reduce((acc, b) => acc + b.grandTotal, 0);
  const totalOutstanding = customers.reduce((acc, c) => acc + c.currentOutstanding, 0);
  const lowStockProducts = products.filter(p => p.stockCases <= p.minStockAlertCases);
  const activeCustomers = customers.filter(c => c.status === "ACTIVE").length;

  // Recharts Data 1: Sales Trend calculated dynamically from real bills
  const salesTrendData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const dayBills = bills.filter(b => b.date === dateStr);
    const daySales = dayBills.reduce((acc, b) => acc + b.grandTotal, 0);
    return {
      date: dayLabel,
      Sales: daySales
    };
  });

  // Recharts Data 2: Category Breakdown
  const categoryMap: Record<string, number> = {};
  products.forEach(p => {
    categoryMap[p.category] = (categoryMap[p.category] || 0) + (p.stockCases * p.sellingPrice * p.packSize);
  });
  const categoryPieData = Object.keys(categoryMap).map(cat => ({
    name: cat,
    value: Math.round(categoryMap[cat])
  }));
  const COLORS = ["#0284c7", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#6366f1"];

  // Recharts Data 3: Route Performance
  const routeMap: Record<string, number> = {};
  bills.forEach(b => {
    const routeShort = (b.routeName || "General").split("-")[0].trim();
    routeMap[routeShort] = (routeMap[routeShort] || 0) + b.grandTotal;
  });
  const routeBarData = Object.keys(routeMap).map(r => ({
    route: r,
    Revenue: Math.round(routeMap[r])
  }));

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Distribution & Stock Dashboard
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Active
            </span>
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Quick overview of sales, collections, stock alerts, and customer bills.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onTabChange("excel")}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-bold border border-slate-200 transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel Backup</span>
          </button>
          <button
            onClick={onOpenNewBill}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create New Bill</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        
        {/* Card 1: Today's Sales */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-1 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <span>Today's Sales</span>
            <div className="p-1 rounded bg-blue-50 text-blue-600">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            ₹{todaySales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
            <ArrowUpRight className="w-3 h-3" />
            <span>{todayBills.length} Bills Today</span>
          </div>
        </div>

        {/* Card 2: Month Sales */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-1 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <span>Total Revenue</span>
            <div className="p-1 rounded bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            ₹{monthSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
            <span>{bills.length} total orders</span>
          </div>
        </div>

        {/* Card 3: Pending Outstanding */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-1 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <span>Pending Due</span>
            <div className="p-1 rounded bg-red-50 text-red-600">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-red-600">
            ₹{totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <button
            onClick={() => onTabChange("payments")}
            className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-0.5"
          >
            <span>Collect Payments</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 4: Low Stock Alert */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-1 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <span>Low Stock Items</span>
            <div className="p-1 rounded bg-amber-50 text-amber-600">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-amber-600">
            {lowStockProducts.length} Items
          </div>
          <button
            onClick={() => onTabChange("products")}
            className="text-[10px] text-amber-600 font-bold hover:underline"
          >
            View Stock
          </button>
        </div>

        {/* Card 5: Active Shops */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-1 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <span>Active Shops</span>
            <div className="p-1 rounded bg-purple-50 text-purple-600">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {activeCustomers} Shops
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            Active Routes
          </div>
        </div>

      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Chart 1: Revenue Trend (Area Chart) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sales Revenue Trend</h3>
              <p className="text-[11px] text-slate-500">Daily gross turnover across all distribution channels</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-blue-700 rounded border border-slate-200">
              Last 7 Days
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}
                  formatter={(val: any) => [`₹${val}`, "Gross Revenue"]}
                />
                <Area type="monotone" dataKey="Sales" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Distribution (Pie Chart) */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3.5 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Category Share</h3>
            <p className="text-[11px] text-slate-500">Inventory value breakdown by RTD segment</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "12px" }}
                  formatter={(val: any) => [`₹${val}`, "Value"]}
                />
                <Legend formatter={(val) => <span className="text-[11px] text-slate-600 font-medium">{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Lower Grid: Route Performance + Recent Bills + Low Stock Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Route Performance Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3.5 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Route Sales Performance</h3>
            <p className="text-[11px] text-slate-500">Revenue contribution per territory</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={routeBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="route" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "12px" }}
                  formatter={(val: any) => [`₹${val}`, "Route Sales"]}
                />
                <Bar dataKey="Revenue" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Invoices Feed */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Sales Invoices</h3>
              <p className="text-[11px] text-slate-500">Latest orders generated in system</p>
            </div>
            <button
              onClick={() => onTabChange("billing")}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-0.5"
            >
              <span>View All Invoices</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Bill No</th>
                  <th className="p-2.5">Customer</th>
                  <th className="p-2.5">Route</th>
                  <th className="p-2.5 text-right">Grand Total</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500 italic text-xs">
                      No invoices generated yet. Click "Create New Bill" above or go to Billing & POS to start billing.
                    </td>
                  </tr>
                ) : (
                  bills.slice(0, 5).map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 font-mono font-bold text-blue-700">{bill.billNo}</td>
                      <td className="p-2.5 font-bold text-slate-800">{bill.customerName}</td>
                      <td className="p-2.5 text-slate-500 text-[11px]">{(bill.routeName || "General").split("-")[0]}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">₹{bill.grandTotal.toFixed(2)}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          bill.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                          bill.paymentStatus === "PARTIAL" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                          "bg-red-100 text-red-800 border border-red-200"
                        }`}>
                          {bill.paymentStatus}
                        </span>
                      </td>
                      <td className="p-2.5 text-right space-x-1">
                        <button
                          onClick={() => onViewInvoice(bill)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="View & Print Invoice"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => PDFService.generateInvoicePDF(bill)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-blue-600 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Low Stock Warning Box */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-amber-100 text-amber-700 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Inventory Alert: Low Stock Identified</h4>
              <p className="text-xs text-amber-800 mt-0.5">
                {lowStockProducts.map(p => `${p.name} (${p.stockCases} Cases left)`).join(", ")}
              </p>
            </div>
          </div>

          <button
            onClick={() => onTabChange("products")}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded shrink-0 transition-all shadow-xs"
          >
            Manage Product Catalog
          </button>
        </div>
      )}

    </div>
  );
};
