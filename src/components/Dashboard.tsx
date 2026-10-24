import React, { useMemo } from 'react';
import {
  DollarSign,
  Calendar,
  AlertTriangle,
  Sparkles,
  ShoppingCart,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Package,
  Plus,
  MessageCircle,
  Printer,
  CheckCircle,
} from 'lucide-react';
import { Sale, Customer, Product, KhataLedgerEntry, Language, PrinterSettings } from '../types';

interface DashboardProps {
  sales: Sale[];
  customers: Customer[];
  products: Product[];
  ledger: KhataLedgerEntry[];
  language: Language;
  printerSettings: PrinterSettings;
  onNavigateToCashSale: () => void;
  onNavigateToKhataSale: () => void;
  onNavigateToVasooli: () => void;
  onNavigateToInventory: () => void;
  onNavigateToCustomers: () => void;
  onSelectSaleForPrint: (sale: Sale) => void;
  onQuickRestock: (product: Product) => void;
  onOpenVasooliModal: (customer: Customer) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  sales,
  customers,
  products,
  ledger,
  language,
  printerSettings,
  onNavigateToCashSale,
  onNavigateToKhataSale,
  onNavigateToVasooli,
  onNavigateToInventory,
  onNavigateToCustomers,
  onSelectSaleForPrint,
  onQuickRestock,
  onOpenVasooliModal,
}) => {
  const isUrdu = language === 'ur';

  // Compute metrics
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  // Today's sales
  const todaySales = useMemo(() => {
    return sales.filter((s) => new Date(s.timestamp).getTime() >= startOfToday);
  }, [sales, startOfToday]);

  const todayCashSales = useMemo(() => {
    return todaySales.reduce((acc, s) => acc + s.cashReceived, 0);
  }, [todaySales]);

  // Total Outstanding Khata
  const totalOutstandingKhata = useMemo(() => {
    return customers.reduce((acc, c) => acc + (c.creditBalance > 0 ? c.creditBalance : 0), 0);
  }, [customers]);

  // Overdue / Pending Customers Count
  const customersWithDue = useMemo(() => {
    return customers.filter((c) => c.creditBalance > 0);
  }, [customers]);

  // Net Profit (MTD)
  const netProfitMtd = useMemo(() => {
    let profit = 0;
    for (const s of sales) {
      for (const item of s.items) {
        const cost = item.product?.buyPrice || item.unitPrice * 0.85;
        profit += (item.unitPrice - cost) * item.quantity;
      }
      profit -= s.discount || 0;
    }
    return Math.max(0, Math.round(profit));
  }, [sales]);

  // Low stock products
  const stockAlerts = useMemo(() => {
    return products.filter((p) => p.stock <= p.minStockAlert);
  }, [products]);

  // Recovered vs Due Progress
  const totalRecoveredThisMonth = useMemo(() => {
    return ledger
      .filter((e) => e.type === 'payment_received')
      .reduce((acc, e) => acc + e.amount, 0);
  }, [ledger]);

  const totalKhataTurnover = totalRecoveredThisMonth + totalOutstandingKhata;
  const recoveryPercent = totalKhataTurnover > 0 ? Math.min(100, Math.round((totalRecoveredThisMonth / totalKhataTurnover) * 100)) : 0;

  // WhatsApp Reminder quick trigger
  const handleWhatsAppReminder = (customer: Customer) => {
    if (!customer.phone) return;
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;
    const msg = isUrdu
      ? `محترم جناب ${customer.nameUrdu} صاحب،\n${printerSettings.shopNameUrdu || 'جہانزیب جنرل سٹور'} کی جانب آپ کا بقایا ادھار Rs. ${Math.round(customer.creditBalance).toLocaleString()} ہے۔ برائے مہربانی تشریف لا کر حساب کلیئر فرمائیں۔ شکریہ!`
      : `Dear ${customer.nameEn || customer.nameUrdu},\nYour pending balance at ${printerSettings.shopNameEn || 'Jahanzaib General Store'} is Rs. ${Math.round(customer.creditBalance).toLocaleString()}. Please visit to settle your account. Thank you!`;
    window.open(`https://api.whatsapp.com/send?phone=${intlPhone}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-5 sm:space-y-6 pb-12">
      {/* Top 4 Metric KPI Cards - 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Today's Cash Sales */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {isUrdu ? 'آج کی نقد فروخت' : "TODAY'S CASH"}
              </span>
              <div className="text-base sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                Rs. {Math.round(todayCashSales).toLocaleString()}
              </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base sm:text-lg shadow-2xs shrink-0">
              $
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3 text-[10px] sm:text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {isUrdu
                ? `آج ${todaySales.length} بلز`
                : `${todaySales.length} sales today`}
            </span>
          </div>
        </div>

        {/* Card 2: Total Outstanding Khata (Udhaar) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {isUrdu ? 'مارکیٹ کل ادھار' : 'TOTAL KHATA'}
              </span>
              <div className="text-base sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                Rs. {Math.round(totalOutstandingKhata).toLocaleString()}
              </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs shrink-0">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          {/* Blue progress bar */}
          <div className="mt-3 sm:mt-4 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(15, recoveryPercent))}%` }}
            />
          </div>
        </div>

        {/* Card 3: Overdue Khata / Due Customers */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {isUrdu ? 'ادھار والے گاہک' : 'CUSTOMERS DUE'}
              </span>
              <div className="text-base sm:text-2xl font-black text-rose-600 tracking-tight mt-1">
                {customersWithDue.length}{' '}
                <span className="text-xs font-semibold text-slate-500">
                  {isUrdu ? 'گاہک' : ''}
                </span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-2xs shrink-0">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3 text-[10px] sm:text-[11px] font-medium text-rose-600 truncate">
            {customersWithDue.length > 0
              ? (isUrdu ? 'ادھار وصولی باقی ہے' : 'Pending recovery')
              : (isUrdu ? 'کھاتے کلیئر ہیں' : 'All cleared')}
          </div>
        </div>

        {/* Card 4: Net Profit (MTD) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {isUrdu ? 'تخمینہ منافع (MTD)' : 'PROFIT (MTD)'}
              </span>
              <div className="text-base sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                Rs. {Math.round(netProfitMtd).toLocaleString()}
              </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-2xs shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3 text-[10px] sm:text-[11px] font-semibold text-slate-500 truncate">
            {isUrdu ? 'گروسری فروخت منافع' : 'Grocery profit'}
          </div>
        </div>
      </div>

      {/* Main Grid: Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (Cols 1-8): Active Khata Accounts / Customers */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            {/* Panel Header */}
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight truncate">
                  {isUrdu ? 'فعال ادھار کھاتے (Active Customer Khatas)' : 'Active Customer Khatas'}
                </h3>
              </div>
              <button
                type="button"
                onClick={onNavigateToCustomers}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors shrink-0"
              >
                <span>{isUrdu ? 'تمام کھاتے دیکھیں' : 'View All'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Table with horizontal scroll on mobile */}
            <div className="overflow-x-auto mt-2">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <th className="py-2.5 px-3">{isUrdu ? 'کھاتہ نمبر' : 'KHATA #'}</th>
                    <th className="py-2.5 px-3">{isUrdu ? 'گاہک کا نام' : 'CUSTOMER'}</th>
                    <th className="py-2.5 px-3">{isUrdu ? 'موبائل / پتہ' : 'PHONE / ADDRESS'}</th>
                    <th className="py-2.5 px-3 text-right">{isUrdu ? 'بقایا رقم' : 'BALANCE'}</th>
                    <th className="py-2.5 px-3 text-center">{isUrdu ? 'حیثیت' : 'STATUS'}</th>
                    <th className="py-2.5 px-3 text-right">{isUrdu ? 'ایکشن' : 'ACTION'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customersWithDue.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                        {isUrdu ? 'کوئی ادھار کھاتہ فعال نہیں ہے۔ نیا بل کاٹیں۔' : 'No active khata accounts found. Start a new sale.'}
                      </td>
                    </tr>
                  ) : (
                    customersWithDue.slice(0, 6).map((c, idx) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-700">
                          #{String(idx + 101).padStart(4, '0')}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">
                            {isUrdu ? c.nameUrdu : c.nameEn}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {isUrdu ? c.nameEn : c.nameUrdu}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                          {c.phone || c.address || '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-black font-mono text-slate-900 text-sm">
                          Rs. {Math.round(c.creditBalance).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            {isUrdu ? 'واجب الادا' : 'DUE'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onOpenVasooliModal(c)}
                              className="px-2 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                              title={isUrdu ? 'وصولی درج کریں' : 'Collect Vasooli'}
                            >
                              {isUrdu ? 'وصولی' : 'Vasooli'}
                            </button>
                            {c.phone && (
                              <button
                                type="button"
                                onClick={() => handleWhatsAppReminder(c)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>
              {isUrdu ? 'کل ادھار والے گاہک: ' : 'Total Due Accounts: '}{' '}
              <strong className="text-slate-900">{customersWithDue.length}</strong>
            </span>
            <span>
              {isUrdu ? 'کل مارکیٹ ادھار: ' : 'Total Due: '}{' '}
              <strong className="text-blue-600">Rs. {Math.round(totalOutstandingKhata).toLocaleString()}</strong>
            </span>
          </div>
        </div>

        {/* Right Column (Cols 9-12): Quick Sale Actions & Stock Alerts */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Sale Actions Card (General Store Actions) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              {isUrdu ? 'فوری کاؤنٹر بٹنز' : 'Quick Sale Actions'}
            </h3>

            {/* Blue Button: New Cash Sale */}
            <button
              type="button"
              onClick={onNavigateToCashSale}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{isUrdu ? 'نیا نقد بل (New Cash Sale)' : 'New Cash Sale'}</span>
            </button>

            {/* Purple Button: New Khata Bill */}
            <button
              type="button"
              onClick={onNavigateToKhataSale}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs shadow-purple-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <BookOpen className="w-4 h-4" />
              <span>{isUrdu ? 'نیا ادھار بل (New Khata Bill)' : 'New Udhaar / Khata Sale'}</span>
            </button>

            {/* Orange Button: Collect Vasooli */}
            <button
              type="button"
              onClick={onNavigateToVasooli}
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs shadow-amber-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <DollarSign className="w-4 h-4" />
              <span>{isUrdu ? 'ادھار وصولی درج کریں (Collect Vasooli)' : 'Collect Udhaar Payment'}</span>
            </button>
          </div>

          {/* STOCK ALERTS Card (General Store Grocery) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {isUrdu ? 'کم اسٹاک گروسری الرٹ' : 'GROCERY STOCK ALERTS'}
              </span>
              <button
                type="button"
                onClick={onNavigateToInventory}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
              >
                {isUrdu ? 'اسٹاک >' : 'Inventory >'}
              </button>
            </div>

            {stockAlerts.length === 0 ? (
              <p className="text-xs text-emerald-600 py-2">
                {isUrdu ? 'ماشاءاللہ تمام سامان مناسب مقدار میں موجود ہے۔' : 'All items have sufficient stock.'}
              </p>
            ) : (
              <div className="space-y-2">
                {stockAlerts.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-200/70 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-slate-900 truncate">
                        {isUrdu ? item.nameUrdu : item.nameEn}
                      </div>
                      <div className="text-[10px] text-amber-700 font-semibold">
                        {isUrdu ? `صرف ${item.stock} ${item.unit} باقی` : `Only ${item.stock} units left`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onQuickRestock(item)}
                      className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-white bg-white hover:bg-blue-600 border border-slate-200 rounded-lg shadow-2xs transition-colors shrink-0"
                    >
                      {isUrdu ? '+ مال آرڈر' : 'Order'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Collection Progress indicator */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-500 text-[11px] font-semibold">
                  {isUrdu ? 'وصولی کا تناسب' : 'Collection Progress'}
                </span>
                <span className="font-mono font-bold text-slate-900">
                  Rs. {Math.round(totalRecoveredThisMonth).toLocaleString()}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(10, recoveryPercent))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Technical Status Bar (Exact match to footer bar in image) */}
      <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span>DATABASE: LOCAL SECURE STORE (OFFLINE FIRST)</span>
          <span aria-hidden="true">·</span>
          <span>ROLE: ADMIN ACCESS</span>
          <span aria-hidden="true">·</span>
          <span>PRINTER: 58mm / 80mm ESC/POS READY</span>
        </div>
        <div>v1.4.0-Production · Bodi General Store</div>
      </div>
    </div>
  );
};
