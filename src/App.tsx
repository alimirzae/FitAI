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
import { runtimeHealth } from './services/localAiRuntime';

const DEFAULT_SETTINGS: AppSettings = {
  defaultMode: 'fitting_room', storeType: 'clothing_boutique', language: 'fa',
  storeName: 'بوتیک پوشاک و استایل هوشمند فیت‌ای‌آی', enableFabricPhysics: true, autoRotateSeconds: 5,
};

export function App() {
  const [settings,setSettings]=useState<AppSettings>(()=>{try{const s=localStorage.getItem('fitai_app_settings');if(s)return {...DEFAULT_SETTINGS,...JSON.parse(s)}}catch{}return DEFAULT_SETTINGS});
  const [currentMode,setCurrentMode]=useState<OperatingMode>(settings.defaultMode);
  const [isCameraActive,setIsCameraActive]=useState(false);
  const [backendOnline,setBackendOnline]=useState(false);
  const [latencyMs,setLatencyMs]=useState<number|null>(null);
  const [cameraError,setCameraError]=useState<string|null>(null);
  const [isSettingsOpen,setIsSettingsOpen]=useState(false);
  const videoRef=useRef<HTMLVideoElement>(null);
  const [eventsLog,setEventsLog]=useState<Array<{event:string;timestamp:string;details?:any}>>([]);

  const logEvent=(event:string,details?:any)=>{console.info('[FitAI]',event,details||'');setEventsLog(p=>[{event,timestamp:new Date().toLocaleTimeString(),details},...p.slice(0,99)])};

  useEffect(()=>{document.documentElement.dir=settings.language==='fa'?'rtl':'ltr';document.documentElement.lang=settings.language},[settings.language]);

  useEffect(()=>{
    let cancelled=false;
    const check=async()=>{const started=performance.now();try{const h=await runtimeHealth();if(!cancelled){setBackendOnline(true);setLatencyMs(Math.round(performance.now()-started));console.info('[FitAI] BACKEND_HEALTH_OK',h)}}catch(e){if(!cancelled){setBackendOnline(false);setLatencyMs(null);console.error('[FitAI] BACKEND_HEALTH_FAILED',e)}}};
    check(); const id=window.setInterval(check,5000); return()=>{cancelled=true;window.clearInterval(id)};
  },[]);

  const handleSaveSettings=(s:AppSettings)=>{setSettings(s);localStorage.setItem('fitai_app_settings',JSON.stringify(s));logEvent('SETTINGS_UPDATED')};
  const handleToggleLanguage=(lang:Language)=>handleSaveSettings({...settings,language:lang});

  const handleToggleCamera=async()=>{
    if(isCameraActive){
      const stream=videoRef.current?.srcObject as MediaStream|null;
      stream?.getTracks().forEach(t=>t.stop()); if(videoRef.current)videoRef.current.srcObject=null;
      setIsCameraActive(false); setCameraError(null); logEvent('CAMERA_STOPPED'); return;
    }
    try{
      setCameraError(null);
      const stream=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:1280},height:{ideal:720},facingMode:'user'},audio:false});
      const video=videoRef.current;
      if(!video) throw new Error('Global video element is not mounted.');
      video.srcObject=stream;
      await video.play();
      await new Promise<void>((resolve,reject)=>{
        if(video.videoWidth>0&&video.videoHeight>0){resolve();return}
        const timeout=window.setTimeout(()=>reject(new Error('Camera opened but no video frames arrived within 5 seconds.')),5000);
        video.onloadedmetadata=()=>{window.clearTimeout(timeout);video.play().then(()=>resolve()).catch(reject)};
      });
      setIsCameraActive(true);
      logEvent('CAMERA_STARTED',{width:video.videoWidth,height:video.videoHeight,tracks:stream.getVideoTracks().map(t=>t.label)});
    }catch(err:any){
      const message=err?.message||String(err); setCameraError(message); setIsCameraActive(false);
      console.error('[FitAI] CAMERA_FAILED',err); logEvent('CAMERA_FAILED',{message});
    }
  };

  return <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
    <Header currentMode={currentMode} onSelectMode={(m)=>{setCurrentMode(m);logEvent('MODE_CHANGED',{to:m})}} isCameraActive={isCameraActive}
      onToggleCamera={handleToggleCamera} latencyMs={latencyMs??0} lang={settings.language} onToggleLanguage={handleToggleLanguage}
      onOpenSettings={()=>setIsSettingsOpen(true)} storeName={settings.storeName}/>
    <div className="fixed bottom-3 left-3 z-50 rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-[10px] font-mono shadow-xl" dir="ltr">
      <span className={backendOnline?'text-emerald-400':'text-rose-400'}>API {backendOnline?'ONLINE':'OFFLINE'}</span>
      <span className="text-slate-600"> | </span><span className={isCameraActive?'text-emerald-400':'text-slate-400'}>CAM {isCameraActive?'LIVE':'OFF'}</span>
      <span className="text-slate-600"> | </span><span className="text-cyan-400">{latencyMs===null?'--':latencyMs+'ms'}</span>
      {cameraError&&<div className="mt-1 max-w-xs text-rose-300">CAM ERROR: {cameraError}</div>}
    </div>
    <main className="flex-1 pb-12">
      {currentMode==='fitting_room'&&<FittingRoom isCameraActive={isCameraActive} videoRef={videoRef} onLogEvent={logEvent} onToggleCamera={handleToggleCamera} lang={settings.language}/>}
      {currentMode==='storefront'&&<StorefrontMode onLogEvent={logEvent} lang={settings.language}/>}
      {currentMode==='body_engine'&&<BodyEngine onLogEvent={logEvent} lang={settings.language}/>}
      {currentMode==='salon'&&<SalonMode onLogEvent={logEvent} lang={settings.language}/>}
      {currentMode==='analytics'&&<AnalyticsPanel eventsLog={eventsLog} lang={settings.language}/>}
    </main>
    <video ref={videoRef} autoPlay playsInline muted className="fixed -left-[9999px] top-0 w-[640px] h-[480px]" />
    <SettingsModal isOpen={isSettingsOpen} onClose={()=>setIsSettingsOpen(false)} settings={settings} onSave={handleSaveSettings} lang={settings.language}/>
  </div>;
}
export default App;
