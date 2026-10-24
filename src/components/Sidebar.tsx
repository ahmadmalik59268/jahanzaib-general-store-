import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  BookOpen,
  Calendar,
  DollarSign,
  AlertTriangle,
  Package,
  Users,
  Truck,
  Printer,
  Shield,
  LogOut,
  Store,
  X,
  Receipt,
  PieChart,
} from 'lucide-react';
import { Language, PrinterSettings } from '../types';

export type MainView =
  | 'dashboard'
  | 'pos_cash'
  | 'pos_khata'
  | 'khata_active'
  | 'khata_vasooli'
  | 'khata_overdue'
  | 'expenses'
  | 'reports'
  | 'inventory'
  | 'customers'
  | 'suppliers'
  | 'sales_history'
  | 'printer_settings';

interface SidebarProps {
  currentView: MainView;
  onSelectView: (view: MainView) => void;
  language: Language;
  printerSettings: PrinterSettings;
  lowStockCount: number;
  isMobile?: boolean;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  language,
  printerSettings,
  lowStockCount,
  isMobile = false,
  isOpenMobile = false,
  onCloseMobile = () => {},
}) => {
  const isUrdu = language === 'ur';

  const handleNavClick = (view: MainView) => {
    onSelectView(view);
    onCloseMobile();
  };

  const renderContent = (showCloseBtn: boolean) => (
    <>
      {/* Top Brand Header */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-extrabold text-white tracking-tight leading-tight truncate">
                {isUrdu ? 'جہانزیب جنرل سٹور' : 'JAHANZAIB GENERAL STORE'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium truncate">
                {isUrdu ? 'پی او ایس و کھاتہ سسٹم' : 'POS & Khata System'}
              </span>
            </div>
          </div>

          {/* Mobile Close Button */}
          {showCloseBtn && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Nav List with custom smooth scrollbar */}
        <div className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-145px)]">
          {/* Section 1: SALES & POS */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {isUrdu ? 'سیلز و کاؤنٹر' : 'SALES & POS'}
            </div>

            {/* Dashboard */}
            <button
              type="button"
              onClick={() => handleNavClick('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentView === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>{isUrdu ? 'ڈیش بورڈ' : 'Dashboard'}</span>
              </div>
            </button>

            {/* Cash Sale (POS) */}
            <button
              type="button"
              onClick={() => handleNavClick('pos_cash')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentView === 'pos_cash'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="w-4 h-4 shrink-0 text-blue-400" />
                <span>{isUrdu ? 'نقد کاؤنٹر بل (POS)' : 'Cash Sale (POS)'}</span>
              </div>
            </button>

            {/* Udhaar / Khata Billing */}
            <button
              type="button"
              onClick={() => handleNavClick('pos_khata')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentView === 'pos_khata'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 shrink-0 text-purple-400" />
                <span>{isUrdu ? 'ادھار کھاتہ بلنگ' : 'Udhaar / Khata Sale'}</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                Khata
              </span>
            </button>
          </div>

          {/* Section 2: KHATA & CREDIT MANAGEMENT */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {isUrdu ? 'ادھار و کھاتہ مینجمنٹ' : 'KHATA MANAGEMENT'}
            </div>

            {/* Active Khatas */}
            <button
              type="button"
              onClick={() => handleNavClick('khata_active')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentView === 'khata_active'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>{isUrdu ? 'فعال ادھار کھاتے' : 'Active Khata Ledger'}</span>
              </div>
            </button>

            {/* Collect Payment (Vasooli) */}
            <button
              type="button"
              onClick={() => handleNavClick('khata_vasooli')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentView === 'khata_vasooli'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{isUrdu ? 'ادھار وصولی (Vasooli)' : 'Collect Payment'}</span>
              </div>
            </button>

            {/* Overdue Payments */}
            <button
              type="button"
              onClick={() => handleNavClick('khata_overdue')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentView === 'khata_overdue'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{isUrdu ? 'اوور ڈیو کھاتے و رسک' : 'Overdue & Risk'}</span>
              </div>
            </button>
          </div>

          {/* Section 3: REPORTS & EXPENSES */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {isUrdu ? 'رپورٹس و اخراجات' : 'REPORTS & EXPENSES'}
            </div>

            {/* Shop Expenses */}
            <button
              type="button"
              onClick={() => handleNavClick('expenses')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentView === 'expenses'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Receipt className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{isUrdu ? 'دکان کے اخراجات' : 'Shop Expenses'}</span>
              </div>
            </button>

            {/* Business Reports */}
            <button
              type="button"
              onClick={() => handleNavClick('reports')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentView === 'reports'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <PieChart className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{isUrdu ? 'کاروباری رپورٹس و منافع' : 'Reports & Net Profit'}</span>
              </div>
            </button>

            {/* Sales History */}
            <button
              type="button"
              onClick={() => handleNavClick('sales_history')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentView === 'sales_history'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="w-4 h-4 shrink-0 text-blue-400" />
                <span>{isUrdu ? 'تمام بلز کی ہسٹری' : 'Invoices History'}</span>
              </div>
            </button>
          </div>

          {/* Section 4: INVENTORY & DIRECTORY */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {isUrdu ? 'اسٹاک و ڈائریکٹری' : 'INVENTORY & DIRECTORY'}
            </div>

            {/* Inventory */}
            <button
              type="button"
              onClick={() => handleNavClick('inventory')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentView === 'inventory'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4 shrink-0" />
                <span>{isUrdu ? 'اسٹاک و مال' : 'Inventory'}</span>
              </div>
              {lowStockCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {lowStockCount} Low
                </span>
              )}
            </button>

            {/* Customers */}
            <button
              type="button"
              onClick={() => handleNavClick('customers')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentView === 'customers'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 shrink-0" />
                <span>{isUrdu ? 'گاہکوں کی لسٹ' : 'Customers'}</span>
              </div>
            </button>

            {/* Suppliers */}
            <button
              type="button"
              onClick={() => handleNavClick('suppliers')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentView === 'suppliers'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 shrink-0" />
                <span>{isUrdu ? 'ڈسٹری بیوٹرز / سپلائرز' : 'Suppliers'}</span>
              </div>
            </button>

            {/* Bluetooth Printer Setup */}
            <button
              type="button"
              onClick={() => handleNavClick('printer_settings')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentView === 'printer_settings'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Printer className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{isUrdu ? 'بلوٹوتھ پرنٹر (58/80mm)' : 'Bluetooth Printer'}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {printerSettings.paperWidthChars === 32 ? '58mm' : '80mm'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Profile Pill */}
      <div className="p-3 border-t border-slate-800/80 bg-[#090e1a]">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-900/60 text-blue-300 font-bold text-xs flex items-center justify-center border border-blue-500/30 shrink-0">
              J
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                ADMINISTRATOR
              </span>
              <span className="text-xs font-bold text-white leading-none mt-0.5 truncate">
                {isUrdu ? 'جہانزیب اونر' : 'Jahanzaib Admin'}
              </span>
            </div>
          </div>
          <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>

        <button
          type="button"
          onClick={() => handleNavClick('dashboard')}
          className="w-full mt-2 py-1.5 px-3 rounded-lg border border-slate-800 hover:bg-slate-800/60 text-slate-400 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span>{isUrdu ? 'سسٹم لاک / خروج' : 'Sign Out / Lock'}</span>
        </button>
      </div>
    </>
  );

  // If Mobile Drawer Mode
  if (isMobile) {
    if (!isOpenMobile) return null;
    return (
      <div dir="ltr" className="fixed inset-0 z-50 md:hidden">
        {/* Backdrop */}
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        />
        {/* Slide-out drawer strictly docked to the left */}
        <aside
          dir="ltr"
          className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#0c1322] text-slate-300 flex flex-col justify-between shadow-2xl border-r border-slate-800/80"
        >
          {renderContent(true)}
        </aside>
      </div>
    );
  }

  // Desktop Static/Sticky Sidebar inside flex container
  return (
    <aside dir="ltr" className="w-full h-full bg-[#0c1322] text-slate-300 flex flex-col justify-between border-r border-slate-800/80">
      {renderContent(false)}
    </aside>
  );
};
