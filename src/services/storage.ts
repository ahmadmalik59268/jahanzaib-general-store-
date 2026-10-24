import { Product, Customer, Sale, KhataLedgerEntry, PrinterSettings, Expense } from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'dukandar_products_v1',
  CUSTOMERS: 'dukandar_customers_v1',
  SALES: 'dukandar_sales_v1',
  KHATA_LEDGER: 'dukandar_khata_ledger_v1',
  EXPENSES: 'dukandar_expenses_v1',
  PRINTER_SETTINGS: 'dukandar_printer_settings_v1',
  LANGUAGE: 'dukandar_lang_v1',
};

// Seed Products: Realistic Pakistani General Store inventory
export const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    barcode: '8964000101',
    nameUrdu: 'سن رج چکی آٹا 10 کلو',
    nameEn: 'Sunridge Chakki Atta 10kg',
    category: 'Grains & Flour',
    buyPrice: 1250,
    salePrice: 1380,
    stock: 45,
    minStockAlert: 10,
    unit: 'bag',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-2',
    barcode: '8964000102',
    nameUrdu: 'چینی (خالص گریڈ اے)',
    nameEn: 'Sugar Grade-A',
    category: 'Grains & Flour',
    buyPrice: 135,
    salePrice: 150,
    stock: 120,
    minStockAlert: 25,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-3',
    barcode: '8964000103',
    nameUrdu: 'ڈالڈا بناسپتی گھی 1 کلو پاؤچ',
    nameEn: 'Dalda Banaspati Ghee 1kg',
    category: 'Oil & Ghee',
    buyPrice: 510,
    salePrice: 560,
    stock: 35,
    minStockAlert: 8,
    unit: 'pouch',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-4',
    barcode: '8964000104',
    nameUrdu: 'حبیب کوکنگ آئل 1 لیٹر پاؤچ',
    nameEn: 'Habib Cooking Oil 1L',
    category: 'Oil & Ghee',
    buyPrice: 525,
    salePrice: 580,
    stock: 28,
    minStockAlert: 8,
    unit: 'pouch',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-5',
    barcode: '8964000105',
    nameUrdu: 'گارڈ باسمتی سپر چاول',
    nameEn: 'Guard Super Basmati Rice',
    category: 'Grains & Flour',
    buyPrice: 280,
    salePrice: 330,
    stock: 80,
    minStockAlert: 15,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-6',
    barcode: '8964000106',
    nameUrdu: 'ٹیپال دانہ دار چائے 430 گرام',
    nameEn: 'Tapal Danedar Tea 430g',
    category: 'Tea & Coffee',
    buyPrice: 710,
    salePrice: 780,
    stock: 22,
    minStockAlert: 5,
    unit: 'packet',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-7',
    barcode: '8964000107',
    nameUrdu: 'دال چنا بہترین کوالٹی',
    nameEn: 'Daal Chana Special',
    category: 'Pulses & Spices',
    buyPrice: 240,
    salePrice: 280,
    stock: 60,
    minStockAlert: 12,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-8',
    barcode: '8964000108',
    nameUrdu: 'دال ماش دھلی ہوئی',
    nameEn: 'Daal Maash Washed',
    category: 'Pulses & Spices',
    buyPrice: 420,
    salePrice: 480,
    stock: 40,
    minStockAlert: 10,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1585994192701-f1a505c8574a?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-9',
    barcode: '8964000109',
    nameUrdu: 'نیشنل سرخ مرچ پاؤڈر 200 گرام',
    nameEn: 'National Red Chilli Powder 200g',
    category: 'Pulses & Spices',
    buyPrice: 220,
    salePrice: 260,
    stock: 30,
    minStockAlert: 6,
    unit: 'packet',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-10',
    barcode: '8964000110',
    nameUrdu: 'شان بمبئی بریانی مصالحہ',
    nameEn: 'Shan Bombay Biryani Masala',
    category: 'Pulses & Spices',
    buyPrice: 95,
    salePrice: 120,
    stock: 50,
    minStockAlert: 10,
    unit: 'box',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-11',
    barcode: '8964000111',
    nameUrdu: 'اولپرز دودھ 1 لیٹر',
    nameEn: "Olper's Full Cream Milk 1L",
    category: 'Dairy & Bakery',
    buyPrice: 265,
    salePrice: 290,
    stock: 32,
    minStockAlert: 10,
    unit: 'tetra',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-12',
    barcode: '8964000112',
    nameUrdu: 'سرف ایکسل 1 کلو پیکٹ',
    nameEn: 'Surf Excel Washing Powder 1kg',
    category: 'Home & Cleaning',
    buyPrice: 580,
    salePrice: 650,
    stock: 18,
    minStockAlert: 5,
    unit: 'packet',
    image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-13',
    barcode: '8964000113',
    nameUrdu: 'لائف بوائے صابن ریڈ',
    nameEn: 'Lifebuoy Red Soap Bar',
    category: 'Personal Care',
    buyPrice: 85,
    salePrice: 100,
    stock: 64,
    minStockAlert: 15,
    unit: 'piece',
    image: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-14',
    barcode: '8964000114',
    nameUrdu: 'کوکا کولا 1.5 لیٹر بوتل',
    nameEn: 'Coca Cola 1.5L PET',
    category: 'Beverages & Snacks',
    buyPrice: 160,
    salePrice: 190,
    stock: 40,
    minStockAlert: 10,
    unit: 'bottle',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-15',
    barcode: '8964000115',
    nameUrdu: 'لیز مصالحہ چپس بڑا پیکٹ',
    nameEn: 'Lays Masala Big Pack',
    category: 'Beverages & Snacks',
    buyPrice: 82,
    salePrice: 100,
    stock: 45,
    minStockAlert: 12,
    unit: 'packet',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-16',
    barcode: '8964000116',
    nameUrdu: 'پیک فرینز سپر بسکٹ فیملی پیک',
    nameEn: 'Peek Freans Super Biscuit Family',
    category: 'Beverages & Snacks',
    buyPrice: 135,
    salePrice: 160,
    stock: 26,
    minStockAlert: 8,
    unit: 'packet',
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-17',
    barcode: '8964000117',
    nameUrdu: 'روح افزاء 800 ملی لیٹر',
    nameEn: 'Rooh Afza Syrup 800ml',
    category: 'Beverages & Snacks',
    buyPrice: 380,
    salePrice: 430,
    stock: 6, // Low stock on purpose to showcase alert!
    minStockAlert: 10,
    unit: 'bottle',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-18',
    barcode: '8964000118',
    nameUrdu: 'ڈٹول صابن اوریجنل',
    nameEn: 'Dettol Soap Original',
    category: 'Personal Care',
    buyPrice: 115,
    salePrice: 140,
    stock: 4, // Low stock on purpose
    minStockAlert: 8,
    unit: 'piece',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80',
  },
];

