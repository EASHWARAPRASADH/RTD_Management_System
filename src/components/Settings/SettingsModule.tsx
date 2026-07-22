import React, { useState } from "react";
import { ShopSettings, User } from "../../types";
import { DatabaseService } from "../../services/db";
import { 
  Building2, Store, FileText, Landmark, QrCode, 
  Save, CheckCircle2, RefreshCw, ShieldAlert, Sparkles, Phone, Mail, MapPin, Receipt, Trash2, Database, ShieldCheck
} from "lucide-react";

interface SettingsModuleProps {
  currentUser: User;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ currentUser }) => {
  const [settings, setSettings] = useState<ShopSettings>(() => DatabaseService.getShopSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "bank" | "invoice" | "data">("general");
  const [isClearing, setIsClearing] = useState(false);

  const handleChange = (field: keyof ShopSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    if (savedSuccess) setSavedSuccess(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    DatabaseService.saveShopSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset settings to default values?")) {
      localStorage.removeItem("rtd_shop_settings");
      const defaultSet = DatabaseService.getShopSettings();
      setSettings(defaultSet);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handleClearDemoData = async () => {
    if (window.confirm("CRITICAL WARNING: Are you sure you want to clear ALL demo data (products, customers, bills, payments, audit logs) for production mode? This will erase sample records from both local storage and Cloud Firestore.")) {
      setIsClearing(true);
      await DatabaseService.clearAllData();
      setIsClearing(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    }
  };

  const handleRestoreSampleData = () => {
    if (window.confirm("Restore sample demo dataset? This will load pre-populated beverage items, distributor clients, and sample invoices.")) {
      DatabaseService.resetToSampleData();
      window.dispatchEvent(new Event("rtd_db_updated"));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Shop & Invoice Settings</h1>
              <p className="text-xs text-slate-500 font-medium">Configure firm details, GSTIN, bank accounts, and invoice headers</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save All Settings</span>
          </button>
        </div>
      </div>

      {/* Save Success Alert */}
      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Shop details & invoice preferences saved successfully! All generated bills, PDFs, and QR codes will now use these settings.</span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center border-b border-slate-200 gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab("general")}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "general"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Shop & Business Profile</span>
        </button>

        <button
          onClick={() => setActiveTab("bank")}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "bank"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Bank & UPI Payments</span>
        </button>

        <button
          onClick={() => setActiveTab("invoice")}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "invoice"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Invoice & Printing Setup</span>
        </button>

        <button
          onClick={() => setActiveTab("data")}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "data"
              ? "border-red-600 text-red-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Production & Data Mode</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* TAB 1: SHOP PROFILE */}
        {activeTab === "general" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form Fields */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Store className="w-4 h-4 text-blue-600" />
                Firm & Organization Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Shop / Firm Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.shopName}
                    onChange={e => handleChange("shopName", e.target.value)}
                    placeholder="e.g. RTD Distro & Wholesale Beverages"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Business Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={settings.tagline}
                    onChange={e => handleChange("tagline", e.target.value)}
                    placeholder="e.g. Wholesale Beverage Logistics"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Street Address / Premises *
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.address}
                    onChange={e => handleChange("address", e.target.value)}
                    placeholder="e.g. Plot 42, Beverage Industrial Estate, Market Yard"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City, State & Pincode *
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.cityStatePincode}
                    onChange={e => handleChange("cityStatePincode", e.target.value)}
                    placeholder="e.g. Pune, Maharashtra - 411037"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Phone / Mobile *
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.phone}
                    onChange={e => handleChange("phone", e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={e => handleChange("email", e.target.value)}
                    placeholder="e.g. contact@rtddistro.com"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    GSTIN Registration No.
                  </label>
                  <input
                    type="text"
                    value={settings.gstin}
                    onChange={e => handleChange("gstin", e.target.value.toUpperCase())}
                    placeholder="e.g. 27AAACR1234F1Z5"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-mono tracking-wider"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    FSSAI License Number (Food & Beverages)
                  </label>
                  <input
                    type="text"
                    value={settings.fssaiNo}
                    onChange={e => handleChange("fssaiNo", e.target.value)}
                    placeholder="e.g. 11521000001234"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Live Invoice Header Card Preview */}
            <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-md space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">
                  <span>Live Invoice Header Preview</span>
                  <span className="text-blue-400">SAMPLE</span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black tracking-tight text-white">{settings.shopName || "YOUR SHOP NAME"}</h3>
                  <p className="text-xs text-blue-400 font-semibold">{settings.tagline || "Your Tagline"}</p>
                  <p className="text-xs text-slate-300 leading-snug">{settings.address || "Address Line 1"}</p>
                  <p className="text-xs text-slate-300">{settings.cityStatePincode}</p>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1 text-xs text-slate-300">
                  <p><strong>Phone:</strong> {settings.phone || "+91 0000000000"}</p>
                  <p><strong>GSTIN:</strong> <span className="font-mono text-amber-300">{settings.gstin || "N/A"}</span></p>
                  {settings.fssaiNo && <p><strong>FSSAI Lic:</strong> <span className="font-mono text-emerald-300">{settings.fssaiNo}</span></p>}
                </div>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/60 text-[11px] text-slate-400">
                💡 This information will automatically be printed at the top of every generated tax invoice & PDF bill.
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: BANK & UPI PAYMENTS */}
        {activeTab === "bank" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* UPI Details */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <QrCode className="w-4 h-4 text-sky-600" />
                UPI Payment QR Configuration
              </h2>

              <p className="text-xs text-slate-500">
                Enter your shop's UPI VPA / ID. A payment QR code will automatically be embedded into invoices for instant customer payments via Google Pay, PhonePe, or Paytm.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  UPI VPA / ID *
                </label>
                <input
                  type="text"
                  value={settings.upiVpa}
                  onChange={e => handleChange("upiVpa", e.target.value.toLowerCase())}
                  placeholder="e.g. rtdlogistics@bank"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-mono font-bold text-blue-700"
                />
              </div>

              <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg flex items-center gap-3">
                <QrCode className="w-8 h-8 text-sky-600 shrink-0" />
                <div className="text-xs text-sky-900 space-y-0.5">
                  <p className="font-bold">Automated Payment QR</p>
                  <p className="text-[11px] text-sky-700">Calculates exact grand total dynamically for every customer bill.</p>
                </div>
              </div>
            </div>

            {/* Bank Transfer Details */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Landmark className="w-4 h-4 text-emerald-600" />
                Direct Bank Account (NEFT / RTGS)
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={settings.bankName}
                    onChange={e => handleChange("bankName", e.target.value)}
                    placeholder="e.g. HDFC Bank Ltd."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={settings.accountHolder}
                    onChange={e => handleChange("accountHolder", e.target.value)}
                    placeholder="e.g. RTD Distro Private Limited"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={settings.accountNumber}
                      onChange={e => handleChange("accountNumber", e.target.value)}
                      placeholder="e.g. 50200012345678"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={settings.ifscCode}
                      onChange={e => handleChange("ifscCode", e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0001234"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: INVOICE SETUP */}
        {activeTab === "invoice" && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-4 h-4 text-blue-600" />
              Invoice Document & Billing Rules
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Invoice Header Title *
                </label>
                <input
                  type="text"
                  required
                  value={settings.invoiceTitle}
                  onChange={e => handleChange("invoiceTitle", e.target.value)}
                  placeholder="TAX INVOICE & DELIVERY MANIFEST"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-bold"
                />
                <p className="text-[11px] text-slate-400 mt-1">Title printed at the top right of bills & PDFs.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Default GST Rate (%)
                </label>
                <select
                  value={settings.defaultGstRate}
                  onChange={e => handleChange("defaultGstRate", Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-semibold"
                >
                  <option value={5}>5% GST Rate</option>
                  <option value={12}>12% GST Rate (Beverage Standard)</option>
                  <option value={18}>18% GST Rate</option>
                  <option value={28}>28% GST Rate (Energy Drinks)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Pre-selected tax percentage when adding items in POS billing.</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Invoice Footer Terms & Conditions *
                </label>
                <textarea
                  rows={3}
                  required
                  value={settings.termsAndConditions}
                  onChange={e => handleChange("termsAndConditions", e.target.value)}
                  placeholder="Thank you for your business! Goods once sold will not be returned unless damaged in transit."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              {/* Toggles */}
              <div className="md:col-span-2 space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Embed UPI QR Code on Printed Invoices</p>
                    <p className="text-[11px] text-slate-500">Includes live QR code on bottom left of printed bills and PDF files.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showUpiQrOnInvoice}
                    onChange={e => handleChange("showUpiQrOnInvoice", e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Auto Round-Off Grand Totals</p>
                    <p className="text-[11px] text-slate-500">Automatically rounds off invoice grand total to nearest integer rupee.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoRoundOff}
                    onChange={e => handleChange("autoRoundOff", e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 4: PRODUCTION & DATA CLEANUP */}
        {activeTab === "data" && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Database className="w-4 h-4 text-red-600" />
              Production Mode & Database Management
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Clear All Demo Data Card */}
              <div className="p-5 bg-red-50/60 border border-red-200 rounded-xl space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-red-800 font-extrabold text-sm">
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span>Clear All Demo / Sample Records</span>
                  </div>
                  <p className="text-xs text-red-700 leading-relaxed">
                    Preparing for live production deployment? This action will permanently delete all demo products, sample distributor customers, fake bills, payments, and audit logs from local storage and Cloud Firestore.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isClearing}
                    onClick={handleClearDemoData}
                    className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{isClearing ? "Clearing Database..." : "Clear All Demo Data (Start Production Fresh)"}</span>
                  </button>
                </div>
              </div>

              {/* Restore Sample Data Card */}
              <div className="p-5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-blue-800 font-extrabold text-sm">
                    <RefreshCw className="w-4 h-4 text-blue-600" />
                    <span>Reload Sample Demo Dataset</span>
                  </div>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Need to re-populate sample beverage inventory, demo distributor accounts, and test invoices for testing or employee training? Click below to restore initial demo data.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleRestoreSampleData}
                    className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Restore Sample Demo Dataset</span>
                  </button>
                </div>
              </div>

            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-900">
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">Cloud Firestore Real-Time Sync Enabled</p>
                <p className="text-emerald-700">All data operations (creating bills, adding stock, collecting payments) automatically persist directly to your connected Google Firebase project ID: <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded text-emerald-900 font-bold">genuine-curve-wpt51</code>.</p>
              </div>
            </div>

          </div>
        )}

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>

      </form>

    </div>
  );
};
