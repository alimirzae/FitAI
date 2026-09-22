import React, { useEffect, useRef, useState } from 'react';
import { Product, GarmentColorOption, PoseLandmark, FabricType } from '../types';
import { Camera, RefreshCw, Sparkles, Check, Sliders, Layers, AlertCircle } from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { analyzeVideoFrame } from '../services/localAiRuntime';

interface LiveCameraTryOnProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isCameraActive: boolean;
  onToggleCamera: () => void;
  selectedProduct: Product;
  selectedColor?: GarmentColorOption;
  landmarks: PoseLandmark[];
  lang: Language;
}

export const LiveCameraTryOn: React.FC<LiveCameraTryOnProps> = ({
  videoRef,
  isCameraActive,
  onToggleCamera,
  selectedProduct,
  selectedColor,
  landmarks,
  lang
}) => {
  const t = TRANSLATIONS[lang];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const garmentImgRef = useRef<HTMLImageElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const [fps, setFps] = useState<number>(30);
  const [cpuLatencyMs, setCpuLatencyMs] = useState<number>(16);
  const [blendOpacity, setBlendOpacity] = useState<number>(0.92);
  const [showWireframe, setShowWireframe] = useState<boolean>(true);
  const [runtimeLandmarks, setRuntimeLandmarks] = useState<PoseLandmark[]>([]);
  const [aiOnline, setAiOnline] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLatency, setAiLatency] = useState<number | null>(null);

  // Real local inference loop. Rendering remains 60 FPS while inference is throttled
  // for CPU-friendly operation on the target P1000 workstation.
  useEffect(() => {
    if (!isCameraActive) { setRuntimeLandmarks([]); setAiOnline(false); return; }
    let cancelled = false;
    let busy = false;
    const timer = window.setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || busy) return;
      busy = true;
      try {
        const result = await analyzeVideoFrame(video);
        if (!cancelled) {
          setRuntimeLandmarks(result.landmarks || []);
          setAiOnline(true);
          setAiError(null);
          setAiLatency(result.latency_ms);
        }
      } catch (error: any) {
        console.error('[FitAI] LIVE_INFERENCE_FAILED', error);
        if (!cancelled) { setAiOnline(false); setAiError(error?.message || String(error)); }
      } finally { busy = false; }
    }, 125);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [isCameraActive, videoRef]);

  // Preload garment image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = selectedProduct.imageUrl;
    img.onload = () => {
      garmentImgRef.current = img;
    };
  }, [selectedProduct]);

  // Main real-time CPU rendering loop
  useEffect(() => {
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = performance.now();

    const renderLoop = (now: number) => {
      const startTime = performance.now();
      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (canvas && video && isCameraActive && video.readyState >= 2) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;

          // 1. Draw mirrored live video frame from webcam
          ctx.save();
          ctx.translate(width, 0);
          ctx.scale(-1, 1); // mirror horizontal for natural reflection
          ctx.drawImage(video, 0, 0, width, height);
          ctx.restore();

          // 2. Torso & Shoulder Tracking from Landmarks
          // Default normalized anchor coordinates if landmarks update
          const activeLandmarks = runtimeLandmarks.length ? runtimeLandmarks : landmarks;
          const leftShoulder = activeLandmarks.find((l) => l.name === 'left_shoulder') || { x: 0.38, y: 0.32 };
          const rightShoulder = activeLandmarks.find((l) => l.name === 'right_shoulder') || { x: 0.62, y: 0.32 };
          const leftHip = activeLandmarks.find((l) => l.name === 'left_hip') || { x: 0.42, y: 0.60 };
          const rightHip = activeLandmarks.find((l) => l.name === 'right_hip') || { x: 0.58, y: 0.60 };

          // In mirrored video: left shoulder appears on the right side of frame
          const shoulderMidX = ((1 - leftShoulder.x) + (1 - rightShoulder.x)) / 2 * width;
          const shoulderMidY = ((leftShoulder.y + rightShoulder.y) / 2) * height;
          const hipMidY = ((leftHip.y + rightHip.y) / 2) * height;

          const shoulderSpan = Math.abs((1 - leftShoulder.x) - (1 - rightShoulder.x)) * width * 1.55;
          const torsoLength = Math.max(120, (hipMidY - shoulderMidY) * 1.6);

          // 3. Render Garment Overlay dynamically anchored to moving body
          if (garmentImgRef.current && garmentImgRef.current.complete) {
            ctx.save();
            ctx.globalAlpha = blendOpacity;

            // Target bounding box for garment
            const gWidth = Math.max(180, shoulderSpan);
            const gHeight = Math.max(200, torsoLength);
            const gX = shoulderMidX - gWidth / 2;
            const gY = shoulderMidY - gHeight * 0.12;

            // Clip torso region with soft rounded shape
            ctx.beginPath();
            ctx.roundRect(gX, gY, gWidth, gHeight, [24, 24, 16, 16]);
            ctx.clip();

            // Draw garment texture
            ctx.drawImage(garmentImgRef.current, gX, gY, gWidth, gHeight);

            // 4. Real-time Color Tinting (if custom color selected)
            if (selectedColor && selectedColor.hex) {
              ctx.globalCompositeOperation = 'color';
              ctx.fillStyle = selectedColor.hex;
              ctx.fillRect(gX, gY, gWidth, gHeight);
            }

            // 5. Real-time Fabric Material Physics Shader Layer (CPU Canvas blend)
            const fabric = selectedProduct.fabricType;
            if (fabric === 'silk') {
              // Satin sheen wave: smooth linear diagonal gradient
              ctx.globalCompositeOperation = 'soft-light';
              const grad = ctx.createLinearGradient(gX, gY, gX + gWidth, gY + gHeight);
              grad.addColorStop(0, 'rgba(255,255,255,0.4)');
              grad.addColorStop(0.5, 'rgba(200,200,200,0.1)');
              grad.addColorStop(1, 'rgba(255,255,255,0.45)');
              ctx.fillStyle = grad;
              ctx.fillRect(gX, gY, gWidth, gHeight);
            } else if (fabric === 'leather') {
              // Specular highlights & deep rich contrast
              ctx.globalCompositeOperation = 'overlay';
              const grad = ctx.createRadialGradient(
                shoulderMidX, shoulderMidY, 20,
                shoulderMidX, shoulderMidY, gWidth / 2
              );
              grad.addColorStop(0, 'rgba(255,255,255,0.3)');
              grad.addColorStop(0.8, 'rgba(0,0,0,0.4)');
              ctx.fillStyle = grad;
              ctx.fillRect(gX, gY, gWidth, gHeight);
            } else if (fabric === 'velvet') {
              // Velvet deep pile retro-reflection
              ctx.globalCompositeOperation = 'color-burn';
              ctx.fillStyle = 'rgba(20, 10, 40, 0.25)';
              ctx.fillRect(gX, gY, gWidth, gHeight);
            } else if (fabric === 'wool') {
              // Wool matte weave
              ctx.globalCompositeOperation = 'multiply';
              ctx.fillStyle = 'rgba(240, 235, 225, 0.15)';
              ctx.fillRect(gX, gY, gWidth, gHeight);
            }

            ctx.restore();

            // 6. Optional Tracking Anchor Visualizer
            if (showWireframe) {
              ctx.save();
              ctx.strokeStyle = 'rgba(99, 102, 241, 0.7)';
              ctx.lineWidth = 2;
              ctx.setLineDash([4, 4]);
              ctx.strokeRect(gX, gY, gWidth, gHeight);

              // Draw shoulder anchor dots
              ctx.fillStyle = '#22d3ee';
              ctx.beginPath();
              ctx.arc(shoulderMidX - shoulderSpan * 0.35, shoulderMidY, 4, 0, Math.PI * 2);
              ctx.arc(shoulderMidX + shoulderSpan * 0.35, shoulderMidY, 4, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }
        }
      }

      // Performance measurement
      frameCount++;
      const frameElapsed = performance.now() - startTime;
      setCpuLatencyMs(Math.round(frameElapsed));

      if (performance.now() - fpsTimer >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        fpsTimer = performance.now();
      }

      animationFrameId.current = requestAnimationFrame(renderLoop);
    };

    animationFrameId.current = requestAnimationFrame(renderLoop);
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isCameraActive, selectedProduct, selectedColor, blendOpacity, showWireframe, landmarks, runtimeLandmarks]);

  return (
    <div className="relative aspect-[3/4] w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
      {/* Live Canvas Stage */}
      {isCameraActive ? (
        <canvas
          ref={canvasRef}
          width={720}
          height={960}
          className="w-full h-full object-cover rounded-3xl"
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Camera className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">
              {lang === 'fa' ? 'حالت پرو زنده لایو با دوربین' : 'Live Camera Mirror Mode'}
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              {lang === 'fa'
                ? 'برای پرو زنده لباس روی حرکت بدن خود، دکمه فعال‌سازی دوربین را بزنید.'
                : 'Activate your webcam to try on garments in real time on your live video stream.'}
            </p>
          </div>
          <button
            onClick={onToggleCamera}
            className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>{lang === 'fa' ? 'روشن کردن وبکم و پرو زنده' : 'Enable Camera for Live Try-On'}</span>
          </button>
        </div>
      )}

      {/* Real-time Telemetry Overlay Bar */}
      {isCameraActive && (
        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
          <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{lang === 'fa' ? 'پرو زنده لایو' : 'Live Stream Try-On'}</span>
            <span className="text-cyan-400 font-bold">{fps} FPS</span>
            <span className={aiOnline ? 'text-emerald-400' : 'text-rose-400'}>{aiOnline ? 'AI REAL' : 'AI OFFLINE'}</span>
            <span className="text-slate-500">|</span>
            <span className="text-amber-400">{cpuLatencyMs}ms render</span>
            <span className="text-cyan-400">{aiLatency === null ? '--' : aiLatency + 'ms AI'}</span>
          {aiError && <span className="max-w-[220px] truncate text-rose-300" title={aiError}>{aiError}</span>}
          </div>

          <button
            onClick={() => setShowWireframe(!showWireframe)}
            className="pointer-events-auto bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] text-slate-400 hover:text-white"
          >
            {showWireframe ? (lang === 'fa' ? 'مخفی کردن راهنمای شانه' : 'Hide Mesh') : (lang === 'fa' ? 'نمایش خطوط شانه' : 'Show Mesh')}
          </button>
        </div>
      )}

      {/* Selected Color & Fabric Pill */}
      {isCameraActive && (
        <div className="absolute bottom-3 inset-x-3 bg-slate-950/85 backdrop-blur-md p-2.5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full border border-slate-700"
              style={{ backgroundColor: selectedColor?.hex || selectedProduct.colorHex }}
            />
            <span className="text-xs font-semibold text-white truncate">
              {selectedProduct.name}
            </span>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
            {lang === 'fa' ? 'ریزش زنده فعال' : 'Active Live Drape'}
          </span>
        </div>
      )}
    </div>
  );
};
