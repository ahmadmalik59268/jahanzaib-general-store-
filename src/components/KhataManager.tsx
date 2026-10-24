import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  UserPlus,
  ArrowDownLeft,
  ArrowUpRight,
  Phone,
  MessageCircle,
  FileText,
  DollarSign,
  Printer,
  CheckCircle2,
  AlertCircle,
  X,
  History,
  Calendar,
} from 'lucide-react';
import { Customer, KhataLedgerEntry, Language, PrinterSettings } from '../types';

interface KhataManagerProps {
  customers: Customer[];
  ledger: KhataLedgerEntry[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onRecordVasooli: (entry: KhataLedgerEntry, updatedCustomer: Customer) => void;
  onPrintVasooliSlip: (entry: KhataLedgerEntry) => void;
  printerSettings: PrinterSettings;
  language: Language;
  initialFilter?: 'all' | 'due' | 'clear';
}

export const KhataManager: React.FC<KhataManagerProps> = ({
  customers,
  ledger,
  onAddCustomer,
  onUpdateCustomer,
  onRecordVasooli,
  onPrintVasooliSlip,
  printerSettings,
  language,
  initialFilter = 'due',
}) => {
  const isUrdu = language === 'ur';

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'due' | 'clear'>(initialFilter);

  // Modals state
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [activeCustomerForVasooli, setActiveCustomerForVasooli] = useState<Customer | null>(null);
  const [activeCustomerForLedger, setActiveCustomerForLedger] = useState<Customer | null>(null);

  // Vasooli form state
  const [vasooliAmount, setVasooliAmount] = useState('');
  const [vasooliNote, setVasooliNote] = useState('');

  // Add Customer form state
  const [newCustNameUrdu, setNewCustNameUrdu] = useState('');
  const [newCustNameEn, setNewCustNameEn] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustOpeningBalance, setNewCustOpeningBalance] = useState('');
  const [newCustLimit, setNewCustLimit] = useState('15000');

