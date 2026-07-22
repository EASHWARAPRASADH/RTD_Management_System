import React from "react";
import { NavigationTab, User } from "../types";
import { 
  LayoutDashboard, ShoppingCart, Users, Package, 
  BarChart3, Wallet, FileSpreadsheet, History, Settings,
  AlertTriangle, ChevronLeft, ChevronRight, X
} from "lucide-react";

interface SidebarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  currentUser: User;
  pendingAmount: number;
  lowStockCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  pendingAmount,
  lowStockCount,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile
}) => {
  const navItems: { id: NavigationTab; label: string; icon: React.FC<any>; badge?: string | number; badgeColor?: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "billing", label: "Billing & POS", icon: ShoppingCart },
    { id: "customers", label: "Customers", icon: Users },
    { id: "products", label: "Products & Stock", icon: Package, badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined, badgeColor: "bg-amber-100 text-amber-800 border-amber-200" },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "payments", label: "Collections", icon: Wallet, badge: pendingAmount > 0 ? `₹${Math.round(pendingAmount)}` : undefined, badgeColor: "bg-red-100 text-red-800 border-red-200" },
    { id: "excel", label: "Excel Import/Export", icon: FileSpreadsheet },
    { id: "audit", label: "Audit Logs", icon: History },
    { id: "settings", label: "Shop Settings", icon: Settings }
  ];

  const renderContent = (collapsed: boolean) => (
    <div className="flex flex-col justify-between h-full min-h-0">
      {/* Navigation Items */}
      <div className="p-2.5 space-y-2 overflow-y-auto">
        {/* Toggle / Header Bar */}
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between px-1.5"} pb-1.5 border-b border-slate-100`}>
          {!collapsed && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Main Menu
            </span>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors hidden md:block"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Links */}
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  onCloseMobile();
                }}
                title={collapsed ? `${item.label}${item.badge ? ` (${item.badge})` : ""}` : undefined}
                className={`w-full flex items-center ${
                  collapsed ? "justify-center px-0 py-2.5" : "justify-between px-3 py-2"
                } rounded-md text-xs font-semibold transition-all relative group ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "hover:bg-slate-100 text-slate-700"
                }`}
              >
                <div className={`flex items-center ${collapsed ? "justify-center" : "gap-2.5"}`}>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-800"}`} />
                  {!collapsed && <span>{item.label}</span>}
                </div>

                {!collapsed && item.badge && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${item.badgeColor || "bg-slate-100 text-slate-600"}`}>
                    {item.badge}
                  </span>
                )}

                {collapsed && item.badge && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Status Footer */}
      <div className="p-2.5 border-t border-slate-200 bg-slate-50/50">
        {!collapsed ? (
          <div className="bg-white border border-slate-200 rounded-md p-2.5 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="truncate">System Status</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            </div>

            {lowStockCount > 0 && (
              <div className="flex items-center gap-1 text-amber-700 text-[11px] font-medium pt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{lowStockCount} items low stock</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-1 space-y-1.5 text-center" title="System Online">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
            {lowStockCount > 0 && (
              <AlertTriangle className="w-4 h-4 text-amber-600" title={`${lowStockCount} low stock`} />
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`bg-white text-slate-700 shrink-0 hidden md:flex flex-col border-r border-slate-200 transition-all duration-200 ease-in-out ${
        isCollapsed ? "w-16" : "w-60"
      }`}>
        {renderContent(isCollapsed)}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-150">
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-sm text-slate-900">Main Menu</span>
              <button
                onClick={onCloseMobile}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {renderContent(false)}
            </div>
          </div>
        </div>
      )}
    </>
  );
};