// Seed Customers with Realistic Khata Balances
export const SEED_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    nameUrdu: 'حاجی محمد اسلم صاحب',
    nameEn: 'Haji Muhammad Aslam',
    phone: '03001234567',
    address: 'مکان نمبر 14، گلی نمبر 2، مین بازار',
    creditBalance: 3450,
    creditLimit: 15000,
    lastTransactionDate: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    notes: 'پرانے اور بااعتماد گاہک، مہینے کے آخر میں ادائیگی کرتے ہیں',
  },
  {
    id: 'cust-2',
    nameUrdu: 'چوہدری طارق محمود',
    nameEn: 'Chaudhry Tariq Mehmood',
    phone: '03217654321',
    address: 'ڈیرہ چوہدری طارق، نزدی مسجد',
    creditBalance: 6800,
    creditLimit: 20000,
    lastTransactionDate: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    notes: 'گھر کا راشن ادھار لیتے ہیں، زرعی کام ہے',
  },
  {
    id: 'cust-3',
    nameUrdu: 'ماسٹر محمد اکرم صاحب',
    nameEn: 'Master Muhammad Akram',
    phone: '03339876543',
    address: 'گورنمنٹ سکول والی گلی',
    creditBalance: 1200,
    creditLimit: 8000,
    lastTransactionDate: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
    notes: 'سکول ٹیچر، پہلی تاریخ کو ادھار صاف کرتے ہیں',
  },
  {
    id: 'cust-4',
    nameUrdu: 'ملک عثمان اعوان',
    nameEn: 'Malik Usman Awan',
    phone: '03451122334',
    address: 'دکان نزدی پٹرول پمپ',
    creditBalance: 0,
    creditLimit: 10000,
    lastTransactionDate: new Date(Date.now() - 86400 * 1000).toISOString(),
    notes: 'کھاتہ بلکل صاف ہے، اکثر کیش پر خریداری کرتے ہیں',
  },
  {
    id: 'cust-5',
    nameUrdu: 'باجی زبیدہ بی بی',
    nameEn: 'Baji Zubaida',
    phone: '03025566778',
    address: 'محلہ فاروقیہ، گلی نمبر 5',
    creditBalance: 2750,
    creditLimit: 6000,
    lastTransactionDate: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
    notes: 'ہفتہ وار ادھار کھاتہ',
  },
  {
    id: 'cust-6',
    nameUrdu: 'کاشف درزی (ٹیلر ماسٹر)',
    nameEn: 'Kashif Tailor Master',
    phone: '03124455667',
    address: 'کاشف ٹیلرز، مارکیٹ چوک',
    creditBalance: 4100,
    creditLimit: 10000,
    lastTransactionDate: new Date(Date.now() - 10 * 86400 * 1000).toISOString(),
    notes: 'دکان کے چائے بسکٹ اور راشن کا کھاتہ',
  },
];

