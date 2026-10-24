import React, { useState } from 'react';
import {
  Settings,
  Printer,
  Store,
  Phone,
  MapPin,
  Save,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  Bluetooth,
  FileSpreadsheet,
  Database,
  Cloud,
  Server,
  AlertCircle,
} from 'lucide-react';
import { PrinterSettings, Language } from '../types';
import { storageService } from '../services/storage';
import { supabaseSyncService } from '../services/supabaseSync';

interface SettingsModalProps {
  settings: PrinterSettings;
  onSaveSettings: (settings: PrinterSettings) => void;
  language: Language;
  onRefreshAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSaveSettings,
  language,
  onRefreshAllData,
}) => {
  const isUrdu = language === 'ur';

  // Form states
  const [formData, setFormData] = useState<PrinterSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [supabaseMessage, setSupabaseMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const handlePushToSupabase = async () => {
    setIsSyncingSupabase(true);
    setSupabaseMessage(null);
    try {
      const res = await supabaseSyncService.syncAllToSupabase();
      setSupabaseMessage({ text: res.message, isError: !res.success });
    } catch (err: any) {
      setSupabaseMessage({ text: err?.message || 'Sync failed', isError: true });
    } finally {
      setIsSyncingSupabase(false);
      setTimeout(() => setSupabaseMessage(null), 6000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Export JSON backup file
  const handleExportBackup = () => {
    const jsonStr = storageService.exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jahanzaib_general_store_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMessage(isUrdu ? 'بیک اپ فائل ڈاؤنلوڈ ہو گئی ہے۔' : 'Backup downloaded successfully.');
    setTimeout(() => setBackupMessage(''), 3000);
  };

  // Helper to trigger UTF-8 CSV download (with BOM for Excel compatibility with Urdu)
  const downloadTextFile = (filename: string, content: string, mimeType: string = 'text/csv;charset=utf-8;') => {
    const bom = '\uFEFF';
    const blob = new Blob([bom + content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportProductsExcel = () => {
    const products = storageService.getProducts();
    const headers = ['ID', 'Barcode', 'Product Name (Urdu)', 'Product Name (En)', 'Category', 'Buy Price (Rs)', 'Sale Price (Rs)', 'Stock', 'Min Stock Alert', 'Unit'];
    const rows = products.map((p) => [
      p.id,
      `"${p.barcode}"`,
      `"${p.nameUrdu.replace(/"/g, '""')}"`,
      `"${p.nameEn.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.buyPrice,
      p.salePrice,
      p.stock,
      p.minStockAlert,
      p.unit,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadTextFile(`jahanzaib_products_${new Date().toISOString().slice(0, 10)}.csv`, csv);
    setBackupMessage(isUrdu ? 'پروڈکٹس ایکسل (CSV) فائل ڈاؤنلوڈ ہو گئی ہے۔' : 'Products Excel CSV exported.');
    setTimeout(() => setBackupMessage(''), 3000);
  };

  const handleExportKhataExcel = () => {
    const customers = storageService.getCustomers();
    const headers = ['Customer ID', 'Name (Urdu)', 'Name (En)', 'Phone', 'Address', 'Current Khata Balance (Rs)', 'Credit Limit (Rs)', 'Account Status', 'Last Transaction'];
    const rows = customers.map((c) => [
      c.id,
      `"${c.nameUrdu.replace(/"/g, '""')}"`,
      `"${c.nameEn.replace(/"/g, '""')}"`,
      `"${c.phone}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      c.creditBalance,
      c.creditLimit,
      c.isFrozen ? 'FROZEN' : 'ACTIVE',
      c.lastTransactionDate || '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadTextFile(`jahanzaib_khata_customers_${new Date().toISOString().slice(0, 10)}.csv`, csv);
    setBackupMessage(isUrdu ? 'کھاتہ لسٹ ایکسل (CSV) فائل ڈاؤنلوڈ ہو گئی ہے۔' : 'Khata ledger Excel CSV exported.');
    setTimeout(() => setBackupMessage(''), 3000);
  };

  const handleExportSalesExcel = () => {
    const sales = storageService.getSales();
    const headers = ['Invoice No', 'Date Time', 'Payment Method', 'Subtotal (Rs)', 'Discount (Rs)', 'Final Bill (Rs)', 'Cash Received (Rs)', 'Khata Amount (Rs)', 'Customer Name'];
    const rows = sales.map((s) => [
      `"${s.receiptNo}"`,
      `"${new Date(s.timestamp).toLocaleString('en-GB')}"`,
      s.paymentMethod,
      s.subtotal,
      s.discount,
      s.finalTotal,
      s.cashReceived,
      s.udhaarAmount,
      `"${(s.customerName || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadTextFile(`jahanzaib_sales_${new Date().toISOString().slice(0, 10)}.csv`, csv);
    setBackupMessage(isUrdu ? 'سیلز رسیدیں ایکسل (CSV) فائل ڈاؤنلوڈ ہو گئی ہیں۔' : 'Sales bills Excel CSV exported.');
    setTimeout(() => setBackupMessage(''), 3000);
  };

  const handleExportExpensesExcel = () => {
    const expenses = storageService.getExpenses();
    const headers = ['Expense ID', 'Date', 'Category', 'Title (Urdu)', 'Title (En)', 'Amount (Rs)', 'Paid To', 'Payment Mode', 'Notes'];
    const rows = expenses.map((e) => [
      e.id,
      `"${new Date(e.date).toLocaleDateString('en-GB')}"`,
      e.category,
      `"${e.categoryTitleUrdu.replace(/"/g, '""')}"`,
      `"${e.categoryTitleEn.replace(/"/g, '""')}"`,
      e.amount,
      `"${(e.paidTo || '').replace(/"/g, '""')}"`,
      e.paymentMode,
      `"${(e.note || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadTextFile(`jahanzaib_expenses_${new Date().toISOString().slice(0, 10)}.csv`, csv);
    setBackupMessage(isUrdu ? 'اخراجات ایکسل (CSV) فائل ڈاؤنلوڈ ہو گئی ہے۔' : 'Expenses Excel CSV exported.');
    setTimeout(() => setBackupMessage(''), 3000);
  };

  // Import JSON backup file
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = storageService.importBackupJson(content);
        if (success) {
          onRefreshAllData();
          setBackupMessage(isUrdu ? 'ڈیٹا کامیابی سے ریسٹور ہو گیا ہے۔' : 'Backup restored successfully!');
        } else {
          setBackupMessage(isUrdu ? 'فائل درست نہیں ہے۔' : 'Invalid backup file.');
        }
        setTimeout(() => setBackupMessage(''), 3500);
      }
    };
    reader.readAsText(file);
  };

  // Reset to default seed
  const handleResetData = () => {
    if (confirm(isUrdu ? 'کیا آپ واقعی سافٹ ویئر کو اصل ابتدائی ڈیٹا پر ری سیٹ کرنا چاہتے ہیں؟' : 'Reset to sample data?')) {
      storageService.resetToDefaultSeed();
      onRefreshAllData();
      setFormData(storageService.getPrinterSettings());
      setBackupMessage(isUrdu ? 'ڈیٹا ری سیٹ ہو گیا ہے۔' : 'Data reset to defaults.');
      setTimeout(() => setBackupMessage(''), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              {isUrdu ? 'پرنٹر و دکان کی ترتیبات (Settings)' : 'POS & Thermal Printer Settings'}
            </h2>
            <p className="text-xs text-slate-500">
              {isUrdu
                ? 'بلوٹوتھ تھرمل پرنٹر (58mm/80mm)، دکان کا نام اور ڈیٹا بیک اپ'
                : 'Configure thermal printer paper width, shop profile, receipts, and backups'}
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{isUrdu ? 'تمام ترتیبات کامیابی سے محفوظ ہو گئیں!' : 'Settings updated successfully!'}</span>
          </div>
        )}

        {backupMessage && (
          <div className="p-3 mb-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{backupMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Section 1: Printer Hardware Configuration */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-200/70 pb-2">
              <Printer className="w-4 h-4 text-blue-600" />
              <span>{isUrdu ? 'تھرمل پرنٹر سیٹ اپ (ESC/POS 58/80mm)' : 'Thermal Printer Setup'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  {isUrdu ? 'کاغذ کا سائز (Paper Width)' : 'Paper Width'}
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paperWidthChars: 32 })}
                    className={`p-3 rounded-xl border text-center font-bold transition-all ${
                      formData.paperWidthChars === 32
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-sm font-extrabold">58 mm</div>
                    <div className="text-[10px] font-normal opacity-80">32 Characters (Font A)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paperWidthChars: 48 })}
                    className={`p-3 rounded-xl border text-center font-bold transition-all ${
                      formData.paperWidthChars === 48
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-sm font-extrabold">80 mm</div>
                    <div className="text-[10px] font-normal opacity-80">48 Characters (Font A)</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  {isUrdu ? 'خودکار پرنٹ (Auto Print)' : 'Auto-Print on Checkout'}
                </label>
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">
                      {isUrdu ? 'بل بنتے ہی پرنٹ بھیجیں' : 'Automatic Receipt Dispatch'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {isUrdu ? 'سیو کے بٹن پر پرنٹر کو رسید بھیجے' : 'Sends receipt to printer immediately'}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.autoPrint}
                    onChange={(e) => setFormData({ ...formData, autoPrint: e.target.checked })}
                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 bg-white border-slate-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Store Profile */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-200/70 pb-2">
              <Store className="w-4 h-4 text-blue-600" />
              <span>{isUrdu ? 'دکان کی معلومات و رسید ہیڈر' : 'Store Profile & Receipt Branding'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  {isUrdu ? 'دکان کا نام (اردو میں) *' : 'Store Name (Urdu) *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.shopNameUrdu}
                  onChange={(e) => setFormData({ ...formData, shopNameUrdu: e.target.value })}
                  placeholder="بوڑی جنرل سٹور"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 font-urdu font-bold"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  {isUrdu ? 'دکان کا نام (انگریزی / پرنٹر کے لیے) *' : 'Store Name (English) *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.shopNameEn}
                  onChange={(e) => setFormData({ ...formData, shopNameEn: e.target.value })}
                  placeholder="Bodi General Store"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  {isUrdu ? 'دکان کا فون / موبائل نمبر *' : 'Phone / Contact *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.shopPhone}
                  onChange={(e) => setFormData({ ...formData, shopPhone: e.target.value })}
                  placeholder="0300-1234567"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  {isUrdu ? 'دکان کا پتہ (Address)' : 'Store Address'}
                </label>
                <input
                  type="text"
                  value={formData.shopAddress}
                  onChange={(e) => setFormData({ ...formData, shopAddress: e.target.value })}
                  placeholder="مین بازار، نزدی جامع مسجد"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-semibold">
                {isUrdu ? 'رسید کے نیچے کا پیغام' : 'Receipt Footer Message'}
              </label>
              <input
                type="text"
                value={formData.footerMessageEn}
                onChange={(e) => setFormData({ ...formData, footerMessageEn: e.target.value })}
                placeholder="Items can be exchanged within 3 days with bill"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-2xs transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isUrdu ? 'ترتیبات محفوظ کریں' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 2.5: Excel & SQL Backend Exports */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {isUrdu ? 'ایکسل (Excel / CSV) بیک اینڈ ایکسپورٹ' : 'Excel & Database Exports'}
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
            {isUrdu ? 'ایکسل شیٹس ریڈی' : 'Excel Ready'}
          </span>
        </div>
        <p className="text-xs text-slate-500">
          {isUrdu
            ? 'سٹور کا تمام ریکارڈ (پروڈکٹس، کسٹمرز کا ادھار کھاتہ، بلز، اور روزانہ اخراجات) الگ الگ ایکسل شیٹس میں ڈاؤنلوڈ کریں۔'
            : 'Export your products, customer ledger, sales invoices, and expenses directly into Excel-compatible CSV files.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <button
            type="button"
            onClick={handleExportProductsExcel}
            className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 text-slate-800 transition-all flex flex-col gap-1 text-left"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-900">
              <span>{isUrdu ? 'پروڈکٹس شیٹ' : 'Products Sheet'}</span>
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-[10px] text-slate-500">
              {isUrdu ? 'بارکوڈ، ریٹ و سٹاک' : 'Barcode, Rates, Stock'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleExportKhataExcel}
            className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 text-slate-800 transition-all flex flex-col gap-1 text-left"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-900">
              <span>{isUrdu ? 'کھاتہ لسٹ شیٹ' : 'Khata Ledger Sheet'}</span>
              <FileSpreadsheet className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-[10px] text-slate-500">
              {isUrdu ? 'گاہکوں کا بقایا ادھار' : 'Customer dues & limits'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleExportSalesExcel}
            className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 text-slate-800 transition-all flex flex-col gap-1 text-left"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-900">
              <span>{isUrdu ? 'سیلز رسیدیں شیٹ' : 'Sales Invoices'}</span>
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-[10px] text-slate-500">
              {isUrdu ? 'تمام بلز اور رقوم' : 'Invoices & split payments'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleExportExpensesExcel}
            className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 text-slate-800 transition-all flex flex-col gap-1 text-left"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-900">
              <span>{isUrdu ? 'اخراجات شیٹ' : 'Expenses Sheet'}</span>
              <FileSpreadsheet className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-[10px] text-slate-500">
              {isUrdu ? 'دکان کے تمام خرچے' : 'Petty cash & bills'}
            </span>
          </button>
        </div>
      </div>

      {/* Section 2.8: Supabase Cloud Database Sync */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {isUrdu ? 'سپابیس کلاؤڈ ڈیٹا بیس سنک (Supabase Cloud Sync)' : 'Supabase Cloud Database Sync'}
            </h3>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
            supabaseSyncService.isReady()
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              supabaseSyncService.isReady() ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`} />
            {supabaseSyncService.isReady()
              ? (isUrdu ? 'کلاؤڈ آن لائن' : 'Cloud Connected')
              : (isUrdu ? 'آف لائن لوکل موڈ' : 'Local Storage Mode')}
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          {isUrdu
            ? 'سافٹ ویئر کے تمام بٹن (سیل رسید، ادھار راشن کھاتہ، نقد وصولی، اور اخراجات) خودکار طور پر بیک اینڈ کے ساتھ منسلک ہیں۔ آف لائن موڈ میں ڈیٹا محفوظ رہتا ہے اور کلاؤڈ سے کنیکٹ ہوتے ہی خودکار طور پر سپابیس میں چلا جاتا ہے۔'
            : 'All buttons (Sales, Khata credit, Cash Vasooli, and Expenses) are wired to auto-sync with Supabase tables.'}
        </p>

        {supabaseMessage && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
            supabaseMessage.isError
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            {supabaseMessage.isError ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{supabaseMessage.text}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            disabled={isSyncingSupabase}
            onClick={handlePushToSupabase}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs transition-all disabled:opacity-50"
          >
            <Cloud className={`w-4 h-4 ${isSyncingSupabase ? 'animate-bounce' : ''}`} />
            <span>
              {isSyncingSupabase
                ? (isUrdu ? 'ڈیٹا سپابیس پر بھیجا جا رہا ہے...' : 'Syncing with Supabase...')
                : (isUrdu ? 'تمام ڈیٹا ابھی سپابیس پر بھیجیں' : 'Push All Data to Supabase Now')}
            </span>
          </button>
        </div>
      </div>

      {/* Section 3: Data Backup & Restore */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Download className="w-4 h-4 text-blue-600" />
          <span>{isUrdu ? 'ڈیٹا بیک اپ و حفاظت (Backup & Restore)' : 'Data Backup & Restore'}</span>
        </h3>
        <p className="text-xs text-slate-500">
          {isUrdu
            ? 'اپنے تمام کھاتوں، سیلز اور پروڈکٹس کا بیک اپ اپنے فون یا کمپیوٹر میں محفوظ کریں تاکہ ڈیٹا کبھی ضائع نہ ہو۔'
            : 'Download all your sales, customers, khata balances, and inventory to a file for complete safety.'}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleExportBackup}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-200 transition-colors"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>{isUrdu ? 'بیک اپ فائل ڈاؤنلوڈ کریں' : 'Export Backup JSON'}</span>
          </button>

          <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-200 cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-purple-600" />
            <span>{isUrdu ? 'بیک اپ فائل اپلوڈ کریں' : 'Restore from Backup'}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleResetData}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ml-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{isUrdu ? 'ابتدائی ڈیٹا پر ری سیٹ کریں' : 'Reset to Default Seed'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
