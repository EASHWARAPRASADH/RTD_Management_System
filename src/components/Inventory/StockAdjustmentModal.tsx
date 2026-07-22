import React, { useState } from "react";
import { Product } from "../../types";
import { DatabaseService } from "../../services/db";
import { RefreshCw, Package, X, CheckCircle2 } from "lucide-react";

interface StockAdjustmentModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  product,
  isOpen,
  onClose,
  onRefresh
}) => {
  const [casesChanged, setCasesChanged] = useState<number>(0);
  const [unitsChanged, setUnitsChanged] = useState<number>(0);
  const [reason, setReason] = useState<string>("Stock Receipt / Warehouse Delivery");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    DatabaseService.adjustStock(product.id, casesChanged, unitsChanged, reason);
    onRefresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-lg w-full max-w-md shadow-xl p-5 text-slate-800 space-y-4">
        
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4 text-emerald-600" />
            Adjust Inventory Stock
          </h3>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-50 p-3 rounded-md border border-slate-200 text-xs space-y-0.5">
          <div className="font-bold text-slate-900 text-xs">{product.name}</div>
          <div className="text-slate-500 font-mono text-[11px]">Code: {product.code} • Pack: {product.packSize} Cans/Case</div>
          <div className="text-emerald-700 font-bold text-xs mt-1">Current Stock: {product.stockCases} Cases ({product.stockUnits} loose cans)</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-bold mb-1">Adjust Cases (+/-)</label>
              <input
                type="number"
                required
                value={casesChanged}
                onChange={(e) => setCasesChanged(parseInt(e.target.value, 10) || 0)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-bold text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Adjust Loose Cans (+/-)</label>
              <input
                type="number"
                value={unitsChanged}
                onChange={(e) => setUnitsChanged(parseInt(e.target.value, 10) || 0)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-bold text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">Audit Reason *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-medium text-xs"
            >
              <option value="Stock Receipt / Warehouse Delivery">Stock Receipt / Warehouse Delivery</option>
              <option value="Damaged Goods / Transit Loss">Damaged Goods / Transit Loss</option>
              <option value="Expired Stock Removal">Expired Stock Removal</option>
              <option value="Physical Stock Audit Correction">Physical Stock Audit Correction</option>
              <option value="Sample / Marketing Distribution">Sample / Marketing Distribution</option>
            </select>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs shadow-xs"
            >
              Confirm Adjustment
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
