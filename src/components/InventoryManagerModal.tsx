import React, { useState } from 'react';
import { Product, FabricType, ClothingCategory } from '../types';
import { X, Check, Tag, Plus, Edit2, ShieldAlert, Layers } from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface InventoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onUpdateProduct: (updated: Product) => void;
  lang: Language;
}

export const InventoryManagerModal: React.FC<InventoryManagerModalProps> = ({
  isOpen,
  onClose,
  products,
  onUpdateProduct,
  lang
}) => {
  if (!isOpen) return null;

  const [selectedProduct, setSelectedProduct] = useState<Product>(products[0]);
  const [editedFabricType, setEditedFabricType] = useState<FabricType>(selectedProduct.fabricType);
  const [editedPrice, setEditedPrice] = useState<number>(selectedProduct.price);
  const [editedName, setEditedName] = useState<string>(selectedProduct.name);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setEditedFabricType(prod.fabricType);
    setEditedPrice(prod.price);
    setEditedName(prod.name);
    setSavedSuccess(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Product = {
      ...selectedProduct,
      name: editedName,
      price: editedPrice,
      fabricType: editedFabricType,
      fabric: editedFabricType.toUpperCase(),
    };
    onUpdateProduct(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const fabricOptions: { id: FabricType; fa: string; en: string; drape: string }[] = [
    { id: 'wool', fa: 'فوتر و پشم اعلا', en: 'Premium Wool', drape: 'ریزش سنگین و خطی ساختاریافته' },
    { id: 'silk', fa: 'ابریشم طبیعی و ساتن', en: 'Pure Silk / Satin', drape: 'ریزش سیال و لغزنده با براقیت ملایم' },
    { id: 'leather', fa: 'چرم طبیعی', en: 'Genuine Leather', drape: 'فرم زاویه‌دار و محکم با بازتاب آینه‌ای' },
    { id: 'denim', fa: 'دنیم و جین سنگین', en: 'Heavy Denim', drape: 'شکن‌های درشت و محکم ۱۴ اونس' },
    { id: 'velvet', fa: 'مخمل فاخر پرزدار', en: 'Luxury Velvet', drape: 'شکن‌های عمیق سایه‌روشن پربازتاب' },
    { id: 'linen', fa: 'کتان و لینن ارگانیک', en: 'Organic Linen', drape: 'شکن‌های طبیعی، خنک و تنفس‌پذیر' },
    { id: 'cotton', fa: 'نخ‌پنبه طبیعی', en: 'Natural Cotton', drape: 'ریزش ملایم و نرم روزمره' },
    { id: 'technical', fa: 'پارچه نانو و ضدآب', en: 'Technical Shell', drape: 'شکن‌های مهندسی بادگیر' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {lang === 'fa' ? 'پنل مدیریت کاتالوگ و جنس پارچه بوتیک' : 'Store Owner Garment & Fabric Manager'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'fa'
                  ? 'جنس و مشخصات پارچه هر محصول توسط شما تعیین می‌شود تا مشتری صرفاً نوع لباس و رنگ را انتخاب کند.'
                  : 'Specify garment fabrics and inventory. Customers select styles and colors while AI applies sizing.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: Two Columns (Product List & Editor) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* Left / Top Product List (5 Cols) */}
          <div className="md:col-span-5 p-4 border-b md:border-b-0 md:border-r border-slate-800 overflow-y-auto space-y-2 max-h-[300px] md:max-h-[520px]">
            <span className="text-[11px] font-mono text-slate-500 uppercase font-semibold block mb-2">
              {lang === 'fa' ? 'لباس‌های موجود در بوتیک:' : 'Store Garments:'}
            </span>
            {products.map((prod) => {
              const isSelected = selectedProduct.id === prod.id;
              const fabricInfo = fabricOptions.find((f) => f.id === prod.fabricType);

              return (
                <div
                  key={prod.id}
                  onClick={() => handleSelectProduct(prod)}
                  className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/40'
                      : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <img
                    src={prod.imageUrl}
                    alt={prod.name}
                    className="w-12 h-12 rounded-lg object-cover border border-slate-800 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate">
                      {prod.name}
                    </div>
                    <div className="text-[10px] text-cyan-400 font-mono mt-0.5 truncate">
                      {lang === 'fa' ? fabricInfo?.fa : fabricInfo?.en}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      ${prod.price}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right / Bottom Editor Form (7 Cols) */}
          <div className="md:col-span-7 p-6 overflow-y-auto space-y-5">
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              
              <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-800"
                />
                <div>
                  <span className="text-[10px] font-mono uppercase text-indigo-400 font-semibold">
                    {selectedProduct.category.replace('_', ' ')}
                  </span>
                  <h4 className="text-sm font-bold text-white">{selectedProduct.name}</h4>
                  <p className="text-[11px] text-slate-400">{selectedProduct.description}</p>
                </div>
              </div>

              {/* Garment Name & Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {lang === 'fa' ? 'نام لباس در کاتالوگ:' : 'Product Name:'}
                  </label>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {lang === 'fa' ? 'قیمت فروش ($):' : 'Price ($):'}
                  </label>
                  <input
                    type="number"
                    value={editedPrice}
                    onChange={(e) => setEditedPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              {/* Fabric Type Selector (Owner Choice) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  {lang === 'fa' ? 'جنس پارچه اختصاصی لباس (تعیین‌شده توسط شما):' : 'Garment Fabric Material (Set by Store):'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {fabricOptions.map((f) => {
                    const isSelected = editedFabricType === f.id;
                    return (
                      <div
                        key={f.id}
                        onClick={() => setEditedFabricType(f.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="font-semibold text-xs text-white">
                          {lang === 'fa' ? f.fa : f.en}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {f.drape}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{lang === 'fa' ? 'ذخیره تغییرات پارچه و قیمت' : 'Save Changes'}</span>
                </button>
                {savedSuccess && (
                  <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1 animate-fade-in">
                    <Check className="w-3.5 h-3.5" />
                    {lang === 'fa' ? 'مشخصات پارچه با موفقیت ذخیره شد' : 'Saved successfully'}
                  </span>
                )}
              </div>

            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
