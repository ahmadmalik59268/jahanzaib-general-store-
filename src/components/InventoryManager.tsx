import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  DollarSign,
  Boxes,
  TrendingUp,
  X,
} from 'lucide-react';
import { Product, Language } from '../types';

interface InventoryManagerProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  language: Language;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  language,
}) => {
  const isUrdu = language === 'ur';

  // Search & Category filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form fields
  const [formNameUrdu, setFormNameUrdu] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formCategory, setFormCategory] = useState('Grains & Flour');
  const [formBuyPrice, setFormBuyPrice] = useState('');
  const [formSalePrice, setFormSalePrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formMinAlert, setFormMinAlert] = useState('10');
  const [formUnit, setFormUnit] = useState('kg');
  const [formBarcode, setFormBarcode] = useState('');
  const [formImage, setFormImage] = useState(
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80'
  );

  // Preset grocery images
  const PRESET_GROCERY_PHOTOS = [
    { labelUrdu: 'آٹا', labelEn: 'Flour', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80' },
    { labelUrdu: 'چاول', labelEn: 'Rice', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80' },
    { labelUrdu: 'گھی / تیل', labelEn: 'Oil / Ghee', url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80' },
    { labelUrdu: 'چینی', labelEn: 'Sugar', url: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=400&q=80' },
    { labelUrdu: 'چائے پتی', labelEn: 'Tea Leaf', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80' },
    { labelUrdu: 'دالیں', labelEn: 'Pulses / Lentils', url: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=400&q=80' },
    { labelUrdu: 'دودھ', labelEn: 'Milk', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80' },
    { labelUrdu: 'صابن / سرف', labelEn: 'Soap & Detergent', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80' },
    { labelUrdu: 'مصالحہ جات', labelEn: 'Spices', url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80' },
    { labelUrdu: 'کولڈ ڈرنک', labelEn: 'Cold Drink', url: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=400&q=80' },
    { labelUrdu: 'بسکٹ / سنیکس', labelEn: 'Biscuits / Snacks', url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80' },
    { labelUrdu: 'شربت / جام', labelEn: 'Syrup / Jam', url: 'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?auto=format&fit=crop&w=400&q=80' },
  ];

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Inventory valuation summary
  const summary = useMemo(() => {
    let totalStockQty = 0;
    let totalCostValue = 0;
    let totalRetailValue = 0;
    let lowStockCount = 0;

    for (const p of products) {
      totalStockQty += p.stock;
      totalCostValue += p.stock * p.buyPrice;
      totalRetailValue += p.stock * p.salePrice;
      if (p.stock <= p.minStockAlert) lowStockCount++;
    }

    const expectedMargin = Math.max(0, totalRetailValue - totalCostValue);

    return {
      totalItems: products.length,
      totalStockQty,
      totalCostValue,
      totalRetailValue,
      expectedMargin,
      lowStockCount,
    };
  }, [products]);

  // Filtered list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchLow = onlyLowStock ? p.stock <= p.minStockAlert : true;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchCat && matchLow;
      const matchText =
        p.nameUrdu.toLowerCase().includes(query) ||
        p.nameEn.toLowerCase().includes(query) ||
        p.barcode.includes(query) ||
        p.category.toLowerCase().includes(query);
      return matchCat && matchLow && matchText;
    });
  }, [products, selectedCategory, onlyLowStock, searchQuery]);

  // Quick Restock adder
  const handleQuickRestock = (product: Product, delta: number) => {
    const updated: Product = {
      ...product,
      stock: Math.max(0, product.stock + delta),
    };
    onUpdateProduct(updated);
  };

  // Open Add Modal
  const openAddModal = () => {
    setEditingProduct(null);
    setFormNameUrdu('');
    setFormNameEn('');
    setFormCategory('Grains & Flour');
    setFormBuyPrice('');
    setFormSalePrice('');
    setFormStock('');
    setFormMinAlert('10');
    setFormUnit('kg');
    setFormBarcode(String(Date.now()).slice(-8));
    setFormImage('https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormNameUrdu(p.nameUrdu);
    setFormNameEn(p.nameEn);
    setFormCategory(p.category);
    setFormBuyPrice(String(p.buyPrice));
    setFormSalePrice(String(p.salePrice));
    setFormStock(String(p.stock));
    setFormMinAlert(String(p.minStockAlert));
    setFormUnit(p.unit);
    setFormBarcode(p.barcode);
    setFormImage(
      p.image ||
        'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80'
    );
    setIsAddModalOpen(true);
  };

  // Handle Save
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNameUrdu.trim()) return;

    const buyPrice = parseFloat(formBuyPrice) || 0;
    const salePrice = parseFloat(formSalePrice) || 0;
    const stock = parseFloat(formStock) || 0;
    const minAlert = parseFloat(formMinAlert) || 5;

    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        nameUrdu: formNameUrdu.trim(),
        nameEn: formNameEn.trim() || formNameUrdu.trim(),
        category: formCategory,
        buyPrice,
        salePrice,
        stock,
        minStockAlert: minAlert,
        unit: formUnit,
        barcode: formBarcode.trim() || editingProduct.barcode,
        image: formImage.trim() || editingProduct.image,
      };
      onUpdateProduct(updated);
    } else {
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        nameUrdu: formNameUrdu.trim(),
        nameEn: formNameEn.trim() || formNameUrdu.trim(),
        category: formCategory,
        buyPrice,
        salePrice,
        stock,
        minStockAlert: minAlert,
        unit: formUnit,
        barcode: formBarcode.trim() || String(Date.now()).slice(-8),
        image:
          formImage.trim() ||
          'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
      };
      onAddProduct(newProduct);
    }

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Financial Valuation Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {isUrdu ? 'کل پروڈکٹس کی تعداد' : 'Total Product SKUs'}
          </span>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight font-mono">
            {summary.totalItems}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {summary.totalStockQty} {isUrdu ? 'مجموعی یونٹس اسٹاک' : 'total units in stock'}
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {isUrdu ? 'اسٹاک کی کل خرید قیمت' : 'Total Stock Cost Value'}
          </span>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight font-mono">
            Rs. {Math.round(summary.totalCostValue).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isUrdu ? 'تھوک خریداری کی لاگت' : 'Wholesale purchase capital'}
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {isUrdu ? 'اسٹاک کی کل فروخت قیمت' : 'Total Retail Sale Value'}
          </span>
          <div className="mt-2 text-2xl font-black text-blue-600 tracking-tight font-mono">
            Rs. {Math.round(summary.totalRetailValue).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isUrdu ? 'فروخت ہونے پر متوقع آمدن' : 'Projected revenue on sale'}
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
            {isUrdu ? 'کم اسٹاک کی وارننگ' : 'Low Stock Items'}
          </span>
          <div className="mt-2 text-2xl font-black text-amber-600 tracking-tight font-mono">
            {summary.lowStockCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isUrdu ? 'جن کو فوری منگوانا ہے' : 'Items needing reordering'}
          </div>
        </div>
      </div>

      {/* Action Bar & Search */}
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
                  ? 'پروڈکٹ کا نام، بارکوڈ، یا کیٹیگری تلاش کریں...'
                  : 'Search product name, barcode, or category...'
              }
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyLowStock}
              onChange={(e) => setOnlyLowStock(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-white border-slate-300"
            />
            <span className="whitespace-nowrap font-bold text-amber-700">
              {isUrdu ? 'صرف کم اسٹاک' : 'Low Stock Only'}
            </span>
          </label>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{isUrdu ? '+ نیا پروڈکٹ شامل کریں' : '+ Add Product'}</span>
        </button>
      </div>

      {/* Category selector row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            {cat === 'all' ? (isUrdu ? 'تمام کیٹیگریز' : 'All Categories') : cat}
          </button>
        ))}
      </div>

      {/* Products Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">{isUrdu ? 'آئٹم کا نام' : 'PRODUCT NAME'}</th>
                <th className="py-3 px-3">{isUrdu ? 'کیٹیگری' : 'CATEGORY'}</th>
                <th className="py-3 px-3 text-right">{isUrdu ? 'خرید ریٹ' : 'BUY RATE'}</th>
                <th className="py-3 px-3 text-right">{isUrdu ? 'سیل ریٹ' : 'SALE RATE'}</th>
                <th className="py-3 px-3 text-center">{isUrdu ? 'موجودہ اسٹاک' : 'STOCK ON HAND'}</th>
                <th className="py-3 px-3 text-center">{isUrdu ? 'فوری ری اسٹاک' : 'QUICK RESTOCK'}</th>
                <th className="py-3 px-4 text-right">{isUrdu ? 'ایکشنز' : 'ACTIONS'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {isUrdu ? 'کوئی پروڈکٹ موجود نہیں ہے۔' : 'No products found.'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stock <= p.minStockAlert;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80'}
                            alt={p.nameEn}
                            className="w-11 h-11 object-cover rounded-xl border border-slate-200/90 shadow-2xs shrink-0"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80';
                            }}
                          />
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                              {isUrdu ? p.nameUrdu : p.nameEn}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {isUrdu ? p.nameEn : p.nameUrdu}{' '}
                              <span className="text-slate-400 font-mono">· #{p.barcode}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="text-slate-600 text-xs font-medium">{p.category}</span>
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-500 font-mono">
                        Rs. {p.buyPrice}
                      </td>
                      <td className="py-3.5 px-3 text-right font-black text-blue-600 font-mono">
                        Rs. {p.salePrice}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded-full ${
                            isLow
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {p.stock} {p.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleQuickRestock(p, 5)}
                            className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded border border-slate-200 transition-colors"
                            title="+5 Restock"
                          >
                            +5
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickRestock(p, 10)}
                            className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded border border-slate-200 transition-colors"
                            title="+10 Restock"
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickRestock(p, 25)}
                            className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded border border-slate-200 transition-colors"
                            title="+25 Restock"
                          >
                            +25
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title={isUrdu ? 'ترمیم کریں' : 'Edit'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(isUrdu ? 'کیا آپ واقعی اس پروڈکٹ کو ڈیلیٹ کرنا چاہتے ہیں؟' : 'Delete this product?')) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title={isUrdu ? 'ڈیلیٹ کریں' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingProduct
                  ? isUrdu ? 'پروڈکٹ میں ترمیم کریں' : 'Edit Product'
                  : isUrdu ? 'نیا پروڈکٹ شامل کریں' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    {isUrdu ? 'آئٹم کا نام (اردو میں) *' : 'Product Name (Urdu) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formNameUrdu}
                    onChange={(e) => setFormNameUrdu(e.target.value)}
                    placeholder="مثلاً: سن رج چکی آٹا 10 کلو"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    {isUrdu ? 'نام انگریزی / رومن میں' : 'Name in English'}
                  </label>
                  <input
                    type="text"
                    value={formNameEn}
                    onChange={(e) => setFormNameEn(e.target.value)}
                    placeholder="e.g. Sunridge Chakki Atta 10kg"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    {isUrdu ? 'کیٹیگری *' : 'Category *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Grains, Oil, Spices, Dairy..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    {isUrdu ? 'یونٹ' : 'Unit'}
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
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
                    value={formBuyPrice}
                    onChange={(e) => setFormBuyPrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
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
                    value={formSalePrice}
                    onChange={(e) => setFormSalePrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-blue-600 font-bold focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    {isUrdu ? 'اسٹاک تعداد *' : 'Stock Qty *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">
                    {isUrdu ? 'کم از کم الرٹ' : 'Min Alert'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formMinAlert}
                    onChange={(e) => setFormMinAlert(e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  {isUrdu ? 'بارکوڈ / کوڈ (Barcode / SKU)' : 'Barcode / SKU'}
                </label>
                <input
                  type="text"
                  value={formBarcode}
                  onChange={(e) => setFormBarcode(e.target.value)}
                  placeholder="8964000101"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Product Picture Selector */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 font-bold block text-[11px]">
                    {isUrdu ? 'پروڈکٹ کی تصویر منتخب کریں' : 'Product Photo'}
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {isUrdu ? 'کلک کر کے تصویر منتخب کریں' : 'Click preset to apply'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={formImage || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80'}
                    alt="Preview"
                    className="w-14 h-14 object-cover rounded-xl border-2 border-blue-500 shadow-xs shrink-0"
                  />
                  <input
                    type="url"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Preset Photo Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PRESET_GROCERY_PHOTOS.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setFormImage(preset.url)}
                      className={`text-[10px] px-2 py-1 rounded-md border font-medium transition-colors ${
                        formImage === preset.url
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {isUrdu ? preset.labelUrdu : preset.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {isUrdu ? 'منسوخ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  {editingProduct
                    ? isUrdu ? 'تبدیلیاں محفوظ کریں' : 'Save Changes'
                    : isUrdu ? 'پروڈکٹ محفوظ کریں' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
