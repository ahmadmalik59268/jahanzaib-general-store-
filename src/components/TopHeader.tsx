import React from 'react';
import {
  Menu,
  Search,
  ShoppingCart,
  BookOpen,
  Shield,
  Users,
  Languages,
  Printer,
  PackagePlus,
} from 'lucide-react';
import { Language, PrinterSettings } from '../types';
import { MainView } from './Sidebar';

interface TopHeaderProps {
  currentView: MainView;
  onSelectView: (view: MainView) => void;
  language: Language;
  onToggleLanguage: () => void;
  onOpenMobileSidebar: () => void;
  onOpenNewCashSale: () => void;
  onOpenNewKhataSale: () => void;
  onOpenAddProduct: () => void;
  printerSettings: PrinterSettings;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentView,
  onSelectView,
  language,
  onToggleLanguage,
  onOpenMobileSidebar,
  onOpenNewCashSale,
  onOpenNewKhataSale,
  onOpenAddProduct,
  printerSettings,
  searchQuery,
  onSearchChange,
}) => {
  const isUrdu = language === 'ur';

  // Format real-time or current date
  const now = new Date();
  const dayName = now.toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-US', { weekday: 'short' });
  const dayNum = now.getDate();
  const monthName = now.toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-US', { month: 'short' });
  const year = now.getFullYear();
  const dateFormatted = `${dayName}, ${dayNum} ${monthName} ${year}`;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 px-3 sm:px-5 py-2.5 shadow-2xs">
      <div className="flex items-center justify-between gap-2 sm:gap-4 max-w-7xl mx-auto">
        {/* Left: Hamburger (mobile) & Store Title */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col">
            <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight leading-none truncate max-w-[150px] sm:max-w-none">
              {isUrdu ? 'جہانزیب جنرل سٹور' : 'JAHANZAIB GENERAL STORE'}
            </h1>
            <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 mt-0.5 hidden xs:inline">
              {dateFormatted}
            </span>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 min-w-[120px] max-w-xs sm:max-w-sm md:max-w-md mx-1 sm:mx-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={
                isUrdu
                  ? 'بارکوڈ، گاہک، یا آئٹم تلاش کریں...'
                  : 'Search barcode, item, customer...'
              }
              className="w-full ps-8 pe-3 py-1.5 bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl text-[11px] sm:text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Right: Action Buttons Group */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* New Cash Sale Button */}
          <button
            type="button"
            onClick={onOpenNewCashSale}
            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs shadow-blue-500/20 flex items-center gap-1.5 transition-all shrink-0"
            title={isUrdu ? 'نیا نقد بل' : 'New Cash Sale'}
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">
              {isUrdu ? 'نیا نقد بل' : 'Cash Bill'}
            </span>
          </button>

          {/* New Khata Sale Button */}
          <button
            type="button"
            onClick={onOpenNewKhataSale}
            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs shadow-purple-500/20 flex items-center gap-1.5 transition-all shrink-0"
            title={isUrdu ? 'نیا ادھار بل (کھاتہ)' : 'New Khata Sale'}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span className="hidden md:inline">
              {isUrdu ? 'نیا ادھار بل' : 'Khata Bill'}
            </span>
          </button>

          {/* Add Product Button (Large Screens) */}
          <button
            type="button"
            onClick={onOpenAddProduct}
            className="hidden lg:flex px-3 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs shadow-emerald-500/20 items-center gap-1.5 transition-all shrink-0"
          >
            <PackagePlus className="w-4 h-4 shrink-0" />
            <span>{isUrdu ? '+ نیا پروڈکٹ' : '+ Item'}</span>
          </button>

          {/* Admin Mode Switcher Pill (Wide screens only) */}
          <div className="hidden xl:flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-xl shrink-0">
            <button
              type="button"
              className="px-2 py-1 text-[11px] font-bold rounded-lg bg-blue-600 text-white shadow-2xs flex items-center gap-1"
            >
              <Shield className="w-3 h-3" />
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectView('pos_cash')}
              className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <Users className="w-3 h-3" />
              <span>Staff</span>
            </button>
          </div>

          {/* Bilingual Switcher */}
          <button
            type="button"
            onClick={onToggleLanguage}
            className="px-2 sm:px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors shrink-0"
            title={isUrdu ? 'Switch to English' : 'اردو میں تبدیل کریں'}
          >
            <Languages className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-[11px] font-bold">{isUrdu ? 'English' : 'اردو'}</span>
          </button>

          {/* Printer Quick Status Trigger */}
          <button
            type="button"
            onClick={() => onSelectView('printer_settings')}
            className="hidden sm:flex items-center gap-1 p-2 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 rounded-xl transition-colors shrink-0"
            title="Bluetooth Thermal Printer"
          >
            <Printer className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-mono font-bold">
              {printerSettings.paperWidthChars === 32 ? '58mm' : '80mm'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
