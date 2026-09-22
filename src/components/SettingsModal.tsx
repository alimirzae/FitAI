import React, { useState } from 'react';
import { AppSettings, OperatingMode, StoreType } from '../types';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { 
  X, 
  Settings, 
  Store, 
  Sparkles, 
  Scissors, 
  Check, 
  Globe, 
  Sliders, 
  Info,
  Layers
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  lang: Language;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  lang
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [savedAlert, setSavedAlert] = useState<boolean>(false);

  if (!isOpen) return null;

  const t = TRANSLATIONS[lang];

  const handleSave = () => {
    onSaveSettings(localSettings);
    setSavedAlert(true);
    setTimeout(() => {
      setSavedAlert(false);
      onClose();
    }, 1200);
  };

  const handleStoreTypeChange = (storeType: StoreType) => {
    // Automatically match the sensible default screen based on store type
    let defaultMode: OperatingMode = 'fitting_room';
    if (storeType === 'beauty_salon') {
      defaultMode = 'salon';
    } else if (storeType === 'storefront_kiosk') {
      defaultMode = 'storefront';
    } else if (storeType === 'clothing_boutique') {
      defaultMode = 'fitting_room';
    }
    setLocalSettings({
      ...localSettings,
      storeType,
      defaultMode
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        id="settings-modal-card"
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {t.settings.title}
              </h3>
              <p className="text-xs text-slate-400">
                {t.settings.defaultMode} & {t.settings.storeType}
              </p>
            </div>
          </div>

          <button
            id="btn-close-settings"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          
          {/* 1. Store Type Profile */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              {t.settings.storeType}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { 
                  id: 'clothing_boutique' as StoreType, 
                  label: t.settings.storeTypes.clothing_boutique, 
                  icon: Store,
                  desc: 'Default: Smart Fitting Room'
                },
                { 
                  id: 'beauty_salon' as StoreType, 
                  label: t.settings.storeTypes.beauty_salon, 
                  icon: Scissors,
                  desc: 'Default: Beauty & Salon Hair Styling'
                },
                { 
                  id: 'storefront_kiosk' as StoreType, 
                  label: t.settings.storeTypes.storefront_kiosk, 
                  icon: Sparkles,
                  desc: 'Default: Storefront Passerby Display'
                },
                { 
                  id: 'multi_department' as StoreType, 
                  label: t.settings.storeTypes.multi_department, 
                  icon: Layers,
                  desc: 'Multi-Mode Selector'
                },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = localSettings.storeType === item.id;
                return (
                  <div
                    key={item.id}
                    id={`setting-store-${item.id}`}
                    onClick={() => handleStoreTypeChange(item.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-200">{item.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Startup Mode Screen */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              {t.settings.defaultMode}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'fitting_room' as OperatingMode, label: t.modes.fitting_room },
                { id: 'salon' as OperatingMode, label: t.modes.salon },
                { id: 'storefront' as OperatingMode, label: t.modes.storefront },
                { id: 'body_engine' as OperatingMode, label: t.modes.body_engine },
                { id: 'analytics' as OperatingMode, label: t.modes.analytics },
              ].map((mode) => (
                <button
                  key={mode.id}
                  id={`startup-mode-${mode.id}`}
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, defaultMode: mode.id })}
                  className={`p-2.5 rounded-xl border text-xs font-medium transition-all text-center ${
                    localSettings.defaultMode === mode.id
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. System Language (EN LTR vs FA RTL) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              {t.settings.language}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                id="btn-set-lang-fa"
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, language: 'fa' })}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  localSettings.language === 'fa'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>فارسی (RTL)</span>
              </button>

              <button
                id="btn-set-lang-en"
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, language: 'en' })}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  localSettings.language === 'en'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>English (LTR)</span>
              </button>
            </div>
          </div>

          {/* 4. Fabric Material Simulation Physics Toggle */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white">
                  {t.settings.fabricPhysics}
                </span>
              </div>
              <button
                id="toggle-fabric-physics"
                type="button"
                onClick={() => setLocalSettings({
                  ...localSettings,
                  enableFabricPhysics: !localSettings.enableFabricPhysics
                })}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  localSettings.enableFabricPhysics ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                    localSettings.enableFabricPhysics ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t.settings.fabricInfo}
            </p>
          </div>

          {/* 5. Business Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              {t.settings.storeName}
            </label>
            <input
              id="input-store-name"
              type="text"
              value={localSettings.storeName}
              onChange={(e) => setLocalSettings({ ...localSettings, storeName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              placeholder="e.g. Tehran Luxury Fashion Boutique"
            />
          </div>

          {/* Success Banner */}
          {savedAlert && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in font-medium">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{t.settings.savedMsg}</span>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            id="btn-cancel-settings"
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            id="btn-save-settings"
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{t.settings.save}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
