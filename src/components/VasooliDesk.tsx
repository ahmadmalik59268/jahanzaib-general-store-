import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Search,
  CheckCircle2,
  Printer,
  MessageCircle,
  Phone,
  User,
  History,
  ArrowDownLeft,
  Calendar,
  Sparkles,
  CreditCard,
  Wallet,
  Clock,
} from 'lucide-react';
import { Customer, KhataLedgerEntry, Language, PrinterSettings } from '../types';

interface VasooliDeskProps {
  customers: Customer[];
  ledger: KhataLedgerEntry[];
  onRecordVasooli: (entry: KhataLedgerEntry, updatedCustomer: Customer) => void;
  onPrintVasooliSlip: (entry: KhataLedgerEntry) => void;
  printerSettings: PrinterSettings;
  language: Language;
}

export const VasooliDesk: React.FC<VasooliDeskProps> = ({
  customers,
  ledger,
  onRecordVasooli,
  onPrintVasooliSlip,
  printerSettings,
  language,
}) => {
  const isUrdu = language === 'ur';

  // Selected customer & input state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'easypaisa' | 'jazzcash' | 'bank'>('cash');
  const [collectorNote, setCollectorNote] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filtered customer list for quick selection
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (c.creditBalance <= 0) return false; // only show customers with outstanding khata
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        c.nameUrdu.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    });
  }, [customers, searchQuery]);

  // Selected customer object
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  const enteredAmount = parseFloat(amountInput) || 0;
  const previousBalance = selectedCustomer ? selectedCustomer.creditBalance : 0;
  const remainingBalance = Math.max(0, previousBalance - enteredAmount);

  // Quick preset adder
  const handleSetAmount = (amount: number) => {
    setAmountInput(String(Math.round(amount)));
  };

  // Submit Vasooli
  const handleSubmitVasooli = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || enteredAmount <= 0) return;

    const newCustomerBalance = Math.max(0, selectedCustomer.creditBalance - enteredAmount);

    const updatedCustomer: Customer = {
      ...selectedCustomer,
      creditBalance: newCustomerBalance,
      lastTransactionDate: new Date().toISOString(),
    };

    const newLedgerEntry: KhataLedgerEntry = {
      id: `led-${Date.now()}`,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.nameEn || selectedCustomer.nameUrdu,
      date: new Date().toISOString(),
      type: 'payment_received',
      amount: enteredAmount,
      previousBalance: selectedCustomer.creditBalance,
      newBalance: newCustomerBalance,
      paymentMode,
      note: collectorNote.trim() || (isUrdu ? 'ادھار میں سے نقد وصولی' : 'Khata Cash Collection'),
    };

    onRecordVasooli(newLedgerEntry, updatedCustomer);
    onPrintVasooliSlip(newLedgerEntry);

    setSuccessMessage(
      isUrdu
        ? `${selectedCustomer.nameUrdu} سے Rs. ${enteredAmount.toLocaleString()} وصولی محفوظ ہو گئی! رسید تیار ہے۔`
        : `Collection of Rs. ${enteredAmount.toLocaleString()} from ${selectedCustomer.nameEn} saved!`
    );

    setAmountInput('');
    setCollectorNote('');
    setTimeout(() => setSuccessMessage(''), 6000);
  };

  // WhatsApp share
  const handleSendWhatsAppReceipt = (entry: KhataLedgerEntry) => {
    const cust = customers.find((c) => c.id === entry.customerId);
    const phone = cust?.phone.replace(/[^0-9]/g, '');
    const cleanPhone = phone?.startsWith('0') ? `92${phone.slice(1)}` : phone;

    const message = `*${printerSettings.shopNameUrdu || 'جہانزیب جنرل سٹور'}*\n` +
      `محترم ${entry.customerName} صاحب،\n` +
      `آپ کی طرف سے رقم کی وصولی کا اندراج ہو گیا ہے۔\n\n` +
      `وصول شدہ رقم: Rs. ${entry.amount.toLocaleString()}\n` +
      `سابقہ ادھار: Rs. ${entry.previousBalance.toLocaleString()}\n` +
      `*باقی نیا ادھار: Rs. ${entry.newBalance.toLocaleString()}*\n` +
      `تاریخ: ${new Date(entry.date).toLocaleDateString('en-GB')}\n\n` +
      `شکریہ! ${printerSettings.shopPhone || ''}`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Today's Vasooli Ledger
  const todayVasooliList = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return ledger.filter((l) => {
      return l.type === 'payment_received' && new Date(l.date).getTime() >= startOfToday.getTime();
    });
  }, [ledger]);

  const todayVasooliTotal = useMemo(() => {
    return todayVasooliList.reduce((sum, v) => sum + v.amount, 0);
  }, [todayVasooliList]);

  return (
    <div className="space-y-5 pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">
            {isUrdu ? 'فوری نقد وصولی کاؤنٹر' : 'CASH VASOOLI & COLLECTION DESK'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1 tracking-tight">
            {isUrdu ? 'گاہک سے ادھار رقم کی وصولی درج کریں' : 'Collect Khata Due from Customer'}
          </h2>
          <p className="text-xs text-emerald-100 mt-1">
            {isUrdu
              ? 'ادھار کی رقم وصول کریں، کھاتہ خود بخود مائنس ہو جائے گا اور پرنٹر پر رسید نکل آئے گی۔'
              : 'Select customer, enter payment amount, auto-deduct balance and print thermal receipt.'}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl p-3 text-right shrink-0">
          <span className="text-[10px] font-bold text-emerald-200 uppercase block">
            {isUrdu ? 'آج کی کل وصولیاں' : "Today's Total Vasooli"}
          </span>
          <span className="text-2xl font-black font-mono text-white">
            Rs. {todayVasooliTotal.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-200 block mt-0.5">
            {todayVasooliList.length} {isUrdu ? 'وصولی سلیپس' : 'collections today'}
          </span>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            بند کریں
          </button>
        </div>
      )}

      {/* Main 2-Column Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Col (5 cols): Select Customer from Due List */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <User className="w-4 h-4 text-purple-600" />
              <span>{isUrdu ? 'واجب الادا گاہک منتخب کریں' : 'Select Customer With Due'}</span>
            </h3>
            <span className="text-xs font-bold font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
              {filteredCustomers.length} {isUrdu ? 'گاہک' : 'customers'}
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isUrdu ? 'نام، فون یا پتہ سے تلاش کریں...' : 'Search by name, phone...'}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Customer Cards List */}
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {filteredCustomers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                {isUrdu ? 'کوئی واجب الادا گاہک نہیں ملا۔' : 'No overdue customers found.'}
              </div>
            ) : (
              filteredCustomers.map((cust) => {
                const isSelected = cust.id === selectedCustomerId;
                return (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => {
                      setSelectedCustomerId(cust.id);
                      setAmountInput('');
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900">
                        {isUrdu ? cust.nameUrdu : cust.nameEn}
                      </span>
                      <span className="font-black font-mono text-sm text-rose-600">
                        Rs. {cust.creditBalance.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>{cust.phone}</span>
                      <span className="truncate max-w-[150px]">{cust.address}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col (7 cols): Vasooli Payment Entry & Live Preview */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>{isUrdu ? 'وصولی کی رقم و رسید' : 'Payment Collection Details'}</span>
          </h3>

          {!selectedCustomer ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
              <User className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-500">
                {isUrdu
                  ? 'وصولی درج کرنے کے لیے بائیں جانب لسٹ میں سے گاہک پر کلک کریں۔'
                  : 'Select a customer from the left list to record collection.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitVasooli} className="space-y-4 text-xs">
              {/* Selected Customer Header Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-slate-900">
                    {selectedCustomer.nameUrdu} ({selectedCustomer.nameEn})
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    {selectedCustomer.phone} · {selectedCustomer.address}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    {isUrdu ? 'سابقہ واجب الادا ادھار' : 'Current Due'}
                  </span>
                  <span className="text-lg font-black text-rose-600 font-mono">
                    Rs. {selectedCustomer.creditBalance.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Quick Amount Preset Buttons */}
              <div>
                <label className="text-slate-700 block mb-1.5 font-bold">
                  {isUrdu ? 'فوری رقم منتخب کریں (Quick Presets)' : 'Quick Amount Presets'}
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetAmount(selectedCustomer.creditBalance)}
                    className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg font-bold"
                  >
                    {isUrdu ? 'مکمل ادھار صاف (Full Due)' : 'Full Payment'}: Rs. {selectedCustomer.creditBalance.toLocaleString()}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAmount(selectedCustomer.creditBalance / 2)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-bold"
                  >
                    {isUrdu ? 'نصف ادھا 50%' : '50%'}: Rs. {Math.round(selectedCustomer.creditBalance / 2).toLocaleString()}
                  </button>
                  {[500, 1000, 2000, 5000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleSetAmount(val)}
                      className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-mono font-bold"
                    >
                      + Rs. {val.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-slate-700 block mb-1 font-bold">
                  {isUrdu ? 'وصول شدہ رقم (Rs) *' : 'Amount Received (Rs) *'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedCustomer.creditBalance * 1.5}
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-black text-xl focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
              </div>

              {/* Payment Mode Pills */}
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  {isUrdu ? 'ادائیگی کا ذریعہ' : 'Payment Method'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('cash')}
                    className={`py-2 text-center rounded-xl border font-bold ${
                      paymentMode === 'cash'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    💵 نقد کیش
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('easypaisa')}
                    className={`py-2 text-center rounded-xl border font-bold ${
                      paymentMode === 'easypaisa'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    📱 ایزی پیسہ
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('jazzcash')}
                    className={`py-2 text-center rounded-xl border font-bold ${
                      paymentMode === 'jazzcash'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    ⚡ جاز کیش
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('bank')}
                    className={`py-2 text-center rounded-xl border font-bold ${
                      paymentMode === 'bank'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
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
                  {isUrdu ? 'تفصیل یا رسید نوٹ (اختیاری)' : 'Note / Collector Reference'}
                </label>
                <input
                  type="text"
                  value={collectorNote}
                  onChange={(e) => setCollectorNote(e.target.value)}
                  placeholder={isUrdu ? 'مثلاً: بھائی علی رضا کے ہاتھ رقم بھجوائی' : 'e.g. Sent via brother'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Dynamic Arithmetic Preview Card */}
              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2 shadow-md">
                <div className="flex justify-between text-slate-300">
                  <span>{isUrdu ? 'سابقہ ادھار کھاتہ (Previous Balance):' : 'Previous Due:'}</span>
                  <span className="font-mono text-amber-300 font-bold">
                    Rs. {previousBalance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>{isUrdu ? 'وصول شدہ رقم (Paid Now):' : 'Received Now:'}</span>
                  <span className="font-mono text-rose-400 font-bold">
                    - Rs. {enteredAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-emerald-400 pt-2 border-t border-slate-800">
                  <span>{isUrdu ? 'باقی نیا ادھار (Remaining Due):' : 'Remaining Khata Due:'}</span>
                  <span className="font-mono text-lg font-black">
                    Rs. {remainingBalance.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={enteredAmount <= 0}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Printer className="w-5 h-5" />
                  <span>
                    {isUrdu
                      ? `وصولی محفوظ کریں و رسید پرنٹ کریں (Rs. ${enteredAmount.toLocaleString()})`
                      : `Save Vasooli & Print Thermal Slip (Rs. ${enteredAmount.toLocaleString()})`}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Today's Vasooli Log Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            <span>{isUrdu ? 'آج کی وصولیوں کا ریکارڈ' : "Today's Collections Log"}</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {isUrdu ? 'کل رقم:' : 'Total:'} Rs. {todayVasooliTotal.toLocaleString()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">{isUrdu ? 'وقت' : 'TIME'}</th>
                <th className="py-3 px-3">{isUrdu ? 'گاہک' : 'CUSTOMER'}</th>
                <th className="py-3 px-3 text-right">{isUrdu ? 'سابقہ ادھار' : 'PREV DUE'}</th>
                <th className="py-3 px-3 text-right">{isUrdu ? 'وصول رقم' : 'COLLECTED'}</th>
                <th className="py-3 px-3 text-right">{isUrdu ? 'باقی ادھار' : 'NEW BALANCE'}</th>
                <th className="py-3 px-4 text-right">{isUrdu ? 'رسید و واٹس ایپ' : 'ACTIONS'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {todayVasooliList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    {isUrdu ? 'آج ابھی تک کوئی ادھار وصولی درج نہیں کی گئی۔' : 'No collections recorded today yet.'}
                  </td>
                </tr>
              ) : (
                todayVasooliList.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {new Date(entry.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-extrabold text-slate-900">{entry.customerName}</div>
                      <div className="text-[10px] text-slate-500">{entry.note}</div>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-500">
                      Rs. {entry.previousBalance.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 text-right font-black font-mono text-emerald-600">
                      Rs. {entry.amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 text-right font-black font-mono text-slate-900">
                      Rs. {entry.newBalance.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onPrintVasooliSlip(entry)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title={isUrdu ? 'تھرمل پرنٹ رسید' : 'Thermal Print'}
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendWhatsAppReceipt(entry)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title={isUrdu ? 'واٹس ایپ رسید بھیجیں' : 'WhatsApp Receipt'}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
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
