/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Product,
  Customer,
  Sale,
  KhataLedgerEntry,
  PrinterSettings,
  Expense,
  Language,
} from './types';
import { storageService } from './services/storage';
import { Sidebar, MainView } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { Dashboard } from './components/Dashboard';
import { PosCounter } from './components/PosCounter';
import { KhataManager } from './components/KhataManager';
import { VasooliDesk } from './components/VasooliDesk';
import { OverdueAccountsView } from './components/OverdueAccountsView';
import { ExpensesManager } from './components/ExpensesManager';
import { ReportsView } from './components/ReportsView';
import { InventoryManager } from './components/InventoryManager';
import { SuppliersDirectory } from './components/SuppliersDirectory';
import { SalesHistory } from './components/SalesHistory';
import { SettingsModal } from './components/SettingsModal';
import { ThermalPrintModal } from './components/ThermalPrintModal';
import { buildEscPosByteStream, renderSaleReceiptText } from './services/escpos';
import { bluetoothPrinter } from './services/bluetoothPrinter';
import { supabaseSyncService } from './services/supabaseSync';
import { MobileBottomNav } from './components/MobileBottomNav';

export default function App() {
  // Navigation & UI state
  const [currentView, setCurrentView] = useState<MainView>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Storage states
  const [language, setLanguage] = useState<Language>(() => storageService.getLanguage());
  const [products, setProducts] = useState<Product[]>(() => storageService.getProducts());
  const [customers, setCustomers] = useState<Customer[]>(() => storageService.getCustomers());
  const [sales, setSales] = useState<Sale[]>(() => storageService.getSales());
  const [ledger, setLedger] = useState<KhataLedgerEntry[]>(() => storageService.getKhataLedger());
  const [expenses, setExpenses] = useState<Expense[]>(() => storageService.getExpenses());
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(() =>
    storageService.getPrinterSettings()
  );

  // Active customer for quick vasooli
  const [selectedCustomerForVasooli, setSelectedCustomerForVasooli] = useState<Customer | null>(null);

  // Print Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [activeSaleForPrint, setActiveSaleForPrint] = useState<Sale | undefined>(undefined);
  const [activeVasooliForPrint, setActiveVasooliForPrint] = useState<KhataLedgerEntry | undefined>(undefined);

  // Sync HTML lang and dir attribute for pristine typography
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
  }, [language]);

  // Toggle Language
  const handleToggleLanguage = useCallback(() => {
    setLanguage((prev) => {
      const next = prev === 'ur' ? 'en' : 'ur';
      storageService.saveLanguage(next);
      return next;
    });
  }, []);

  // Refresh all state from storage
  const refreshAllData = useCallback(() => {
    setProducts(storageService.getProducts());
    setCustomers(storageService.getCustomers());
    setSales(storageService.getSales());
    setLedger(storageService.getKhataLedger());
    setExpenses(storageService.getExpenses());
    setPrinterSettings(storageService.getPrinterSettings());
  }, []);

  // Update Printer Settings
  const handleUpdatePrinterSettings = useCallback((newSettings: PrinterSettings) => {
    setPrinterSettings(newSettings);
    storageService.savePrinterSettings(newSettings);
  }, []);

  // Handle Complete Sale from POS Counter
  const handleCompleteSale = useCallback(
    (newSale: Sale) => {
      // 1. Prepend to sales
      const updatedSales = [newSale, ...sales];
      setSales(updatedSales);
      storageService.saveSales(updatedSales);

      // 2. Reduce inventory stock for all sold items
      const updatedProducts = products.map((prod) => {
        const cartItem = newSale.items.find((i) => i.product.id === prod.id);
        if (cartItem) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - cartItem.quantity),
          };
        }
        return prod;
      });
      setProducts(updatedProducts);
      storageService.saveProducts(updatedProducts);

      // 3. Handle Khata Ledger if payment was Udhaar or Split
      if (
        (newSale.paymentMethod === 'udhaar' || newSale.paymentMethod === 'split') &&
        newSale.customerId &&
        newSale.udhaarAmount > 0
      ) {
        let prevBal = 0;
        let customerObj: Customer | undefined;

        const updatedCustomers = customers.map((c) => {
          if (c.id === newSale.customerId) {
            prevBal = c.creditBalance;
            const updated = {
              ...c,
              creditBalance: c.creditBalance + newSale.udhaarAmount,
              lastTransactionDate: newSale.timestamp,
            };
            customerObj = updated;
            return updated;
          }
          return c;
        });

        setCustomers(updatedCustomers);
        storageService.saveCustomers(updatedCustomers);

        const itemsSummary = newSale.items
          .map((it) => `${it.product.nameUrdu || it.product.nameEn} (${it.quantity} ${it.product.unit})`)
          .join('، ');

        const itemsDetail = newSale.items.map((it) => ({
          name: it.product.nameUrdu || it.product.nameEn,
          quantity: it.quantity,
          unit: it.product.unit,
          unitPrice: it.unitPrice,
          total: it.total,
        }));

        const newLedgerEntry: KhataLedgerEntry = {
          id: `led-${Date.now()}`,
          customerId: newSale.customerId,
          customerName: customerObj?.nameEn || customerObj?.nameUrdu || 'Customer',
          date: newSale.timestamp,
          type: 'credit_sale',
          amount: newSale.udhaarAmount,
          saleId: newSale.id,
          receiptNo: newSale.receiptNo,
          previousBalance: prevBal,
          newBalance: prevBal + newSale.udhaarAmount,
          note:
            newSale.paymentMethod === 'split'
              ? `بل #${newSale.receiptNo}: کل ${Math.round(newSale.finalTotal)}، نقد ادا ${Math.round(newSale.cashReceived)}، باقی ادھار`
              : `بل #${newSale.receiptNo}: مکمل ادھار خریداری`,
          itemsSummary,
          itemsDetail,
        };

        const updatedLedger = [newLedgerEntry, ...ledger];
        setLedger(updatedLedger);
        storageService.saveKhataLedger(updatedLedger);
      }

      // Background Supabase Sync for Sale
      supabaseSyncService.syncSale(newSale).catch(() => {});

      // 4. Open Thermal Print sheet for the new bill
      setActiveSaleForPrint(newSale);
      setActiveVasooliForPrint(undefined);
      setIsPrintModalOpen(true);

      // 5. If auto-print is enabled, trigger background Bluetooth print
      if (printerSettings.autoPrint) {
        try {
          const formatted = renderSaleReceiptText(newSale, printerSettings, printerSettings.paperWidthChars);
          const bytes = buildEscPosByteStream(formatted);
          bluetoothPrinter.printBytes(bytes).catch(() => {});
        } catch {
          // ignore
        }
      }
    },
    [sales, products, customers, ledger, printerSettings]
  );

  // Handle Udhaar Vasooli (Payment Received)
  const handleRecordVasooli = useCallback(
    (entry: KhataLedgerEntry, updatedCustomer: Customer) => {
      const updatedCustomers = customers.map((c) =>
        c.id === updatedCustomer.id ? updatedCustomer : c
      );
      setCustomers(updatedCustomers);
      storageService.saveCustomers(updatedCustomers);

      const updatedLedger = [entry, ...ledger];
      setLedger(updatedLedger);
      storageService.saveKhataLedger(updatedLedger);

      // Background Supabase Sync for Vasooli & Customer balance
      supabaseSyncService.syncVasooli(entry, updatedCustomer).catch(() => {});
    },
    [customers, ledger]
  );

  // Trigger Vasooli Slip Print Modal
  const handlePrintVasooliSlip = useCallback((entry: KhataLedgerEntry) => {
    setActiveVasooliForPrint(entry);
    setActiveSaleForPrint(undefined);
    setIsPrintModalOpen(true);
  }, []);

  // Trigger Sale Receipt Print Modal
  const handleSelectSaleForPrint = useCallback((sale: Sale) => {
    setActiveSaleForPrint(sale);
    setActiveVasooliForPrint(undefined);
    setIsPrintModalOpen(true);
  }, []);

  // Add / Update Product
  const handleAddProduct = useCallback(
    (p: Product) => {
      const updated = [p, ...products];
      setProducts(updated);
      storageService.saveProducts(updated);
      supabaseSyncService.syncProduct(p).catch(() => {});
    },
    [products]
  );

  const handleUpdateProduct = useCallback(
    (p: Product) => {
      const updated = products.map((item) => (item.id === p.id ? p : item));
      setProducts(updated);
      storageService.saveProducts(updated);
      supabaseSyncService.syncProduct(p).catch(() => {});
    },
    [products]
  );

  const handleDeleteProduct = useCallback(
    (productId: string) => {
      const updated = products.filter((p) => p.id !== productId);
      setProducts(updated);
      storageService.saveProducts(updated);
    },
    [products]
  );

  // Add / Update Customer
  const handleAddCustomer = useCallback(
    (c: Customer) => {
      const updated = [c, ...customers];
      setCustomers(updated);
      storageService.saveCustomers(updated);
      supabaseSyncService.syncCustomer(c).catch(() => {});
    },
    [customers]
  );

  const handleUpdateCustomer = useCallback(
    (c: Customer) => {
      const updated = customers.map((item) => (item.id === c.id ? c : item));
      setCustomers(updated);
      storageService.saveCustomers(updated);
      supabaseSyncService.syncCustomer(c).catch(() => {});
    },
    [customers]
  );

  // Quick Restock helper
  const handleQuickRestock = useCallback(
    (product: Product) => {
      const updated: Product = {
        ...product,
        stock: product.stock + 10,
      };
      handleUpdateProduct(updated);
    },
    [handleUpdateProduct]
  );

  // Low stock items count
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock <= p.minStockAlert).length;
  }, [products]);

  // Open Vasooli from Dashboard
  const handleOpenVasooliFromDashboard = useCallback((cust: Customer) => {
    setSelectedCustomerForVasooli(cust);
    setCurrentView('khata_vasooli');
  }, []);

  // Expense Handlers
  const handleAddExpense = useCallback(
    (expense: Expense) => {
      const updated = [expense, ...expenses];
      setExpenses(updated);
      storageService.saveExpenses(updated);
      supabaseSyncService.syncExpense(expense).catch(() => {});
    },
    [expenses]
  );

  const handleDeleteExpense = useCallback(
    (expenseId: string) => {
      const updated = expenses.filter((e) => e.id !== expenseId);
      setExpenses(updated);
      storageService.saveExpenses(updated);
    },
    [expenses]
  );

  return (
    <div
      className={`min-h-screen bg-slate-100 text-slate-900 flex flex-col md:flex-row ${
        language === 'ur' ? 'font-urdu' : ''
      }`}
    >
      {/* Desktop Static/Sticky Sidebar: Pure flex child, zero overlap in LTR & RTL */}
      <div className="hidden md:flex md:w-64 md:shrink-0 md:sticky md:top-0 md:h-screen z-30">
        <Sidebar
          currentView={currentView}
          onSelectView={setCurrentView}
          language={language}
          printerSettings={printerSettings}
          lowStockCount={lowStockCount}
          isMobile={false}
        />
      </div>

      {/* Mobile Slide-over Drawer (< md) */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        language={language}
        printerSettings={printerSettings}
        lowStockCount={lowStockCount}
        isMobile={true}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        {/* Top Header */}
        <TopHeader
          currentView={currentView}
          onSelectView={setCurrentView}
          language={language}
          onToggleLanguage={handleToggleLanguage}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenNewCashSale={() => setCurrentView('pos_cash')}
          onOpenNewKhataSale={() => setCurrentView('pos_khata')}
          onOpenAddProduct={() => setCurrentView('inventory')}
          printerSettings={printerSettings}
          searchQuery={globalSearch}
          onSearchChange={setGlobalSearch}
        />

        {/* View Router */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          {currentView === 'dashboard' && (
            <Dashboard
              sales={sales}
              customers={customers}
              products={products}
              ledger={ledger}
              language={language}
              printerSettings={printerSettings}
              onNavigateToCashSale={() => setCurrentView('pos_cash')}
              onNavigateToKhataSale={() => setCurrentView('pos_khata')}
              onNavigateToVasooli={() => setCurrentView('khata_vasooli')}
              onNavigateToInventory={() => setCurrentView('inventory')}
              onNavigateToCustomers={() => setCurrentView('customers')}
              onSelectSaleForPrint={handleSelectSaleForPrint}
              onQuickRestock={handleQuickRestock}
              onOpenVasooliModal={handleOpenVasooliFromDashboard}
            />
          )}

          {(currentView === 'pos_cash' || currentView === 'pos_khata') && (
            <PosCounter
              products={products}
              customers={customers}
              onCompleteSale={handleCompleteSale}
              onAddQuickCustomer={handleAddCustomer}
              onAddProduct={handleAddProduct}
              printerSettings={printerSettings}
              language={language}
              initialMode={currentView === 'pos_khata' ? 'udhaar' : 'cash'}
            />
          )}

          {(currentView === 'khata_active' || currentView === 'customers') && (
            <KhataManager
              customers={customers}
              ledger={ledger}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onRecordVasooli={handleRecordVasooli}
              onPrintVasooliSlip={handlePrintVasooliSlip}
              printerSettings={printerSettings}
              language={language}
              initialFilter={currentView === 'customers' ? 'all' : 'due'}
            />
          )}

          {currentView === 'khata_vasooli' && (
            <VasooliDesk
              customers={customers}
              ledger={ledger}
              onRecordVasooli={handleRecordVasooli}
              onPrintVasooliSlip={handlePrintVasooliSlip}
              printerSettings={printerSettings}
              language={language}
            />
          )}

          {currentView === 'khata_overdue' && (
            <OverdueAccountsView
              customers={customers}
              onUpdateCustomer={handleUpdateCustomer}
              onNavigateToVasooli={(cust) => {
                setSelectedCustomerForVasooli(cust);
                setCurrentView('khata_vasooli');
              }}
              printerSettings={printerSettings}
              language={language}
            />
          )}

          {currentView === 'expenses' && (
            <ExpensesManager
              expenses={expenses}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              language={language}
            />
          )}

          {currentView === 'reports' && (
            <ReportsView
              sales={sales}
              customers={customers}
              expenses={expenses}
              ledger={ledger}
              products={products}
              printerSettings={printerSettings}
              language={language}
            />
          )}

          {currentView === 'inventory' && (
            <InventoryManager
              products={products}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              language={language}
            />
          )}

          {currentView === 'suppliers' && (
            <SuppliersDirectory language={language} />
          )}

          {currentView === 'sales_history' && (
            <SalesHistory
              sales={sales}
              onSelectSaleForPrint={handleSelectSaleForPrint}
              printerSettings={printerSettings}
              language={language}
            />
          )}

          {currentView === 'printer_settings' && (
            <SettingsModal
              settings={printerSettings}
              onSaveSettings={handleUpdatePrinterSettings}
              language={language}
              onRefreshAllData={refreshAllData}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation Bar for Android/iPhone (< md) */}
        <MobileBottomNav
          currentView={currentView}
          onSelectView={setCurrentView}
          onOpenMenu={() => setIsMobileSidebarOpen(true)}
          language={language}
        />
      </div>

      {/* 58mm / 80mm ESC/POS Bluetooth Thermal Printer Sheet */}
      <ThermalPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        sale={activeSaleForPrint}
        vasooliEntry={activeVasooliForPrint}
        settings={printerSettings}
        onUpdateSettings={handleUpdatePrinterSettings}
        language={language}
      />
    </div>
  );
}
