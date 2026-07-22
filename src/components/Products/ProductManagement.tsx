import React, { useState } from "react";
import { Product } from "../../types";
import { DatabaseService } from "../../services/db";
import { ExcelService } from "../../services/excelService";
import { 
  Package, Search, Plus, FileSpreadsheet, Edit3, AlertTriangle, 
  Layers, Tag, CheckCircle2, RefreshCw, Barcode, X, Trash2
} from "lucide-react";

interface ProductManagementProps {
  products: Product[];
  onRefresh: () => void;
  onOpenRestockModal: (product: Product) => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({
  products,
  onRefresh,
  onOpenRestockModal
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const defaultCategories: string[] = [
    "Energy Drink", "Iced Coffee", "Iced Tea", "Sparkling Soda", "Flavored Milk", "Juice RTD", "Isotonic / Sports"
  ];

  // Dynamic Category Master combining default list and existing product categories
  const categoryMaster = Array.from(
    new Set([...defaultCategories, ...products.map(p => p.category).filter(Boolean)])
  );

  const containerUnitTypes = [
    "250ml Can", "500ml PET Bottle", "330ml Glass Bottle", "200ml Tetra Pack", "355ml Can", "750ml Glass Bottle", "180ml Pouch"
  ];

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    category: (categoryMaster[0] || "Energy Drink") as Product["category"],
    mrp: "" as unknown as number,
    sellingPrice: "" as unknown as number,
    packSize: "" as unknown as number,
    unit: "",
    stockCases: "" as unknown as number,
    stockUnits: 0,
    minStockAlertCases: "" as unknown as number,
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    barcode: ""
  });

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState("");

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsCustomCategory(false);
    setCustomCategoryInput("");
    setFormData({
      code: "",
      name: "",
      category: (categoryMaster[0] || "Energy Drink") as Product["category"],
      mrp: "" as unknown as number,
      sellingPrice: "" as unknown as number,
      packSize: "" as unknown as number,
      unit: "",
      stockCases: "" as unknown as number,
      stockUnits: 0,
      minStockAlertCases: "" as unknown as number,
      status: "ACTIVE",
      barcode: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setIsCustomCategory(false);
    setCustomCategoryInput("");
    setFormData({
      code: product.code,
      name: product.name,
      category: product.category,
      mrp: product.mrp,
      sellingPrice: product.sellingPrice,
      packSize: product.packSize,
      unit: product.unit,
      stockCases: product.stockCases,
      stockUnits: product.stockUnits,
      minStockAlertCases: product.minStockAlertCases,
      status: product.status,
      barcode: product.barcode
    });
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete product "${name}"?`)) {
      DatabaseService.deleteProduct(id);
      onRefresh();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = isCustomCategory && customCategoryInput.trim() 
      ? customCategoryInput.trim() 
      : formData.category;

    const dataToSave = {
      ...formData,
      category: finalCategory as Product["category"],
      mrp: Number(formData.mrp) || 0,
      sellingPrice: Number(formData.sellingPrice) || 0,
      packSize: Number(formData.packSize) || 24,
      stockCases: Number(formData.stockCases) || 0,
      minStockAlertCases: Number(formData.minStockAlertCases) || 10,
      unit: formData.unit.trim() || "Units/Bottles",
      barcode: formData.barcode.trim() || `890${Math.floor(1000000000 + Math.random() * 9000000000)}`
    };

    if (editingProduct) {
      DatabaseService.updateProduct(editingProduct.id, dataToSave);
    } else {
      DatabaseService.addProduct(dataToSave);
    }
    setIsModalOpen(false);
    onRefresh();
  };

  const categories = categoryMaster;

  const filteredProducts = products.filter(p => {
    const matchesQuery = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm);

    const matchesCategory = selectedCategory === "ALL" || p.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            RTD Product Master & Stock Catalog
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Beverage SKU catalog, case pack sizes, wholesale pricing, and stock level tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => ExcelService.exportReportToExcel("Product_Catalog", products)}
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
            <span>Add New Product SKU</span>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search SKU name, code, barcode..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:border-blue-600 transition-all"
          >
            <option value="ALL">All Beverage Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">SKU Code & Product</th>
                <th className="p-3">Category & Unit</th>
                <th className="p-3 text-right">MRP</th>
                <th className="p-3 text-right">Selling Price</th>
                <th className="p-3 text-center">Pack Size</th>
                <th className="p-3 text-center">Stock Inventory</th>
                <th className="p-3">Barcode</th>
                <th className="p-3 text-right">Stock Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No beverage SKUs found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const isLowStock = prod.stockCases <= prod.minStockAlertCases;
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                      
                      {/* Code & Name */}
                      <td className="p-3">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{prod.name}</span>
                          {isLowStock && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-bold flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Low Stock</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-emerald-700 mt-0.5">{prod.code}</div>
                      </td>

                      {/* Category */}
                      <td className="p-3 space-y-0.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          {prod.category}
                        </span>
                        <div className="text-[10px] text-slate-500">{prod.unit}</div>
                      </td>

                      {/* MRP */}
                      <td className="p-3 text-right font-medium text-slate-500">
                        ₹{prod.mrp.toFixed(2)}
                      </td>

                      {/* Selling Price */}
                      <td className="p-3 text-right font-bold text-emerald-700 text-xs">
                        ₹{prod.sellingPrice.toFixed(2)}
                      </td>

                      {/* Pack Size */}
                      <td className="p-3 text-center font-medium text-slate-700">
                        {prod.packSize} / Case
                      </td>

                      {/* Stock Inventory */}
                      <td className="p-3 text-center">
                        <div className={`font-bold text-xs ${isLowStock ? "text-amber-700" : "text-slate-900"}`}>
                          {prod.stockCases} Cases
                        </div>
                        {prod.stockUnits > 0 && (
                          <div className="text-[9px] text-slate-500">+ {prod.stockUnits} units</div>
                        )}
                      </td>

                      {/* Barcode */}
                      <td className="p-3 font-mono text-slate-500 text-[10px] flex items-center gap-1">
                        <Barcode className="w-3 h-3 text-slate-400" />
                        <span>{prod.barcode}</span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right space-x-1">
                        <button
                          onClick={() => onOpenRestockModal(prod)}
                          className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] border border-emerald-200 transition-colors inline-flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Adjust Stock</span>
                        </button>

                        <button
                          onClick={() => handleOpenEdit(prod)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Edit SKU Details"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(prod.id, prod.name)}
                          className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                          title="Delete SKU"
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

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl p-6 text-slate-800 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                {editingProduct ? "Edit Beverage SKU" : "Register New Beverage SKU"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Monster Energy Ultra Zero 500ml Can"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-semibold">Category (Category Master)</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomCategory(!isCustomCategory)}
                      className="text-[10px] text-blue-600 hover:underline font-bold"
                    >
                      {isCustomCategory ? "Select from Master" : "+ Custom Category"}
                    </button>
                  </div>
                  {isCustomCategory ? (
                    <input
                      type="text"
                      required
                      value={customCategoryInput}
                      onChange={(e) => setCustomCategoryInput(e.target.value)}
                      placeholder="Enter new category name..."
                      className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 transition-all"
                    />
                  ) : (
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 transition-all"
                    >
                      {categoryMaster.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Container Unit Type</label>
                  <input
                    type="text"
                    list="container-units-list"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="250ml Can / 500ml Bottle..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 transition-all"
                  />
                  <datalist id="container-units-list">
                    {containerUnitTypes.map(u => (
                      <option key={u} value={u} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    placeholder="e.g. 60"
                    value={formData.mrp === 0 || formData.mrp ? formData.mrp : ''}
                    onChange={(e) => setFormData({ ...formData, mrp: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Selling Price (₹)*</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    required
                    placeholder="e.g. 50"
                    value={formData.sellingPrice === 0 || formData.sellingPrice ? formData.sellingPrice : ''}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Pack Size (Units/Case)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 24"
                    value={formData.packSize === 0 || formData.packSize ? formData.packSize : ''}
                    onChange={(e) => setFormData({ ...formData, packSize: e.target.value === '' ? ('' as any) : parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Initial Stock (Cases)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 50"
                    value={formData.stockCases === 0 || formData.stockCases ? formData.stockCases : ''}
                    onChange={(e) => setFormData({ ...formData, stockCases: e.target.value === '' ? ('' as any) : parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Min Stock Alert (Cases)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 10"
                    value={formData.minStockAlertCases === 0 || formData.minStockAlertCases ? formData.minStockAlertCases : ''}
                    onChange={(e) => setFormData({ ...formData, minStockAlertCases: e.target.value === '' ? ('' as any) : parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Barcode</label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="e.g. 8908086880174"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md font-mono text-slate-900 focus:outline-none focus:border-blue-600 transition-all"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md transition-all shadow-xs"
                >
                  {editingProduct ? "Save Changes" : "Register Product"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
