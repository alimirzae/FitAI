import React, { useState, useEffect } from 'react';
import { StoreCampaign, Product, ModelSubject } from '../types';
import { STORE_CAMPAIGNS, SAMPLE_PRODUCTS, MODEL_SUBJECTS } from '../data/catalog';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { 
  Store, 
  Sparkles, 
  Users, 
  Eye, 
  Flame, 
  ArrowRight, 
  Radio, 
  Sliders 
} from 'lucide-react';

interface StorefrontModeProps {
  onLogEvent: (event: string, details?: any) => void;
  lang: Language;
}

export const StorefrontMode: React.FC<StorefrontModeProps> = ({ onLogEvent, lang }) => {
  const t = TRANSLATIONS[lang];
  const [activeCampaign, setActiveCampaign] = useState<StoreCampaign>(STORE_CAMPAIGNS[0]);
  const [visitorDetected, setVisitorDetected] = useState<boolean>(true);
  const [visitorSubject, setVisitorSubject] = useState<ModelSubject>(MODEL_SUBJECTS[0]);
  const [activeLookIndex, setActiveLookIndex] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  // Campaign Products
  const campaignProducts: Product[] = activeCampaign.productIds
    .map((id) => SAMPLE_PRODUCTS.find((p) => p.id === id))
    .filter((p): p is Product => !!p);

  // Auto-rotate showcase looks every 4.5 seconds (simulating hands-free storefront kiosk)
  useEffect(() => {
    if (!autoRotate) return;
    const interval = setInterval(() => {
      setActiveLookIndex((prev) => (prev + 1) % (campaignProducts.length || 1));
    }, 4500);
    return () => clearInterval(interval);
  }, [autoRotate, campaignProducts.length]);

  // Simulate new passerby approaching the storefront window
  const handleSimulateNewVisitor = () => {
    const nextModel = MODEL_SUBJECTS[(MODEL_SUBJECTS.indexOf(visitorSubject) + 1) % MODEL_SUBJECTS.length];
    setVisitorSubject(nextModel);
    setVisitorDetected(true);
    setActiveLookIndex(0);
    onLogEvent('STOREFRONT_PERSON_DETECTED', { model: nextModel.name });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Storefront Banner & Campaign Selector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <span className="text-xs font-mono uppercase font-bold text-cyan-400">
              {t.storefront.title}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">
            {activeCampaign.title}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {activeCampaign.description}
          </p>
        </div>

        {/* Campaign Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Campaign:</span>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {STORE_CAMPAIGNS.map((camp) => (
              <button
                key={camp.id}
                id={`camp-select-${camp.id}`}
                onClick={() => {
                  setActiveCampaign(camp);
                  setActiveLookIndex(0);
                  onLogEvent('STOREFRONT_CAMPAIGN_CHANGED', { campaign: camp.title });
                }}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                  activeCampaign.id === camp.id
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {camp.title.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sensor Detection Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 px-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>{t.storefront.sensorNotice}</span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
              <span>{t.storefront.inferredPresentation} <strong className="text-slate-200 uppercase">{visitorSubject.gender}</strong></span>
              <span>•</span>
              <span>{t.storefront.probAge} <strong className="text-cyan-400">{visitorSubject.estimatedAgeRange}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-simulate-passerby"
            onClick={handleSimulateNewVisitor}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.storefront.simulatePasserby}</span>
          </button>

          <button
            id="btn-toggle-autorotate"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
              autoRotate 
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <span>{autoRotate ? t.storefront.autoRotateOn : t.storefront.autoRotatePaused}</span>
          </button>
        </div>
      </div>

      {/* Main 4-Way Showcase Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Original Passerby Live Mirror */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-3 flex flex-col shadow-xl">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">
              {t.storefront.originalPerson}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              {t.storefront.liveMirror}
            </span>
          </div>
          <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
            <img
              src={visitorSubject.imageUrl}
              alt="Passerby original"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 right-3 bg-slate-950/80 backdrop-blur-md p-2 rounded-xl border border-slate-800 text-center">
              <span className="text-xs font-semibold text-slate-200">
                {t.storefront.visitor} {visitorSubject.name.split(' ')[0]}
              </span>
            </div>
          </div>
        </div>

        {/* Cards 2, 3, 4: Automated Try-On Looks */}
        {campaignProducts.slice(0, 3).map((product, idx) => {
          const isActiveLook = activeLookIndex === idx;

          return (
            <div
              key={product.id}
              onClick={() => setActiveLookIndex(idx)}
              className={`rounded-3xl p-3 flex flex-col shadow-xl transition-all cursor-pointer ${
                isActiveLook
                  ? 'bg-slate-900/95 border-2 border-cyan-400 ring-4 ring-cyan-500/20 scale-[1.02]'
                  : 'bg-slate-900/70 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <span className={`text-xs font-mono font-bold uppercase flex items-center gap-1 ${
                  isActiveLook ? 'text-cyan-400' : 'text-slate-400'
                }`}>
                  <Sparkles className="w-3 h-3" />
                  <span>{t.storefront.look} {idx + 1}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono border border-cyan-800/60">
                  ${product.price}
                </span>
              </div>

              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 group">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-300 uppercase">
                  {product.fabricType}
                </div>

                <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-white truncate">
                    {product.name}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>{product.category.replace('_', ' ')}</span>
                    <span className="text-cyan-400 font-semibold">{t.storefront.tryInStore} →</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

      </div>

      {/* Compliance Note */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 text-[11px] text-slate-400 leading-relaxed font-sans">
        <p>{t.storefront.privacyNote}</p>
      </div>

    </div>
  );
};
