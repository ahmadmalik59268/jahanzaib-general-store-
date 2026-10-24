import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Product, Customer, Sale, KhataLedgerEntry, Expense } from '../types';
import { storageService } from './storage';

export interface SyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  errorMessage: string | null;
  syncedCounts: {
    products: number;
    customers: number;
    sales: number;
    ledger: number;
    expenses: number;
  };
}

class SupabaseSyncService {
  private lastSynced: string | null = null;
  private error: string | null = null;

  public isReady(): boolean {
    return isSupabaseConfigured() && supabase !== null;
  }

  public getStatus(): SyncStatus {
    const products = storageService.getProducts();
    const customers = storageService.getCustomers();
    const sales = storageService.getSales();
    const ledger = storageService.getKhataLedger();
    const expenses = storageService.getExpenses();

    return {
      isConnected: this.isReady(),
      isSyncing: false,
      lastSyncedAt: this.lastSynced,
      errorMessage: this.error,
      syncedCounts: {
        products: products.length,
        customers: customers.length,
        sales: sales.length,
        ledger: ledger.length,
        expenses: expenses.length,
      },
    };
  }

  // 1. Sync Single Product (Upsert)
  public async syncProduct(p: Product): Promise<boolean> {
    if (!this.isReady() || !supabase) return false;
    try {
      const { error } = await supabase.from('products').upsert({
        product_id: p.id,
        barcode: p.barcode,
        name_urdu: p.nameUrdu,
        name_en: p.nameEn,
        category_id: p.category,
        buy_price: p.buyPrice,
        sale_price: p.salePrice,
        current_stock: p.stock,
        min_stock_alert: p.minStockAlert,
        unit: p.unit,
        image_url: p.image || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'product_id' });

      if (error) {
        console.warn('Supabase syncProduct warning:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase syncProduct network error:', err);
      return false;
    }
  }

  // 2. Sync Single Customer (Upsert)
  public async syncCustomer(c: Customer): Promise<boolean> {
    if (!this.isReady() || !supabase) return false;
    try {
      const { error } = await supabase.from('customers').upsert({
        customer_id: c.id,
        name_urdu: c.nameUrdu,
        name_en: c.nameEn || null,
        phone: c.phone,
        address: c.address || null,
        credit_balance: c.creditBalance,
        credit_limit: c.creditLimit,
        is_frozen: !!c.isFrozen,
        last_transaction_date: c.lastTransactionDate || new Date().toISOString(),
        notes: c.notes || null,
      }, { onConflict: 'customer_id' });

      if (error) {
        console.warn('Supabase syncCustomer warning:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase syncCustomer network error:', err);
      return false;
    }
  }

  // 3. Sync Sale & its Items Basket + Stock Update
  public async syncSale(sale: Sale): Promise<boolean> {
    if (!this.isReady() || !supabase) return false;
    try {
      // Step A: Insert Sale master record
      const { error: saleError } = await supabase.from('sales').upsert({
        sale_id: sale.id,
        receipt_no: sale.receiptNo,
        sale_timestamp: sale.timestamp,
        payment_method: sale.paymentMethod,
        subtotal: sale.subtotal,
        discount: sale.discount,
        final_total: sale.finalTotal,
        cash_received: sale.cashReceived,
        udhaar_amount: sale.udhaarAmount,
        change_due: sale.changeDue,
        customer_id: sale.customerId || null,
        customer_name: sale.customerName || null,
      }, { onConflict: 'sale_id' });

      if (saleError) {
        console.warn('Supabase syncSale header error:', saleError.message);
        return false;
      }

      // Step B: Insert Sale Items
      if (sale.items && sale.items.length > 0) {
        const lineItems = sale.items.map((item, idx) => ({
          item_id: `${sale.id}-item-${idx + 1}`,
          sale_id: sale.id,
          product_id: item.product.id,
          product_name_urdu: item.product.nameUrdu,
          product_name_en: item.product.nameEn,
          quantity: item.quantity,
          unit: item.product.unit,
          buy_price: item.product.buyPrice,
          sale_price: item.unitPrice,
          line_total: item.total,
          line_profit: (item.unitPrice - item.product.buyPrice) * item.quantity,
        }));

        await supabase.from('sale_items').upsert(lineItems, { onConflict: 'item_id' });
      }

      // Step C: Update customer balance if credit sale
      if (sale.customerId && sale.udhaarAmount > 0) {
        const customer = storageService.getCustomers().find(c => c.id === sale.customerId);
        if (customer) {
          await this.syncCustomer(customer);
        }
      }

      return true;
    } catch (err) {
      console.warn('Supabase syncSale network error:', err);
      return false;
    }
  }

  // 4. Sync Vasooli / Khata Ledger Entry
  public async syncVasooli(entry: KhataLedgerEntry, customer?: Customer): Promise<boolean> {
    if (!this.isReady() || !supabase) return false;
    try {
      const { error: ledError } = await supabase.from('khata_ledger').upsert({
        ledger_id: entry.id,
        customer_id: entry.customerId,
        customer_name: entry.customerName,
        transaction_date: entry.date,
        entry_type: entry.type,
        amount: entry.amount,
        previous_balance: entry.previousBalance,
        new_balance: entry.newBalance,
        sale_id: entry.saleId || null,
        receipt_no: entry.receiptNo || null,
        payment_mode: entry.paymentMode || 'cash',
        note: entry.note || null,
        items_summary: entry.itemsSummary || null,
        items_detail_json: entry.itemsDetail || [],
      }, { onConflict: 'ledger_id' });

      if (ledError) {
        console.warn('Supabase syncVasooli error:', ledError.message);
        return false;
      }

      // Also update customer balance in Supabase
      if (customer) {
        await this.syncCustomer(customer);
      }

      return true;
    } catch (err) {
      console.warn('Supabase syncVasooli network error:', err);
      return false;
    }
  }

  // 5. Sync Expense
  public async syncExpense(expense: Expense): Promise<boolean> {
    if (!this.isReady() || !supabase) return false;
    try {
      const { error } = await supabase.from('expenses').upsert({
        expense_id: expense.id,
        expense_date: expense.date,
        category: expense.category,
        category_title_urdu: expense.categoryTitleUrdu,
        category_title_en: expense.categoryTitleEn,
        amount: expense.amount,
        paid_to: expense.paidTo,
        payment_mode: expense.paymentMode,
        note: expense.note || null,
      }, { onConflict: 'expense_id' });

      if (error) {
        console.warn('Supabase syncExpense error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase syncExpense network error:', err);
      return false;
    }
  }

  // 6. One-Click Full Database Push (Sync All local records to Supabase)
  public async syncAllToSupabase(): Promise<{ success: boolean; message: string }> {
    if (!this.isReady() || !supabase) {
      return {
        success: false,
        message: 'سپابیس کنکشن فعال نہیں ہے۔ براائے مہربانی پراجیکٹ URL اور Anon Key مہیا کریں۔',
      };
    }

    try {
      const products = storageService.getProducts();
      const customers = storageService.getCustomers();
      const sales = storageService.getSales();
      const ledger = storageService.getKhataLedger();
      const expenses = storageService.getExpenses();

      // Upsert Products
      if (products.length > 0) {
        const mappedProducts = products.map((p) => ({
          product_id: p.id,
          barcode: p.barcode,
          name_urdu: p.nameUrdu,
          name_en: p.nameEn,
          category_id: p.category,
          buy_price: p.buyPrice,
          sale_price: p.salePrice,
          current_stock: p.stock,
          min_stock_alert: p.minStockAlert,
          unit: p.unit,
          image_url: p.image || null,
        }));
        await supabase.from('products').upsert(mappedProducts, { onConflict: 'product_id' });
      }

      // Upsert Customers
      if (customers.length > 0) {
        const mappedCustomers = customers.map((c) => ({
          customer_id: c.id,
          name_urdu: c.nameUrdu,
          name_en: c.nameEn || null,
          phone: c.phone,
          address: c.address || null,
          credit_balance: c.creditBalance,
          credit_limit: c.creditLimit,
          is_frozen: !!c.isFrozen,
          last_transaction_date: c.lastTransactionDate || new Date().toISOString(),
          notes: c.notes || null,
        }));
        await supabase.from('customers').upsert(mappedCustomers, { onConflict: 'customer_id' });
      }

      // Upsert Sales
      if (sales.length > 0) {
        const mappedSales = sales.map((s) => ({
          sale_id: s.id,
          receipt_no: s.receiptNo,
          sale_timestamp: s.timestamp,
          payment_method: s.paymentMethod,
          subtotal: s.subtotal,
          discount: s.discount,
          final_total: s.finalTotal,
          cash_received: s.cashReceived,
          udhaar_amount: s.udhaarAmount,
          change_due: s.changeDue,
          customer_id: s.customerId || null,
          customer_name: s.customerName || null,
        }));
        await supabase.from('sales').upsert(mappedSales, { onConflict: 'sale_id' });
      }

      // Upsert Khata Ledger
      if (ledger.length > 0) {
        const mappedLedger = ledger.map((l) => ({
          ledger_id: l.id,
          customer_id: l.customerId,
          customer_name: l.customerName,
          transaction_date: l.date,
          entry_type: l.type,
          amount: l.amount,
          previous_balance: l.previousBalance,
          new_balance: l.newBalance,
          sale_id: l.saleId || null,
          receipt_no: l.receiptNo || null,
          payment_mode: l.paymentMode || 'cash',
          note: l.note || null,
          items_summary: l.itemsSummary || null,
          items_detail_json: l.itemsDetail || [],
        }));
        await supabase.from('khata_ledger').upsert(mappedLedger, { onConflict: 'ledger_id' });
      }

      // Upsert Expenses
      if (expenses.length > 0) {
        const mappedExpenses = expenses.map((e) => ({
          expense_id: e.id,
          expense_date: e.date,
          category: e.category,
          category_title_urdu: e.categoryTitleUrdu,
          category_title_en: e.categoryTitleEn,
          amount: e.amount,
          paid_to: e.paidTo,
          payment_mode: e.paymentMode,
          note: e.note || null,
        }));
        await supabase.from('expenses').upsert(mappedExpenses, { onConflict: 'expense_id' });
      }

      this.lastSynced = new Date().toISOString();
      this.error = null;

      return {
        success: true,
        message: 'تمام پروڈکٹس، کسٹمرز، سیلز، کھاتہ لیجر اور اخراجات سپابیس میں کامیابی سے سنک ہو گئے ہیں!',
      };
    } catch (err: any) {
      console.error('Failed full sync to Supabase:', err);
      this.error = err?.message || 'سنک کرتے وقت خرابی پیش آئی';
      return {
        success: false,
        message: `سنک میں خرابی: ${this.error}`,
      };
    }
  }
}

export const supabaseSyncService = new SupabaseSyncService();
