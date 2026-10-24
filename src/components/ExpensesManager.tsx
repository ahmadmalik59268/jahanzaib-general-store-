import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  Calendar,
  Filter,
  Trash2,
  TrendingDown,
  Receipt,
  Building,
  Zap,
  Users,
  Coffee,
  Truck,
  ShoppingBag,
  Wrench,
  HelpCircle,
  X,
  CreditCard,
  Wallet,
} from 'lucide-react';
import { Expense, Language } from '../types';

interface ExpensesManagerProps {
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  language: Language;
}

export const ExpensesManager: React.FC<ExpensesManagerProps> = ({
  expenses,
  onAddExpense,
  onDeleteExpense,
  language,
}) => {
  const isUrdu = language === 'ur';

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form Fields
  const [formCategory, setFormCategory] = useState<Expense['category']>('tea');
  const [formAmount, setFormAmount] = useState('');
  const [formPaidTo, setFormPaidTo] = useState('');
  const [formPaymentMode, setFormPaymentMode] = useState<Expense['paymentMode']>('cash');
  const [formNote, setFormNote] = useState('');

  // Category Configuration
  const CATEGORIES = [
    { key: 'tea', urdu: 'چائے و پانی و مہمان نوازی', en: 'Tea & Refreshment', icon: Coffee, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { key: 'freight', urdu: 'کرایہ مال / اڈا خرچہ', en: 'Freight & Carriage', icon: Truck, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { key: 'bags', urdu: 'شاپر، بیگز و پیکنگ', en: 'Shopping Bags & Packaging', icon: ShoppingBag, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { key: 'electricity', urdu: 'بجلی کمرشل بل', en: 'Electricity Bill', icon: Zap, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
    { key: 'rent', urdu: 'دکان کا ماہانہ کرایہ', en: 'Shop Rent', icon: Building, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { key: 'salary', urdu: 'ملازمین تنخواہ و دیہاڑی', en: 'Staff Salary & Wages', icon: Users, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { key: 'maintenance', urdu: 'دکان مرمت و بجلی کام', en: 'Repairs & Maintenance', icon: Wrench, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { key: 'other', urdu: 'متفرق روزمرہ اخراجات', en: 'Miscellaneous', icon: HelpCircle, color: 'text-slate-600 bg-slate-50 border-slate-200' },
  ] as const;

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = startOfToday - 7 * 86400 * 1000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return expenses.filter((exp) => {
      // Category filter
      if (selectedCategory !== 'all' && exp.category !== selectedCategory) return false;

      // Date filter
      const expTime = new Date(exp.date).getTime();
      if (dateFilter === 'today' && expTime < startOfToday) return false;
      if (dateFilter === 'week' && expTime < startOfWeek) return false;
      if (dateFilter === 'month' && expTime < startOfMonth) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle =
          exp.categoryTitleUrdu.toLowerCase().includes(q) ||
          exp.categoryTitleEn.toLowerCase().includes(q) ||
          exp.paidTo.toLowerCase().includes(q) ||
          (exp.note && exp.note.toLowerCase().includes(q));
        if (!matchTitle) return false;
      }

      return true;
    });
  }, [expenses, selectedCategory, dateFilter, searchQuery]);

  // Financial Metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let todayTotal = 0;
    let monthTotal = 0;
    let allTotal = 0;

    for (const exp of expenses) {
      const expTime = new Date(exp.date).getTime();
      allTotal += exp.amount;
      if (expTime >= startOfToday) todayTotal += exp.amount;
      if (expTime >= startOfMonth) monthTotal += exp.amount;
    }

    return { todayTotal, monthTotal, allTotal };
  }, [expenses]);

  // Submit New Expense
  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formAmount);
    if (!amount || amount <= 0) return;

    const matchedCat = CATEGORIES.find((c) => c.key === formCategory);

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      date: new Date().toISOString(),
      category: formCategory,
      categoryTitleUrdu: matchedCat ? matchedCat.urdu : 'متفرق خرچہ',
      categoryTitleEn: matchedCat ? matchedCat.en : 'Miscellaneous',
      amount,
      paidTo: formPaidTo.trim() || (isUrdu ? 'متفرق' : 'Misc'),
      paymentMode: formPaymentMode,
      note: formNote.trim(),
    };

    onAddExpense(newExpense);
    setIsAddModalOpen(false);
    setFormAmount('');
    setFormPaidTo('');
    setFormNote('');
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Top Header Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Today's Expense */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isUrdu ? 'آج کے کل اخراجات' : "Today's Expenses"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600 tracking-tight font-mono">
            Rs. {metrics.todayTotal.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isUrdu ? 'چائے، اڈا، بیگز وغیرہ' : 'Daily petty cash outflow'}
          </div>
        </div>

        {/* This Month's Expense */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isUrdu ? 'رواں ماہ کے کل اخراجات' : 'This Month Expenses'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight font-mono">
            Rs. {metrics.monthTotal.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isUrdu ? 'کرایہ، بجلی، تنخواہ اور روزمرہ' : 'Rent, bills, staff & operating'}
          </div>
        </div>

        {/* Action Button Card */}
        <div className="bg-gradient-to-br from-slate-900 to-[#0c1322] border border-slate-800 rounded-2xl p-4 text-white flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">
              {isUrdu ? 'دکان خرچ اندراج' : 'Record Expense'}
            </span>
            <Receipt className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{isUrdu ? '+ نیا خرچہ درج کریں' : '+ Add Shop Expense'}</span>
            </button>
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
                ? 'خرچے کی تفصیل، وصول کنندہ یا نوٹ تلاش کریں...'
                : 'Search expense, payee or note...'
            }
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {(['today', 'week', 'month', 'all'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setDateFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                dateFilter === filter
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {filter === 'today'
                ? isUrdu ? 'آج' : 'Today'
                : filter === 'week'
                ? isUrdu ? 'یہ ہفتہ' : 'This Week'
                : filter === 'month'
                ? isUrdu ? 'یہ مہینہ' : 'This Month'
                : isUrdu ? 'تمام' : 'All'}
            </button>
          ))}
        </div>

        {/* Category Dropdown */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
        >
          <option value="all">{isUrdu ? 'تمام کیٹیگریز' : 'All Categories'}</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.key} value={cat.key}>
              {isUrdu ? cat.urdu : cat.en}
            </option>
          ))}
        </select>
      </div>

      {/* Expenses Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">{isUrdu ? 'تاریخ و وقت' : 'DATE & TIME'}</th>
                <th className="py-3 px-3">{isUrdu ? 'خرچہ کی مد (کیٹیگری)' : 'CATEGORY'}</th>
                <th className="py-3 px-3">{isUrdu ? 'وصول کنندہ (Paid To)' : 'PAID TO'}</th>
                <th className="py-3 px-3">{isUrdu ? 'ادائیگی طریقہ' : 'PAYMENT MODE'}</th>
                <th className="py-3 px-3 text-right">{isUrdu ? 'رقم' : 'AMOUNT'}</th>
                <th className="py-3 px-4 text-right">{isUrdu ? 'ایکشن' : 'ACTION'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {isUrdu ? 'اس فلٹر کے مطابق کوئی خرچہ موجود نہیں ہے۔' : 'No expenses recorded for this period.'}
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const catConfig = CATEGORIES.find((c) => c.key === exp.category);
                  const Icon = catConfig ? catConfig.icon : HelpCircle;
                  const dateObj = new Date(exp.date);
                  const dateStr = dateObj.toLocaleDateString('en-GB');
                  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{dateStr}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{timeStr}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg border ${catConfig?.color || 'bg-slate-50 text-slate-600'}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900">
                              {isUrdu ? exp.categoryTitleUrdu : exp.categoryTitleEn}
                            </div>
                            {exp.note && (
                              <div className="text-[11px] text-slate-500 italic max-w-xs truncate">
                                {exp.note}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-medium text-slate-700">{exp.paidTo}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold uppercase">
                          {exp.paymentMode === 'cash' ? '💵 نقد کیش' : exp.paymentMode === 'bank' ? '🏦 بینک' : exp.paymentMode}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <span className="font-black font-mono text-rose-600 text-sm">
                          Rs. {Math.round(exp.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(isUrdu ? 'کیا آپ واقعی اس خرچے کو ڈیلیٹ کرنا چاہتے ہیں؟' : 'Delete this expense entry?')) {
                              onDeleteExpense(exp.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title={isUrdu ? 'ڈیلیٹ کریں' : 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-rose-600" />
                <span>{isUrdu ? 'دکان کا نیا خرچہ درج کریں' : 'Record Shop Expense'}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3.5 mt-4 text-xs">
              {/* Category Radio Grid */}
              <div>
                <label className="text-slate-700 block mb-1.5 font-bold">
                  {isUrdu ? 'خرچے کی مد (کیٹیگری منتخب کریں) *' : 'Expense Category *'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = formCategory === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setFormCategory(cat.key)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/10 text-rose-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0 text-slate-600" />
                        <span className="truncate">{isUrdu ? cat.urdu : cat.en}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-slate-700 block mb-1 font-bold">
                  {isUrdu ? 'خرچے کی رقم (Rs) *' : 'Expense Amount (Rs) *'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="مثلاً: 350"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold text-base focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Paid To */}
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  {isUrdu ? 'کس کو ادا کیا؟ (Paid To)' : 'Paid To (Person / Vendor)'}
                </label>
                <input
                  type="text"
                  value={formPaidTo}
                  onChange={(e) => setFormPaidTo(e.target.value)}
                  placeholder="مثلاً: چائے والا، لوڈر رکشہ، لیسکو بل"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Payment Mode */}
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  {isUrdu ? 'ادائیگی کا طریقہ' : 'Payment Mode'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormPaymentMode('cash')}
                    className={`py-2 text-center rounded-lg border font-bold ${
                      formPaymentMode === 'cash'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    💵 نقد کیش
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormPaymentMode('easypaisa')}
                    className={`py-2 text-center rounded-lg border font-bold ${
                      formPaymentMode === 'easypaisa'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    📱 ایزی پیسہ
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormPaymentMode('bank')}
                    className={`py-2 text-center rounded-lg border font-bold ${
                      formPaymentMode === 'bank'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    🏦 بینک
                  </button>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  {isUrdu ? 'تفصیل / نوٹ (اختیاری)' : 'Note / Remarks'}
                </label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="مثلاً: گاہکوں کے لیے چائے بسکٹ"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {isUrdu ? 'منسوخ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
                >
                  {isUrdu ? 'خرچہ محفوظ کریں' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
