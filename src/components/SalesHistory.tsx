import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Calendar,
  Printer,
  Share2,
  Trash2,
  Filter,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { Sale, Language, PrinterSettings } from '../types';

interface SalesHistoryProps {
  sales: Sale[];
  onSelectSaleForPrint: (sale: Sale) => void;
  onVoidSale?: (saleId: string) => void;
  printerSettings: PrinterSettings;
  language: Language;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({
  sales,
  onSelectSaleForPrint,
  onVoidSale,
  printerSettings,
  language,
}) => {
  const isUrdu = language === 'ur';

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'udhaar' | 'split'>('all');

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const matchPayment = paymentFilter === 'all' || sale.paymentMethod === paymentFilter;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchPayment;
      const matchText =
        sale.receiptNo.includes(query) ||
        (sale.customerName && sale.customerName.toLowerCase().includes(query)) ||
        sale.items.some((i) => i.product.nameEn.toLowerCase().includes(query) || i.product.nameUrdu.toLowerCase().includes(query));
      return matchPayment && matchText;
    });
  }, [sales, paymentFilter, searchQuery]);

  // Aggregated totals
  const summary = useMemo(() => {
    let totalSales = 0;
    let totalCash = 0;
    let totalUdhaar = 0;

    for (const s of filteredSales) {
      totalSales += s.finalTotal;
      totalCash += s.cashReceived;
      totalUdhaar += s.udhaarAmount;
    }

    return {
      count: filteredSales.length,
      totalSales,
      totalCash,
      totalUdhaar,
    };
  }, [filteredSales]);

  // Quick WhatsApp share
  const handleQuickWhatsApp = (sale: Sale) => {
    const text = isUrdu
      ? `*${printerSettings.shopNameUrdu || 'بوڑی جنرل سٹور'}*\nبل نمبر: #${sale.receiptNo}\nکل رقم: Rs. ${Math.round(sale.finalTotal).toLocaleString()}\nطریقہ: ${sale.paymentMethod.toUpperCase()}\nشکریہ!`
      : `*${printerSettings.shopNameEn || 'Bodi General Store'}*\nInvoice #${sale.receiptNo}\nTotal Amount: Rs. ${Math.round(sale.finalTotal).toLocaleString()}\nPayment: ${sale.paymentMethod.toUpperCase()}\nThank you!`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Sales Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {isUrdu ? 'کل کٹے ہوئے بلز' : 'Total Invoices'}
          </span>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight font-mono">
            {summary.count}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isUrdu ? 'رسیدات فلٹر شدہ' : 'filtered invoices'}
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {isUrdu ? 'مجموعی فروخت' : 'Gross Volume'}
          </span>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight font-mono">
            Rs. {Math.round(summary.totalSales).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isUrdu ? 'کل سیلز مالیت' : 'total billing value'}
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            {isUrdu ? 'نقد وصول شدہ' : 'Cash Collected'}
          </span>
          <div className="mt-2 text-2xl font-black text-emerald-600 tracking-tight font-mono">
            Rs. {Math.round(summary.totalCash).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isUrdu ? 'فوری کاؤنٹر نقد' : 'instant cash'}
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
            {isUrdu ? 'ادھار پر گیا' : 'Credit Given'}
          </span>
          <div className="mt-2 text-2xl font-black text-purple-600 tracking-tight font-mono">
            Rs. {Math.round(summary.totalUdhaar).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isUrdu ? 'کھاتے میں درج' : 'added to Khata'}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isUrdu
                ? 'بل نمبر، کسٹمر کا نام یا خریدی گئی چیز تلاش کریں...'
                : 'Search bill #, customer name, or items...'
            }
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Payment mode filter tabs */}
        <div className="flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setPaymentFilter('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              paymentFilter === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isUrdu ? 'تمام بلز' : 'All'}
          </button>
          <button
            type="button"
            onClick={() => setPaymentFilter('cash')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              paymentFilter === 'cash'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isUrdu ? 'صرف نقد' : 'Cash'}
          </button>
          <button
            type="button"
            onClick={() => setPaymentFilter('udhaar')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              paymentFilter === 'udhaar'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isUrdu ? 'صرف ادھار' : 'Khata'}
          </button>
          <button
            type="button"
            onClick={() => setPaymentFilter('split')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              paymentFilter === 'split'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isUrdu ? 'مکس (Split)' : 'Split'}
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">{isUrdu ? 'بل نمبر' : 'BILL #'}</th>
                <th className="py-3 px-3">{isUrdu ? 'تاریخ و وقت' : 'DATE & TIME'}</th>
                <th className="py-3 px-3">{isUrdu ? 'کسٹمر کا نام' : 'CUSTOMER'}</th>
                <th className="py-3 px-3">{isUrdu ? 'سامان تفصیل' : 'ITEMS'}</th>
                <th className="py-3 px-3">{isUrdu ? 'طریقہ' : 'MODE'}</th>
                <th className="py-3 px-3 text-right">{isUrdu ? 'کل رقم' : 'TOTAL'}</th>
                <th className="py-3 px-4 text-right">{isUrdu ? 'ایکشنز' : 'ACTIONS'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {isUrdu ? 'کوئی بل ریکارڈ نہیں ملا۔' : 'No sales records found.'}
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const dateObj = new Date(sale.timestamp);
                  const dateStr = dateObj.toLocaleDateString('en-GB');
                  const timeStr = dateObj.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  });
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        #{sale.receiptNo}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                        <div className="font-mono text-[11px]">{dateStr}</div>
                        <div className="text-[10px] text-slate-400">{timeStr}</div>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-900">
                        {sale.customerName || (isUrdu ? 'نقد واک ان گاہک' : 'Walk-in Cash')}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 max-w-[220px] truncate text-[11px]">
                        {sale.items.map((i) => `${i.product.nameUrdu || i.product.nameEn} (${i.quantity})`).join(', ')}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            sale.paymentMethod === 'cash'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : sale.paymentMethod === 'udhaar'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {sale.paymentMethod.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-black text-slate-900 text-sm">
                        Rs. {Math.round(sale.finalTotal).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectSaleForPrint(sale)}
                            className="px-2.5 py-1 text-slate-700 hover:text-white bg-slate-100 hover:bg-blue-600 border border-slate-200 rounded-lg flex items-center gap-1 transition-colors font-bold text-[11px]"
                            title={isUrdu ? 'تھرمل پرنٹ / دیکھیں' : 'Thermal Print'}
                          >
                            <Printer className="w-3.5 h-3.5 text-blue-600 group-hover:text-white" />
                            <span>{isUrdu ? 'پرنٹ' : 'Print'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuickWhatsApp(sale)}
                            className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                            title="WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
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
