import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  BookOpen,
  Calendar,
  Printer,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  FileText,
  Percent,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Sale, Customer, Expense, KhataLedgerEntry, Product, Language, PrinterSettings } from '../types';
import { bluetoothPrinter } from '../services/bluetoothPrinter';
import { buildEscPosByteStream, center, pair, rule, wrap } from '../services/escpos';

interface ReportsViewProps {
  sales: Sale[];
  customers: Customer[];
  expenses: Expense[];
  ledger: KhataLedgerEntry[];
  products: Product[];
  printerSettings: PrinterSettings;
  language: Language;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  sales,
  customers,
  expenses,
  ledger,
  products,
  printerSettings,
  language,
}) => {
  const isUrdu = language === 'ur';

  // Time filter: today | week | month | all
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [isPrintingReport, setIsPrintingReport] = useState(false);

  // Financial Calculations based on Time Range
  const reportData = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = startOfToday - 7 * 86400 * 1000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    // Filter sales
    const filteredSales = sales.filter((s) => {
      const t = new Date(s.timestamp).getTime();
      if (timeRange === 'today') return t >= startOfToday;
      if (timeRange === 'week') return t >= startOfWeek;
      if (timeRange === 'month') return t >= startOfMonth;
      return true;
    });

    // Filter expenses
    const filteredExpenses = expenses.filter((e) => {
      const t = new Date(e.date).getTime();
      if (timeRange === 'today') return t >= startOfToday;
      if (timeRange === 'week') return t >= startOfWeek;
      if (timeRange === 'month') return t >= startOfMonth;
      return true;
    });

    // Filter payments received (vasooli)
    const filteredVasooli = ledger.filter((l) => {
      if (l.type !== 'payment_received') return false;
      const t = new Date(l.date).getTime();
      if (timeRange === 'today') return t >= startOfToday;
      if (timeRange === 'week') return t >= startOfWeek;
      if (timeRange === 'month') return t >= startOfMonth;
      return true;
    });

    let totalGrossSales = 0;
    let cashSalesTotal = 0;
    let udhaarSalesTotal = 0;
    let totalCogs = 0; // wholesale cost
    let totalDiscount = 0;
    const productSalesMap: Record<string, { product: Product; quantity: number; revenue: number }> = {};

    for (const s of filteredSales) {
      totalGrossSales += s.finalTotal;
      totalDiscount += s.discount;

      if (s.paymentMethod === 'cash') {
        cashSalesTotal += s.finalTotal;
      } else if (s.paymentMethod === 'udhaar') {
        udhaarSalesTotal += s.udhaarAmount;
      } else if (s.paymentMethod === 'split') {
        cashSalesTotal += s.cashReceived;
        udhaarSalesTotal += s.udhaarAmount;
      }

      for (const item of s.items) {
        const cost = item.product.buyPrice * item.quantity;
        totalCogs += cost;

        if (!productSalesMap[item.product.id]) {
          productSalesMap[item.product.id] = {
            product: item.product,
            quantity: 0,
            revenue: 0,
          };
        }
        productSalesMap[item.product.id].quantity += item.quantity;
        productSalesMap[item.product.id].revenue += item.total;
      }
    }

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalVasooli = filteredVasooli.reduce((sum, v) => sum + v.amount, 0);
    const grossProfit = Math.max(0, totalGrossSales - totalCogs);
    const netProfit = grossProfit - totalExpenses;

    // Top selling items
    const topItems = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    // Khata recovery percentage
    const khataRecoveryRate =
      udhaarSalesTotal > 0
        ? Math.min(100, Math.round((totalVasooli / udhaarSalesTotal) * 100))
        : totalVasooli > 0
        ? 100
        : 0;

    return {
      billCount: filteredSales.length,
      totalGrossSales,
      cashSalesTotal,
      udhaarSalesTotal,
      totalCogs,
      totalDiscount,
      grossProfit,
      totalExpenses,
      netProfit,
      totalVasooli,
      khataRecoveryRate,
      topItems,
    };
  }, [sales, expenses, ledger, timeRange]);

  // Overall Khata Outstanding
  const totalMarketUdhaar = useMemo(() => {
    return customers.reduce((sum, c) => sum + Math.max(0, c.creditBalance), 0);
  }, [customers]);

  // Generate and print Z-Report on ESC/POS thermal printer
  const handlePrintZReport = async () => {
    setIsPrintingReport(true);
    const width = printerSettings.paperWidthChars;
    const lines: string[] = [];

    lines.push(center('*** DAILY / MONTHLY Z-REPORT ***', width));
    lines.push(center(printerSettings.shopNameEn || 'JAHANZAIB GENERAL STORE', width));
    if (printerSettings.shopAddress) lines.push(center(printerSettings.shopAddress, width));
    lines.push(rule(width, '='));

    const now = new Date();
    lines.push(pair('Report Range:', timeRange.toUpperCase(), width));
    lines.push(pair('Generated On:', now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), width));
    lines.push(pair('Total Invoices:', String(reportData.billCount), width));
    lines.push(rule(width, '-'));

    lines.push(pair('GROSS SALES:', `Rs. ${Math.round(reportData.totalGrossSales).toLocaleString()}`, width));
    lines.push(pair('  - Cash Sales:', `Rs. ${Math.round(reportData.cashSalesTotal).toLocaleString()}`, width));
    lines.push(pair('  - Khata (Udhaar):', `Rs. ${Math.round(reportData.udhaarSalesTotal).toLocaleString()}`, width));
    lines.push(rule(width, '-'));

    lines.push(pair('Cost of Goods (COGS):', `Rs. ${Math.round(reportData.totalCogs).toLocaleString()}`, width));
    lines.push(pair('Gross Profit Margin:', `Rs. ${Math.round(reportData.grossProfit).toLocaleString()}`, width));
    lines.push(pair('Shop Expenses:', `Rs. ${Math.round(reportData.totalExpenses).toLocaleString()}`, width));
    lines.push(rule(width, '='));

    lines.push(pair('NET ESTIMATED PROFIT:', `Rs. ${Math.round(reportData.netProfit).toLocaleString()}`, width));
    lines.push(rule(width, '='));

    lines.push(pair('Khata Vasooli Collected:', `Rs. ${Math.round(reportData.totalVasooli).toLocaleString()}`, width));
    lines.push(pair('Total Market Khata Due:', `Rs. ${Math.round(totalMarketUdhaar).toLocaleString()}`, width));
    lines.push(rule(width, '-'));
    lines.push(center('Software: Dukandar POS', width));

    const reportText = lines.join('\n');

    try {
      if (bluetoothPrinter.isBluetoothSupported()) {
        const bytes = buildEscPosByteStream(reportText);
        const result = await bluetoothPrinter.printBytes(bytes);
        if (!result.success) {
          // Fallback to window print
          const win = window.open('', '_blank');
          if (win) {
            win.document.write(`<pre style="font-family:monospace;font-size:12px;padding:20px;">${reportText}</pre>`);
            win.document.close();
            win.print();
          }
        }
      } else {
        // Fallback: window print
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(`<pre style="font-family:monospace;font-size:12px;padding:20px;">${reportText}</pre>`);
          win.document.close();
          win.print();
        }
      }
    } catch (err) {
      console.error('Print report error:', err);
    } finally {
      setIsPrintingReport(false);
    }
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Top Header & Range Filters */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-600" />
            <span>{isUrdu ? 'کاروباری کارکردگی و مالیاتی رپورٹس' : 'Business Financial & Sales Reports'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isUrdu
              ? 'نقد فروخت، ادھار، اخراجات، اور خالص منافع کا تفصیلی جائزہ'
              : 'Detailed breakdown of sales, khata, operational expenses, and net profit.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['today', 'week', 'month', 'all'] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range === 'today'
                  ? isUrdu ? 'آج' : 'Today'
                  : range === 'week'
                  ? isUrdu ? 'یہ ہفتہ' : 'This Week'
                  : range === 'month'
                  ? isUrdu ? 'رواں ماہ' : 'This Month'
                  : isUrdu ? 'مکمل تاریخ' : 'All Time'}
              </button>
            ))}
          </div>

          {/* Print Z-Report */}
          <button
            type="button"
            onClick={handlePrintZReport}
            disabled={isPrintingReport}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>{isUrdu ? 'رپورٹ پرنٹ کریں' : 'Print Z-Report'}</span>
          </button>
        </div>
      </div>

      {/* Main KPI Cards: Revenue, Cost, Expense, Profit */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Sales */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isUrdu ? 'کل فروخت (Gross Revenue)' : 'Gross Revenue'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight font-mono">
            Rs. {Math.round(reportData.totalGrossSales).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="font-bold text-slate-700">{reportData.billCount}</span>
            <span>{isUrdu ? 'بلز جاری ہوئے' : 'invoices generated'}</span>
          </div>
        </div>

        {/* Wholesale COGS */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isUrdu ? 'مال کی تھوک لاگت (COGS)' : 'Cost of Goods Sold'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-700 tracking-tight font-mono">
            Rs. {Math.round(reportData.totalCogs).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isUrdu ? 'تھوک خریداری کی اصل قیمت' : 'Wholesale inventory cost'}
          </div>
        </div>

        {/* Shop Expenses */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
              {isUrdu ? 'دکان کے کل اخراجات' : 'Shop Expenses'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600 tracking-tight font-mono">
            Rs. {Math.round(reportData.totalExpenses).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isUrdu ? 'کرایہ، بجلی، ملازم اور متفرق' : 'Rent, bills, staff & operating'}
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 border border-emerald-500 rounded-2xl p-4 text-white shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider">
              {isUrdu ? 'خالص متوقع منافع (Net Profit)' : 'Net Estimated Profit'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white tracking-tight font-mono">
            Rs. {Math.round(reportData.netProfit).toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-100 mt-1">
            {isUrdu ? 'فروخت منفی لاگت منفی اخراجات' : 'Revenue - COGS - Expenses'}
          </div>
        </div>
      </div>

      {/* Sales Split: Cash vs Udhaar and Khata Recovery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Cash vs Udhaar Sales */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-blue-600" />
            <span>{isUrdu ? 'نقد بمقابلہ ادھار فروخت کا تناسب' : 'Cash vs Udhaar Sales Ratio'}</span>
          </h3>

          <div className="space-y-3">
            {/* Cash Sale Bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                  <span>{isUrdu ? 'نقد فروخت (Cash Sales)' : 'Cash Sales'}</span>
                </span>
                <span className="font-mono font-bold text-slate-900">
                  Rs. {Math.round(reportData.cashSalesTotal).toLocaleString()} (
                  {reportData.totalGrossSales > 0
                    ? Math.round((reportData.cashSalesTotal / reportData.totalGrossSales) * 100)
                    : 0}
                  %)
                </span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      reportData.totalGrossSales > 0
                        ? (reportData.cashSalesTotal / reportData.totalGrossSales) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Udhaar Sale Bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                  <span>{isUrdu ? 'ادھار فروخت (Udhaar Sales)' : 'Khata Credit Sales'}</span>
                </span>
                <span className="font-mono font-bold text-purple-700">
                  Rs. {Math.round(reportData.udhaarSalesTotal).toLocaleString()} (
                  {reportData.totalGrossSales > 0
                    ? Math.round((reportData.udhaarSalesTotal / reportData.totalGrossSales) * 100)
                    : 0}
                  %)
                </span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      reportData.totalGrossSales > 0
                        ? (reportData.udhaarSalesTotal / reportData.totalGrossSales) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{isUrdu ? 'کل جاری کردہ ڈسکاؤنٹ:' : 'Total Discount Given:'}</span>
            <span className="font-mono font-bold text-slate-700">
              Rs. {Math.round(reportData.totalDiscount).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Right: Khata Recovery & Vasooli Performance */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-600" />
            <span>{isUrdu ? 'کھاتہ ریکوری و وصولی کی کارکردگی' : 'Khata Recovery & Collection'}</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl">
              <span className="text-[10px] font-bold text-purple-700 uppercase">
                {isUrdu ? 'رواں مدت کی وصولی' : 'Vasooli Collected'}
              </span>
              <div className="text-xl font-black text-purple-900 font-mono mt-1">
                Rs. {Math.round(reportData.totalVasooli).toLocaleString()}
              </div>
            </div>

            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl">
              <span className="text-[10px] font-bold text-rose-700 uppercase">
                {isUrdu ? 'مارکیٹ میں کل بقایا ادھار' : 'Total Market Due'}
              </span>
              <div className="text-xl font-black text-rose-900 font-mono mt-1">
                Rs. {Math.round(totalMarketUdhaar).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-600 font-semibold">
              {isUrdu ? 'ادھار وصولی کی شرح (Recovery Rate):' : 'Collection Rate:'}
            </span>
            <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {reportData.khataRecoveryRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Top Selling Grocery Products Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{isUrdu ? 'سب سے زیادہ فروخت ہونے والے راشن آئٹمز' : 'Top Selling Grocery Items'}</span>
          </h3>
          <span className="text-xs text-slate-500">
            {isUrdu ? 'آمدنی کی بنیاد پر ترتیب شدہ' : 'Ranked by revenue'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">{isUrdu ? 'پروڈکٹ کا نام' : 'PRODUCT'}</th>
                <th className="py-3 px-3">{isUrdu ? 'کیٹیگری' : 'CATEGORY'}</th>
                <th className="py-3 px-3 text-center">{isUrdu ? 'فروخت شدہ یونٹس' : 'SOLD QTY'}</th>
                <th className="py-3 px-3 text-right">{isUrdu ? 'فی یونٹ ریٹ' : 'UNIT PRICE'}</th>
                <th className="py-3 px-4 text-right">{isUrdu ? 'کل حاصل شدہ رقم' : 'TOTAL REVENUE'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData.topItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    {isUrdu ? 'اس مدت میں کوئی پروڈکٹ سیل نہیں ہوا۔' : 'No product sales recorded in this period.'}
                  </td>
                </tr>
              ) : (
                reportData.topItems.map((item, idx) => (
                  <tr key={item.product.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        {item.product.image && (
                          <img
                            src={item.product.image}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                          />
                        )}
                        <div>
                          <div className="font-extrabold text-slate-900">
                            {isUrdu ? item.product.nameUrdu : item.product.nameEn}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            #{item.product.barcode}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-slate-600">{item.product.category}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {item.quantity} {item.product.unit}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      Rs. {item.product.salePrice}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-black font-mono text-blue-600 text-sm">
                        Rs. {Math.round(item.revenue).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
