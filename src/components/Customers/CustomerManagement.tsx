import React, { useState } from "react";
import { Customer, Route } from "../../types";
import { DatabaseService } from "../../services/db";
import { ExcelService } from "../../services/excelService";
import { 
  Users, Search, Plus, Download, Edit3, Trash2, 
  MapPin, Phone, Building2, AlertCircle, FileSpreadsheet,
  CheckCircle2, XCircle, ArrowUpRight, History, X
} from "lucide-react";

interface CustomerManagementProps {
  customers: Customer[];
  routes: Route[];
  onRefresh: () => void;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  customers,
  routes,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerForLedger, setSelectedCustomerForLedger] = useState<Customer | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    address: "",
    city: "Downtown",
    phone: "",
    gstNo: "",
    routeId: routes[0]?.id || "RT-01",
    creditLimit: 10000,
    status: "ACTIVE" as "ACTIVE" | "INACTIVE"
  });

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: "",
      contactPerson: "",
      address: "",
      city: "Downtown",
      phone: "",
      gstNo: "",
      routeId: routes[0]?.id || "RT-01",
      creditLimit: 10000,
      status: "ACTIVE"
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      contactPerson: customer.contactPerson,
      address: customer.address,
      city: customer.city,
      phone: customer.phone,
      gstNo: customer.gstNo,
      routeId: customer.routeId,
      creditLimit: customer.creditLimit,
      status: customer.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedRoute = routes.find(r => r.id === formData.routeId) || routes[0] || { id: "RT-01", name: "Route 01 - Central CBD", code: "RT-01" };

    if (editingCustomer) {
      DatabaseService.updateCustomer(editingCustomer.id, {
        ...formData,
        routeName: matchedRoute.name
      });
    } else {
      DatabaseService.addCustomer({
        ...formData,
        code: "",
        routeName: matchedRoute.name
      });
    }

    setIsModalOpen(false);
    onRefresh();
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this customer record?")) {
      DatabaseService.deleteCustomer(id);
      onRefresh();
    }
  };

  // Filtering
  const filteredCustomers = customers.filter(c => {
    const matchesQuery = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.gstNo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRoute = selectedRoute === "ALL" || c.routeId === selectedRoute;

    return matchesQuery && matchesRoute;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Customer Master Directory
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Manage RTD retail outlets, supermarket accounts, credit limits, and distribution routes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => ExcelService.exportReportToExcel("Customers_List", customers)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-bold border border-slate-200 transition-all flex items-center gap-2"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold shadow-xs transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add Outlet / Customer</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Search */}
        <div className="sm:col-span-2 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by customer name, code, GST #, phone..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all"
          />
        </div>

        {/* Route Select Filter */}
        <div>
          <select
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:border-blue-600 transition-all"
          >
            <option value="ALL">All Territory Routes ({routes.length})</option>
            {routes.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Customers Data Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">Customer Code & Name</th>
                <th className="p-3">Route / Territory</th>
                <th className="p-3">Contact Info</th>
                <th className="p-3">GST Number</th>
                <th className="p-3 text-right">Credit Limit</th>
                <th className="p-3 text-right">Outstanding</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No customers found matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const isOverCredit = cust.currentOutstanding > cust.creditLimit;
                  return (
                    <tr key={cust.id} className="hover:bg-slate-50 transition-colors">
                      
                      {/* Code & Name */}
                      <td className="p-3">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{cust.name}</span>
                          {isOverCredit && (
                            <span className="p-0.5 rounded bg-red-100 text-red-600" title="Outstanding exceeds credit limit!">
                              <AlertCircle className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-blue-700 mt-0.5">{cust.code}</div>
                      </td>

                      {/* Route */}
                      <td className="p-3">
                        <div className="text-slate-800 font-medium">{(cust.routeName || "General").split("-")[0]}</div>
                        <div className="text-[10px] text-slate-500">{cust.city}</div>
                      </td>

                      {/* Contact Info */}
                      <td className="p-3 space-y-0.5">
                        <div className="text-slate-800 font-medium">{cust.contactPerson}</div>
                        <div className="text-slate-500 flex items-center gap-1 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{cust.phone}</span>
                        </div>
                      </td>

                      {/* GST */}
                      <td className="p-3 font-mono text-slate-600 text-[11px]">
                        {cust.gstNo}
                      </td>

                      {/* Credit Limit */}
                      <td className="p-3 text-right font-medium text-slate-700">
                        ₹{cust.creditLimit.toLocaleString()}
                      </td>

                      {/* Current Outstanding */}
                      <td className="p-3 text-right">
                        <div className={`font-bold text-xs ${cust.currentOutstanding > 0 ? "text-red-600" : "text-emerald-600"}`}>
                          ₹{cust.currentOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase inline-flex items-center gap-1 ${
                          cust.status === "ACTIVE" 
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}>
                          {cust.status === "ACTIVE" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{cust.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right space-x-1">
                        <button
                          onClick={() => setSelectedCustomerForLedger(cust)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-blue-700 font-bold text-[11px] transition-colors inline-flex items-center gap-1"
                          title="View Ledger / Order History"
                        >
                          <History className="w-3 h-3" />
                          <span>Ledger</span>
                        </button>

                        <button
                          onClick={() => handleOpenEdit(cust)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Edit Customer"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => handleDelete(cust.id)}
                          className="p-1 rounded bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 text-slate-100 space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-sky-400" />
                {editingCustomer ? "Edit Customer Record" : "Register New Outlet Customer"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Customer / Store Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Metro Supermarket Outlet #04"
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Store Manager Name"
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">GST / Tax Identification Number</label>
                <input
                  type="text"
                  value={formData.gstNo}
                  onChange={(e) => setFormData({ ...formData, gstNo: e.target.value.toUpperCase() })}
                  placeholder="GST27AAAAA0000A1Z0"
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street / Plaza Address"
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">City / Zone</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City Name"
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Route Assignment</label>
                  <select
                    value={formData.routeId}
                    onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Credit Limit ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="ACTIVE">ACTIVE (Authorized to Bill)</option>
                  <option value="INACTIVE">INACTIVE (Hold Billing)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md shadow-sky-500/20"
                >
                  {editingCustomer ? "Save Changes" : "Register Outlet"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Customer Ledger Drawer */}
      {selectedCustomerForLedger && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-150">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-xl h-full shadow-2xl p-6 text-slate-100 flex flex-col justify-between overflow-y-auto">
            
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedCustomerForLedger.name}</h3>
                  <p className="text-xs text-sky-400 font-mono mt-0.5">{selectedCustomerForLedger.code} • GST: {selectedCustomerForLedger.gstNo}</p>
                </div>
                <button
                  onClick={() => setSelectedCustomerForLedger(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-800">
                  <div className="text-xs text-slate-400">Credit Limit</div>
                  <div className="text-xl font-bold text-white mt-1">${selectedCustomerForLedger.creditLimit.toLocaleString()}</div>
                </div>
                <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-800">
                  <div className="text-xs text-slate-400">Current Outstanding</div>
                  <div className={`text-xl font-bold mt-1 ${selectedCustomerForLedger.currentOutstanding > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    ${selectedCustomerForLedger.currentOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Details List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Outlet Master Details</h4>
                <div className="bg-slate-800/40 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-slate-400">Route:</span> <span className="font-semibold text-slate-200">{selectedCustomerForLedger.routeName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Contact:</span> <span className="font-semibold text-slate-200">{selectedCustomerForLedger.contactPerson} ({selectedCustomerForLedger.phone})</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Address:</span> <span className="font-semibold text-slate-200">{selectedCustomerForLedger.address}, {selectedCustomerForLedger.city}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Status:</span> <span className="font-semibold text-emerald-400">{selectedCustomerForLedger.status}</span></div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800">
              <button
                onClick={() => setSelectedCustomerForLedger(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm"
              >
                Close Drawer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
