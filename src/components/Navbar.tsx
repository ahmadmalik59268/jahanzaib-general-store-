import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  BookOpen,
  Package,
  Receipt,
  Settings,
  Store,
  Languages,
  Printer,
} from 'lucide-react';
import { Language, PrinterSettings } from '../types';

export type ActiveTab = 'dashboard' | 'pos' | 'khata' | 'inventory' | 'sales' | 'settings';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  language: Language;
  onToggleLanguage: () => void;
  printerSettings: PrinterSettings;
  onOpenPrinterSettings: () => void;
  pendingUdhaarTotal: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  language,
  onToggleLanguage,
  printerSettings,
  onOpenPrinterSettings,
  pendingUdhaarTotal,
}) => {
  const isUrdu = language === 'ur';

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      labelUrdu: 'ڈیش بورڈ',
      labelEn: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'pos' as ActiveTab,
      labelUrdu: 'کیش کاؤنٹر',
      labelEn: 'POS Counter',
      icon: ShoppingCart,
    },
    {
      id: 'khata' as ActiveTab,
      labelUrdu: 'ادھار کھاتہ',
      labelEn: 'Khata Ledger',
      icon: BookOpen,
      badge: pendingUdhaarTotal > 0 ? `Rs. ${Math.round(pendingUdhaarTotal).toLocaleString()}` : undefined,
    },
    {
      id: 'inventory' as ActiveTab,
      labelUrdu: 'اسٹاک آئٹمز',
      labelEn: 'Inventory',
      icon: Package,
    },
    {
      id: 'sales' as ActiveTab,
      labelUrdu: 'سیلز بلز',
      labelEn: 'Sales History',
      icon: Receipt,
    },
    {
      id: 'settings' as ActiveTab,
      labelUrdu: 'سیٹنگز',
      labelEn: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Top Header for Desktop & Mobile */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Store Name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-950/40">
                <Store className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold text-white tracking-tight leading-none">
                  {isUrdu ? printerSettings.shopNameUrdu || 'الرحمٰن جنرل سٹور' : printerSettings.shopNameEn || 'Al-Rehman General Store'}
                </span>
                <span className="text-[11px] text-emerald-400 font-medium mt-1">
                  {isUrdu ? 'پوائنٹ آف سیل و ادھار کھاتہ' : 'Smart Retail POS & Khata Book'}
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all select-none ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{isUrdu ? item.labelUrdu : item.labelEn}</span>
                    {item.badge && (
                      <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Utility actions */}
            <div className="flex items-center gap-2">
              {/* Printer width chip & quick trigger */}
              <button
                type="button"
                onClick={onOpenPrinterSettings}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-white rounded-lg border border-slate-700/80 transition-colors"
                title={isUrdu ? 'پرنٹر سیٹنگز تبدیل کریں' : 'Configure Printer'}
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>{printerSettings.paperWidthChars === 32 ? '58mm' : '80mm'}</span>
              </button>

              {/* Language Switcher */}
              <button
                type="button"
                onClick={onToggleLanguage}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              >
                <Languages className="w-4 h-4 text-emerald-400" />
                <span>{isUrdu ? 'English' : 'اردو'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5">
        <div className="grid grid-cols-5 gap-1 items-center">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 rounded-lg transition-all ${
                  isActive
                    ? 'text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[62px]">
                  {isUrdu ? item.labelUrdu : item.labelEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
