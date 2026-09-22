import React, { useState, useRef, useEffect } from 'react';
import { OperatingMode, AppSettings } from './types';
import { Language } from './i18n/translations';
import { Header } from './components/Header';
import { FittingRoom } from './components/FittingRoom';
import { StorefrontMode } from './components/StorefrontMode';
import { BodyEngine } from './components/BodyEngine';
import { SalonMode } from './components/SalonMode';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { SettingsModal } from './components/SettingsModal';

const DEFAULT_SETTINGS: AppSettings = {
  defaultMode: 'fitting_room',
  storeType: 'clothing_boutique',
  language: 'fa', // Default to Persian as requested by user
  storeName: 'بوتیک پوشاک و استایل هوشمند فیت‌ای‌آی',
  enableFabricPhysics: true,
  autoRotateSeconds: 5,
};

export function App() {
  // Load settings from localStorage
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('fitai_app_settings');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Could not read settings from localStorage:', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Current active mode (boots directly to configured defaultMode)
  const [currentMode, setCurrentMode] = useState<OperatingMode>(settings.defaultMode);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number>(142);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync RTL / LTR direction on documentElement
  useEffect(() => {
    const isRtl = settings.language === 'fa';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = settings.language;
  }, [settings.language]);

  // Session Events Log (README Sec 18)
  const [eventsLog, setEventsLog] = useState<Array<{ event: string; timestamp: string; details?: any }>>([
    { event: 'SYSTEM_BOOT', timestamp: new Date().toLocaleTimeString(), details: { version: '0.9.4', env: 'WebAssembly / ONNX', startupMode: settings.defaultMode } },
    { event: 'STORE_INITIALIZED', timestamp: new Date().toLocaleTimeString(), details: { storeType: settings.storeType, name: settings.storeName } },
  ]);

  const logEvent = (event: string, details?: any) => {
    setEventsLog((prev) => [
      { event, timestamp: new Date().toLocaleTimeString(), details },
      ...prev.slice(0, 49),
    ]);
  };

  // Save Settings handler
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('fitai_app_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.warn('Could not write settings to localStorage:', e);
    }
    logEvent('SETTINGS_UPDATED', { defaultMode: newSettings.defaultMode, lang: newSettings.language });
  };

  // Switch Language
  const handleToggleLanguage = (newLang: Language) => {
    const updated = { ...settings, language: newLang };
    handleSaveSettings(updated);
  };

  // Toggle Live Webcam
  const handleToggleCamera = async () => {
    if (isCameraActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
      logEvent('CAMERA_STOPPED');
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraActive(true);
        logEvent('CAMERA_STARTED', { resolution: '720p' });
      } catch (err) {
        console.warn('Camera access could not be acquired or was denied in preview frame:', err);
        alert(
          settings.language === 'fa' 
            ? 'دسترسی به دوربین در این پنجره پیش‌نمایش مسدود است. می‌توانید از مدل‌های آماده استودیو استفاده کنید.'
            : 'Could not access camera in this preview environment. You can use our high-fidelity virtual mirror studio models!'
        );
      }
    }
  };

  // Switch mode and log transition
  const handleSelectMode = (mode: OperatingMode) => {
    setCurrentMode(mode);
    logEvent('MODE_CHANGED', { to: mode });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white font-sans">
      {/* Top Navigation Bar */}
      <Header
        currentMode={currentMode}
        onSelectMode={handleSelectMode}
        isCameraActive={isCameraActive}
        onToggleCamera={handleToggleCamera}
        latencyMs={latencyMs}
        lang={settings.language}
        onToggleLanguage={handleToggleLanguage}
        onOpenSettings={() => setIsSettingsOpen(true)}
        storeName={settings.storeName}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-12">
        {currentMode === 'fitting_room' && (
          <FittingRoom
            isCameraActive={isCameraActive}
            videoRef={videoRef}
            onLogEvent={logEvent}
            onToggleCamera={handleToggleCamera}
            lang={settings.language}
          />
        )}

        {currentMode === 'storefront' && (
          <StorefrontMode 
            onLogEvent={logEvent}
            lang={settings.language}
          />
        )}

        {currentMode === 'body_engine' && (
          <BodyEngine 
            onLogEvent={logEvent}
            lang={settings.language}
          />
        )}

        {currentMode === 'salon' && (
          <SalonMode 
            onLogEvent={logEvent}
            lang={settings.language}
          />
        )}

        {currentMode === 'analytics' && (
          <AnalyticsPanel 
            eventsLog={eventsLog}
            lang={settings.language}
          />
        )}
      </main>

      {/* Hidden Global Video Element for Camera Stream capture */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="hidden"
      />

      {/* Platform Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        lang={settings.language}
      />

      {/* Persistent Platform Footer */}
      <footer className="border-t border-slate-850 bg-slate-950/80 py-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>FitAI OpenFit Platform • {settings.storeName}</div>
          <div className="flex items-center gap-3">
            <span>Modular Architecture (Sec. 6)</span>
            <span>•</span>
            <span>Privacy-By-Design (Sec. 24)</span>
            <span>•</span>
            <span>ONNX / TensorRT</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
