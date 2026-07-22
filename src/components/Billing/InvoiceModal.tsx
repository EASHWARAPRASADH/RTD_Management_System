import React, { useState } from "react";
import { Bill } from "../../types";
import { PDFService } from "../../services/pdfService";
import { DatabaseService } from "../../services/db";
import { 
  FileText, Download, Printer, Share2, X, CheckCircle2, 
  QrCode, ExternalLink, Sparkles, Building2, Phone, Mail, Landmark
} from "lucide-react";

interface InvoiceModalProps {
  bill: Bill;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  bill,
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shop = DatabaseService.getShopSettings();

  // Generate UPI QR string
  const upiVpa = shop.upiVpa || "rtdlogistics@bank";
  const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=${upiVpa}&pn=${encodeURIComponent(shop.shopName)}&am=${bill.grandTotal}&cu=INR`)}`;

  // WhatsApp share link generator
  const whatsappMessage = encodeURIComponent(
    `*${shop.shopName.toUpperCase()} - TAX INVOICE*\nInvoice No: ${bill.billNo}\nDate: ${bill.date}\nCustomer: ${bill.customerName}\n*Grand Total: ₹${bill.grandTotal.toFixed(2)}*\nStatus: ${bill.paymentStatus}\nThank you for your business!`
  );
  const whatsappUrl = `https://wa.me/${bill.customerPhone.replace(/[^0-9]/g, "")}?text=${whatsappMessage}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden text-slate-800 my-8">
        
        {/* Header Bar */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-100 text-blue-700">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Invoice Preview: {bill.billNo}</h3>
              <p className="text-[11px] text-slate-500">Billed to {bill.customerName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => PDFService.generateInvoicePDF(bill)}
              className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="p-8 bg-white text-slate-900 space-y-6 select-text" id="printable-area">
          
          {/* Top Brand Banner */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{shop.shopName}</h2>
              <p className="text-xs font-medium text-blue-700">{shop.tagline}</p>
              <p className="text-xs text-slate-500">{shop.address}, {shop.cityStatePincode}</p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 pt-0.5">
                <span>Ph: <strong>{shop.phone}</strong></span>
                {shop.gstin && <span>GSTIN: <strong className="font-mono">{shop.gstin}</strong></span>}
                {shop.fssaiNo && <span>FSSAI: <strong className="font-mono">{shop.fssaiNo}</strong></span>}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-block px-3 py-1 rounded-md bg-slate-900 text-white text-xs font-bold tracking-wide">
                {shop.invoiceTitle || "TAX INVOICE"}
              </span>
              <p className="text-xs font-bold text-slate-900 mt-2">{bill.billNo}</p>
              <p className="text-xs text-slate-500">Date: {bill.date}</p>
              <p className="text-xs text-slate-500">Payment: <strong className="text-slate-800">{bill.paymentMode}</strong></p>
            </div>
          </div>

          {/* Customer & Route Meta Box */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <p className="font-bold uppercase text-slate-400 text-[10px] tracking-wider">Billed To (Outlet)</p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{bill.customerName}</p>
              <p className="text-slate-600">Code: {bill.customerCode} | GSTIN: {bill.customerGst || "N/A"}</p>
              <p className="text-slate-600">Phone: {bill.customerPhone}</p>
            </div>

            <div className="text-right">
              <p className="font-bold uppercase text-slate-400 text-[10px] tracking-wider">Route & Logistics</p>
              <p className="font-semibold text-slate-800 mt-0.5">{bill.routeName}</p>
              <p className="text-slate-600">Issued By: {bill.createdBy}</p>
              <p className="text-slate-600">Due Date: {bill.dueDate}</p>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-[11px]">
                <th className="p-2.5 rounded-l-lg">#</th>
                <th className="p-2.5">Beverage Item Description</th>
                <th className="p-2.5 text-center">Qty / Packs</th>
                <th className="p-2.5 text-right">Unit Price</th>
                <th className="p-2.5 text-center">Tax %</th>
                <th className="p-2.5 text-right">Discount</th>
                <th className="p-2.5 text-right rounded-r-lg">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {bill.items.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="p-2.5 font-medium text-slate-500">{index + 1}</td>
                  <td className="p-2.5 font-bold text-slate-800">{item.productName}</td>
                  <td className="p-2.5 text-center text-slate-600">
                    {item.unitType === "CASE" ? `${item.quantity} Cases (${item.totalUnits} cans)` : `${item.quantity} Single Units`}
                  </td>
                  <td className="p-2.5 text-right font-mono">₹{item.unitPrice.toFixed(2)}</td>
                  <td className="p-2.5 text-center">{item.taxRate}%</td>
                  <td className="p-2.5 text-right font-mono text-emerald-600">-₹{item.discountAmount.toFixed(2)}</td>
                  <td className="p-2.5 text-right font-bold font-mono text-slate-900">₹{item.lineTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals, Bank Info & QR Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end border-t border-slate-200 pt-4">
            
            {/* Left Box: UPI QR & Bank Account Details */}
            <div className="space-y-3">
              {shop.showUpiQrOnInvoice && shop.upiVpa && (
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 max-w-sm">
                  <img src={upiQrUrl} alt="UPI QR Code" className="w-20 h-20 rounded-lg border border-slate-300 shrink-0" />
                  <div className="text-[11px] space-y-1">
                    <p className="font-bold text-slate-800 flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-sky-600" />
                      Instant UPI Payment
                    </p>
                    <p className="text-slate-500">Scan QR using GPay, PhonePe, or Paytm.</p>
                    <p className="font-mono text-slate-700 text-[10px] font-semibold">UPI: {shop.upiVpa}</p>
                  </div>
                </div>
              )}

              {/* Bank Account */}
              {shop.bankName && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] space-y-1 max-w-sm">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-blue-600" />
                    <span>Bank Transfer Details (NEFT / RTGS)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 text-slate-600">
                    <span>Bank Name: <strong className="text-slate-800">{shop.bankName}</strong></span>
                    <span>IFSC: <strong className="font-mono text-slate-800">{shop.ifscCode}</strong></span>
                    <span className="col-span-2">A/C No: <strong className="font-mono text-slate-800">{shop.accountNumber}</strong></span>
                    <span className="col-span-2">A/C Name: <strong className="text-slate-800">{shop.accountHolder}</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Box: Totals */}
            <div className="space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-slate-600"><span>Subtotal:</span> <span>₹{bill.subTotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-600"><span>GST Tax Total:</span> <span>₹{bill.totalTax.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Total Discounts:</span> <span className="text-emerald-600">-₹{bill.totalDiscount.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Round Off:</span> <span>₹{bill.roundOff.toFixed(2)}</span></div>
              
              <div className="border-t border-slate-900 pt-2 flex justify-between font-extrabold text-sm text-slate-900">
                <span>Grand Total:</span>
                <span>₹{bill.grandTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-600 pt-1">
                <span>Amount Paid:</span>
                <span>₹{bill.amountPaid.toFixed(2)}</span>
              </div>

              <div className="flex justify-between font-bold text-rose-600 border-t border-slate-200 pt-1">
                <span>Balance Outstanding:</span>
                <span>₹{bill.balanceAmount.toFixed(2)}</span>
              </div>
            </div>

          </div>

          <div className="text-[10px] text-slate-500 border-t border-slate-200 pt-3 space-y-1">
            <p className="font-semibold text-slate-700">{shop.termsAndConditions}</p>
            <p className="text-slate-400">This is a computer-generated tax invoice issued by {shop.shopName}.</p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Send WhatsApp Invoice Link</span>
          </a>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded transition-all"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};
