import React from "react";
import { User, NavigationTab } from "../types";
import { 
  Search, FileSpreadsheet, PlusCircle, 
  RotateCcw, PanelLeftClose, PanelLeftOpen, Menu
} from "lucide-react";

interface NavbarProps {
  currentUser: User;
  onUserChange?: (user: User) => void;
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  onOpenSearch: () => void;
  onOpenNewBill: () => void;
  onResetData: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  onOpenSearch,
  onOpenNewBill,
  onResetData,
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenMobileMenu
}) => {

  return (
    <header className="sticky top-0 z-30 bg-white text-slate-900 border-b border-slate-200 shadow-xs h-16">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
        
        {/* Brand & Toggle Controls */}
        <div className="flex items-center gap-2.5">
          {/* Mobile Hamburger Button */}
          <button
            onClick={onOpenMobileMenu}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 md:hidden transition-colors"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Sidebar Collapse Toggle Button */}
          <button
            onClick={onToggleSidebar}
            className="hidden md:flex p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors"
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          {/* Logo & Title */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onTabChange("dashboard")}>
            <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-black text-base shadow-xs">
              R
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-sm text-slate-900">RTD DISTRO</span>
                <span className="text-[9px] font-bold tracking-wider uppercase bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200">
                  v2.4
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block">Distribution Billing</p>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-xs hover:border-slate-300 hover:bg-slate-200/60 transition-all group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
              <span>Search customer, product, invoice, GST...</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono font-semibold text-slate-500 bg-white rounded border border-slate-200">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Action Buttons & User Switcher */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            onClick={onOpenNewBill}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">New Bill</span>
          </button>

          <button
            onClick={() => onTabChange("excel")}
            className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            title="Excel Import & Export Hub"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Excel Hub</span>
          </button>

          <button
            onClick={onResetData}
            className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-amber-600 transition-all"
            title="Reset to Sample Demo Dataset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

        </div>

      </div>
    </header>
  );
};
