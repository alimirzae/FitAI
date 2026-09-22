import React, { useState } from 'react';
import { ModelSubject, SalonConfiguration } from '../types';
import { MODEL_SUBJECTS } from '../data/catalog';
import { 
  Scissors, 
  Sparkles, 
  Palette, 
  Check, 
  Heart, 
  RotateCcw, 
  Columns, 
  Eye, 
  Layers 
} from 'lucide-react';

interface SalonModeProps {
  onLogEvent: (event: string, details?: any) => void;
}

export const SalonMode: React.FC<SalonModeProps> = ({ onLogEvent }) => {
  const [selectedModel, setSelectedModel] = useState<ModelSubject>(MODEL_SUBJECTS[0]); // Sophia
  
  const [config, setConfig] = useState<SalonConfiguration>({
    hairstyleId: 'style-layered-waves',
    hairColor: 'Honey Blonde',
    hairColorHex: '#d4af37',
    hairLength: 'medium',
    beardStyle: 'none',
    makeupIntensity: 0.5,
    eyebrowStyle: 'defined'
  });

  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'hair' | 'color' | 'facial_hair' | 'makeup'>('hair');

  const hairstyles = [
    { id: 'style-layered-waves', name: 'Layered Beach Waves', length: 'medium', category: 'all' },
    { id: 'style-sleek-bob', name: 'Precision French Bob', length: 'short', category: 'all' },
    { id: 'style-textured-pixie', name: 'Textured Modern Pixie', length: 'short', category: 'women' },
    { id: 'style-curtain-bangs', name: 'Curtain Bangs Long Cut', length: 'long', category: 'women' },
    { id: 'style-classic-fade', name: 'Low Taper Fade & Quiff', length: 'short', category: 'men' },
    { id: 'style-slick-undercut', name: 'Pompadour Undercut', length: 'short', category: 'men' },
  ];

  const hairColors = [
    { name: 'Espresso Black', hex: '#1c1917' },
    { name: 'Chestnut Brown', hex: '#451a03' },
    { name: 'Honey Blonde', hex: '#d4af37' },
    { name: 'Platinum Ice', hex: '#e2e8f0' },
    { name: 'Copper Auburn', hex: '#9a3412' },
    { name: 'Burgundy Wine', hex: '#881337' },
    { name: 'Silver Ash', hex: '#94a3b8' },
    { name: 'Rose Gold Tint', hex: '#f43f5e' },
  ];

  const beardStyles = [
    { id: 'none', name: 'Clean Shaved' },
    { id: 'stubble', name: '5 O’Clock Shadow' },
    { id: 'sculpted', name: 'Sculpted Goatee' },
    { id: 'full', name: 'Full Groomed Beard' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Salon Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase font-bold text-pink-400">
              Beauty Engine & Smart Salon Mode (Sec. 10 & 11)
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">
            Hairstyle & Color Simulation
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Virtual try-on for hair cuts, dye colors, facial hair, and cosmetics with photorealistic edge & volume alignment.
          </p>
        </div>

        {/* Model Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Client:</span>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {MODEL_SUBJECTS.map((model) => (
              <button
                key={model.id}
                id={`salon-model-${model.id}`}
                onClick={() => setSelectedModel(model)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                  selectedModel.id === model.id
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {model.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Stage (Before vs After Side-by-Side) & Right Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Stage: 7 Columns */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          
          <div className="grid grid-cols-2 gap-4">
            
            {/* Card A: Original Client Portrait */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                  Before (Current)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  Natural
                </span>
              </div>
              <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                <img
                  src={selectedModel.imageUrl}
                  alt="Original Portrait"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Card B: Virtual Salon Makeover (After Look) */}
            <div className="bg-slate-900/90 border border-pink-500/40 ring-1 ring-pink-500/30 rounded-2xl p-3 flex flex-col shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-pink-400 uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-pink-400" />
                  <span>After (Virtual Look)</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-pink-950 text-pink-300 font-mono border border-pink-800/60">
                  {config.hairColor}
                </span>
              </div>
              <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group">
                <img
                  src={selectedModel.imageUrl}
                  alt="Virtual Salon Look"
                  className="w-full h-full object-cover"
                  style={{
                    filter: `hue-rotate(15deg) saturate(1.1)`
                  }}
                />

                {/* Hair Tint Color Filter Overlay */}
                <div 
                  className="absolute inset-0 mix-blend-color opacity-35 pointer-events-none transition-colors duration-300"
                  style={{ backgroundColor: config.hairColorHex }}
                />

                <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 backdrop-blur-md p-2 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">
                        {hairstyles.find((h) => h.id === config.hairstyleId)?.name}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span 
                          className="w-2.5 h-2.5 rounded-full border border-slate-700 inline-block"
                          style={{ backgroundColor: config.hairColorHex }}
                        />
                        <span>{config.hairColor} • {config.hairLength.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Actions Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                id="btn-save-salon-favorite"
                onClick={() => {
                  setIsSaved(!isSaved);
                  onLogEvent('SALON_FAVORITE_SAVED', { config });
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isSaved
                    ? 'bg-pink-600 border-pink-500 text-white shadow-md shadow-pink-600/30'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-white' : ''}`} />
                <span>{isSaved ? 'Style Saved' : 'Save as Favorite'}</span>
              </button>

              <button
                id="btn-reset-salon"
                onClick={() => {
                  setConfig({
                    hairstyleId: 'style-layered-waves',
                    hairColor: 'Espresso Black',
                    hairColorHex: '#1c1917',
                    hairLength: 'medium',
                    beardStyle: 'none',
                    makeupIntensity: 0.3,
                    eyebrowStyle: 'natural'
                  });
                  onLogEvent('SALON_RESET');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-400 font-mono">
              HairFast-GAN • 96.2% Edge Preservation
            </span>
          </div>
        </div>

        {/* Right Stage: Salon Control Panel (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            
            {/* Salon Feature Sub-Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {[
                { id: 'hair' as const, label: 'Hairstyle', icon: Scissors },
                { id: 'color' as const, label: 'Hair Color', icon: Palette },
                { id: 'facial_hair' as const, label: 'Beard / Grooming', icon: Eye },
                { id: 'makeup' as const, label: 'Cosmetics', icon: Sparkles },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    id={`salon-tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                      activeTab === tab.id
                        ? 'bg-pink-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content 1: Hairstyle Catalog */}
            {activeTab === 'hair' && (
              <div className="space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Select Cut & Silhouette:
                </span>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {hairstyles.map((hair) => {
                    const isSelected = config.hairstyleId === hair.id;
                    return (
                      <div
                        key={hair.id}
                        id={`hair-opt-${hair.id}`}
                        onClick={() => {
                          setConfig({ ...config, hairstyleId: hair.id, hairLength: hair.length as any });
                          onLogEvent('HAIRSTYLE_CHANGED', { hairstyle: hair.name });
                        }}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-pink-950/40 border-pink-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-semibold">{hair.name}</div>
                          <div className="text-[10px] text-slate-500 uppercase mt-0.5">
                            Length: {hair.length}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-pink-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab Content 2: Hair Color Palette */}
            {activeTab === 'color' && (
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Dye Tint & Pigment:
                </span>
                <div className="grid grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {hairColors.map((color) => {
                    const isSelected = config.hairColor === color.name;
                    return (
                      <div
                        key={color.name}
                        id={`color-opt-${color.name.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => {
                          setConfig({ ...config, hairColor: color.name, hairColorHex: color.hex });
                          onLogEvent('HAIR_COLOR_CHANGED', { color: color.name });
                        }}
                        className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                          isSelected
                            ? 'bg-pink-950/40 border-pink-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full border border-slate-700 shadow-sm shrink-0"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-xs font-medium truncate">{color.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab Content 3: Facial Hair */}
            {activeTab === 'facial_hair' && (
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Facial Hair & Beard Grooming:
                </span>
                <div className="space-y-2">
                  {beardStyles.map((beard) => {
                    const isSelected = config.beardStyle === beard.id;
                    return (
                      <div
                        key={beard.id}
                        id={`beard-opt-${beard.id}`}
                        onClick={() => {
                          setConfig({ ...config, beardStyle: beard.id as any });
                          onLogEvent('BEARD_STYLE_CHANGED', { style: beard.name });
                        }}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-pink-950/40 border-pink-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xs font-semibold">{beard.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-pink-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab Content 4: Makeup Intensity */}
            {activeTab === 'makeup' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-slate-200">Makeup Intensity</span>
                    <span className="font-mono text-pink-400 font-bold">
                      {(config.makeupIntensity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    id="slider-makeup"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.makeupIntensity}
                    onChange={(e) => setConfig({ ...config, makeupIntensity: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                </div>

                <div className="pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Eyebrow Styling:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {['natural', 'defined', 'arched'].map((style) => (
                      <button
                        key={style}
                        id={`eyebrow-${style}`}
                        onClick={() => setConfig({ ...config, eyebrowStyle: style as any })}
                        className={`p-2 rounded-lg text-xs font-medium border capitalize ${
                          config.eyebrowStyle === style
                            ? 'bg-pink-950 border-pink-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
