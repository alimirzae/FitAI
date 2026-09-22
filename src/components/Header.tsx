import React from 'react';
import { OperatingMode } from '../types';
import { 
  Sparkles, 
  Shirt, 
  Store, 
  UserCheck, 
  Scissors, 
  BarChart3, 
  Camera, 
  Cpu, 
  ShieldCheck 
} from 'lucide-react';

interface HeaderProps {
  currentMode: OperatingMode;
  onSelectMode: (mode: OperatingMode) => void;
  isCameraActive: boolean;
  onToggleCamera: () => void;
  latencyMs: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  isCameraActive,
  onToggleCamera,
  latencyMs
}) => {
  const modes = [
    { id: 'fitting_room' as OperatingMode, label: 'Smart Fitting Room', icon: Shirt },
    { id: 'storefront' as OperatingMode, label: 'Storefront Kiosk', icon: Store },
    { id: 'body_engine' as OperatingMode, label: 'Body Transformation', icon: UserCheck },
    { id: 'salon' as OperatingMode, label: 'Beauty & Salon', icon: Scissors },
    { id: 'analytics' as OperatingMode, label: 'Analytics & Registry', icon: BarChart3 },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">FitAI</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                  OpenFit Core
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                AI Virtual Appearance & Smart Mirror Platform
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 max-w-full overflow-x-auto">
            {modes.map((mode) => {
              const Icon = mode.icon;
              const isActive = currentMode === mode.id;
              return (
                <button
                  key={mode.id}
                  id={`tab-${mode.id}`}
                  onClick={() => onSelectMode(mode.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{mode.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Hardware & Camera Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/70 border border-slate-700/60 text-xs text-slate-300">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>RTX 4080 • {latencyMs}ms</span>
            </div>

            <button
              id="btn-toggle-camera"
              onClick={onToggleCamera}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isCameraActive
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isCameraActive ? 'Camera Live' : 'Enable Camera'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
