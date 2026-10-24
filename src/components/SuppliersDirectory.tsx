import React, { useState } from 'react';
import { Truck, Phone, MapPin, Plus, PackageCheck, Search, X } from 'lucide-react';
import { Language } from '../types';

interface Supplier {
  id: string;
  name: string;
  company: string;
  phone: string;
  itemsSupplied: string;
  address: string;
  balancePayable: number;
}

const SEED_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'حاجی جمیل صاحب (ڈسٹری بیوٹر)',
    company: 'Dalda & Cooking Oil Agency',
    phone: '0300-9876543',
    itemsSupplied: 'ڈالڈا گھی، حبیب کوکنگ آئل، میزبان بناسپتی',
    address: 'غلہ منڈی، گودام نمبر 12',
    balancePayable: 14500,
  },
  {
    id: 'sup-2',
    name: 'شیخ نعیم احمد',
    company: 'Sunridge Flour & Rice Mills',
    phone: '0321-5544332',
    itemsSupplied: 'سن رج چکی آٹا، گارڈ چاول، بیسن، میدہ',
    address: 'لاہور روڈ، نزد بائی پاس',
    balancePayable: 8200,
  },
  {
    id: 'sup-3',
    name: 'محمد رضوان (ایجنسی منیجر)',
    company: 'Tapal Tea & Beverages Agency',
    phone: '0333-1122334',
    itemsSupplied: 'ٹیپال دانہ دار چائے، روح افزاء، اولپرز دودھ',
    address: 'مین جی ٹی روڈ، نزد ریلوے پھاٹک',
    balancePayable: 0,
  },
  {
    id: 'sup-4',
    name: 'ملک ارشد گجر',
    company: 'Unilever & Grocery Wholesalers',
    phone: '0345-7788990',
    itemsSupplied: 'سرف ایکسل، لائف بوائے، لکس صابن، شیمپو',
    address: 'نیو ہول سیل مارکیٹ، دکان 4',
    balancePayable: 5600,
  },
];

interface SuppliersDirectoryProps {
  language: Language;
}

export const SuppliersDirectory: React.FC<SuppliersDirectoryProps> = ({ language }) => {
  const isUrdu = language === 'ur';
  const [suppliers, setSuppliers] = useState<Supplier[]>(SEED_SUPPLIERS);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formItems, setFormItems] = useState('');

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.company.toLowerCase().includes(search.toLowerCase()) ||
      s.itemsSupplied.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      name: formName.trim(),
      company: formCompany.trim() || 'General Store Wholesaler',
      phone: formPhone.trim(),
      itemsSupplied: formItems.trim() || 'General Grocery',
      address: 'مین بازار',
      balancePayable: 0,
    };

    setSuppliers([newSup, ...suppliers]);
    setIsModalOpen(false);
    setFormName('');
    setFormCompany('');
    setFormPhone('');
    setFormItems('');
  };

  return (
    <div className="space-y-5 pb-16">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isUrdu
                ? 'ڈسٹری بیوٹر یا فراہم کردہ سامان تلاش کریں...'
                : 'Search supplier or company name...'
            }
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{isUrdu ? '+ نیا ڈسٹری بیوٹر' : '+ Add Supplier'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((sup) => (
          <div
            key={sup.id}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{sup.name}</h4>
                  <span className="text-[11px] font-semibold text-blue-600">{sup.company}</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{sup.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PackageCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] text-slate-500">{sup.itemsSupplied}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">{isUrdu ? 'واجب الادا بقایا: ' : 'Payable Balance: '}</span>
              <span className="font-bold text-rose-600 font-mono">
                Rs. {sup.balancePayable.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {isUrdu ? 'نیا ڈسٹری بیوٹر شامل کریں' : 'Add New Supplier'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  {isUrdu ? 'ڈسٹری بیوٹر کا نام *' : 'Supplier Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثلاً: حاجی نعیم"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  {isUrdu ? 'کمپنی / ایجنسی کا نام' : 'Company Name'}
                </label>
                <input
                  type="text"
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  placeholder="Dalda / Oil Agency"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  {isUrdu ? 'موبائل نمبر' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">
                  {isUrdu ? 'فراہم کردہ اشیاء' : 'Items Supplied'}
                </label>
                <input
                  type="text"
                  value={formItems}
                  onChange={(e) => setFormItems(e.target.value)}
                  placeholder="گھی، کوکنگ آئل، چاول..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