// Seed Printer Settings
export const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  printerName: 'POS-58 Bluetooth Thermal Printer',
  printerAddress: '00:11:22:33:44:55',
  paperWidthChars: 32, // 32 chars for 58mm by default, toggleable to 48 chars (80mm)
  autoPrint: false,
  shopNameUrdu: 'جہانزیب جنرل سٹور',
  shopNameEn: 'Jahanzaib General Store',
  shopPhone: '0300-1234567',
  shopAddress: 'مین بازار، نزدی جامع مسجد',
  footerMessageUrdu: 'خریدے ہوئے سامان کی تبدیلی 3 دن کے اندر بل کے ساتھ ممکن ہے۔',
  footerMessageEn: 'Items can be exchanged within 3 days with original bill.',
};

// Seed Initial Sales & Khata Ledger
export function generateSeedSalesAndLedger(): { sales: Sale[]; ledger: KhataLedgerEntry[] } {
  const now = Date.now();
  const sales: Sale[] = [];
  const ledger: KhataLedgerEntry[] = [];

  // Sale 1: Today - Cash
  sales.push({
    id: 'sale-101',
    receiptNo: '1001',
    timestamp: new Date(now - 45 * 60 * 1000).toISOString(),
    items: [
      { product: SEED_PRODUCTS[1], quantity: 2, unitPrice: 150, total: 300 }, // 2kg sugar
      { product: SEED_PRODUCTS[5], quantity: 1, unitPrice: 780, total: 780 }, // 1 Tapal tea
      { product: SEED_PRODUCTS[13], quantity: 2, unitPrice: 190, total: 380 }, // 2 Coke
    ],
    subtotal: 1460,
    discount: 60,
    finalTotal: 1400,
    paymentMethod: 'cash',
    cashReceived: 1500,
    udhaarAmount: 0,
    changeDue: 100,
  });

  // Sale 2: Today - Udhaar (Haji Muhammad Aslam)
  sales.push({
    id: 'sale-102',
    receiptNo: '1002',
    timestamp: new Date(now - 2 * 3600 * 1000).toISOString(),
    items: [
      { product: SEED_PRODUCTS[0], quantity: 1, unitPrice: 1380, total: 1380 }, // 1 Atta
      { product: SEED_PRODUCTS[2], quantity: 2, unitPrice: 560, total: 1120 }, // 2 Dalda
      { product: SEED_PRODUCTS[6], quantity: 2, unitPrice: 280, total: 560 }, // 2 Daal Chana
    ],
    subtotal: 3060,
    discount: 60,
    finalTotal: 3000,
    paymentMethod: 'udhaar',
    cashReceived: 0,
    udhaarAmount: 3000,
    customerId: 'cust-1',
    customerName: 'Haji Muhammad Aslam (حاجی محمد اسلم)',
    changeDue: 0,
  });

  ledger.push({
    id: 'led-1',
    customerId: 'cust-1',
    customerName: 'Haji Muhammad Aslam',
    date: new Date(now - 2 * 3600 * 1000).toISOString(),
    type: 'credit_sale',
    amount: 3000,
    saleId: 'sale-102',
    receiptNo: '1002',
    previousBalance: 450,
    newBalance: 3450,
    note: 'بل نمبر #1002 پر راشن کی خریداری ادھار',
    itemsSummary: 'سن رج آٹا 10 کلو (1 تھیلا)، ڈالڈا گھی (2 کلو)، دال چنا (2 کلو)',
    itemsDetail: [
      { name: 'سن رج چکی آٹا 10 کلو', quantity: 1, unit: 'bag', unitPrice: 1380, total: 1380 },
      { name: 'ڈالڈا کوکنگ آئل / گھی 1 کلو', quantity: 2, unit: 'pouch', unitPrice: 560, total: 1120 },
      { name: 'دال چنا سپیشل 1 کلو', quantity: 2, unit: 'kg', unitPrice: 280, total: 560 },
    ],
  });

  // Sale 3: Yesterday - Split Payment (Chaudhry Tariq Mehmood)
  sales.push({
    id: 'sale-103',
    receiptNo: '1003',
    timestamp: new Date(now - 26 * 3600 * 1000).toISOString(),
    items: [
      { product: SEED_PRODUCTS[4], quantity: 5, unitPrice: 330, total: 1650 }, // 5kg Rice
      { product: SEED_PRODUCTS[3], quantity: 2, unitPrice: 580, total: 1160 }, // 2 Habib Oil
      { product: SEED_PRODUCTS[11], quantity: 1, unitPrice: 650, total: 650 }, // 1 Surf Excel
    ],
    subtotal: 3460,
    discount: 60,
    finalTotal: 3400,
    paymentMethod: 'split',
    cashReceived: 1400,
    udhaarAmount: 2000,
    customerId: 'cust-2',
    customerName: 'Chaudhry Tariq Mehmood (چوہدری طارق)',
    changeDue: 0,
  });

  ledger.push({
    id: 'led-2',
    customerId: 'cust-2',
    customerName: 'Chaudhry Tariq Mehmood',
    date: new Date(now - 26 * 3600 * 1000).toISOString(),
    type: 'credit_sale',
    amount: 2000,
    saleId: 'sale-103',
    receiptNo: '1003',
    previousBalance: 4800,
    newBalance: 6800,
    note: 'بل #1003: کل 3400، نقد 1400 ادا، بقایا 2000 کھاتہ میں شامل',
    itemsSummary: 'کرنل باسمتی چاول (5 کلو)، حبیب آئل (2 ل)، سرف ایکسل (1 پیکٹ)',
    itemsDetail: [
      { name: 'سپر کرنل باسمتی چاول', quantity: 5, unit: 'kg', unitPrice: 330, total: 1650 },
      { name: 'حبیب کوکنگ آئل 1 لیٹر', quantity: 2, unit: 'pouch', unitPrice: 580, total: 1160 },
      { name: 'سرف ایکسل 1 کلو پیکٹ', quantity: 1, unit: 'packet', unitPrice: 650, total: 650 },
    ],
  });

  // Sale 4: This Week - Cash
  sales.push({
    id: 'sale-104',
    receiptNo: '1004',
    timestamp: new Date(now - 3 * 86400 * 1000).toISOString(),
    items: [
      { product: SEED_PRODUCTS[10], quantity: 4, unitPrice: 290, total: 1160 }, // Milk
      { product: SEED_PRODUCTS[15], quantity: 3, unitPrice: 160, total: 480 },
    ],
    subtotal: 1640,
    discount: 40,
    finalTotal: 1600,
    paymentMethod: 'cash',
    cashReceived: 2000,
    udhaarAmount: 0,
    changeDue: 400,
  });

  // Vasooli Entry (Payment Received from Master Akram)
  ledger.push({
    id: 'led-3',
    customerId: 'cust-3',
    customerName: 'Master Muhammad Akram',
    date: new Date(now - 4 * 86400 * 1000).toISOString(),
    type: 'payment_received',
    amount: 2000,
    previousBalance: 3200,
    newBalance: 1200,
    note: 'پچھلے ادھار میں سے نقد وصولی بذریعہ کیش',
    paymentMode: 'cash',
  });

  // Kashif Tailor Master (cust-6) previous ledger entries (Balance: 4,100)
  ledger.push({
    id: 'led-kashif-1',
    customerId: 'cust-6',
    customerName: 'Kashif Tailor Master (کاشف درزی)',
    date: new Date(now - 10 * 86400 * 1000).toISOString(),
    type: 'credit_sale',
    amount: 2600,
    receiptNo: '0985',
    previousBalance: 1500,
    newBalance: 4100,
    note: 'بل #0985: دکان کے لیے چائے، چینی اور کوکنگ آئل راشن',
    itemsSummary: 'ٹپال دانے دار چائے 450 گرام (1)، چینی گریڈ اے (5 کلو)، حبیب آئل (2 ل)',
    itemsDetail: [
      { name: 'ٹپال دانے دار چائے 450 گرام', quantity: 1, unit: 'packet', unitPrice: 780, total: 780 },
      { name: 'چینی (خالص گریڈ اے)', quantity: 5, unit: 'kg', unitPrice: 150, total: 750 },
      { name: 'حبیب کوکنگ آئل 1 لیٹر', quantity: 2, unit: 'pouch', unitPrice: 535, total: 1070 },
    ],
  });

  ledger.push({
    id: 'led-kashif-2',
    customerId: 'cust-6',
    customerName: 'Kashif Tailor Master (کاشف درزی)',
    date: new Date(now - 20 * 86400 * 1000).toISOString(),
    type: 'credit_sale',
    amount: 1500,
    receiptNo: '0940',
    previousBalance: 0,
    newBalance: 1500,
    note: 'بل #0940: ٹیلر شاپ کے لیے بسکٹ، چائے اور دودھ پیکٹ',
    itemsSummary: 'اولپرز دودھ 1 لیٹر (3)، پیپسی بوتل (3)، لائف بوائے صابن (3)',
    itemsDetail: [
      { name: "اولپرز دودھ 1 لیٹر", quantity: 3, unit: 'tetra', unitPrice: 290, total: 870 },
      { name: 'پیپسی کولڈ ڈرنک 1.5 لیٹر', quantity: 2, unit: 'bottle', unitPrice: 190, total: 380 },
      { name: 'لائف بوائے صابن ریڈ', quantity: 2, unit: 'piece', unitPrice: 100, total: 200 },
    ],
  });

  return { sales, ledger };
}

