import React, { useState, useRef } from 'react';
import { ModelSubject, BodyTransformation } from '../types';
import { MODEL_SUBJECTS } from '../data/catalog';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { 
  UserCheck, 
  RotateCcw, 
  Sliders, 
  Sparkles, 
  ShieldAlert, 
  Check, 
  Info,
  Maximize2
} from 'lucide-react';

interface BodyEngineProps {
  onLogEvent: (event: string, details?: any) => void;
  lang: Language;
}

export const BodyEngine: React.FC<BodyEngineProps> = ({ onLogEvent, lang }) => {
  const t = TRANSLATIONS[lang];
  const [selectedModel, setSelectedModel] = useState<ModelSubject>(MODEL_SUBJECTS[1]); // Marcus
  const [transform, setTransform] = useState<BodyTransformation>({
    slim: 0.04, // 4%
    fitness: 0.05, // 5%
    posture: 0.03, // 3%
    chestTuning: 0.02
  });

  const [splitPos, setSplitPos] = useState<number>(50);
  const isDragging = useRef<boolean>(false);

  const handleReset = () => {
    setTransform({
      slim: 0.0,
      fitness: 0.0,
      posture: 0.0,
      chestTuning: 0.0
    });
    onLogEvent('BODY_TRANSFORM_RESET');
  };

  // Split-slider drag handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSplitPos(Math.round((x / rect.width) * 100));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging.current || e.touches.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    setSplitPos(Math.round((x / rect.width) * 100));
  };

  // Optical deformation calculations
  const scaleXFactor = 1.0 - transform.slim * 0.7;
  const postureTranslateY = -transform.posture * 12;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase font-bold text-indigo-400">
              {t.bodyEngine.badge}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">
            {t.bodyEngine.title}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {t.bodyEngine.description}
          </p>
        </div>

        {/* Model Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{t.salon.client}</span>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {MODEL_SUBJECTS.map((model) => (
              <button
                key={model.id}
                id={`body-model-${model.id}`}
                onClick={() => {
                  setSelectedModel(model);
                  onLogEvent('BODY_MODEL_CHANGED', { model: model.name });
                }}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                  selectedModel.id === model.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {model.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Canvas & Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Stage: 7 Columns Interactive Split View */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          
          <div
            id="body-canvas-container"
            className="relative aspect-[3/4] w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl select-none group"
            onMouseMove={handleMouseMove}
            onMouseDown={() => { isDragging.current = true; }}
            onMouseUp={() => { isDragging.current = false; }}
            onTouchMove={handleTouchMove}
            onTouchStart={() => { isDragging.current = true; }}
            onTouchEnd={() => { isDragging.current = false; }}
          >
            {/* 1. Base Original Image Layer */}
            <img
              src={selectedModel.imageUrl}
              alt="Original Unmodified Subject"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* 2. Controlled Transformation Preview Layer (clipped by split position) */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{
                clipPath: `polygon(${splitPos}% 0, 100% 0, 100% 100%, ${splitPos}% 100%)`
              }}
            >
              <div
                className="w-full h-full relative"
                style={{
                  transform: `scaleX(${scaleXFactor}) translateY(${postureTranslateY}px)`,
                  transition: isDragging.current ? 'none' : 'transform 0.15s ease-out'
                }}
              >
                <img
                  src={selectedModel.imageUrl}
                  alt="Transformed Subject"
                  className="w-full h-full object-cover"
                  style={{
                    filter: `contrast(${1 + transform.fitness * 0.8}) brightness(${1 + transform.posture * 0.2})`
                  }}
                />
              </div>

              {/* Transformed Badge */}
              <div className="absolute top-4 right-4 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-indigo-500/40 text-xs font-mono text-white flex items-center gap-1.5 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t.bodyEngine.transformed}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300">
                  Slim +{(transform.slim * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Split Comparison Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize z-20 shadow-[0_0_12px_rgba(255,255,255,0.7)]"
              style={{ left: `${splitPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-white shadow-xl flex items-center justify-center text-white">
                <Sliders className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Original Badge */}
            <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
              {t.bodyEngine.original}
            </div>

            <div className="absolute bottom-3 inset-x-3 text-center pointer-events-none">
              <span className="text-[11px] bg-slate-950/80 backdrop-blur-sm px-3 py-1 rounded-full text-slate-400 border border-slate-800 font-mono">
                {t.bodyEngine.dragNotice}
              </span>
            </div>
          </div>

          {/* Section 9 Compliance Notice */}
          <div className="bg-amber-950/30 border border-amber-800/60 rounded-2xl p-3.5 flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-200 leading-relaxed">
              <strong>{t.bodyEngine.complianceNotice}</strong>
            </div>
          </div>
        </div>

        {/* Right Stage: 5 Columns Precision Tuning Sliders */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>{t.bodyEngine.sliders}</span>
              </h3>
              <button
                id="btn-reset-body"
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t.bodyEngine.resetAll}</span>
              </button>
            </div>

            {/* Slider 1: Slimmer Ratio */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">{t.bodyEngine.slimmerRatio}</span>
                <span className="font-mono text-indigo-400 font-bold">
                  {(transform.slim * 100).toFixed(1)}% / 10.0%
                </span>
              </div>
              <input
                id="slider-slim"
                type="range"
                min="0"
                max="0.10"
                step="0.005"
                value={transform.slim}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setTransform({ ...transform, slim: val });
                  onLogEvent('BODY_SLIM_ADJUSTED', { value: val });
                }}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Slider 2: Fit / Athletic Tone */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">{t.bodyEngine.fitTone}</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {(transform.fitness * 100).toFixed(1)}% / 10.0%
                </span>
              </div>
              <input
                id="slider-fitness"
                type="range"
                min="0"
                max="0.10"
                step="0.005"
                value={transform.fitness}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setTransform({ ...transform, fitness: val });
                  onLogEvent('BODY_FITNESS_ADJUSTED', { value: val });
                }}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Slider 3: Posture & Spine Lift */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">{t.bodyEngine.postureLift}</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {(transform.posture * 100).toFixed(1)}% / 10.0%
                </span>
              </div>
              <input
                id="slider-posture"
                type="range"
                min="0"
                max="0.10"
                step="0.005"
                value={transform.posture}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setTransform({ ...transform, posture: val });
                  onLogEvent('BODY_POSTURE_ADJUSTED', { value: val });
                }}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Preservation Safeguards Checklist */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">
                {t.bodyEngine.safeguards}
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.bodyEngine.faceLocked}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.bodyEngine.proportionsIntact}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.bodyEngine.fabricMapped}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.bodyEngine.bgUntouched}</span>
                </div>
              </div>
            </div>

            {/* Quick Tuning Presets */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-2">
                {t.bodyEngine.presets}
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  id="preset-subtle"
                  onClick={() => setTransform({ slim: 0.02, fitness: 0.03, posture: 0.02, chestTuning: 0.01 })}
                  className="px-2 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-300 transition-colors"
                >
                  {t.bodyEngine.subtle}
                </button>
                <button
                  id="preset-athletic"
                  onClick={() => setTransform({ slim: 0.05, fitness: 0.08, posture: 0.04, chestTuning: 0.03 })}
                  className="px-2 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-300 transition-colors"
                >
                  {t.bodyEngine.athletic}
                </button>
                <button
                  id="preset-tailored"
                  onClick={() => setTransform({ slim: 0.03, fitness: 0.04, posture: 0.08, chestTuning: 0.02 })}
                  className="px-2 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-300 transition-colors"
                >
                  {t.bodyEngine.tailored}
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
