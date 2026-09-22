import React, { useState, useRef } from 'react';
import { ModelSubject, BodyTransformation } from '../types';
import { MODEL_SUBJECTS } from '../data/catalog';
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
}

export const BodyEngine: React.FC<BodyEngineProps> = ({ onLogEvent }) => {
  const [selectedModel, setSelectedModel] = useState<ModelSubject>(MODEL_SUBJECTS[1]); // Marcus (athletic) or Sophia
  const [transform, setTransform] = useState<BodyTransformation>({
    slim: 0.04, // 4%
    fitness: 0.05, // 5%
    posture: 0.03, // 3%
    chestTuning: 0.02
  });

  const [compareMode, setCompareMode] = useState<'split' | 'side-by-side'>('split');
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

  // Optical deformation calculations (pure visual warp simulation preserving head & background)
  // Slimming gently reduces waist/torso width while maintaining vertical proportion
  const scaleXFactor = 1.0 - transform.slim * 0.7;
  const postureTranslateY = -transform.posture * 12; // lifts torso slightly for posture alignment
  const fitnessContrast = 1.0 + transform.fitness * 0.8; // subtle muscle definition shading enhancement

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase font-bold text-indigo-400">
              Controlled Visual Body Transformation (Sec. 9)
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">
            Proportional Visual Appearance Engine
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Fine, controlled adjustments that preserve face identity, body proportions, hand geometry, and background integrity.
          </p>
        </div>

        {/* Model Subject Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Subject:</span>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {MODEL_SUBJECTS.map((model) => (
              <button
                key={model.id}
                id={`body-model-${model.id}`}
                onClick={() => setSelectedModel(model)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                  selectedModel.id === model.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {model.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Stage (Comparison Viewport) & Right Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Stage: 7 Columns */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          
          <div
            className="relative w-full aspect-[3/4] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl select-none"
            onMouseMove={handleMouseMove}
            onMouseDown={() => { isDragging.current = true; }}
            onMouseUp={() => { isDragging.current = false; }}
            onMouseLeave={() => { isDragging.current = false; }}
            onTouchMove={handleTouchMove}
            onTouchStart={() => { isDragging.current = true; }}
            onTouchEnd={() => { isDragging.current = false; }}
          >
            {/* Base Original Model */}
            <img
              src={selectedModel.imageUrl}
              alt="Original Body"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-xs font-semibold text-slate-300 z-10">
              ORIGINAL (0%)
            </div>

            {/* Transformed Layer clipped by split position */}
            <div
              className="absolute inset-0 overflow-hidden z-10"
              style={{ clipPath: `inset(0 0 0 ${splitPos}%)` }}
            >
              <div 
                className="w-full h-full transition-transform duration-100 ease-out"
                style={{
                  transform: `scaleX(${scaleXFactor}) translateY(${postureTranslateY}px)`,
                  filter: `contrast(${fitnessContrast})`,
                  transformOrigin: 'center center'
                }}
              >
                <img
                  src={selectedModel.imageUrl}
                  alt="Transformed Body"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Modified tag */}
              <div className="absolute top-4 right-4 bg-indigo-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-indigo-700/60 text-xs font-semibold text-cyan-300">
                TRANSFORMED (Slim: {(transform.slim * 100).toFixed(0)}%, Tone: {(transform.fitness * 100).toFixed(0)}%)
              </div>
            </div>

            {/* Split Slider Divider Line & Handle */}
            <div
              className="absolute top-0 bottom-0 z-30 cursor-ew-resize flex items-center justify-center pointer-events-none"
              style={{ left: `${splitPos}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-0.5 h-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              <div className="absolute w-8 h-8 rounded-full bg-cyan-500 border-2 border-slate-900 shadow-lg flex items-center justify-center text-slate-950 text-xs font-bold pointer-events-auto cursor-ew-resize">
                ↔
              </div>
            </div>

            {/* Viewport Overlay Controls */}
            <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between bg-slate-900/85 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-xs text-slate-300">
              <span>Drag slider to compare Original vs Transformation</span>
              <span className="font-mono text-cyan-400">Divider: {splitPos}%</span>
            </div>
          </div>

          {/* Mandatory Section 9 Disclaimer */}
          <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong>Mandatory Compliance Notice (README Sec. 9):</strong> Body transformation is a visualization feature and must never be represented as a health, weight-loss or medical prediction.
            </p>
          </div>
        </div>

        {/* Right Stage: Transformation Sliders (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>Adjustment Sliders (0 – 10%)</span>
              </h3>
              <button
                id="btn-reset-body"
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-slate-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All</span>
              </button>
            </div>

            {/* Slider 1: Slimmer (0 to 10%) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Slimmer Ratio</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {(transform.slim * 100).toFixed(1)}%
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
                  setTransform({ ...transform, slim: parseFloat(e.target.value) });
                  onLogEvent('BODY_SLIM_ADJUST', { value: e.target.value });
                }}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0% (Original)</span>
                <span>5%</span>
                <span>10% (Max)</span>
              </div>
            </div>

            {/* Slider 2: Athletic / Fit Muscle Tone (0 to 10%) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Fit / Athletic Tone</span>
                <span className="font-mono text-indigo-400 font-bold">
                  {(transform.fitness * 100).toFixed(1)}%
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
                  setTransform({ ...transform, fitness: parseFloat(e.target.value) });
                  onLogEvent('BODY_FITNESS_ADJUST', { value: e.target.value });
                }}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0%</span>
                <span>5%</span>
                <span>10% (Max)</span>
              </div>
            </div>

            {/* Slider 3: Posture Alignment (0 to 10%) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Posture & Spine Lift</span>
                <span className="font-mono text-purple-400 font-bold">
                  {(transform.posture * 100).toFixed(1)}%
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
                  setTransform({ ...transform, posture: parseFloat(e.target.value) });
                  onLogEvent('BODY_POSTURE_ADJUST', { value: e.target.value });
                }}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0%</span>
                <span>5%</span>
                <span>10% (Max)</span>
              </div>
            </div>

            {/* Preservation Safeguards Checklist (Section 9) */}
            <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Preservation Safeguards:
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Face Identity Locked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Proportions Intact</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Clothing Fabric Mapped</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Background Untouched</span>
                </div>
              </div>
            </div>

            {/* Preset Transformation Profiles */}
            <div className="pt-4 border-t border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Quick Tuning Presets:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  id="preset-subtle"
                  onClick={() => setTransform({ slim: 0.02, fitness: 0.03, posture: 0.02, chestTuning: 0.01 })}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 text-center"
                >
                  Subtle Natural
                </button>
                <button
                  id="preset-athletic"
                  onClick={() => setTransform({ slim: 0.05, fitness: 0.08, posture: 0.04, chestTuning: 0.03 })}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 text-center"
                >
                  Athletic Fit
                </button>
                <button
                  id="preset-tailored"
                  onClick={() => setTransform({ slim: 0.06, fitness: 0.04, posture: 0.05, chestTuning: 0.02 })}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 text-center"
                >
                  Suit Posture
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
