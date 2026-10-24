import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  UserCheck,
  CheckCircle,
  Banknote,
  BookOpen,
  Split,
  Printer,
  ShoppingBag,
  UserPlus,
  X,
  PackagePlus,
  Image as ImageIcon,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Product, Customer, CartItem, Sale, PaymentMethod, Language, PrinterSettings } from '../types';

// Preset grocery image choices for adding products easily
const PRESET_GROCERY_IMAGES = [
  { label: 'Atta / Flour (آٹا)', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80' },
  { label: 'Sugar (چینی)', url: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=400&auto=format&fit=crop&q=80' },
  { label: 'Ghee & Oil (گھی و تیل)', url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80' },
  { label: 'Rice (چاول)', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80' },
  { label: 'Tea (چائے کی پتی)', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80' },
  { label: 'Pulses / Daal (دالیں)', url: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=400&auto=format&fit=crop&q=80' },
  { label: 'Spices / Masala (مصالحہ)', url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&auto=format&fit=crop&q=80' },
  { label: 'Milk / Dairy (دودھ)', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80' },
  { label: 'Detergent / Surf (سرف)', url: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&auto=format&fit=crop&q=80' },
  { label: 'Soap (صابن)', url: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400&auto=format&fit=crop&q=80' },
  { label: 'Cold Drinks (کولڈ ڈرنک)', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=80' },
  { label: 'Chips / Snacks (چپس)', url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80' },
  { label: 'Biscuits (بسکٹ)', url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&auto=format&fit=crop&q=80' },
  { label: 'Rooh Afza / Syrups (شربت)', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&auto=format&fit=crop&q=80' },
];

interface PosCounterProps {
  products: Product[];
  customers: Customer[];
  onCompleteSale: (sale: Sale) => void;
  onAddQuickCustomer: (customer: Customer) => void;
  onAddProduct?: (product: Product) => void;
  printerSettings: PrinterSettings;
  language: Language;
  initialMode?: 'cash' | 'udhaar';
}

export const PosCounter: React.FC<PosCounterProps> = ({
  products,
  customers,
  onCompleteSale,
  onAddQuickCustomer,
  onAddProduct,
  printerSettings,
  language,
  initialMode = 'cash',
}) => {
  const isUrdu = language === 'ur';

  // Search & Category states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Cart & Payment states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initialMode === 'udhaar' ? 'udhaar' : 'cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [cashReceivedInput, setCashReceivedInput] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState('');

  // Mobile cart drawer open toggle
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Modals state
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // Quick Customer Form
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // New Product Form
  const [prodNameUrdu, setProdNameUrdu] = useState('');
  const [prodNameEn, setProdNameEn] = useState('');
  const [prodCategory, setProdCategory] = useState('Grains & Flour');
  const [prodUnit, setProdUnit] = useState('kg');
  const [prodBuyPrice, setProdBuyPrice] = useState('');
  const [prodSalePrice, setProdSalePrice] = useState('');
  const [prodStock, setProdStock] = useState('50');
  const [prodMinAlert, setProdMinAlert] = useState('10');
  const [prodBarcode, setProdBarcode] = useState('');
  const [prodImage, setProdImage] = useState(PRESET_GROCERY_IMAGES[0].url);

  useEffect(() => {
    if (initialMode === 'udhaar') {
      setPaymentMethod('udhaar');
    } else {
      setPaymentMethod('cash');
    }
  }, [initialMode]);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchCat;
      const matchName =
        p.nameEn.toLowerCase().includes(query) ||
        p.nameUrdu.toLowerCase().includes(query) ||
        p.barcode.includes(query) ||
        p.category.toLowerCase().includes(query);
      return matchCat && matchName;
    });
  }, [products, selectedCategory, searchQuery]);

  // Selected customer object
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // Cart totals
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.total, 0);
  }, [cart]);

  const finalTotal = useMemo(() => {
    return Math.max(0, subtotal - (discount || 0));
  }, [subtotal, discount]);

  const cashReceived = parseFloat(cashReceivedInput) || 0;

  // Split & Change calculations
  const { changeDue, udhaarAmount } = useMemo(() => {
    if (paymentMethod === 'cash') {
      const change = cashReceived > finalTotal ? cashReceived - finalTotal : 0;
      return { changeDue: change, udhaarAmount: 0 };
    }
    if (paymentMethod === 'udhaar') {
      return { changeDue: 0, udhaarAmount: finalTotal };
    }
    if (paymentMethod === 'split') {
      const paid = Math.min(finalTotal, cashReceived);
      const remainingUdhaar = Math.max(0, finalTotal - paid);
      return { changeDue: 0, udhaarAmount: remainingUdhaar };
    }
    return { changeDue: 0, udhaarAmount: 0 };
  }, [paymentMethod, cashReceived, finalTotal]);

  // Add item to cart
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
            : item
        );
      }
      return [...prev, { product, quantity: 1, unitPrice: product.salePrice, total: product.salePrice }];
    });
  };

  // Adjust quantity
  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0
              ? { ...item, quantity: newQty, total: newQty * item.unitPrice }
              : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Direct qty set
  const setDirectQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: qty, total: qty * item.unitPrice }
          : item
      )
    );
  };

  // Remove single item
  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Clear entire cart
  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setCashReceivedInput('');
    setSelectedCustomerId('');
    setPaymentMethod('cash');
    setSaleNotes('');
  };

  // Submit Sale / Checkout
  const handleCheckout = () => {
    if (cart.length === 0) return;

    if ((paymentMethod === 'udhaar' || paymentMethod === 'split') && !selectedCustomerId) {
      alert(
        isUrdu
          ? 'ادھار بل کے لیے براہ کرم لسٹ سے گاہک منتخب کریں جن کے کھاتے میں یہ بل درج ہونا ہے!'
          : 'Please select a customer for Udhaar / Khata billing!'
      );
      return;
    }

    const receiptNo = String(Date.now()).slice(-6);

    const sale: Sale = {
      id: `sale-${Date.now()}`,
      receiptNo,
      timestamp: new Date().toISOString(),
      items: [...cart],
      subtotal,
      discount,
      finalTotal,
      paymentMethod,
      cashReceived:
        paymentMethod === 'udhaar'
          ? 0
          : paymentMethod === 'split'
          ? Math.min(finalTotal, cashReceived)
          : cashReceived || finalTotal,
      udhaarAmount,
      customerId: selectedCustomerId || undefined,
      customerName: selectedCustomer ? `${selectedCustomer.nameUrdu} (${selectedCustomer.nameEn})` : undefined,
      changeDue,
      previousCustomerBalance: selectedCustomer ? selectedCustomer.creditBalance : undefined,
      newCustomerBalance: selectedCustomer
        ? selectedCustomer.creditBalance + udhaarAmount
        : undefined,
      notes: saleNotes,
    };

    onCompleteSale(sale);
    clearCart();
    setIsMobileCartOpen(false);
  };

  // Quick Customer Save
  const handleSaveQuickCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      nameUrdu: newCustName.trim(),
      nameEn: newCustName.trim(),
      phone: newCustPhone.trim(),
      address: newCustAddress.trim(),
      creditBalance: 0,
      creditLimit: 15000,
      lastTransactionDate: new Date().toISOString(),
      notes: 'نیا راشن گاہک',
    };

    onAddQuickCustomer(newCust);
    setSelectedCustomerId(newCust.id);
    setIsAddCustomerOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
  };

  // Add New Product Save
  const handleSaveNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodNameUrdu.trim()) return;

    const buyPrice = parseFloat(prodBuyPrice) || 0;
    const salePrice = parseFloat(prodSalePrice) || 0;
    const stock = parseFloat(prodStock) || 0;
    const minAlert = parseFloat(prodMinAlert) || 5;

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      nameUrdu: prodNameUrdu.trim(),
      nameEn: prodNameEn.trim() || prodNameUrdu.trim(),
      category: prodCategory,
      buyPrice,
      salePrice,
      stock,
      minStockAlert: minAlert,
      unit: prodUnit,
      barcode: prodBarcode.trim() || String(Date.now()).slice(-8),
      image: prodImage || PRESET_GROCERY_IMAGES[0].url,
    };

    if (onAddProduct) {
      onAddProduct(newProduct);
    }
    setIsAddProductOpen(false);
    setProdNameUrdu('');
    setProdNameEn('');
    setProdBuyPrice('');
    setProdSalePrice('');
    setProdBarcode('');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Banner: Prominent Action Buttons + Search */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isUrdu
                ? 'نام، بارکوڈ، یا کیٹیگری تلاش کریں (مثلاً: آٹا، گھی، چینی، چائے)...'
                : 'Search grocery by name, barcode, or category...'
            }
            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Buttons: Add Product & Add Customer */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddProductOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-all"
          >
            <PackagePlus className="w-4 h-4" />
            <span>{isUrdu ? '+ نیا پروڈکٹ شامل کریں' : '+ Add Product'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddCustomerOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isUrdu ? '+ نیا کھاتہ گاہک' : '+ Add Customer'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Products Grid (with Photos) + Right Billing Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (Cols 1-7): Grocery Products Grid with Pictures */}
        <div className="lg:col-span-7 space-y-3">
          {/* Categories Tab Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {cat === 'all' ? (isUrdu ? 'تمام گروسری اشیاء' : 'All Grocery') : cat}
              </button>
            ))}
          </div>

          {/* Product Cards with High-Res Photos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const inCart = cart.find((i) => i.product.id === p.id);
              const isLowStock = p.stock <= p.minStockAlert;
              return (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className={`bg-white border rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer select-none transition-all hover:border-blue-500 hover:shadow-md active:scale-[0.98] group ${
                    inCart ? 'border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/10' : 'border-slate-200/90 shadow-2xs'
                  }`}
                >
                  {/* Product Image Banner */}
                  <div className="relative h-28 sm:h-32 w-full bg-slate-100 overflow-hidden">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.nameEn}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          // Fallback placeholder if offline
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}

                    {/* Unit & Stock Badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900/80 text-white backdrop-blur-xs font-mono">
                        {p.unit}
                      </span>
                    </div>

                    {isLowStock ? (
                      <span className="absolute top-2 right-2 text-[10px] font-bold text-rose-700 bg-rose-50/95 border border-rose-300 px-1.5 py-0.5 rounded-md">
                        {p.stock} left
                      </span>
                    ) : (
                      <span className="absolute top-2 right-2 text-[10px] font-bold text-emerald-700 bg-white/95 border border-emerald-300 px-1.5 py-0.5 rounded-md">
                        {p.stock} in stock
                      </span>
                    )}

                    {/* Quantity Badge in Cart */}
                    {inCart && (
                      <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                        <span className="w-9 h-9 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shadow-lg animate-in zoom-in-75">
                          {inCart.quantity}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug line-clamp-2">
                        {isUrdu ? p.nameUrdu : p.nameEn}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                        {isUrdu ? p.nameEn : p.nameUrdu}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-sm sm:text-base font-black font-mono text-blue-600">
                        Rs. {p.salePrice}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(p);
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isUrdu ? 'شامل' : 'Add'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (Cols 8-12): POS Counter Cart & Billing Box */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
          {/* Cart Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                  {isUrdu ? 'کاؤنٹر بل (Billing Counter)' : 'Store Billing Counter'}
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  {cart.length} {isUrdu ? 'اشیاء منتخب' : 'items added'}
                </span>
              </div>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isUrdu ? 'بل صاف کریں' : 'Clear'}</span>
              </button>
            )}
          </div>

          {/* Big Payment Mode Selector (CASH / UDHAAR / SPLIT) */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              {isUrdu ? 'ادائیگی کا طریقہ منتخب کریں:' : 'Select Payment Mode:'}
            </span>
            <div className="grid grid-cols-3 gap-2">
              {/* Cash Button */}
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2.5 px-2 rounded-xl text-xs font-extrabold flex flex-col items-center gap-1 transition-all border ${
                  paymentMethod === 'cash'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>{isUrdu ? '💵 نقد بل (Cash)' : 'Full Cash'}</span>
              </button>

              {/* Udhaar / Khata Button */}
              <button
                type="button"
                onClick={() => setPaymentMethod('udhaar')}
                className={`py-2.5 px-2 rounded-xl text-xs font-extrabold flex flex-col items-center gap-1 transition-all border ${
                  paymentMethod === 'udhaar'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>{isUrdu ? '📒 ادھار بل (Khata)' : 'Full Khata'}</span>
              </button>

              {/* Split Button */}
              <button
                type="button"
                onClick={() => setPaymentMethod('split')}
                className={`py-2.5 px-2 rounded-xl text-xs font-extrabold flex flex-col items-center gap-1 transition-all border ${
                  paymentMethod === 'split'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Split className="w-4 h-4" />
                <span>{isUrdu ? '⚡ مکس ادھار+نقد' : 'Split Pay'}</span>
              </button>
            </div>
          </div>

          {/* Customer Selection Row: Always available, Highlighted when Udhaar */}
          <div
            className={`rounded-xl p-3 space-y-2 transition-all border ${
              paymentMethod === 'udhaar' || paymentMethod === 'split'
                ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-500/10'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-purple-600" />
                <span>
                  {paymentMethod === 'udhaar'
                    ? isUrdu ? 'گاہک کھاتہ منتخب کریں (ادھار درج ہوگا) *' : 'Select Customer Account (for Khata) *'
                    : isUrdu ? 'گاہک منتخب کریں (اختیاری):' : 'Select Customer (Optional):'}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setIsAddCustomerOpen(true)}
                className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isUrdu ? '+ نیا گاہک' : '+ Add'}</span>
              </button>
            </div>

            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-purple-500 shadow-2xs"
            >
              <option value="">
                {paymentMethod === 'udhaar'
                  ? isUrdu ? '-- برائے مہربانی کھاتہ گاہک منتخب کریں --' : '-- Please Select Khata Customer --'
                  : isUrdu ? '-- عام نقد واک ان گاہک --' : '-- Walk-in Cash Customer --'}
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameUrdu} ({c.nameEn}) — {isUrdu ? 'بقایا ادھار:' : 'Existing Due:'} Rs. {c.creditBalance.toLocaleString()}
                </option>
              ))}
            </select>

            {selectedCustomer && (
              <div className="flex items-center justify-between text-xs px-1 text-slate-700 pt-0.5">
                <span>{isUrdu ? 'سابقہ واجب الادا ادھار:' : 'Previous Khata Due:'}</span>
                <span className="font-extrabold text-rose-600 font-mono">
                  Rs. {selectedCustomer.creditBalance.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="max-h-[190px] overflow-y-auto space-y-2 pr-1">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                {isUrdu ? 'بل بنانے کے لیے بائیں جانب گروسری سامان پر کلک کریں۔' : 'No items added. Click any grocery item to add.'}
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {isUrdu ? item.product.nameUrdu : item.product.nameEn}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Rs. {item.unitPrice} x {item.quantity} {item.product.unit}
                    </div>
                  </div>

                  {/* Quantity Modifier */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-6 h-6 rounded-md bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => setDirectQuantity(item.product.id, parseInt(e.target.value) || 1)}
                      className="w-10 text-center py-0.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-6 h-6 rounded-md bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right min-w-[65px]">
                    <span className="text-xs font-black font-mono text-slate-900">
                      Rs. {Math.round(item.total).toLocaleString()}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Cash Received & Change Return (for Cash & Split) */}
          {paymentMethod !== 'udhaar' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  {isUrdu ? 'وصول نقد رقم (Cash Received):' : 'Cash Received:'}
                </span>
                <input
                  type="number"
                  min="0"
                  value={cashReceivedInput}
                  onChange={(e) => setCashReceivedInput(e.target.value)}
                  placeholder={finalTotal ? String(finalTotal) : '0'}
                  className="w-28 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-right font-black font-mono text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              {changeDue > 0 && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 text-emerald-800 font-bold">
                  <span>{isUrdu ? 'گاہک کو بقایا واپس کریں:' : 'Change to return:'}</span>
                  <span className="font-mono text-sm font-black">Rs. {Math.round(changeDue).toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          {/* Discount input */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-slate-600 font-semibold">
              {isUrdu ? 'رعایت / ڈسکاؤنٹ (Rs):' : 'Discount (Rs):'}
            </span>
            <input
              type="number"
              min="0"
              value={discount || ''}
              onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder="0"
              className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Net Total Summary Box */}
          <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-1.5 shadow-md">
            <div className="flex justify-between text-xs text-slate-300">
              <span>{isUrdu ? 'سب ٹوٹل:' : 'Subtotal:'}</span>
              <span className="font-mono">Rs. {Math.round(subtotal).toLocaleString()}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-xs text-emerald-400 font-semibold">
                <span>{isUrdu ? 'رعایت (-):' : 'Discount (-):'}</span>
                <span className="font-mono">Rs. {Math.round(discount).toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-lg font-black text-white pt-1.5 border-t border-slate-800">
              <span>{isUrdu ? 'کل رقم:' : 'Net Total:'}</span>
              <span className="text-emerald-400 font-mono">
                Rs. {Math.round(finalTotal).toLocaleString()}
              </span>
            </div>

            {selectedCustomer && (paymentMethod === 'udhaar' || paymentMethod === 'split') && (
              <div className="bg-purple-950/70 border border-purple-500/40 rounded-xl p-3 my-2 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>{isUrdu ? 'سابقہ ادھار کھاتہ (Previous Due):' : 'Previous Khata:'}</span>
                  <span className="font-mono text-amber-300 font-bold">
                    Rs. {selectedCustomer.creditBalance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>{isUrdu ? 'موجودہ بل راشن (This Bill):' : 'Current Bill:'}</span>
                  <span className="font-mono text-white font-bold">
                    + Rs. {Math.round(udhaarAmount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-emerald-400 pt-1.5 border-t border-purple-700/60">
                  <span>{isUrdu ? 'کل نیا بقایا ادھار (New Total):' : 'New Total Balance:'}</span>
                  <span className="font-mono text-base font-black">
                    Rs. {(selectedCustomer.creditBalance + udhaarAmount).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {paymentMethod === 'udhaar' && !selectedCustomer && (
              <div className="text-xs text-purple-300 pt-1 font-semibold flex items-center justify-between">
                <span>{isUrdu ? 'ادھار کھاتے میں شامل ہوگی:' : 'Will be added to Khata:'}</span>
                <span className="font-mono font-bold">Rs. {Math.round(finalTotal).toLocaleString()}</span>
              </div>
            )}

            {paymentMethod === 'split' && !selectedCustomer && (
              <div className="text-xs text-amber-300 pt-1 font-semibold flex items-center justify-between">
                <span>{isUrdu ? 'باقی ادھار کھاتے میں:' : 'Remaining to Khata:'}</span>
                <span className="font-mono font-bold">Rs. {Math.round(udhaarAmount).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Primary Checkout Button */}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full py-3.5 px-4 font-extrabold rounded-xl shadow-md text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              paymentMethod === 'udhaar'
                ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'
                : paymentMethod === 'split'
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
            }`}
          >
            <Printer className="w-5 h-5" />
            <span>
              {paymentMethod === 'udhaar'
                ? isUrdu
                  ? selectedCustomer
                    ? `کھاتے میں درج کریں (نیا کل ادھار: Rs. ${(selectedCustomer.creditBalance + finalTotal).toLocaleString()})`
                    : `بل کھاتے میں درج کریں (Rs. ${Math.round(finalTotal).toLocaleString()})`
                  : selectedCustomer
                  ? `Save to Khata (New Due: Rs. ${(selectedCustomer.creditBalance + finalTotal).toLocaleString()})`
                  : `Save to Khata & Print (Rs. ${Math.round(finalTotal).toLocaleString()})`
                : isUrdu
                ? `بل مکمل کریں و رسید پرنٹ کریں (Rs. ${Math.round(finalTotal).toLocaleString()})`
                : `Complete & Print Bill (Rs. ${Math.round(finalTotal).toLocaleString()})`}
            </span>
          </button>
        </div>
      </div>

      {/* Modal 1: Add New Product (with photo selection) */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-emerald-600" />
                <span>{isUrdu ? 'نیا گروسری پروڈکٹ شامل کریں' : 'Add New Grocery Product'}</span>
              </h3>
              <button onClick={() => setIsAddProductOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewProduct} className="space-y-3.5 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    {isUrdu ? 'آئٹم کا نام (اردو میں) *' : 'Item Name (Urdu) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={prodNameUrdu}
                    onChange={(e) => setProdNameUrdu(e.target.value)}
                    placeholder="مثلاً: سن رج چکی آٹا 10 کلو"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 font-urdu font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    {isUrdu ? 'نام انگریزی / رومن میں' : 'Item Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={prodNameEn}
                    onChange={(e) => setProdNameEn(e.target.value)}
                    placeholder="e.g. Sunridge Atta 10kg"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>
              </div>

              {/* Photo Preset Selector */}
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  {isUrdu ? 'پروڈکٹ کی تصویر منتخب کریں (Product Picture):' : 'Select Product Image Preset:'}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {PRESET_GROCERY_IMAGES.map((img) => (
                    <div
                      key={img.label}
                      onClick={() => setProdImage(img.url)}
                      className={`cursor-pointer rounded-lg overflow-hidden border p-1 text-center transition-all ${
                        prodImage === img.url
                          ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <img src={img.url} alt={img.label} className="w-full h-12 object-cover rounded" />
                      <span className="text-[9px] font-bold text-slate-700 truncate block mt-1">{img.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    {isUrdu ? 'کیٹیگری' : 'Category'}
                  </label>
                  <input
                    type="text"
                    required
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    placeholder="Grains, Oil, Spices, Dairy..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    {isUrdu ? 'یونٹ (Unit)' : 'Unit'}
                  </label>
                  <select
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="kg">kg (کلوگرام)</option>
                    <option value="packet">packet (پیکٹ)</option>
                    <option value="pouch">pouch (پاؤچ)</option>
                    <option value="bottle">bottle (بوتل)</option>
                    <option value="piece">piece (عدد / دانہ)</option>
                    <option value="box">box (ڈبہ)</option>
                    <option value="bag">bag (بوری / تھیلا)</option>
                    <option value="litre">litre (لیٹر)</option>
                    <option value="dozen">dozen (درجن)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    {isUrdu ? 'خرید قیمت' : 'Buy Rate'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={prodBuyPrice}
                    onChange={(e) => setProdBuyPrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    {isUrdu ? 'فروخت قیمت *' : 'Sale Rate *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={prodSalePrice}
                    onChange={(e) => setProdSalePrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-blue-600 font-bold focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    {isUrdu ? 'اسٹاک تعداد' : 'Stock Qty'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    placeholder="50"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    {isUrdu ? 'الرٹ حد' : 'Min Alert'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={prodMinAlert}
                    onChange={(e) => setProdMinAlert(e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  {isUrdu ? 'بارکوڈ / SKU' : 'Barcode / SKU'}
                </label>
                <input
                  type="text"
                  value={prodBarcode}
                  onChange={(e) => setProdBarcode(e.target.value)}
                  placeholder="8964000101"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {isUrdu ? 'منسوخ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  {isUrdu ? 'پروڈکٹ محفوظ کریں' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Quick Add Customer */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {isUrdu ? 'نیا کھاتہ گاہک شامل کریں' : 'Add New Customer'}
              </h3>
              <button onClick={() => setIsAddCustomerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickCustomer} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  {isUrdu ? 'کسٹمر کا نام *' : 'Customer Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="مثلاً: چوہدری اصغر علی"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  {isUrdu ? 'موبائل نمبر (فون/واٹس ایپ)' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  {isUrdu ? 'پتہ / محلہ' : 'Address'}
                </label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="محلہ فاروقیہ، گلی نمبر 2"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
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
                  {isUrdu ? 'محفوظ کریں' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
