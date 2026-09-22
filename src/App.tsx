import React, { useState, useRef, useEffect } from 'react';
import { OperatingMode } from './types';
import { Header } from './components/Header';
import { FittingRoom } from './components/FittingRoom';
import { StorefrontMode } from './components/StorefrontMode';
import { BodyEngine } from './components/BodyEngine';
import { SalonMode } from './components/SalonMode';
import { AnalyticsPanel } from './components/AnalyticsPanel';

export function App() {
  const [currentMode, setCurrentMode] = useState<OperatingMode>('fitting_room');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number>(142);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Session Events Log (README Sec 18)
  const [eventsLog, setEventsLog] = useState<Array<{ event: string; timestamp: string; details?: any }>>([
    { event: 'SYSTEM_BOOT', timestamp: new Date().toLocaleTimeString(), details: { version: '0.9.4', env: 'WebAssembly / ONNX' } },
    { event: 'SESSION_STARTED', timestamp: new Date().toLocaleTimeString(), details: { mode: 'fitting_room', device: 'DEV-SM-001' } },
  ]);

  const logEvent = (event: string, details?: any) => {
    setEventsLog((prev) => [
      { event, timestamp: new Date().toLocaleTimeString(), details },
      ...prev.slice(0, 49), // retain last 50 events
    ]);
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
        alert('Could not access camera in this preview environment. You can use our high-fidelity virtual mirror studio models!');
      }
    }
  };

  // Switch mode and log transition
  const handleSelectMode = (mode: OperatingMode) => {
    setCurrentMode(mode);
    logEvent('MODE_CHANGED', { to: mode });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Header
        currentMode={currentMode}
        onSelectMode={handleSelectMode}
        isCameraActive={isCameraActive}
        onToggleCamera={handleToggleCamera}
        latencyMs={latencyMs}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-12">
        {currentMode === 'fitting_room' && (
          <FittingRoom
            isCameraActive={isCameraActive}
            videoRef={videoRef}
            onLogEvent={logEvent}
          />
        )}

        {currentMode === 'storefront' && (
          <StorefrontMode onLogEvent={logEvent} />
        )}

        {currentMode === 'body_engine' && (
          <BodyEngine onLogEvent={logEvent} />
        )}

        {currentMode === 'salon' && (
          <SalonMode onLogEvent={logEvent} />
        )}

        {currentMode === 'analytics' && (
          <AnalyticsPanel eventsLog={eventsLog} />
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

      {/* Persistent Platform Footer */}
      <footer className="border-t border-slate-850 bg-slate-950/80 py-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>FitAI OpenFit Platform • Commercial Open-Source Virtual Appearance & Try-On</div>
          <div className="flex items-center gap-4">
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
