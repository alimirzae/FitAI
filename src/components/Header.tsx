import React from 'react';
import { OperatingMode } from '../types';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { 
  Sparkles, 
  Shirt, 
  Store, 
  UserCheck, 
  Scissors, 
  BarChart3, 
  Camera, 
  Cpu, 
  Settings,
  Globe
} from 'lucide-react';

interface HeaderProps {
  currentMode: OperatingMode;
  onSelectMode: (mode: OperatingMode) => void;
  isCameraActive: boolean;
  onToggleCamera: () => void;
  latencyMs: number;
  lang: Language;
  onToggleLanguage: (lang: Language) => void;
  onOpenSettings: () => void;
  storeName: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  isCameraActive,
  onToggleCamera,
  latencyMs,
  lang,
  onToggleLanguage,
  onOpenSettings,
  storeName,
}) => {
  const t = TRANSLATIONS[lang];

  const modes = [
    { id: 'simple_tryon' as OperatingMode, label: t.modes.simple_tryon, icon: Sparkles },
    { id: 'fitting_room' as OperatingMode, label: t.modes.fitting_room, icon: Shirt },
    { id: 'storefront' as OperatingMode, label: t.modes.storefront, icon: Store },
    { id: 'body_engine' as OperatingMode, label: t.modes.body_engine, icon: UserCheck },
    { id: 'salon' as OperatingMode, label: t.modes.salon, icon: Scissors },
    { id: 'analytics' as OperatingMode, label: t.modes.analytics, icon: BarChart3 },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg text-white tracking-tight">
                  {t.appName}
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 hidden sm:inline-block">
                  {t.coreBadge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block truncate max-w-[200px] lg:max-w-xs">
                {storeName || t.appSub}
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 overflow-x-auto max-w-full">
            {modes.map((mode) => {
              const Icon = mode.icon;
              const isActive = currentMode === mode.id;
              return (
                <button
                  key={mode.id}
                  id={`tab-${mode.id}`}
                  onClick={() => onSelectMode(mode.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">{mode.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons: Language Toggle, Settings & Camera */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Language Switcher */}
            <button
              id="btn-toggle-lang"
              type="button"
              onClick={() => onToggleLanguage(lang === 'en' ? 'fa' : 'en')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors"
              title="تغییر زبان / Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>{lang === 'en' ? 'FA' : 'EN'}</span>
            </button>

            {/* Settings Dialog Trigger */}
            <button
              id="btn-open-settings"
              type="button"
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              title={t.settings.title}
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Hardware Status */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/70 border border-slate-700/60 text-[11px] text-slate-300 font-mono">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>{latencyMs}ms</span>
            </div>

            {/* Camera Toggle */}
            <button
              id="btn-toggle-camera"
              onClick={onToggleCamera}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                isCameraActive
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 shadow-sm'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isCameraActive ? t.fittingRoom.cameraLive : t.fittingRoom.enableCamera}
              </span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
