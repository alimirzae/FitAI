import React, { useState } from 'react';
import { CustomerProfile, SizeRecommendation } from '../types';
import { FaceRecognitionService } from '../services/faceRecognitionService';
import { UserCheck, Sparkles, Heart, PlusCircle, Check, X, ShieldCheck, History } from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface CustomerRecognitionBannerProps {
  identifiedCustomer: CustomerProfile | null;
  identificationConfidence: number;
  currentFaceEmbedding: number[];
  sizeRecommendation: SizeRecommendation;
  onCustomerRegistered: (newProfile: CustomerProfile) => void;
  onSelectLikedProduct: (productId: string) => void;
  lang: Language;
}

export const CustomerRecognitionBanner: React.FC<CustomerRecognitionBannerProps> = ({
  identifiedCustomer,
  identificationConfidence,
  currentFaceEmbedding,
  sizeRecommendation,
  onCustomerRegistered,
  onSelectLikedProduct,
  lang
}) => {
  const t = TRANSLATIONS[lang];
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newCustomerNotes, setNewCustomerNotes] = useState<string>('');
  const [showHistoryDropdown, setShowHistoryDropdown] = useState<boolean>(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;

    const registered = FaceRecognitionService.registerCustomer({
      name: newCustomerName.trim(),
      faceEmbedding: currentFaceEmbedding,
      gender: 'women',
      estimatedAgeRange: '25–34',
      recommendedSize: sizeRecommendation.recommendedSize,
      bodyMeasurements: {
        heightCm: sizeRecommendation.heightCm,
        shoulderCm: sizeRecommendation.shoulderCm,
        chestCm: sizeRecommendation.chestCm,
        waistCm: sizeRecommendation.waistCm,
      },
      preferredStyles: ['کلاسیک و مدرن'],
      favoriteCategories: ['jackets', 'upper_body'],
      likedProductIds: [],
      notes: newCustomerNotes.trim() || 'ثبت‌شده در آینه هوشمند فروشگاه'
    });

    onCustomerRegistered(registered);
    setShowRegisterModal(false);
    setNewCustomerName('');
    setNewCustomerNotes('');
  };

  return (
    <div className="bg-slate-900/95 border border-indigo-500/30 rounded-2xl p-4 shadow-xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Identified State */}
        {identifiedCustomer ? (
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-emerald-400/80 shadow-md">
                {identifiedCustomer.avatarUrl ? (
                  <img
                    src={identifiedCustomer.avatarUrl}
                    alt={identifiedCustomer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-emerald-950 flex items-center justify-center text-emerald-300 font-bold text-lg">
                    {identifiedCustomer.name[0]}
                  </div>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {lang === 'fa' ? 'چهره شناسایی شد' : 'Face Verified'} ({(identificationConfidence * 100).toFixed(0)}%)
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {lang === 'fa' ? `${identifiedCustomer.visitsCount} بار مراجعه` : `${identifiedCustomer.visitsCount} visits`}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                {lang === 'fa' ? `خوش‌آمدید، ${identifiedCustomer.name} عزیز!` : `Welcome back, ${identifiedCustomer.name}!`}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                <span>
                  {lang === 'fa' ? 'سایز پیشنهادی:' : 'Suggested Size:'}{' '}
                  <strong className="text-cyan-400 font-mono">{identifiedCustomer.recommendedSize}</strong>
                </span>
                <span>•</span>
                <span>
                  {lang === 'fa' ? 'سبک‌های مورد علاقه:' : 'Style:'}{' '}
                  <span className="text-slate-300">{identifiedCustomer.preferredStyles.join('، ')}</span>
                </span>
              </p>
            </div>
          </div>
        ) : (
          /* Unidentified / New Customer State */
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>{lang === 'fa' ? 'شناسایی خودکار چهره و پروفایل مشتری' : 'Automated Face Recognition'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  {lang === 'fa' ? 'مشتری جدید' : 'New Visitor'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'fa'
                  ? 'چهره شما در سیستم اسکن شد. با ثبت نام، دفعه بعد سوابق، سایز و علایق شما خودکار بازیابی می‌شود.'
                  : 'Face geometry analyzed. Register profile to auto-recall your sizing and favorite styles.'}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {identifiedCustomer ? (
            <div className="flex items-center gap-2">
              {identifiedCustomer.likedProductIds.length > 0 && (
                <button
                  onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition-colors"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20" />
                  <span>{lang === 'fa' ? `علایق قبلی (${identifiedCustomer.likedProductIds.length})` : `Favorites (${identifiedCustomer.likedProductIds.length})`}</span>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowRegisterModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{lang === 'fa' ? 'ثبت چهره در باشگاه مشتریان' : 'Register Customer Face'}</span>
            </button>
          )}
        </div>

      </div>

      {/* Customer Liked Products Quick Bar */}
      {identifiedCustomer && showHistoryDropdown && identifiedCustomer.likedProductIds.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 animate-fade-in">
          <span className="text-[11px] font-semibold text-slate-400 block mb-2">
            {lang === 'fa' ? 'لباس‌های پسندیده‌شده در مراجعه‌های قبلی:' : 'Garments liked in previous visits:'}
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {identifiedCustomer.likedProductIds.map((pid) => (
              <button
                key={pid}
                onClick={() => onSelectLikedProduct(pid)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-indigo-500/40 text-xs text-indigo-300 font-medium flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>{pid === 'prod-camel-coat-01' ? 'پالتو پشمی شتری اعلا' : pid === 'prod-leather-moto-02' ? 'کت چرم طبیعی کلاسیک' : 'پیراهن شب ابریشمی'}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  {lang === 'fa' ? 'ثبت مشخصات و اسکن چهره مشتری' : 'Register Customer Profile & Face'}
                </h3>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {lang === 'fa' ? 'نام و نام خانوادگی مشتری:' : 'Customer Full Name:'}
                </label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder={lang === 'fa' ? 'مثلاً: نیلوفر افشار' : 'e.g. Niloofar Afshar'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block">{lang === 'fa' ? 'سایز تخمینی هوشمند:' : 'AI Estimated Size:'}</span>
                  <span className="text-cyan-400 font-bold font-mono text-sm">{sizeRecommendation.recommendedSize}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{lang === 'fa' ? 'عرض شانه اندازه‌گیری:' : 'Shoulder Breadth:'}</span>
                  <span className="text-slate-200 font-mono">{sizeRecommendation.shoulderCm} cm</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {lang === 'fa' ? 'یادداشت بوتیک یا سلیقه خاص مشتری:' : 'Boutique Notes / Style Preferences:'}
                </label>
                <textarea
                  rows={2}
                  value={newCustomerNotes}
                  onChange={(e) => setNewCustomerNotes(e.target.value)}
                  placeholder={lang === 'fa' ? 'مثلاً: طرفدار پالتوهای فوتر و رنگ‌های تیره' : 'Preferences for fabrics and colors'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-colors"
                >
                  {lang === 'fa' ? 'ذخیره در حافظه سیستم' : 'Save Profile'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  {lang === 'fa' ? 'انصراف' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
