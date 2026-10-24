import React, { useState } from 'react';
import { Printer, Bluetooth, Share2, Copy, Check, X, AlertCircle } from 'lucide-react';
import { Sale, KhataLedgerEntry, PrinterSettings } from '../types';
import { renderSaleReceiptText, renderVasooliReceiptText, buildEscPosByteStream } from '../services/escpos';
import { bluetoothPrinter } from '../services/bluetoothPrinter';

interface ThermalPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale?: Sale;
  vasooliEntry?: KhataLedgerEntry;
  settings: PrinterSettings;
  onUpdateSettings: (settings: PrinterSettings) => void;
  language: 'ur' | 'en';
}

export const ThermalPrintModal: React.FC<ThermalPrintModalProps> = ({
  isOpen,
  onClose,
  sale,
  vasooliEntry,
  settings,
  onUpdateSettings,
  language,
}) => {
  const [selectedWidth, setSelectedWidth] = useState<32 | 48>(settings.paperWidthChars || 32);
  const [isPrintingBt, setIsPrintingBt] = useState(false);
  const [btStatus, setBtStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });
  const [copied, setCopied] = useState(false);

  if (!isOpen || (!sale && !vasooliEntry)) return null;

  // Render receipt text with the active width
  const receiptText = sale
    ? renderSaleReceiptText(sale, settings, selectedWidth)
    : vasooliEntry
    ? renderVasooliReceiptText(vasooliEntry, settings, selectedWidth)
    : '';

  // Handle Bluetooth Print
  const handleBluetoothPrint = async () => {
    setIsPrintingBt(true);
    setBtStatus({
      type: 'idle',
      message: language === 'ur' ? 'پرنٹر سے کنکشن ہو رہا ہے...' : 'Connecting to printer...',
    });

    try {
      const bytes = buildEscPosByteStream(receiptText);
      const res = await bluetoothPrinter.printBytes(bytes);

      if (res.success) {
        setBtStatus({
          type: 'success',
          message: language === 'ur' ? res.messageUrdu : res.messageEn,
        });
      } else {
        setBtStatus({
          type: 'error',
          message: language === 'ur' ? res.messageUrdu : res.messageEn,
        });
      }
    } catch (err: any) {
      setBtStatus({
        type: 'error',
        message: err.message || (language === 'ur' ? 'پرنٹر سے رابطہ نہیں ہوا' : 'Failed to connect to printer'),
      });
    } finally {
      setIsPrintingBt(false);
    }
  };

  // Handle Standard System Print
  const handleSystemPrint = () => {
    window.print();
  };

  // Copy receipt text to clipboard
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(receiptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Send receipt via WhatsApp
  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(`*${settings.shopNameEn || 'GENERAL STORE'}*\n\`\`\`\n${receiptText}\n\`\`\``);
    const targetPhone = sale?.customerName ? '' : ''; // Can be blank or formatted
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Change paper width and update persistent settings
  const handleWidthChange = (width: 32 | 48) => {
    setSelectedWidth(width);
    onUpdateSettings({ ...settings, paperWidthChars: width });
  };

  // Toggle Auto-Print
  const handleToggleAutoPrint = (checked: boolean) => {
    onUpdateSettings({ ...settings, autoPrint: checked });
  };

  const isUrdu = language === 'ur';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                {isUrdu ? 'تھرمل رسید پرنٹ شیٹ' : 'Thermal Receipt Sheet'}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{sale ? `#${sale.receiptNo}` : `#${vasooliEntry?.receiptNo || 'VASOOLI'}`}</span>
                <span aria-hidden="true">·</span>
                <span>ESC/POS 58mm / 80mm</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Controls bar: Paper Width Selection & Auto Print Toggle */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">
                {isUrdu ? 'کاغذ کا سائز (Paper Width):' : 'Paper Width:'}
              </span>
              <div className="flex items-center p-0.5 bg-slate-900 border border-slate-700 rounded-lg">
                <button
                  type="button"
                  onClick={() => handleWidthChange(32)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    selectedWidth === 32
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  58 mm (32 کالم)
                </button>
                <button
                  type="button"
                  onClick={() => handleWidthChange(48)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    selectedWidth === 48
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  80 mm (48 کالم)
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
              <input
                type="checkbox"
                checked={settings.autoPrint}
                onChange={(e) => handleToggleAutoPrint(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-900"
              />
              <span>{isUrdu ? 'آئندہ بل پر خودکار پرنٹ (Auto)' : 'Auto-print on checkout'}</span>
            </label>
          </div>

          {/* Bluetooth Status Feedback */}
          {btStatus.type !== 'idle' && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                btStatus.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}
            >
              {btStatus.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium leading-relaxed">{btStatus.message}</p>
                {btStatus.type === 'error' && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isUrdu
                      ? 'اگر بلوٹوتھ کنیکٹ نہ ہو تو نیچے دیا گیا "سسٹم پرنٹر" بٹن دبائیں۔'
                      : 'Tip: If Bluetooth is unavailable, tap "System Print" below to print via USB or network.'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Thermal Paper Receipt Simulator Screen */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 flex flex-col items-center">
            <div className="text-[11px] text-slate-500 mb-2 font-mono flex items-center justify-between w-full max-w-[380px] px-2">
              <span>{selectedWidth === 32 ? '58mm (32 Chars Font A)' : '80mm (48 Chars Font A)'}</span>
              <span>CP437 ESC/POS</span>
            </div>

            {/* Receipt Preview Body (White Thermal Paper look) */}
            <div
              className={`w-full bg-white text-black p-4 sm:p-5 rounded-sm shadow-md font-mono-receipt text-[12px] sm:text-[13px] leading-tight select-all overflow-x-auto ${
                selectedWidth === 32 ? 'max-w-[310px]' : 'max-w-[420px]'
              }`}
              style={{
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <pre className="whitespace-pre font-mono-receipt text-slate-900 m-0">
                {receiptText}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (isUrdu ? 'کاپی ہو گیا' : 'Copied!') : (isUrdu ? 'متن کاپی کریں' : 'Copy Text')}</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="px-3 py-2 text-xs font-medium text-emerald-300 hover:text-emerald-200 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'واٹس ایپ پر بھیجیں' : 'WhatsApp'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSystemPrint}
              className="px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{isUrdu ? 'سسٹم پرنٹر' : 'System Print'}</span>
            </button>

            <button
              type="button"
              onClick={handleBluetoothPrint}
              disabled={isPrintingBt}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 rounded-lg flex items-center gap-2 shadow-sm transition-all"
            >
              <Bluetooth className={`w-4 h-4 ${isPrintingBt ? 'animate-pulse' : ''}`} />
              <span>
                {isPrintingBt
                  ? (isUrdu ? 'پرنٹ جاری ہے...' : 'Printing...')
                  : (isUrdu ? 'بلوٹوتھ پرنٹ کریں' : 'Print Bluetooth')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden container dedicated to browser system thermal printing */}
      <div id="thermal-receipt-print-area" className="hidden">
        <pre className="font-mono text-xs whitespace-pre leading-tight text-black m-0 p-0">
          {receiptText}
        </pre>
      </div>
    </div>
  );
};
