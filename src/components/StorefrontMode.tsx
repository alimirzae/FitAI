import React, { useState, useEffect } from 'react';
import { StoreCampaign, Product, ModelSubject } from '../types';
import { STORE_CAMPAIGNS, SAMPLE_PRODUCTS, MODEL_SUBJECTS } from '../data/catalog';
import { 
  Store, 
  Sparkles, 
  Users, 
  Eye, 
  Timer, 
  Flame, 
  ArrowRight, 
  CheckCircle2, 
  Radio, 
  Sliders 
} from 'lucide-react';

interface StorefrontModeProps {
  onLogEvent: (event: string, details?: any) => void;
}

export const StorefrontMode: React.FC<StorefrontModeProps> = ({ onLogEvent }) => {
  const [activeCampaign, setActiveCampaign] = useState<StoreCampaign>(STORE_CAMPAIGNS[0]);
  const [visitorDetected, setVisitorDetected] = useState<boolean>(true);
  const [visitorSubject, setVisitorSubject] = useState<ModelSubject>(MODEL_SUBJECTS[0]);
  const [activeLookIndex, setActiveLookIndex] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  // Campaign Products
  const campaignProducts: Product[] = activeCampaign.productIds
    .map((id) => SAMPLE_PRODUCTS.find((p) => p.id === id))
    .filter((p): p is Product => !!p);

  // Auto-rotate showcase looks every 5 seconds (simulating hands-free storefront kiosk)
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
              Interactive Storefront Display Mode (Sec. 4 & 21)
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">
            {activeCampaign.title}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {activeCampaign.description} • Location: {activeCampaign.location}
          </p>
        </div>

        {/* Campaign Switcher & Passerby Simulator */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {STORE_CAMPAIGNS.map((camp) => (
              <button
                key={camp.id}
                id={`btn-camp-${camp.id}`}
                onClick={() => {
                  setActiveCampaign(camp);
                  onLogEvent('CAMPAIGN_CHANGED', { campaignId: camp.id });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeCampaign.id === camp.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {camp.title.split(' ')[0]}
              </button>
            ))}
          </div>

          <button
            id="btn-new-passerby"
            onClick={handleSimulateNewVisitor}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulate Passerby</span>
          </button>
        </div>
      </div>

      {/* Real-time Passerby Telemetry & Probabilistic Demographic Inference Bar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-semibold">Storefront Sensor:</span>
            <span className="text-emerald-400 font-medium">Visitor Approaching (Distance: 1.8m)</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 border-l border-slate-800 pl-4 text-slate-400">
            <span>Inferred Presentation: <strong className="text-slate-200">{visitorSubject.gender.toUpperCase()}</strong></span>
            <span>•</span>
            <span>Probabilistic Age Group: <strong className="text-slate-200">{visitorSubject.estimatedAgeRange}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-toggle-autorotate"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
              autoRotate
                ? 'bg-indigo-950/80 border-indigo-700 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {autoRotate ? 'Auto-Rotate ON (4.5s)' : 'Auto-Rotate Paused'}
          </button>
        </div>
      </div>

      {/* Main Showcase: Multi-Look Presentation (Original vs Look 1, Look 2, Look 3) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Card 1: Original Passerby Live Camera Feed */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              1. Original Person
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              Live Mirror
            </span>
          </div>
          <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
            <img
              src={visitorSubject.imageUrl}
              alt="Original Visitor"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 right-3 bg-slate-950/80 backdrop-blur-md p-2 rounded-lg border border-slate-800 text-center">
              <span className="text-[11px] font-medium text-slate-300">
                Visitor: {visitorSubject.name}
              </span>
            </div>
          </div>
        </div>

        {/* Cards 2, 3, 4: Automatic Virtual Try-On Looks */}
        {campaignProducts.map((prod, idx) => {
          const isHighlighted = activeLookIndex === idx;
          return (
            <div
              key={prod.id}
              id={`storefront-look-${idx + 1}`}
              onClick={() => {
                setActiveLookIndex(idx);
                setAutoRotate(false);
              }}
              className={`bg-slate-900/90 rounded-2xl p-4 flex flex-col shadow-xl cursor-pointer transition-all border ${
                isHighlighted
                  ? 'border-cyan-500 ring-2 ring-cyan-500/30 shadow-cyan-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{idx + 2}. Look {idx + 1}</span>
                </span>
                <span className="text-xs font-extrabold text-emerald-400 font-mono">
                  ${prod.price}
                </span>
              </div>

              <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group">
                <img
                  src={prod.imageUrl}
                  alt={prod.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Simulated garment drape overlay tag */}
                <div className="absolute top-2 left-2 bg-slate-950/85 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-cyan-300 font-mono border border-cyan-700/50">
                  CatVTON 98% Match
                </div>

                <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 backdrop-blur-md p-2 rounded-lg border border-slate-800">
                  <h4 className="text-xs font-bold text-white truncate">{prod.name}</h4>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{prod.fabric}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">Available: S, M, L</span>
                <span className="text-indigo-400 font-medium flex items-center gap-1">
                  Try In-Store <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footnote on Section 4: Demographic Inference Guidance */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 text-[11px] text-slate-400 flex items-center gap-2">
        <span className="font-semibold text-slate-300">Privacy & Recommendation Compliance:</span>
        <span>
          Demographic and age group estimations are probabilistic inferences used purely for seasonal campaign ranking without storing any biometric or identity data.
        </span>
      </div>
    </div>
  );
};
