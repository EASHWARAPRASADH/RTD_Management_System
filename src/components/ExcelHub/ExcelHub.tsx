import React, { useState } from "react";
import { ExcelService, ImportValidationResult } from "../../services/excelService";
import { DatabaseService } from "../../services/db";
import { ExcelImportLog, User } from "../../types";
import { 
  FileSpreadsheet, Download, Upload, CheckCircle2, AlertTriangle, 
  X, ShieldCheck, Database, FileText, ArrowRight, Table
} from "lucide-react";

interface ExcelHubProps {
  currentUser: User;
  onRefreshData: () => void;
}

export const ExcelHub: React.FC<ExcelHubProps> = ({
  currentUser,
  onRefreshData
}) => {
  const [importTarget, setImportTarget] = useState<"CUSTOMERS" | "PRODUCTS">("CUSTOMERS");
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState<ImportValidationResult<any> | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const excelLogs = DatabaseService.getExcelLogs();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessing(true);

    try {
      if (importTarget === "CUSTOMERS") {
        const result = await ExcelService.parseCustomerExcel(file);
        setValidationResult(result);
      } else {
        const result = await ExcelService.parseProductExcel(file);
        setValidationResult(result);
      }
    } catch (err) {
      alert("Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls spreadsheet.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommitImport = () => {
    if (!validationResult || validationResult.validRows.length === 0) return;

    if (importTarget === "CUSTOMERS") {
      validationResult.validRows.forEach((custData: any) => {
        DatabaseService.addCustomer(custData);
      });
    } else {
      validationResult.validRows.forEach((prodData: any) => {
        DatabaseService.addProduct(prodData);
      });
    }

    DatabaseService.logExcelActivity({
      filename: selectedFile?.name || "Imported_Batch.xlsx",
      type: "IMPORT",
      target: importTarget,
      status: "SUCCESS",
      rowsProcessed: validationResult.validRows.length,
      rowsFailed: validationResult.invalidRows.length,
      uploadedBy: currentUser.name
    });

    alert(`Successfully imported ${validationResult.validRows.length} ${importTarget.toLowerCase()} into database!`);
    setValidationResult(null);
    setSelectedFile(null);
    onRefreshData();
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Excel Import & Export Operations Hub
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Bulk import customer master, product catalog, or download complete database multi-sheet Excel workbooks.
          </p>
        </div>

        <button
          onClick={() => ExcelService.exportFullDatabaseToExcel()}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md text-xs transition-all flex items-center gap-2 shadow-xs active:scale-95"
        >
          <Database className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Export Full Database Workbook</span>
        </button>
      </div>

      {/* Operations Grid: Download Templates & Upload Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Template Downloads */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Download className="w-4 h-4 text-blue-600" />
            1. Download Import Templates
          </h3>
          <p className="text-xs text-slate-500">
            Use our formatted Excel templates with predefined column headers to ensure 100% validation success.
          </p>

          <div className="space-y-2 pt-1">
            <button
              onClick={() => ExcelService.downloadCustomerTemplate()}
              className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-left text-xs text-slate-800 font-semibold transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-blue-600" />
                <span>Customer Master Template (.xlsx)</span>
              </div>
              <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </button>

            <button
              onClick={() => ExcelService.downloadProductTemplate()}
              className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-left text-xs text-slate-800 font-semibold transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-emerald-600" />
                <span>Product Catalog Template (.xlsx)</span>
              </div>
              <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </button>
          </div>
        </div>

        {/* Upload File Drag Box */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-emerald-600" />
              2. Upload Excel Spreadsheet
            </h3>

            {/* Target selector */}
            <div className="flex rounded-md bg-slate-100 p-1 border border-slate-200">
              <button
                onClick={() => { setImportTarget("CUSTOMERS"); setValidationResult(null); }}
                className={`px-2.5 py-0.5 rounded text-xs font-bold transition-all ${
                  importTarget === "CUSTOMERS" ? "bg-white text-blue-700 shadow-xs border border-slate-200" : "text-slate-600"
                }`}
              >
                Customers
              </button>
              <button
                onClick={() => { setImportTarget("PRODUCTS"); setValidationResult(null); }}
                className={`px-2.5 py-0.5 rounded text-xs font-bold transition-all ${
                  importTarget === "PRODUCTS" ? "bg-white text-emerald-700 shadow-xs border border-slate-200" : "text-slate-600"
                }`}
              >
                Products
              </button>
            </div>
          </div>

          <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-slate-100 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all group">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="p-3 rounded-lg bg-white border border-slate-200 text-slate-500 group-hover:text-blue-600 transition-colors mb-2 shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-800">
              Click or drag Excel spreadsheet (.xlsx) here
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Targeting: <strong className="text-slate-700">{importTarget} Master</strong>
            </p>
          </label>
        </div>

      </div>

      {/* Live Data Preview & Validation Matrix */}
      {validationResult && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3 shadow-xs animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Validation Preview ({validationResult.summary.total} Rows Read)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {validationResult.summary.validCount} valid rows ready to commit • {validationResult.summary.invalidCount} rows contain errors
              </p>
            </div>

            <button
              onClick={handleCommitImport}
              disabled={validationResult.validRows.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs transition-all shadow-xs disabled:opacity-50"
            >
              Commit {validationResult.validRows.length} Valid Rows to Database
            </button>
          </div>

          {/* Valid rows summary list */}
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs font-mono text-slate-800">
            <div className="font-bold text-emerald-700 mb-1">Sample Parsed Record Preview:</div>
            <pre className="overflow-x-auto text-[11px] text-slate-700">
              {JSON.stringify(validationResult.validRows.slice(0, 3), null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Excel Activity History Log Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Excel Operations Audit History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">File Name</th>
                <th className="p-3">Type</th>
                <th className="p-3">Target</th>
                <th className="p-3 text-right">Rows Processed</th>
                <th className="p-3">User</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {excelLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-3 font-mono font-bold text-slate-900">{log.filename}</td>
                  <td className="p-3 font-bold text-blue-700">{log.type}</td>
                  <td className="p-3 text-slate-700">{log.target}</td>
                  <td className="p-3 text-right font-bold font-mono text-slate-900">{log.rowsProcessed}</td>
                  <td className="p-3 text-slate-500">{log.uploadedBy}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[9px] uppercase">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