  // Summary Metrics
  const summary = useMemo(() => {
    let totalDue = 0;
    let customersWithDue = 0;
    let customersClear = 0;

    for (const c of customers) {
      if (c.creditBalance > 0) {
        totalDue += c.creditBalance;
        customersWithDue++;
      } else {
        customersClear++;
      }
    }

    return { totalDue, customersWithDue, customersClear };
  }, [customers]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        c.nameUrdu.toLowerCase().includes(query) ||
        c.nameEn.toLowerCase().includes(query) ||
        c.phone.includes(query) ||
        (c.address && c.address.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      if (filterMode === 'due') return c.creditBalance > 0;
      if (filterMode === 'clear') return c.creditBalance <= 0;
      return true;
    });
  }, [customers, searchQuery, filterMode]);

  // Handle Vasooli Submit
  const handleSaveVasooli = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomerForVasooli) return;

    const amount = parseFloat(vasooliAmount);
    if (!amount || amount <= 0) return;

    const previousBalance = activeCustomerForVasooli.creditBalance;
    const newBalance = Math.max(0, previousBalance - amount);

    const updatedCustomer: Customer = {
      ...activeCustomerForVasooli,
      creditBalance: newBalance,
      lastTransactionDate: new Date().toISOString(),
    };

    const entry: KhataLedgerEntry = {
      id: `led-${Date.now()}`,
      customerId: activeCustomerForVasooli.id,
      customerName: activeCustomerForVasooli.nameEn || activeCustomerForVasooli.nameUrdu,
      date: new Date().toISOString(),
      type: 'payment_received',
      amount,
      receiptNo: String(Date.now()).slice(-5),
      previousBalance,
      newBalance,
      note: vasooliNote.trim() || (isUrdu ? 'نقد ادھار وصولی' : 'Cash recovery payment'),
    };

    onRecordVasooli(entry, updatedCustomer);
    setActiveCustomerForVasooli(null);
    setVasooliAmount('');
    setVasooliNote('');

    // Offer instant print of receipt
    onPrintVasooliSlip(entry);
  };

  // Handle Add Customer Submit
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustNameUrdu.trim()) return;

    const openingBal = parseFloat(newCustOpeningBalance) || 0;
    const creditLimit = parseFloat(newCustLimit) || 15000;

    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      nameUrdu: newCustNameUrdu.trim(),
      nameEn: newCustNameEn.trim() || newCustNameUrdu.trim(),
      phone: newCustPhone.trim(),
      address: newCustAddress.trim(),
      creditBalance: openingBal,
      creditLimit,
      lastTransactionDate: new Date().toISOString(),
      notes: openingBal > 0 ? `سابقہ ابتدائی ادھار: Rs. ${openingBal}` : 'نیا کھاتہ گاہک',
    };

    onAddCustomer(newCustomer);
    setIsAddCustomerOpen(false);
    setNewCustNameUrdu('');
    setNewCustNameEn('');
    setNewCustPhone('');
    setNewCustAddress('');
    setNewCustOpeningBalance('');
  };

  // WhatsApp reminder message generator
  const sendWhatsAppReminder = (customer: Customer) => {
    if (!customer.phone) {
      alert(isUrdu ? 'کسٹمر کا فون نمبر موجود نہیں ہے!' : 'Customer phone number is missing!');
      return;
    }

    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;

    const text = isUrdu
      ? `محترم جناب ${customer.nameUrdu} صاحب،\n${printerSettings.shopNameUrdu || 'بوڑی جنرل سٹور'} کی جانب آپ کا واجب الادا ادھار balance *Rs. ${Math.round(customer.creditBalance).toLocaleString()}* ہے۔\nبرائے مہربانی تشریف لا کر حساب کلیئر فرما دیں۔ شکریہ!`
      : `Dear ${customer.nameEn || customer.nameUrdu},\nYour pending balance at ${printerSettings.shopNameEn || 'Bodi General Store'} is *Rs. ${Math.round(customer.creditBalance).toLocaleString()}*.\nPlease visit to clear your account. Thank you!`;

    window.open(`https://api.whatsapp.com/send?phone=${intlPhone}&text=${encodeURIComponent(text)}`, '_blank');
  };

  // Filtered customer's ledger entries for modal
  const customerLedgerEntries = useMemo(() => {
    if (!activeCustomerForLedger) return [];
    return ledger
      .filter((entry) => entry.customerId === activeCustomerForLedger.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [ledger, activeCustomerForLedger]);

  return (
    <div className="space-y-5 pb-16">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Due Khata */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isUrdu ? 'مارکیٹ میں کل بقایا ادھار' : 'Total Outstanding Khata'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight font-mono">
            Rs. {Math.round(summary.totalDue).toLocaleString('en-US')}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {isUrdu ? 'تمام گاہکوں سے وصول ہونے والی کل رقم' : 'Net credit due across all accounts'}
          </div>
        </div>

        {/* Due Customers Count */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isUrdu ? 'جن پر ادھار باقی ہے' : 'Customers with Due Udhaar'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600 tracking-tight">
            {summary.customersWithDue}{' '}
            <span className="text-xs font-semibold text-slate-500">{isUrdu ? 'افراد' : 'people'}</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {isUrdu ? 'جن کا کھاتہ بیلنس 0 سے زیادہ ہے' : 'Active balances to recover'}
          </div>
        </div>

        {/* Clear Customers Count */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isUrdu ? 'صاف کھاتہ والے گاہک' : 'Fully Cleared Accounts'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 tracking-tight">
            {summary.customersClear}{' '}
            <span className="text-xs font-semibold text-slate-500">{isUrdu ? 'افراد' : 'people'}</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {isUrdu ? 'جن پر کوئی ادھار واجب الادا نہیں' : 'Zero debt / complete clearance'}
          </div>
        </div>
      </div>

      {/* Action Header & Search Controls */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isUrdu
                  ? 'کسٹمر کا نام، موبائل نمبر یا پتہ تلاش کریں...'
                  : 'Search customer name, phone or address...'
              }
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          {/* Filter segment */}
          <div className="flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterMode('due')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filterMode === 'due'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isUrdu ? 'صرف بقایا دار' : 'With Due'}
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filterMode === 'all'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isUrdu ? 'تمام گاہک' : 'All'}
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('clear')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filterMode === 'clear'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isUrdu ? 'صاف کھاتہ' : 'Zero Due'}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddCustomerOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>{isUrdu ? '+ نیا کھاتہ گاہک بنائیں' : '+ Add Customer'}</span>
        </button>
      </div>

      {/* Customer Khata Directory Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">{isUrdu ? 'کسٹمر کا نام' : 'CUSTOMER'}</th>
                <th className="py-3 px-3">{isUrdu ? 'موبائل نمبر / پتہ' : 'PHONE / ADDRESS'}</th>
                <th className="py-3 px-3 text-right">{isUrdu ? 'بقایا رقم (Due)' : 'DUE BALANCE'}</th>
                <th className="py-3 px-3 text-right">{isUrdu ? 'ادھار کی حد' : 'CREDIT LIMIT'}</th>
                <th className="py-3 px-3 text-center">{isUrdu ? 'حیثیت' : 'STATUS'}</th>
                <th className="py-3 px-4 text-right">{isUrdu ? 'ایکشنز' : 'ACTIONS'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {isUrdu ? 'کوئی کسٹمر نہیں ملا۔' : 'No customers found.'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const hasDue = customer.creditBalance > 0;
                  return (
                    <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {customer.nameUrdu}
                        </div>
                        <div className="text-[11px] text-slate-500">{customer.nameEn}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-mono text-slate-700">{customer.phone || '—'}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
                          {customer.address}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-black font-mono text-sm text-slate-900">
                        <span className={hasDue ? 'text-rose-600' : 'text-emerald-600'}>
                          Rs. {Math.round(customer.creditBalance).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-slate-500">
                        Rs. {customer.creditLimit.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            hasDue
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {hasDue ? (isUrdu ? 'بقایا واجب الادا' : 'DUE') : (isUrdu ? 'صاف کھاتہ' : 'CLEARED')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveCustomerForVasooli(customer);
                              setVasooliAmount(customer.creditBalance > 0 ? String(customer.creditBalance) : '');
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            <span>{isUrdu ? 'وصولی' : 'Vasooli'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveCustomerForLedger(customer)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
                            title={isUrdu ? 'کھاتہ کی تفصیل' : 'View Ledger'}
                          >
                            <History className="w-3.5 h-3.5 text-blue-600" />
                          </button>

                          {hasDue && customer.phone && (
                            <button
                              type="button"
                              onClick={() => sendWhatsAppReminder(customer)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Modal 1: Vasooli Form */}
      {activeCustomerForVasooli && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isUrdu ? 'ادھار رقم وصولی درج کریں' : 'Record Vasooli Payment'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {activeCustomerForVasooli.nameUrdu} ({activeCustomerForVasooli.nameEn})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveCustomerForVasooli(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVasooli} className="space-y-3.5 mt-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600">{isUrdu ? 'سابقہ کل بقایا:' : 'Existing Balance:'}</span>
                <span className="font-bold text-rose-600 text-sm font-mono">
                  Rs. {Math.round(activeCustomerForVasooli.creditBalance).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  {isUrdu ? 'وصول ہونے والی رقم (Rs) *' : 'Amount Received (Rs) *'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={activeCustomerForVasooli.creditBalance || undefined}
                  value={vasooliAmount}
                  onChange={(e) => setVasooliAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-emerald-600 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  {isUrdu ? 'تفصیل / نوٹ' : 'Remarks'}
                </label>
                <input
                  type="text"
                  value={vasooliNote}
                  onChange={(e) => setVasooliNote(e.target.value)}
                  placeholder={isUrdu ? 'مثلاً: نقد وصولی' : 'e.g. Cash recovery'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCustomerForVasooli(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {isUrdu ? 'منسوخ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isUrdu ? 'وصولی محفوظ و پرنٹ کریں' : 'Save & Print Slip'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Customer Ledger Statement */}
      {activeCustomerForLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <span>
                    {activeCustomerForLedger.nameUrdu} ({activeCustomerForLedger.nameEn})
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isUrdu ? 'کھاتے کی مکمل تفصیل، راشن خریداری اور وصولیوں کا ریکارڈ' : 'Complete Ledger Transactions & Itemized Purchases'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const phone = activeCustomerForLedger.phone.replace(/[^0-9]/g, '');
                    const cleanPhone = phone.startsWith('0') ? `92${phone.slice(1)}` : phone;
                    const itemsLines = customerLedgerEntries.map((e) => {
                      const date = new Date(e.date).toLocaleDateString('en-GB');
                      const typeLabel = e.type === 'credit_sale' ? 'راشن خریداری' : 'نقد ادائیگی';
                      const itemsText = e.itemsSummary ? `\n  سامان: ${e.itemsSummary}` : '';
                      return `• ${date} (${typeLabel}): Rs. ${e.amount.toLocaleString()}${itemsText}\n  نیا بقایا: Rs. ${e.newBalance.toLocaleString()}`;
                    }).join('\n\n');

                    const text = `*${printerSettings.shopNameUrdu || 'جہانزیب جنرل سٹور'}*\n` +
                      `کھاتہ سٹیٹمنٹ برائے: *${activeCustomerForLedger.nameUrdu}*\n` +
                      `رابطہ نمبر: ${activeCustomerForLedger.phone}\n` +
                      `موجودہ کل واجب الادا ادھار: *Rs. ${activeCustomerForLedger.creditBalance.toLocaleString()}*\n\n` +
                      `*لین دین کی تفصیل (تاریخ وار):*\n${itemsLines}\n\n` +
                      `شکریہ! ${printerSettings.shopPhone || ''}`;

                    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="WhatsApp Statement"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{isUrdu ? 'واٹس ایپ سٹیٹمنٹ' : 'WhatsApp Statement'}</span>
                </button>
                <button
                  onClick={() => setActiveCustomerForLedger(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">{isUrdu ? 'موجودہ کل بقایا:' : 'Current Due Balance:'}</span>
                  <span className="text-lg font-black text-rose-600 font-mono">
                    Rs. {Math.round(activeCustomerForLedger.creditBalance).toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">{isUrdu ? 'ادھار کی حد:' : 'Credit Limit:'}</span>
                  <span className="text-sm font-bold text-slate-700 font-mono">
                    Rs. {activeCustomerForLedger.creditLimit.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">{isUrdu ? 'تاریخ و بل' : 'DATE & BILL'}</th>
                      <th className="py-2.5 px-3">{isUrdu ? 'سامان / تفصیل (کیا کیا گیا)' : 'ITEMS & DETAILS'}</th>
                      <th className="py-2.5 px-3 text-right">{isUrdu ? 'رقم' : 'AMOUNT'}</th>
                      <th className="py-2.5 px-3 text-right">{isUrdu ? 'سابقہ تا نیا بقایا' : 'BALANCE'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerLedgerEntries.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400">
                          {isUrdu ? 'اس کسٹمر کے کھاتہ میں کوئی ریکارڈ موجود نہیں ہے۔' : 'No transactions recorded yet.'}
                        </td>
                      </tr>
                    ) : (
                      customerLedgerEntries.map((e) => {
                        const isCredit = e.type === 'credit_sale';
                        return (
                          <tr key={e.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] align-top">
                              <div className="font-bold text-slate-900">
                                {new Date(e.date).toLocaleDateString('en-GB')}
                              </div>
                              {e.receiptNo && (
                                <span className="text-[10px] text-blue-600 font-mono">
                                  #{e.receiptNo}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 align-top">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    isCredit ? 'bg-purple-600' : 'bg-emerald-600'
                                  }`}
                                />
                                <span>
                                  {isCredit
                                    ? isUrdu ? 'راشن خریداری (ادھار)' : 'Credit Purchase'
                                    : isUrdu ? 'نقد وصولی' : 'Payment Received'}
                                </span>
                              </div>
                              {e.itemsSummary ? (
                                <div className="text-[11px] text-slate-700 bg-slate-50 border border-slate-200 rounded p-1.5 mt-1 font-medium">
                                  <span className="font-bold text-slate-900 block text-[10px] text-purple-700">
                                    {isUrdu ? 'لیے گئے راشن کا سامان:' : 'Items Taken:'}
                                  </span>
                                  {e.itemsSummary}
                                </div>
                              ) : (
                                <div className="text-[11px] text-slate-500 mt-0.5">{e.note}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono align-top">
                              <span className={`font-black ${isCredit ? 'text-purple-700' : 'text-emerald-600'}`}>
                                {isCredit ? '+' : '-'} Rs. {Math.round(e.amount).toLocaleString()}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono align-top whitespace-nowrap">
                              <div className="font-black text-slate-900 text-xs">
                                Rs. {Math.round(e.newBalance).toLocaleString()}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                سابقہ: Rs. {Math.round(e.previousBalance).toLocaleString()}
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

            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setActiveCustomerForLedger(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                {isUrdu ? 'بند کریں' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Create Customer */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {isUrdu ? 'نیا کھاتہ گاہک شامل کریں' : 'Create New Customer Account'}
              </h3>
              <button
                onClick={() => setIsAddCustomerOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  {isUrdu ? 'کسٹمر کا نام (اردو میں) *' : 'Customer Name (Urdu) *'}
                </label>
                <input
                  type="text"
                  required
                  value={newCustNameUrdu}
                  onChange={(e) => setNewCustNameUrdu(e.target.value)}
                  placeholder="مثلاً: چوہدری اصغر علی"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  {isUrdu ? 'نام انگریزی / رومن میں' : 'Name in English'}
                </label>
                <input
                  type="text"
                  value={newCustNameEn}
                  onChange={(e) => setNewCustNameEn(e.target.value)}
                  placeholder="e.g. Chaudhry Asghar Ali"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    {isUrdu ? 'موبائل نمبر' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    {isUrdu ? 'ادھار کی حد' : 'Credit Limit'}
                  </label>
                  <input
                    type="number"
                    value={newCustLimit}
                    onChange={(e) => setNewCustLimit(e.target.value)}
                    placeholder="15000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  {isUrdu ? 'پتہ / رہائش' : 'Address'}
                </label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="محلہ فاروقیہ، گلی 4"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  {isUrdu ? 'سابقہ پرانا ادھار (اگر ہو)' : 'Opening Balance (if any)'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={newCustOpeningBalance}
                  onChange={(e) => setNewCustOpeningBalance(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {isUrdu ? 'منسوخ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  {isUrdu ? 'کھاتہ بنائیں' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
