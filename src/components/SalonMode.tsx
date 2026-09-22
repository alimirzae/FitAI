import React, { useEffect, useRef, useState } from 'react';
import { ModelSubject, SalonConfiguration } from '../types';
import { MODEL_SUBJECTS } from '../data/catalog';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { analyzeVideoFrame, LocalPersonAnalysis } from '../services/localAiRuntime';
import { 
  Camera,
  Scissors, 
  Sparkles, 
  Palette, 
  Check, 
  Heart, 
  RotateCcw, 
  Eye 
} from 'lucide-react';

interface SalonModeProps {
  onLogEvent: (event: string, details?: any) => void;
  lang: Language;
  videoRef: React.RefObject<HTMLVideoElement>;
  isCameraActive: boolean;
  onToggleCamera: () => void;
}

export const SalonMode: React.FC<SalonModeProps> = ({ onLogEvent, lang, videoRef, isCameraActive, onToggleCamera }) => {
  const t = TRANSLATIONS[lang];
  const [selectedModel, setSelectedModel] = useState<ModelSubject>(MODEL_SUBJECTS[0]); // Sophia
  
  const [config, setConfig] = useState<SalonConfiguration>({
    hairstyleId: 'style-classic-short-v1',
    hairColor: 'Honey Blonde',
    hairColorHex: '#d4af37',
    hairLength: 'medium',
    beardStyle: 'none',
    makeupIntensity: 0.5,
    eyebrowStyle: 'defined'
  });

  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'hair' | 'color' | 'facial_hair' | 'makeup'>('hair');
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const afterOverlayRef = useRef<HTMLCanvasElement>(null);
  const hairAssetRef = useRef<HTMLImageElement | null>(null);
  const [liveAnalysis,setLiveAnalysis]=useState<LocalPersonAnalysis|null>(null);
  const [liveError,setLiveError]=useState<string|null>(null);

  useEffect(()=>{
    const img=new Image();img.src='/assets/hair/classic-short-v1.svg';img.onload=()=>{hairAssetRef.current=img;};
  },[]);

  useEffect(()=>{
    if(!isCameraActive || !videoRef.current || !liveVideoRef.current) return;
    const stream=videoRef.current.srcObject as MediaStream|null;
    if(!stream)return;
    liveVideoRef.current.srcObject=stream; liveVideoRef.current.play().catch(()=>{});
  },[isCameraActive,videoRef]);

  useEffect(()=>{
    if(!isCameraActive)return;
    let stopped=false,busy=false;
    const id=window.setInterval(async()=>{
      const v=liveVideoRef.current; if(!v||v.readyState<2||busy)return; busy=true;
      try{const a=await analyzeVideoFrame(v);if(!stopped){setLiveAnalysis(a);setLiveError(null);}}
      catch(e:any){if(!stopped)setLiveError(e?.message||String(e));}
      finally{busy=false}
    },300);
    return()=>{stopped=true;window.clearInterval(id)};
  },[isCameraActive]);

  useEffect(()=>{
    const analysis=liveAnalysis;if(!analysis)return;
    const draw=(c:HTMLCanvasElement|null,after:boolean)=>{
      if(!c)return;const ctx=c.getContext('2d');if(!ctx)return;ctx.clearRect(0,0,c.width,c.height);
      const face=analysis.faces?.[0];if(!face)return;
      const x=(1-face.x-face.width)*c.width,y=face.y*c.height,w=face.width*c.width,h=face.height*c.height;
      if(!after){
        ctx.save();ctx.strokeStyle='rgba(34,211,238,.34)';ctx.lineWidth=1.5;ctx.setLineDash([5,6]);ctx.strokeRect(x,y,w,h);ctx.restore();
      } else {
        // Real-texture hair recolor preview: tint only the probable hair zone while keeping
        // the live camera texture underneath. This is deliberately NOT labelled hairstyle synthesis.
        const hx=x-w*.14, hy=y-h*.34, hw=w*1.28, hh=h*.58;
        ctx.save();
        ctx.beginPath();ctx.ellipse(hx+hw/2,hy+hh*.58,hw*.48,hh*.48,0,Math.PI,Math.PI*2);ctx.clip();
        ctx.globalCompositeOperation='color';ctx.globalAlpha=.52;ctx.fillStyle=config.hairColorHex;ctx.fillRect(hx,hy,hw,hh);
        ctx.globalCompositeOperation='soft-light';ctx.globalAlpha=.24;
        const g=ctx.createLinearGradient(hx,hy,hx,hy+hh);g.addColorStop(0,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(0,0,0,.35)');ctx.fillStyle=g;ctx.fillRect(hx,hy,hw,hh);
        ctx.restore();
      }
    };
    draw(overlayRef.current,false);draw(afterOverlayRef.current,true);
  },[liveAnalysis,config.hairColorHex,config.hairstyleId]);

  const hairstyles = [
    { id: 'style-classic-short-v1', nameEn: 'Classic Short v1 (Live)', nameFa: 'کوتاه کلاسیک زنده', length: 'short', category: 'all' },
    { id: 'style-layered-waves', nameEn: 'Layered Beach Waves', nameFa: 'موج‌دار لایه‌ای ساحلی', length: 'medium', category: 'all' },
    { id: 'style-sleek-bob', nameEn: 'Precision French Bob', nameFa: 'باب فرانسوی کلاسیک', length: 'short', category: 'all' },
    { id: 'style-textured-pixie', nameEn: 'Textured Modern Pixie', nameFa: 'پیکسی مدرن و کوتاه', length: 'short', category: 'women' },
    { id: 'style-curtain-bangs', nameEn: 'Curtain Bangs Long Cut', nameFa: 'چتری پرده‌ای موی بلند', length: 'long', category: 'women' },
    { id: 'style-classic-fade', nameEn: 'Low Taper Fade & Quiff', nameFa: 'سایه‌زنی فید و کوئیف مردانه', length: 'short', category: 'men' },
    { id: 'style-slick-undercut', nameEn: 'Pompadour Undercut', nameFa: 'آندرکات پامپادور', length: 'short', category: 'men' },
    { id: 'style-curly-afro', nameEn: 'Defined Natural Curls', nameFa: 'فر طبیعی و پرحجم', length: 'medium', category: 'all' },
  ];

  const hairColors = [
    { nameEn: 'Espresso Black', nameFa: 'مشکی اسپرسو', hex: '#1c1917' },
    { nameEn: 'Chestnut Brown', nameFa: 'قهوه‌ای شاه‌بلوطی', hex: '#451a03' },
    { nameEn: 'Honey Blonde', nameFa: 'بلوند عسلی', hex: '#d4af37' },
    { nameEn: 'Platinum Ice', nameFa: 'پلاتینی یخی', hex: '#e2e8f0' },
    { nameEn: 'Copper Auburn', nameFa: 'مسی فندقی', hex: '#9a3412' },
    { nameEn: 'Burgundy Wine', nameFa: 'شرابی بورگاندی', hex: '#881337' },
    { nameEn: 'Silver Ash', nameFa: 'دودی نقره‌ای', hex: '#94a3b8' },
    { nameEn: 'Rose Gold Tint', nameFa: 'رزگلد پاستلی', hex: '#f43f5e' },
  ];

  const beardStyles = [
    { id: 'none', nameEn: 'Clean Shaved', nameFa: 'اصلاح کامل (بدون ریش)' },
    { id: 'stubble', nameEn: '5 O’Clock Stubble', nameFa: 'ته‌ریش کلاسیک' },
    { id: 'sculpted', nameEn: 'Sculpted Goatee', nameFa: 'پروفسوری خط‌گیری شده' },
    { id: 'full', nameEn: 'Full Groomed Beard', nameFa: 'ریش کامل پرپشت' },
  ];

  const lipsticks = [
    { nameEn: 'Ruby Velvet', nameFa: 'قرمز مخملی یاقوتی', hex: '#991b1b' },
    { nameEn: 'Nude Rose', nameFa: 'رز طبیعی ملایم', hex: '#be123c' },
    { nameEn: 'Deep Berry Plum', nameFa: 'تمشکی ارغوانی', hex: '#701a75' },
    { nameEn: 'Terracotta Coral', nameFa: 'مرجانی آجری', hex: '#c2410c' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Salon Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase font-bold text-pink-400">
              {t.salon.badge}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">
            {t.salon.title}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {t.salon.description}
          </p>
        </div>

        {/* Model Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{t.salon.client}</span>
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

      <div className="flex items-center gap-3">
        <button onClick={onToggleCamera} className="px-4 py-2 rounded-xl bg-pink-600 text-white text-xs font-bold flex items-center gap-2">
          <Camera className="w-4 h-4"/>{isCameraActive ? (lang==='fa'?'خاموش کردن دوربین':'Stop Camera') : (lang==='fa'?'فعال‌سازی دوربین سالن':'Enable Salon Camera')}
        </button>
        <span className={liveAnalysis?.faces?.length ? 'text-emerald-400 text-xs' : 'text-slate-400 text-xs'}>
          {isCameraActive ? `Face: ${liveAnalysis?.faces?.length||0} | AI: ${liveAnalysis?.latency_ms??'--'}ms` : (lang==='fa'?'حالت تصویر نمونه':'Sample image mode')}
        </span>
        {liveError&&<span className="text-rose-400 text-xs">{liveError}</span>}
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
                  {t.salon.before}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  {t.salon.natural}
                </span>
              </div>
              <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                {isCameraActive ? <><video ref={liveVideoRef} autoPlay playsInline muted onLoadedMetadata={(e)=>{const v=e.currentTarget;if(v.videoWidth&&v.videoHeight){if(overlayRef.current){overlayRef.current.width=v.videoWidth;overlayRef.current.height=v.videoHeight;}if(afterOverlayRef.current){afterOverlayRef.current.width=v.videoWidth;afterOverlayRef.current.height=v.videoHeight;}}}} className="absolute inset-0 w-full h-full object-contain -scale-x-100 bg-black"/><canvas ref={overlayRef} width={1280} height={720} className="absolute inset-0 w-full h-full object-contain"/></> :
                <img src={selectedModel.imageUrl} alt="Original Portrait" className="w-full h-full object-cover" />}
              </div>
            </div>

            {/* Card B: Virtual Salon Makeover (After Look) */}
            <div className="bg-slate-900/90 border border-pink-500/40 ring-1 ring-pink-500/30 rounded-2xl p-3 flex flex-col shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-pink-400 uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-pink-400" />
                  <span>{t.salon.after}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-pink-950 text-pink-300 font-mono border border-pink-800/60">
                  {lang === 'fa' 
                    ? hairColors.find(c => c.nameEn === config.hairColor)?.nameFa 
                    : config.hairColor}
                </span>
              </div>
              <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group">
                {isCameraActive ? <><video autoPlay playsInline muted ref={(el)=>{if(el&&videoRef.current?.srcObject&&el.srcObject!==videoRef.current.srcObject){el.srcObject=videoRef.current.srcObject;el.play().catch(()=>{});}}} className="absolute inset-0 w-full h-full object-contain -scale-x-100 bg-black"/><canvas ref={afterOverlayRef} width={1280} height={720} className="absolute inset-0 w-full h-full object-contain"/></> :
                <img src={selectedModel.imageUrl} alt="Virtual Salon Look" className="w-full h-full object-cover" style={{filter:'hue-rotate(15deg) saturate(1.1)'}} />}

                {/* Hair Tint Color Filter Overlay */}
                {!isCameraActive && <div className="absolute inset-0 mix-blend-color opacity-20 pointer-events-none transition-colors duration-300" style={{ backgroundColor: config.hairColorHex }} />}

                <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 backdrop-blur-md p-2 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">
                        {lang === 'fa' ? 'پیش‌نمایش زنده رنگ مو با حفظ بافت واقعی' : 'Live hair-color preview preserving real texture'}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span 
                          className="w-2.5 h-2.5 rounded-full border border-slate-700 inline-block"
                          style={{ backgroundColor: config.hairColorHex }}
                        />
                        <span>
                          {lang === 'fa' 
                            ? hairColors.find(c => c.nameEn === config.hairColor)?.nameFa 
                            : config.hairColor} • {config.hairLength.toUpperCase()}
                        </span>
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
                <span>{isSaved ? t.salon.saved : t.salon.saveFavorite}</span>
              </button>

              <button
                id="btn-reset-salon"
                onClick={() => {
                  setConfig({
                    hairstyleId: 'style-layered-waves',
                    hairColor: 'Honey Blonde',
                    hairColorHex: '#d4af37',
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
                <span>{t.salon.reset}</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-400 font-mono">
              MediaPipe Face Mesh • LIVE HAIR COLOR • STYLE SYNTHESIS PENDING
            </span>
          </div>
        </div>

        {/* Right Stage: Salon Control Panel (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            
            {/* Salon Feature Sub-Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {[
                { id: 'hair' as const, label: t.salon.tabs.hair, icon: Scissors },
                { id: 'color' as const, label: t.salon.tabs.color, icon: Palette },
                { id: 'facial_hair' as const, label: t.salon.tabs.facial_hair, icon: Eye },
                { id: 'makeup' as const, label: t.salon.tabs.makeup, icon: Sparkles },
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
                  {t.salon.selectCut}
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
                          onLogEvent('HAIRSTYLE_CHANGED', { hairstyle: hair.nameEn });
                        }}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-pink-950/40 border-pink-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-semibold">
                            {lang === 'fa' ? hair.nameFa : hair.nameEn}
                          </div>
                          <div className="text-[10px] text-slate-500 uppercase mt-0.5">
                            {hair.length}
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
                  {t.salon.dyePigment}
                </span>
                <div className="grid grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {hairColors.map((color) => {
                    const isSelected = config.hairColor === color.nameEn;
                    return (
                      <div
                        key={color.nameEn}
                        id={`color-opt-${color.nameEn.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => {
                          setConfig({ ...config, hairColor: color.nameEn, hairColorHex: color.hex });
                          onLogEvent('HAIR_COLOR_CHANGED', { color: color.nameEn });
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
                        <span className="text-xs font-medium truncate">
                          {lang === 'fa' ? color.nameFa : color.nameEn}
                        </span>
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
                  {t.salon.facialGrooming}
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
                          onLogEvent('BEARD_STYLE_CHANGED', { style: beard.nameEn });
                        }}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-pink-950/40 border-pink-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xs font-semibold">
                          {lang === 'fa' ? beard.nameFa : beard.nameEn}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-pink-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab Content 4: Makeup & Cosmetics */}
            {activeTab === 'makeup' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-slate-200">{t.salon.makeupIntensity}</span>
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

                {/* Lipstick Palette */}
                <div className="pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    {lang === 'fa' ? 'رنگ رژ لب و براق‌کننده:' : 'Lipstick & Gloss Tint:'}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {lipsticks.map((lip) => (
                      <div
                        key={lip.nameEn}
                        className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer hover:border-pink-500/50"
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 border border-slate-700"
                          style={{ backgroundColor: lip.hex }}
                        />
                        <span className="truncate">{lang === 'fa' ? lip.nameFa : lip.nameEn}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    {t.salon.eyebrows}
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
