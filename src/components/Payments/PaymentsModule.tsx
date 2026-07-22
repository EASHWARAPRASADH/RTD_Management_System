import React, { useState } from "react";
import { Bill, PaymentRecord, PaymentMode, User } from "../../types";
import { DatabaseService } from "../../services/db";
import { Wallet, DollarSign, Plus, CheckCircle2, Search, ArrowUpRight, Calendar } from "lucide-react";

interface PaymentsModuleProps {
  bills: Bill[];
  payments: PaymentRecord[];
  currentUser: User;
  onRefresh: () => void;
}

export const PaymentsModule: React.FC<PaymentsModuleProps> = ({
  bills,
  payments,
  currentUser,
  onRefresh
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState<string>(
    bills.find(b => b.balanceAmount > 0)?.id || ""
  );
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("UPI");
  const [referenceNo, setReferenceNo] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const pendingBills = bills.filter(b => b.balanceAmount > 0);
  const selectedBill = bills.find(b => b.id === selectedBillId);

  const handleOpenPayment = (bill: Bill) => {
    setSelectedBillId(bill.id);
    setPaymentAmount(bill.balanceAmount);
    setIsModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;

    DatabaseService.recordPayment({
      billId: selectedBill.id,
      billNo: selectedBill.billNo,
      customerId: selectedBill.customerId,
      customerName: selectedBill.customerName,
      paymentDate: new Date().toISOString().slice(0, 10),
      amount: paymentAmount,
      paymentMode,
      referenceNo,
      recordedBy: currentUser.name,
      notes
    });

    setIsModalOpen(false);
    onRefresh();
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            Collections & Payment Receipts
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Record customer collections against outstanding credit bills and track payment history.
          </p>
        </div>

        <button
          onClick={() => {
            if (pendingBills.length > 0) {
              handleOpenPayment(pendingBills[0]);
            }
          }}
          disabled={pendingBills.length === 0}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md text-xs transition-all flex items-center gap-2 shadow-xs disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Record Collection Payment</span>
        </button>
      </div>

      {/* Grid: Pending Invoices to Collect vs Recent Receipts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Pending Bills */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-red-600" />
            Unpaid / Credit Invoices ({pendingBills.length})
          </h3>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {pendingBills.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                All invoices settled! Zero outstanding collections due.
              </div>
            ) : (
              pendingBills.map((b) => (
                <div key={b.id} className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between hover:bg-slate-100 transition-all">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{b.customerName}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-blue-700">{b.billNo}</span>
                      <span>•</span>
                      <span>Due: {b.dueDate}</span>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="font-extrabold text-red-600 text-xs">
                      ₹{b.balanceAmount.toFixed(2)}
                    </div>
                    <button
                      onClick={() => handleOpenPayment(b)}
                      className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[10px] rounded border border-emerald-200 transition-all"
                    >
                      Collect Now
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Collection History */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Collection Receipts History ({payments.length})
          </h3>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {payments.map((p) => (
              <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-xs">{p.customerName}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-blue-700">{p.billNo}</span>
                    <span>•</span>
                    <span>{p.paymentMode}</span>
                    {p.referenceNo && <span>• Ref: {p.referenceNo}</span>}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-extrabold text-emerald-600 text-xs">
                    +₹{p.amount.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500">{p.paymentDate}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Record Payment Modal */}
      {isModalOpen && selectedBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-xl p-6 text-slate-800 space-y-5">
            
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Customer Payment</h3>
                <p className="text-xs text-slate-500 mt-0.5">Invoice #{selectedBill.billNo} • {selectedBill.customerName}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-3.5 text-xs">
              
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Pending Invoice</label>
                <select
                  value={selectedBillId}
                  onChange={(e) => {
                    setSelectedBillId(e.target.value);
                    const b = bills.find(x => x.id === e.target.value);
                    if (b) setPaymentAmount(b.balanceAmount);
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-900 font-semibold focus:outline-none focus:border-blue-600 transition-all"
                >
                  {pendingBills.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.billNo} - {b.customerName} (Due: ₹{b.balanceAmount.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Collection Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    max={selectedBill.balanceAmount}
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-900 font-bold focus:outline-none focus:border-blue-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Method</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-900 font-semibold focus:outline-none focus:border-blue-600 transition-all"
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="BANK_TRANSFER">Bank Wire</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reference / Cheque #</label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="e.g. UPI/902812 or CHQ-8821"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-900 font-mono focus:outline-none focus:border-blue-600 transition-all"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md transition-all shadow-xs"
                >
                  Confirm Receipt
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