// Seed Expenses
export const SEED_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    date: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    category: 'tea',
    categoryTitleUrdu: 'چائے، دودھ و پانی خرچہ',
    categoryTitleEn: 'Tea & Refreshment',
    amount: 350,
    paidTo: 'اصغر ہوٹل والا',
    paymentMode: 'cash',
    note: 'گاہکوں اور سٹاف کے لیے روزانہ چائے',
  },
  {
    id: 'exp-2',
    date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    category: 'freight',
    categoryTitleUrdu: 'کرایہ مال / اڈا خرچہ',
    categoryTitleEn: 'Freight & Carriage',
    amount: 800,
    paidTo: 'شاہین لوڈر رکشہ',
    paymentMode: 'cash',
    note: 'غلہ منڈی سے آٹے کی بوریاں دکان لانے کا کرایہ',
  },
  {
    id: 'exp-3',
    date: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
    category: 'bags',
    categoryTitleUrdu: 'شاپر و پیکنگ میٹریل',
    categoryTitleEn: 'Shopping Bags & Packaging',
    amount: 1500,
    paidTo: 'مدینہ پلاسٹک سٹور',
    paymentMode: 'cash',
    note: 'سفید و پرنٹڈ شاپنگ بیگز بنڈل 10 کلو',
  },
  {
    id: 'exp-4',
    date: new Date(Date.now() - 10 * 86400 * 1000).toISOString(),
    category: 'electricity',
    categoryTitleUrdu: 'بجلی کمرشل بل',
    categoryTitleEn: 'Electricity Bill',
    amount: 14500,
    paidTo: 'لیسکو کمرشل',
    paymentMode: 'bank',
    note: 'دکان اور ڈیپ فریزرز کا ماہانہ کمرشل بل',
  },
  {
    id: 'exp-5',
    date: new Date(Date.now() - 18 * 86400 * 1000).toISOString(),
    category: 'salary',
    categoryTitleUrdu: 'سیلز ہیلپر تنخواہ',
    categoryTitleEn: 'Staff Salary',
    amount: 18000,
    paidTo: 'علی رضا (سیلز بوائے)',
    paymentMode: 'cash',
    note: 'ماہانہ تنخواہ دکان ہیلپر',
  },
  {
    id: 'exp-6',
    date: new Date(Date.now() - 25 * 86400 * 1000).toISOString(),
    category: 'rent',
    categoryTitleUrdu: 'دکان کا ماہانہ کرایہ',
    categoryTitleEn: 'Shop Rent',
    amount: 25000,
    paidTo: 'چوہدری بشیر (دکان کے مالک)',
    paymentMode: 'bank',
    note: 'بوڑی جنرل سٹور مین بازار دکان کرایہ',
  },
];

