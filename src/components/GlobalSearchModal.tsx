import React, { useState, useEffect } from "react";
import { DatabaseService } from "../services/db";
import { Customer, Product, Bill, NavigationTab } from "../types";
import { Search, X, Users, Package, FileText, ArrowRight } from "lucide-react";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (type: "customer" | "product" | "bill", item: any) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResult
}) => {
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);

  useEffect(() => {
    if (isOpen) {
      setCustomers(DatabaseService.getCustomers());
      setProducts(DatabaseService.getProducts());
      setBills(DatabaseService.getBills());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredCustomers = q
    ? customers.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.gstNo.toLowerCase().includes(q)
      )
    : [];

  const filteredProducts = q
    ? products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.barcode.includes(q)
      )
    : [];

  const filteredBills = q
    ? bills.filter(b =>
        b.billNo.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.customerCode.toLowerCase().includes(q)
      )
    : [];

  const totalResults = filteredCustomers.length + filteredProducts.length + filteredBills.length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center p-4 pt-16 sm:pt-24 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-lg w-full max-w-2xl shadow-xl overflow-hidden text-slate-800 flex flex-col max-h-[80vh]">
        
        {/* Input Header */}
        <div className="p-3.5 border-b border-slate-200 flex items-center gap-2.5 bg-slate-50">
          <Search className="w-4 h-4 text-blue-600 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by customer, product, invoice #, GST, phone..."
            className="w-full bg-transparent border-none text-slate-900 placeholder-slate-400 text-sm focus:outline-none font-medium"
          />
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-3.5 overflow-y-auto space-y-4 flex-1">
          {!query && (
            <div className="text-center py-10 text-slate-400 space-y-1.5">
              <Search className="w-6 h-6 mx-auto text-slate-300" />
              <p className="text-xs">Type to instantly search across RTD Customers, Products, and Invoices.</p>
            </div>
          )}

          {query && totalResults === 0 && (
            <div className="text-center py-10 text-slate-500 text-xs">
              No matching records found for "{query}".
            </div>
          )}

          {/* Customer Results */}
          {filteredCustomers.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                <Users className="w-3.5 h-3.5" />
                <span>Customers ({filteredCustomers.length})</span>
              </div>
              <div className="space-y-1">
                {filteredCustomers.map((cust) => (
                  <button
                    key={cust.id}
                    onClick={() => {
                      onSelectResult("customer", cust);
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between transition-all group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                        {cust.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>Code: {cust.code}</span>
                        <span>•</span>
                        <span>GST: {cust.gstNo}</span>
                        <span>•</span>
                        <span>Route: {cust.routeName}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Product Results */}
          {filteredProducts.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                <Package className="w-3.5 h-3.5" />
                <span>Products ({filteredProducts.length})</span>
              </div>
              <div className="space-y-1">
                {filteredProducts.map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => {
                      onSelectResult("product", prod);
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between transition-all group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                        {prod.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>Cat: {prod.category}</span>
                        <span>•</span>
                        <span>Price: ₹{prod.sellingPrice.toFixed(2)}</span>
                        <span>•</span>
                        <span>Stock: {prod.stockCases} Cases</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bill / Invoice Results */}
          {filteredBills.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-700">
                <FileText className="w-3.5 h-3.5" />
                <span>Invoices ({filteredBills.length})</span>
              </div>
              <div className="space-y-1">
                {filteredBills.map((bill) => (
                  <button
                    key={bill.id}
                    onClick={() => {
                      onSelectResult("bill", bill);
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between transition-all group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-purple-700 flex items-center gap-2">
                        <span>{bill.billNo}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-normal">
                          {bill.date}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>Customer: {bill.customerName}</span>
                        <span>•</span>
                        <span>Total: ₹{bill.grandTotal.toFixed(2)}</span>
                        <span>•</span>
                        <span className="uppercase text-blue-700 font-bold">Status: {bill.paymentStatus}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-700 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-slate-100 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between items-center">
          <span>Esc to close</span>
          <span>{totalResults} items matching</span>
        </div>

      </div>
    </div>
  );
};
