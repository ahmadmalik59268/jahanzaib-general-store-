export interface Product {
  id: string;
  barcode: string;
  nameUrdu: string;
  nameEn: string;
  category: string;
  buyPrice: number;
  salePrice: number;
  stock: number;
  minStockAlert: number;
  unit: string; // 'kg' | 'packet' | 'piece' | 'litre' | 'box' | 'dozen'
  image?: string;
}

export interface Customer {
  id: string;
  nameUrdu: string;
  nameEn: string;
  phone: string;
  address?: string;
  creditBalance: number; // positive means customer owes store (Udhaar)
  creditLimit: number;
  lastTransactionDate: string;
  dueDate?: string;
  isFrozen?: boolean;
  notes?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type PaymentMethod = 'cash' | 'udhaar' | 'split';

export interface Sale {
  id: string;
  receiptNo: string;
  timestamp: string; // ISO string
  items: CartItem[];
  subtotal: number;
  discount: number;
  finalTotal: number;
  paymentMethod: PaymentMethod;
  cashReceived: number;
  udhaarAmount: number;
  customerId?: string;
  customerName?: string;
  changeDue: number;
  previousCustomerBalance?: number;
  newCustomerBalance?: number;
  notes?: string;
}

export interface KhataItemDetail {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface KhataLedgerEntry {
  id: string;
  customerId: string;
  customerName: string;
  date: string; // ISO string
  type: 'credit_sale' | 'payment_received' | 'opening_balance' | 'adjustment';
  amount: number;
  saleId?: string;
  receiptNo?: string;
  previousBalance: number;
  newBalance: number;
  note: string;
  paymentMode?: 'cash' | 'easypaisa' | 'jazzcash' | 'bank';
  itemsSummary?: string;
  itemsDetail?: KhataItemDetail[];
}

export interface Expense {
  id: string;
  date: string; // ISO string
  category:
    | 'rent'
    | 'electricity'
    | 'salary'
    | 'tea'
    | 'freight'
    | 'bags'
    | 'maintenance'
    | 'other';
  categoryTitleUrdu: string;
  categoryTitleEn: string;
  amount: number;
  paidTo: string;
  paymentMode: 'cash' | 'bank' | 'easypaisa' | 'jazzcash';
  note?: string;
}

export interface PrinterSettings {
  printerName: string;
  printerAddress: string;
  paperWidthChars: 32 | 48; // 32 for 58mm, 48 for 80mm
  autoPrint: boolean;
  shopNameUrdu: string;
  shopNameEn: string;
  shopPhone: string;
  shopAddress: string;
  footerMessageUrdu: string;
  footerMessageEn: string;
}

export type TimeFilter = 'today' | 'week' | 'month' | 'all';
export type Language = 'ur' | 'en';