// Storage helpers
export const storageService = {
  getProducts(): Product[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
      return SEED_PRODUCTS;
    }
    try {
      const parsed: Product[] = JSON.parse(raw);
      // Auto-migrate images if existing products lack image URL
      let needsSave = false;
      const enriched = parsed.map((p) => {
        if (!p.image) {
          const seedMatch = SEED_PRODUCTS.find((s) => s.id === p.id || s.nameEn === p.nameEn);
          if (seedMatch?.image) {
            needsSave = true;
            return { ...p, image: seedMatch.image };
          }
        }
        return p;
      });
      if (needsSave) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(enriched));
      }
      return enriched;
    } catch {
      return SEED_PRODUCTS;
    }
  },

  saveProducts(products: Product[]): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  getCustomers(): Customer[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(SEED_CUSTOMERS));
      return SEED_CUSTOMERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return SEED_CUSTOMERS;
    }
  },

  saveCustomers(customers: Customer[]): void {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  },

  getSales(): Sale[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SALES);
    if (!raw) {
      const { sales, ledger } = generateSeedSalesAndLedger();
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
      localStorage.setItem(STORAGE_KEYS.KHATA_LEDGER, JSON.stringify(ledger));
      return sales;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveSales(sales: Sale[]): void {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  },

  getKhataLedger(): KhataLedgerEntry[] {
    const raw = localStorage.getItem(STORAGE_KEYS.KHATA_LEDGER);
    if (!raw) {
      const { ledger } = generateSeedSalesAndLedger();
      localStorage.setItem(STORAGE_KEYS.KHATA_LEDGER, JSON.stringify(ledger));
      return ledger;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveKhataLedger(ledger: KhataLedgerEntry[]): void {
    localStorage.setItem(STORAGE_KEYS.KHATA_LEDGER, JSON.stringify(ledger));
  },

  getExpenses(): Expense[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(SEED_EXPENSES));
      return SEED_EXPENSES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return SEED_EXPENSES;
    }
  },

  saveExpenses(expenses: Expense[]): void {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  },

  getPrinterSettings(): PrinterSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.PRINTER_SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PRINTER_SETTINGS, JSON.stringify(DEFAULT_PRINTER_SETTINGS));
      return DEFAULT_PRINTER_SETTINGS;
    }
    try {
      const parsed = JSON.parse(raw);
      if (
        !parsed.shopNameUrdu ||
        parsed.shopNameUrdu.includes('الرحمٰن') ||
        parsed.shopNameUrdu.includes('بوڑی') ||
        parsed.shopNameEn?.includes('Bodi')
      ) {
        parsed.shopNameUrdu = 'جہانزیب جنرل سٹور';
        parsed.shopNameEn = 'Jahanzaib General Store';
        localStorage.setItem(STORAGE_KEYS.PRINTER_SETTINGS, JSON.stringify(parsed));
      }
      return { ...DEFAULT_PRINTER_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_PRINTER_SETTINGS;
    }
  },

  savePrinterSettings(settings: PrinterSettings): void {
    localStorage.setItem(STORAGE_KEYS.PRINTER_SETTINGS, JSON.stringify(settings));
  },

  getLanguage(): 'ur' | 'en' {
    const raw = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    return (raw === 'en' ? 'en' : 'ur');
  },

  saveLanguage(lang: 'ur' | 'en'): void {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  },

  exportBackupJson(): string {
    const data = {
      products: this.getProducts(),
      customers: this.getCustomers(),
      sales: this.getSales(),
      ledger: this.getKhataLedger(),
      expenses: this.getExpenses(),
      printerSettings: this.getPrinterSettings(),
      exportDate: new Date().toISOString(),
      version: '1.1',
    };
    return JSON.stringify(data, null, 2);
  },

  importBackupJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.products) this.saveProducts(parsed.products);
      if (parsed.customers) this.saveCustomers(parsed.customers);
      if (parsed.sales) this.saveSales(parsed.sales);
      if (parsed.ledger) this.saveKhataLedger(parsed.ledger);
      if (parsed.expenses) this.saveExpenses(parsed.expenses);
      if (parsed.printerSettings) this.savePrinterSettings(parsed.printerSettings);
      return true;
    } catch (err) {
      console.error('Backup import failed:', err);
      return false;
    }
  },

  resetToDefaultSeed(): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(SEED_CUSTOMERS));
    const { sales, ledger } = generateSeedSalesAndLedger();
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    localStorage.setItem(STORAGE_KEYS.KHATA_LEDGER, JSON.stringify(ledger));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(SEED_EXPENSES));
    localStorage.setItem(STORAGE_KEYS.PRINTER_SETTINGS, JSON.stringify(DEFAULT_PRINTER_SETTINGS));
  },
};
