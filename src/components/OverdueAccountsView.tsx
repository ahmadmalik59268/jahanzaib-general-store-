import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Search,
  MessageCircle,
  Phone,
  Calendar,
  Lock,
  Unlock,
  DollarSign,
  Clock,
  ShieldAlert,
  ArrowRight,
  Filter,
  CheckCircle,
} from 'lucide-react';
import { Customer, Language, PrinterSettings } from '../types';

interface OverdueAccountsViewProps {
  customers: Customer[];
  onUpdateCustomer: (customer: Customer) => void;
  onNavigateToVasooli: (customer: Customer) => void;
  printerSettings: PrinterSettings;
  language: Language;
}

export const OverdueAccountsView: React.FC<OverdueAccountsViewProps> = ({
  customers,
  onUpdateCustomer,
  onNavigateToVasooli,
  printerSettings,
  language,
}) => {
  const isUrdu = language === 'ur';

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'critical' | 'overlimit' | 'frozen'>('all');

  // Calculate overdue metrics for each customer
  const enrichedCustomers = useMemo(() => {
    const now = Date.now();

    return customers
      .filter((c) => c.creditBalance > 0)
      .map((c) => {
        const lastTxTime = new Date(c.lastTransactionDate).getTime();
        const daysSinceLastTx = Math.max(0, Math.floor((now - lastTxTime) / (86400 * 1000)));
        const isOverLimit = c.creditBalance > c.creditLimit;
        const isCritical = daysSinceLastTx >= 20 || isOverLimit;

        return {
          ...c,
          daysSinceLastTx,
          isOverLimit,
          isCritical,
        };
      })
      .sort((a, b) => b.creditBalance - a.creditBalance);
  }, [customers]);

  // Filtered list
  const filteredCustomers = useMemo(() => {
    return enrichedCustomers.filter((c) => {
      if (riskFilter === 'critical' && !c.isCritical) return false;
      if (riskFilter === 'overlimit' && !c.isOverLimit) return false;
      if (riskFilter === 'frozen' && !c.isFrozen) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        c.nameUrdu.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    });
  }, [enrichedCustomers, riskFilter, searchQuery]);

  // Overall Statistics
  const stats = useMemo(() => {
    let totalOverdue = 0;
    let criticalCount = 0;
    let overLimitCount = 0;
    let frozenCount = 0;

    for (const c of enrichedCustomers) {
      totalOverdue += c.creditBalance;
      if (c.isCritical) criticalCount++;
      if (c.isOverLimit) overLimitCount++;
      if (c.isFrozen) frozenCount++;
    }

    return { totalOverdue, criticalCount, overLimitCount, frozenCount };
  }, [enrichedCustomers]);

  // Toggle Freeze Status
  const handleToggleFreeze = (customer: Customer) => {
    const updated: Customer = {
      ...customer,
      isFrozen: !customer.isFrozen,
    };
    onUpdateCustomer(updated);
  };

  // Send WhatsApp Reminder
  const handleSendReminder = (customer: Customer, urgency: 'polite' | 'urgent') => {
    const phone = customer.phone.replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? `92${phone.slice(1)}` : phone;

    let text = '';
    if (urgency === 'polite') {
      text = `*السلام علیکم ورحمۃ اللہ*\n` +
        `محترم ${customer.nameUrdu} صاحب،\n` +
        `امید ہے آپ بخیریت ہوں گے۔\n` +
        `آپ کے علم میں لانا تھا کہ ${printerSettings.shopNameUrdu || 'جہانزیب جنرل سٹور'} پر آپ کا ادھار کھاتہ *Rs. ${customer.creditBalance.toLocaleString()}* ہے۔\n` +
        `برائے مہربانی سہولت کے مطابق دکان پر تشریف لا کر رقم جمع کروا دیں۔ شکریہ!\n\n` +
        `${printerSettings.shopPhone || ''}`;
    } else {
      text = `*اہم کاروباری اطلاع و یاد دہانی*\n` +
        `محترم ${customer.nameUrdu} صاحب،\n` +
        `${printerSettings.shopNameUrdu || 'جہانزیب جنرل سٹور'} کے ریکارڈ کے مطابق آپ کے کھاتے کی واجب الادا رقم *Rs. ${customer.creditBalance.toLocaleString()}* طویل عرصے سے زیر التوا ہے۔\n` +
        `برائے مہربانی فوری طور پر دکان پر تشریف لا کر یا بذریعہ ایزی پیسہ/جاز کیش رقم کلیئر فرمائیں تاکہ کھاتہ بلا تعطل جاری رہ سکے۔\n\n` +
        `شکریہ، ${printerSettings.shopNameUrdu || 'جہانزیب جنرل سٹور'} | رابطہ: ${printerSettings.shopPhone || ''}`;
    }

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Risk Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Overdue */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isUrdu ? 'کل واجب الادا ادھار' : 'Total Overdue Amount'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600 tracking-tight font-mono">
            Rs. {stats.totalOverdue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {enrichedCustomers.length} {isUrdu ? 'کھاتے دار گاہک' : 'customers with balance'}
          </div>
        </div>

        {/* Critical Delayed Accounts */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              {isUrdu ? 'شدید تاخیر کے شکار (20+ دن)' : 'Critical Delayed (>20d)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600 tracking-tight font-mono">
            {stats.criticalCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isUrdu ? 'جن کی فوری ریکوری درکار ہے' : 'Immediate recovery needed'}
          </div>
        </div>

        {/* Over Limit Accounts */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
              {isUrdu ? 'حد سے زائد ادھار (Over Limit)' : 'Over Credit Limit'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-600 tracking-tight font-mono">
            {stats.overLimitCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isUrdu ? 'مقررہ حد سے زیادہ ادھار لے چکے ہیں' : 'Exceeded approved limit'}
          </div>
        </div>

        {/* Frozen Accounts */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              {isUrdu ? 'منجمد کھاتے (Frozen)' : 'Blocked / Frozen'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight font-mono">
            {stats.frozenCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isUrdu ? 'جن پر مزید ادھار بند کیا گیا ہے' : 'Credit temporarily stopped'}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isUrdu
                ? 'بقایا دار گاہک کا نام یا فون نمبر تلاش کریں...'
                : 'Search overdue customer by name, phone...'
            }
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {(['all', 'critical', 'overlimit', 'frozen'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setRiskFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                riskFilter === filter
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {filter === 'all'
                ? isUrdu ? 'تمام واجب الادا' : 'All Due'
                : filter === 'critical'
                ? isUrdu ? '🔴 شدید تاخیر' : 'Critical'
                : filter === 'overlimit'
                ? isUrdu ? '🟠 حد سے زائد' : 'Over Limit'
                : isUrdu ? '🔒 منجمد' : 'Frozen'}
            </button>
          ))}
        </div>
      </div>

      {/* Overdue Accounts Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">{isUrdu ? 'گاہک کھاتہ دار' : 'CUSTOMER'}</th>
                <th className="py-3 px-3">{isUrdu ? 'آخری ادائیگی / خریداری' : 'LAST ACTIVITY'}</th>
                <th className="py-3 px-3 text-right">{isUrdu ? 'مقررہ حد' : 'CREDIT LIMIT'}</th>
                <th className="py-3 px-3 text-right">{isUrdu ? 'واجب الادا ادھار' : 'DUE BALANCE'}</th>
                <th className="py-3 px-3 text-center">{isUrdu ? 'سٹیٹس' : 'STATUS'}</th>
                <th className="py-3 px-4 text-right">{isUrdu ? 'ریکوری ایکشنز' : 'RECOVERY ACTIONS'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {isUrdu ? 'اس فلٹر کے مطابق کوئی ریکارڈ نہیں ہے۔' : 'No overdue records found.'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const dateObj = new Date(cust.lastTransactionDate);
                  const dateStr = dateObj.toLocaleDateString('en-GB');

                  return (
                    <tr
                      key={cust.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        cust.isFrozen ? 'bg-slate-50/50' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {cust.nameUrdu.charAt(0) || 'ک'}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                              <span>{isUrdu ? cust.nameUrdu : cust.nameEn}</span>
                              {cust.isFrozen && (
                                <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-bold">
                                  منجمد
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {cust.phone} · <span className="text-slate-400">{cust.address}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-800">{dateStr}</div>
                        <div className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {cust.daysSinceLastTx} {isUrdu ? 'دن قبل' : 'days ago'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono text-slate-500">
                        Rs. {cust.creditLimit.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <span className="font-black font-mono text-rose-600 text-sm">
                          Rs. {cust.creditBalance.toLocaleString()}
                        </span>
                        {cust.isOverLimit && (
                          <div className="text-[10px] text-rose-500 font-bold mt-0.5">
                            +Rs. {(cust.creditBalance - cust.creditLimit).toLocaleString()} حد سے زائد
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {cust.isCritical ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                            {isUrdu ? 'شدید تاخیر' : 'Critical'}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            {isUrdu ? 'زیر التوا' : 'Pending'}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Click Collect Payment */}
                          <button
                            type="button"
                            onClick={() => onNavigateToVasooli(cust)}
                            className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 transition-colors shadow-2xs"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>{isUrdu ? 'وصولی' : 'Collect'}</span>
                          </button>

                          {/* WhatsApp Reminder (Polite) */}
                          <button
                            type="button"
                            onClick={() => handleSendReminder(cust, 'polite')}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                            title={isUrdu ? 'واٹس ایپ یاد دہانی بھیجیں' : 'Polite WhatsApp Reminder'}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>

                          {/* WhatsApp Notice (Urgent) */}
                          <button
                            type="button"
                            onClick={() => handleSendReminder(cust, 'urgent')}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                            title={isUrdu ? 'فوری ادائیگی نوٹس' : 'Urgent Legal Notice'}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>

                          {/* Freeze / Unfreeze Credit */}
                          <button
                            type="button"
                            onClick={() => handleToggleFreeze(cust)}
                            className={`p-1.5 rounded-lg transition-colors border ${
                              cust.isFrozen
                                ? 'text-slate-600 bg-slate-100 border-slate-300'
                                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-slate-200'
                            }`}
                            title={
                              cust.isFrozen
                                ? isUrdu ? 'کھاتہ کھولیں (Unfreeze)' : 'Unfreeze'
                                : isUrdu ? 'کھاتہ منجمد کریں (Freeze)' : 'Freeze Credit'
                            }
                          >
                            {cust.isFrozen ? <Lock className="w-3.5 h-3.5 text-rose-600" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
