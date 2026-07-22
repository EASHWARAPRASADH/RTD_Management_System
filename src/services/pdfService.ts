import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Bill } from "../types";
import { DatabaseService } from "./db";

export class PDFService {
  static generateInvoicePDF(bill: Bill): void {
    const doc = new jsPDF();
    const shop = DatabaseService.getShopSettings();

    // Header Background Accent
    doc.setFillColor(15, 23, 42); // Dark Navy Slate
    doc.rect(0, 0, 210, 36, "F");

    // Company Header Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text((shop.shopName || "RTD DISTRO").toUpperCase(), 14, 16);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text(shop.tagline || "Wholesale Beverage Logistics", 14, 23);
    doc.text(`Ph: ${shop.phone} | GSTIN: ${shop.gstin}`, 14, 29);
    doc.text((shop.invoiceTitle || "TAX INVOICE").toUpperCase(), 145, 23);

    // Invoice Title & Meta Box
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`INVOICE NO: ${bill.billNo}`, 14, 46);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${bill.date}`, 14, 52);
    doc.text(`Payment Mode: ${bill.paymentMode}`, 14, 57);
    doc.text(`Due Date: ${bill.dueDate}`, 14, 62);
    if (shop.upiVpa) {
      doc.text(`UPI VPA: ${shop.upiVpa}`, 14, 67);
    }

    // Bill To Box
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(115, 40, 81, 30, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.text("CUSTOMER DETAILS:", 119, 46);
    doc.setFont("helvetica", "normal");
    doc.text(`${bill.customerName}`, 119, 52);
    doc.text(`Code: ${bill.customerCode} | Phone: ${bill.customerPhone}`, 119, 57);
    doc.text(`GSTIN: ${bill.customerGst || "N/A"}`, 119, 62);

    // Items Table
    const tableRows = bill.items.map((item, index) => [
      (index + 1).toString(),
      item.productName,
      item.unitType === "CASE" ? `${item.quantity} Cases (${item.totalUnits} cans)` : `${item.quantity} Units`,
      `Rs. ${item.unitPrice.toFixed(2)}`,
      `${item.taxRate}%`,
      `Rs. ${item.discountAmount.toFixed(2)}`,
      `Rs. ${item.lineTotal.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 74,
      head: [["#", "Product Description", "Qty", "Unit Price", "Tax %", "Discount", "Line Total"]],
      body: tableRows,
      theme: "striped",
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [51, 65, 85]
      },
      alternateRowStyles: {
        fillColor: [241, 245, 249]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 70 },
        2: { cellWidth: 35 },
        3: { cellWidth: 20, halign: "right" },
        4: { cellWidth: 15, halign: "center" },
        5: { cellWidth: 18, halign: "right" },
        6: { cellWidth: 22, halign: "right" }
      }
    });

    // Summary Box Calculation
    const finalY = (doc as any).lastAutoTable.finalY || 140;

    doc.setDrawColor(203, 213, 225);
    doc.line(120, finalY + 8, 196, finalY + 8);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text("Sub Total:", 120, finalY + 15);
    doc.text(`Rs. ${bill.subTotal.toFixed(2)}`, 196, finalY + 15, { align: "right" });

    doc.text("GST Tax Total:", 120, finalY + 21);
    doc.text(`Rs. ${bill.totalTax.toFixed(2)}`, 196, finalY + 21, { align: "right" });

    doc.text("Discounts:", 120, finalY + 27);
    doc.text(`-Rs. ${bill.totalDiscount.toFixed(2)}`, 196, finalY + 27, { align: "right" });

    doc.text("Round Off:", 120, finalY + 33);
    doc.text(`Rs. ${bill.roundOff.toFixed(2)}`, 196, finalY + 33, { align: "right" });

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.line(120, finalY + 37, 196, finalY + 37);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("GRAND TOTAL:", 120, finalY + 44);
    doc.text(`Rs. ${bill.grandTotal.toFixed(2)}`, 196, finalY + 44, { align: "right" });

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text("Amount Paid:", 120, finalY + 50);
    doc.text(`Rs. ${bill.amountPaid.toFixed(2)}`, 196, finalY + 50, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(bill.balanceAmount > 0 ? 185 : 16, bill.balanceAmount > 0 ? 28 : 185, 28);
    doc.text("BALANCE DUE:", 120, finalY + 56);
    doc.text(`Rs. ${bill.balanceAmount.toFixed(2)}`, 196, finalY + 56, { align: "right" });

    // Bank Details on Left Side of Footer if available
    doc.setTextColor(51, 65, 85);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("BANK PAYMENT DETAILS:", 14, finalY + 15);
    doc.setFont("helvetica", "normal");
    doc.text(`Bank: ${shop.bankName || "N/A"}`, 14, finalY + 20);
    doc.text(`A/C Name: ${shop.accountHolder || "N/A"}`, 14, finalY + 25);
    doc.text(`A/C No: ${shop.accountNumber || "N/A"}`, 14, finalY + 30);
    doc.text(`IFSC: ${shop.ifscCode || "N/A"}`, 14, finalY + 35);

    // Terms & Signatures Footer
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.text(shop.termsAndConditions || "Thank you for your business!", 14, finalY + 64);
    doc.text(`Billed by: ${bill.createdBy} | Route: ${bill.routeName} | Address: ${shop.address}`, 14, finalY + 69);

    // Save File
    doc.save(`Invoice_${bill.billNo}.pdf`);
  }
}
