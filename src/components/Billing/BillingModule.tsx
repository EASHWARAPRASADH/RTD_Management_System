import React, { useState } from "react";
import { Customer, Product, Bill, BillItem, UnitType, PaymentMode, User } from "../../types";
import { DatabaseService } from "../../services/db";
import { InvoiceModal } from "./InvoiceModal";
import { 
  ShoppingCart, Users, Package, Plus, Trash2, 
  ShieldAlert, CheckCircle2, Calculator, Store
} from "lucide-react";

interface BillingModuleProps {
  customers: Customer[];
  products: Product[];
  currentUser: User;
  onBillCreated: () => void;
}

export const BillingModule: React.FC<BillingModuleProps> = ({
  customers,
  products,
  currentUser,
  onBillCreated
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CREDIT");
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");

  // Items in bill start clean/empty (no pre-filled mock items)
  const [items, setItems] = useState<Omit<BillItem, "id">[]>([]);

  // Invoice Modal post save
  const [savedBill, setSavedBill] = useState<Bill | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Selected Customer details
  const currentCustomer = customers.find(c => c.id === selectedCustomerId);

  // Row calculation helper
  const calculateRow = (item: Omit<BillItem, "id">): Omit<BillItem, "id"> => {
    const prod = products.find(p => p.id === item.productId);
    const packSize = prod ? prod.packSize : (item.packSize || 1);
    const baseUnitPrice = prod ? prod.sellingPrice : 0;

    let totalUnits = item.quantity;
    let unitPrice = item.unitPrice;

    if (item.unitType === "CASE") {
      totalUnits = item.quantity * packSize;
      unitPrice = baseUnitPrice * packSize;
    } else {
      totalUnits = item.quantity;
      unitPrice = baseUnitPrice;
    }

    const rawTotal = item.quantity * unitPrice;
    const discountAmount = rawTotal * (item.discountRate / 100);
    const taxableAmount = rawTotal - discountAmount;
    const taxAmount = taxableAmount * (item.taxRate / 100);
    const lineTotal = taxableAmount + taxAmount;

    return {
      ...item,
      productCode: prod ? prod.code : item.productCode,
      productName: prod ? prod.name : item.productName,
      packSize,
      totalUnits,
      unitPrice,
      taxAmount,
      discountAmount,
      lineTotal
    };
  };

  const handleProductChange = (index: number, productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const newItems = [...items];
    const isCase = newItems[index].unitType === "CASE";

    newItems[index] = calculateRow({
      ...newItems[index],
      productId: prod.id,
      productCode: prod.code,
      productName: prod.name,
      packSize: prod.packSize,
      unitPrice: isCase ? prod.sellingPrice * prod.packSize : prod.sellingPrice,
      quantity: 1
    });

    setItems(newItems);
  };

  const handleUnitTypeChange = (index: number, unitType: UnitType) => {
    const newItems = [...items];
    newItems[index].unitType = unitType;
    setItems(newItems.map((it, i) => i === index ? calculateRow(it) : it));
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index].quantity = Math.max(1, quantity);
    setItems(newItems.map((it, i) => i === index ? calculateRow(it) : it));
  };

  const handleDiscountChange = (index: number, discountRate: number) => {
    const newItems = [...items];
    newItems[index].discountRate = Math.max(0, Math.min(100, discountRate));
    setItems(newItems.map((it, i) => i === index ? calculateRow(it) : it));
  };

  const handleAddItem = () => {
    if (!products || products.length === 0) return;
    const defaultProd = products[0];

    const newItem: Omit<BillItem, "id"> = calculateRow({
      productId: defaultProd.id,
      productCode: defaultProd.code,
      productName: defaultProd.name,
      unitType: "CASE",
      packSize: defaultProd.packSize,
      quantity: 1,
      totalUnits: defaultProd.packSize,
      unitPrice: defaultProd.sellingPrice * defaultProd.packSize,
      taxRate: 12,
      taxAmount: 0,
      discountRate: 0,
      discountAmount: 0,
      lineTotal: 0
    });

    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Grand Totals
  const subTotal = items.reduce((acc, it) => acc + (it.quantity * it.unitPrice - it.discountAmount), 0);
  const totalTax = items.reduce((acc, it) => acc + it.taxAmount, 0);
  const totalDiscount = items.reduce((acc, it) => acc + it.discountAmount, 0);
  const rawGrandTotal = subTotal + totalTax;
  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundOff = roundedGrandTotal - rawGrandTotal;

  // Credit Limit check
  const isCreditLimitExceeded = currentCustomer
    ? (currentCustomer.currentOutstanding + roundedGrandTotal) > currentCustomer.creditLimit
    : false;

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer) return;
    if (items.length === 0) return;

    const formattedItems: BillItem[] = items.map((it, idx) => ({
      ...it,
      id: `ITEM-${idx + 1}`
    }));

    let effectivePaid = amountPaid;
    if (paymentMode === "CASH" || paymentMode === "UPI") {
      effectivePaid = roundedGrandTotal;
    }

    const balanceAmount = Math.max(0, roundedGrandTotal - effectivePaid);
    const finalPaymentStatus = balanceAmount === 0 ? "PAID" : effectivePaid > 0 ? "PARTIAL" : "PENDING";

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const bill = DatabaseService.createBill({
      date: new Date().toISOString().slice(0, 10),
      customerId: currentCustomer.id,
      customerCode: currentCustomer.code,
      customerName: currentCustomer.name,
      customerPhone: currentCustomer.phone,
      customerGst: currentCustomer.gstNo,
      routeId: currentCustomer.routeId,
      routeName: currentCustomer.routeName,
      items: formattedItems,
      subTotal,
      totalTax,
      totalDiscount,
      roundOff,
      grandTotal: roundedGrandTotal,
      paymentStatus: finalPaymentStatus,
      paymentMode,
      amountPaid: effectivePaid,
      balanceAmount,
      dueDate: dueDate.toISOString().slice(0, 10),
      createdBy: currentUser.name,
      createdById: currentUser.id,
      notes
    });

    setSavedBill(bill);
    setIsInvoiceModalOpen(true);
    // Reset form after creation
    setItems([]);
    setSelectedCustomerId("");
    setNotes("");
    onBillCreated();
  };

  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            Billing Counter & Invoice Generator
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Select a customer outlet, add products to the bill, and print tax invoices instantly.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveInvoice} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Main Billing Area (Left 2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Step 1: Customer Selection Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Users className="w-4 h-4 text-blue-600" />
              1. Customer Shop Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Customer Shop *</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-600 transition-all"
                >
                  <option value="">-- Choose Customer Shop --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) - Due: ₹{c.currentOutstanding}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMode}
                  onChange={(e) => {
                    const mode = e.target.value as PaymentMode;
                    setPaymentMode(mode);
                    if (mode === "CASH" || mode === "UPI") {
                      setAmountPaid(roundedGrandTotal);
                    } else {
                      setAmountPaid(0);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-600 transition-all"
                >
                  <option value="CREDIT">Khata / Credit (Pending)</option>
                  <option value="UPI">UPI / Google Pay / PhonePe</option>
                  <option value="CASH">Cash Payment</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
            </div>

            {/* Selected Customer Details Banner */}
            {currentCustomer ? (
              <div className={`p-3 rounded-md border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs ${
                isCreditLimitExceeded 
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-blue-50/60 border-blue-200 text-slate-800"
              }`}>
                <div className="flex items-center gap-2">
                  <Store className={`w-4 h-4 ${isCreditLimitExceeded ? "text-red-600" : "text-blue-600"}`} />
                  <div>
                    <span className="font-bold text-slate-900">{currentCustomer.name}</span>
                    <span className="mx-1.5 text-slate-400">•</span>
                    <span>Route: {(currentCustomer.routeName || "General").split("-")[0]}</span>
                    <span className="mx-1.5 text-slate-400">•</span>
                    <span>Ph: {currentCustomer.phone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <span>Credit Limit: ₹{currentCustomer.creditLimit.toLocaleString()}</span>
                  <span className={`font-bold ${currentCustomer.currentOutstanding > 0 ? "text-red-600" : "text-emerald-700"}`}>
                    Due: ₹{currentCustomer.currentOutstanding.toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-500 italic">
                Select a customer shop above to display route details, credit limit, and current due balance.
              </div>
            )}
          </div>

          {/* Step 2: Line Items Table */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-600" />
                2. Items to Bill ({items.length})
              </h3>

              <button
                type="button"
                onClick={handleAddItem}
                disabled={products.length === 0}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs rounded transition-all flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>+ Add Product</span>
              </button>
            </div>

            <div className="space-y-2">
              {products.length === 0 ? (
                <div className="p-6 bg-slate-50 border border-slate-200 border-dashed rounded-md text-center space-y-2">
                  <Package className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No products in inventory</p>
                  <p className="text-[11px] text-slate-500">
                    Add products in <span className="font-semibold text-blue-600">Products & Stock</span> before generating a bill.
                  </p>
                </div>
              ) : items.length === 0 ? (
                <div className="p-8 bg-slate-50 border border-slate-200 border-dashed rounded-md text-center space-y-3">
                  <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto" />
                  <div>
                    <p className="text-xs font-bold text-slate-700">No items added to bill yet</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Click "+ Add Product" above to add products to this invoice.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition-all shadow-xs"
                  >
                    + Add Product to Bill
                  </button>
                </div>
              ) : (
                items.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-md grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center text-xs transition-all hover:border-slate-300"
                  >
                    
                    {/* Product Selector */}
                    <div className="md:col-span-4">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Product Name</label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-bold focus:outline-none focus:border-blue-600"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} (₹{p.sellingPrice.toFixed(2)}/unit)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Unit Type (Case vs Unit) */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Packing Type</label>
                      <select
                        value={item.unitType}
                        onChange={(e) => handleUnitTypeChange(index, e.target.value as UnitType)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-800 font-medium focus:outline-none focus:border-blue-600"
                      >
                        <option value="CASE">FULL CASE ({item.packSize})</option>
                        <option value="UNIT">LOOSE BOTTLE</option>
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, parseInt(e.target.value, 10) || 1)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-bold text-center focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    {/* Discount % */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Disc %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discountRate}
                        onChange={(e) => handleDiscountChange(index, parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-800 text-center focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    {/* Line Total & Remove Button */}
                    <div className="md:col-span-2 flex items-center justify-between gap-2 pt-1 md:pt-0">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500">Line Total</div>
                        <div className="font-extrabold text-slate-900 font-mono text-xs">
                          ₹{item.lineTotal.toFixed(2)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remove product line"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Step 3: Payment Summary Side Panel */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs sticky top-20">
            
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2.5">
              <Calculator className="w-4 h-4 text-purple-600" />
              Bill Payment Summary
            </h3>

            {/* Calculations List */}
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal:</span>
                <span className="font-mono font-medium">₹{subTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">GST Tax (12%):</span>
                <span className="font-mono font-medium">₹{totalTax.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-emerald-700">
                <span>Discount:</span>
                <span className="font-mono font-medium">-₹{totalDiscount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Round Off:</span>
                <span className="font-mono font-medium">₹{roundOff.toFixed(2)}</span>
              </div>

              <div className="border-t border-slate-200 pt-2.5 flex justify-between items-baseline">
                <span className="text-sm font-extrabold text-slate-900">Total Bill Amount:</span>
                <span className="text-2xl font-black text-blue-600 font-mono">
                  ₹{roundedGrandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Optional Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Bill Notes (Optional)</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Delivered by Van #1..."
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={items.length === 0 || !currentCustomer}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-md shadow-sm transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>SAVE & PRINT BILL</span>
            </button>

            {(!currentCustomer || items.length === 0) && (
              <p className="text-[10px] text-slate-500 text-center italic">
                {!currentCustomer ? "Select a customer shop to enable billing" : "Add at least one product item to bill"}
              </p>
            )}

          </div>
        </div>

      </form>

      {/* Invoice Post-Creation Modal */}
      {savedBill && (
        <InvoiceModal
          bill={savedBill}
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
        />
      )}

    </div>
  );
};
