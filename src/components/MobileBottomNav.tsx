import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  BookOpen,
  DollarSign,
  Menu,
} from 'lucide-react';
import { MainView } from './Sidebar';
import { Language } from '../types';

interface MobileBottomNavProps {
  currentView: MainView;
  onSelectView: (view: MainView) => void;
  onOpenMenu: () => void;
  language: Language;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onSelectView,
  onOpenMenu,
  language,
}) => {
  const isUrdu = language === 'ur';

  const isPosCash = currentView === 'pos_cash';
  const isPosKhata = currentView === 'pos_khata';
  const isVasooli = currentView === 'khata_vasooli';
  const isDashboard = currentView === 'dashboard';

  return (
    <nav dir="ltr" className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0c1322]/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-1.5 shadow-2xl safe-area-bottom">
      <div className="grid grid-cols-5 gap-1 items-center max-w-md mx-auto">
        {/* 1. Dashboard */}
        <button
          type="button"
          onClick={() => onSelectView('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all ${
            isDashboard
              ? 'text-blue-400 font-bold bg-blue-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight truncate">
            {isUrdu ? 'ڈیش بورڈ' : 'Dashboard'}
          </span>
        </button>

        {/* 2. Cash Sale */}
        <button
          type="button"
          onClick={() => onSelectView('pos_cash')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all ${
            isPosCash
              ? 'text-white font-bold bg-blue-600 shadow-md shadow-blue-500/30'
              : 'text-blue-400 hover:text-blue-300'
          }`}
        >
          <ShoppingCart className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight truncate">
            {isUrdu ? 'نقد بل' : 'Cash POS'}
          </span>
        </button>

        {/* 3. Khata Sale */}
        <button
          type="button"
          onClick={() => onSelectView('pos_khata')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all ${
            isPosKhata
              ? 'text-white font-bold bg-purple-600 shadow-md shadow-purple-500/30'
              : 'text-purple-400 hover:text-purple-300'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight truncate">
            {isUrdu ? 'ادھار بل' : 'Khata Bill'}
          </span>
        </button>

        {/* 4. Vasooli */}
        <button
          type="button"
          onClick={() => onSelectView('khata_vasooli')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all ${
            isVasooli
              ? 'text-white font-bold bg-emerald-600 shadow-md shadow-emerald-500/30'
              : 'text-emerald-400 hover:text-emerald-300'
          }`}
        >
          <DollarSign className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight truncate">
            {isUrdu ? 'وصولی' : 'Vasooli'}
          </span>
        </button>

        {/* 5. Full Menu */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center py-1 px-1 rounded-xl text-slate-400 hover:text-white transition-all"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight truncate">
            {isUrdu ? 'مینو' : 'Menu'}
          </span>
        </button>
      </div>
    </nav>
  );
};
