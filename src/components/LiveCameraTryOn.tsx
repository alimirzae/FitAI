import React, { useEffect, useRef, useState } from 'react';
import { Product, GarmentColorOption, PoseLandmark, FabricType } from '../types';
import { Camera, RefreshCw, Sparkles, Check, Sliders, Layers, AlertCircle, Download, Maximize2, Shirt } from 'lucide-react';
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
  const previewRef = useRef<HTMLVideoElement>(null);
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
  const [videoStatus, setVideoStatus] = useState<string>('idle');
  const requestCount = useRef(0);

  // Attach the already-acquired MediaStream to a visible video element.
  // This gives a direct camera preview independent of Canvas/AI processing.
  useEffect(() => {
    const source = videoRef.current;
    const preview = previewRef.current;
    if (!isCameraActive || !source || !preview) return;
    const stream = source.srcObject as MediaStream | null;
    if (!stream) { setVideoStatus('no-stream'); return; }
    if (preview.srcObject !== stream) preview.srcObject = stream;
    preview.play()
      .then(() => {
        setVideoStatus(`preview ${preview.videoWidth || '?'}x${preview.videoHeight || '?'}`);
        console.info('[FitAI] DIRECT_PREVIEW_PLAYING', { width: preview.videoWidth, height: preview.videoHeight });
      })
      .catch((e) => { setVideoStatus('preview-play-error'); setAiError(e?.message || String(e)); console.error('[FitAI] DIRECT_PREVIEW_FAILED', e); });
  }, [isCameraActive, videoRef]);

  // Real local inference loop. Rendering remains 60 FPS while inference is throttled
  // for CPU-friendly operation on the target P1000 workstation.
  useEffect(() => {
    if (!isCameraActive) { setRuntimeLandmarks([]); setAiOnline(false); return; }
    let cancelled = false;
    let busy = false;
    const timer = window.setInterval(async () => {
      const video = previewRef.current || videoRef.current;
      if (!video) { setVideoStatus('missing-video'); return; }
      if (video.readyState < 2 || !video.videoWidth) {
        setVideoStatus(`waiting rs=${video.readyState} ${video.videoWidth}x${video.videoHeight}`);
        return;
      }
      if (busy) return;
      setVideoStatus(`ready ${video.videoWidth}x${video.videoHeight}`);
      busy = true;
      requestCount.current += 1;
      if (requestCount.current === 1 || requestCount.current % 20 === 0) console.info('[FitAI] AI_FRAME_POST',{request:requestCount.current,size:`${video.videoWidth}x${video.videoHeight}`});
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
    img.src = '/assets/garments/classic-shirt-v1.svg';
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
      const video = previewRef.current || videoRef.current;

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

          const shoulderSpan = Math.abs((1 - leftShoulder.x) - (1 - rightShoulder.x)) * width * 1.08;
          const torsoLength = Math.max(120, (hipMidY - shoulderMidY) * 1.03);

          // 3. Visible real CV overlay: draw MediaPipe skeleton so detection is observable.
          if (runtimeLandmarks.length) {
            const byName = new Map(runtimeLandmarks.map(p => [p.name, p]));
            const edges = [['left_shoulder','right_shoulder'],['left_shoulder','left_elbow'],['left_elbow','left_wrist'],['right_shoulder','right_elbow'],['right_elbow','right_wrist'],['left_shoulder','left_hip'],['right_shoulder','right_hip'],['left_hip','right_hip'],['left_hip','left_knee'],['right_hip','right_knee']];
            ctx.save(); ctx.strokeStyle='#22d3ee'; ctx.fillStyle='#67e8f9'; ctx.lineWidth=3;
            for (const [a,b] of edges) { const p=byName.get(a), q=byName.get(b); if(!p||!q)continue; ctx.beginPath();ctx.moveTo((1-p.x)*width,p.y*height);ctx.lineTo((1-q.x)*width,q.y*height);ctx.stroke(); }
            for (const p of runtimeLandmarks) { if ((p.visibility ?? 1) < .45) continue; ctx.beginPath();ctx.arc((1-p.x)*width,p.y*height,4,0,Math.PI*2);ctx.fill(); }
            ctx.restore();
          }

          // 4. Classic Shirt v1 — local transparent garment asset + articulated sleeves.
          if (runtimeLandmarks.length) {
            const byName=new Map(runtimeLandmarks.map(p=>[p.name,p]));
            const pt=(name:string)=>{const p=byName.get(name);return p?{x:(1-p.x)*width,y:p.y*height}:null};
            const ls=pt('left_shoulder'),rs=pt('right_shoulder'),lh=pt('left_hip'),rh=pt('right_hip');
            const le=pt('left_elbow'),re=pt('right_elbow'),lw=pt('left_wrist'),rw=pt('right_wrist');
            if(ls&&rs&&lh&&rh){
              const topY=Math.min(ls.y,rs.y)-Math.abs(ls.x-rs.x)*.035;
              const bottomY=Math.max(lh.y,rh.y)+Math.abs(ls.x-rs.x)*.035;
              const leftX=Math.min(ls.x,lh.x)-Math.abs(ls.x-rs.x)*.08;
              const rightX=Math.max(rs.x,rh.x)+Math.abs(ls.x-rs.x)*.08;
              const color=selectedColor?.hex||selectedProduct.colorHex||'#dbeafe';
              // Torso uses an actual transparent local garment asset.
              if(garmentImgRef.current?.complete){
                ctx.save();ctx.globalAlpha=blendOpacity;
                ctx.drawImage(garmentImgRef.current,leftX,topY,rightX-leftX,bottomY-topY);
                ctx.globalCompositeOperation='multiply';ctx.globalAlpha=.22;ctx.fillStyle=color;ctx.fillRect(leftX,topY,rightX-leftX,bottomY-topY);ctx.restore();
              }
              // Sleeves are articulated independently along shoulder/elbow/wrist.
              const sleeve=(p0:any,p1:any,p2:any)=>{
                if(!p0||!p1)return;const pts=[p0,p1,...(p2?[p2]:[])];ctx.save();ctx.globalAlpha=.9;ctx.fillStyle=color;ctx.strokeStyle='rgba(148,163,184,.85)';ctx.lineWidth=2;
                const widths=[Math.max(18,shoulderSpan*.14),Math.max(14,shoulderSpan*.105),Math.max(10,shoulderSpan*.075)];
                const left:any[]=[],right:any[]=[];for(let i=0;i<pts.length;i++){const prev=pts[Math.max(0,i-1)],next=pts[Math.min(pts.length-1,i+1)],dx=next.x-prev.x,dy=next.y-prev.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;left.push({x:pts[i].x+nx*widths[i],y:pts[i].y+ny*widths[i]});right.push({x:pts[i].x-nx*widths[i],y:pts[i].y-ny*widths[i]});}
                ctx.beginPath();ctx.moveTo(left[0].x,left[0].y);for(const p of left.slice(1))ctx.lineTo(p.x,p.y);for(const p of right.reverse())ctx.lineTo(p.x,p.y);ctx.closePath();ctx.fill();ctx.stroke();
                ctx.globalAlpha=.25;ctx.strokeStyle='#fff';ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.lineTo(p1.x,p1.y);if(p2)ctx.lineTo(p2.x,p2.y);ctx.stroke();ctx.restore();
              };
              sleeve(ls,le,lw);sleeve(rs,re,rw);
            }
          }

          // 5. Experimental texture overlay. This only works well with transparent garment assets.
          if (false && garmentImgRef.current && garmentImgRef.current.complete) {
            ctx.save();
            ctx.globalAlpha = Math.min(blendOpacity, 0.18);

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

  const saveSnapshot=()=>{const c=canvasRef.current;if(!c)return;const a=document.createElement('a');a.download=`fitai-classic-shirt-${Date.now()}.png`;a.href=c.toDataURL('image/png');a.click();};
  const toggleFullscreen=()=>{const el=canvasRef.current?.parentElement;if(!el)return;if(!document.fullscreenElement)el.requestFullscreen?.();else document.exitFullscreen?.();};

  return (
    <div className="relative aspect-video w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
      {/* Live Canvas Stage */}
      {isCameraActive ? (
        <>
          <video
            ref={previewRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={(e) => {
              const v=e.currentTarget;
              if (canvasRef.current && v.videoWidth && v.videoHeight) { canvasRef.current.width=v.videoWidth; canvasRef.current.height=v.videoHeight; }
              setVideoStatus(`preview ${v.videoWidth}x${v.videoHeight}`);
              console.info('[FitAI] DIRECT_PREVIEW_METADATA',{width:v.videoWidth,height:v.videoHeight,readyState:v.readyState});
            }}
            className="absolute inset-0 w-full h-full object-contain rounded-3xl -scale-x-100 bg-black"
          />
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="absolute inset-0 w-full h-full object-contain rounded-3xl"
          />
        </>
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
            <span className="text-slate-400">{videoStatus}</span>
            <span className="text-slate-500">POST#{requestCount.current}</span>
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

      {isCameraActive && (
        <div className="absolute bottom-16 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/85 px-3 py-2 backdrop-blur">
            <Shirt className="w-4 h-4 text-indigo-300"/><span className="text-[11px] font-bold text-white">{lang==='fa'?'Classic Shirt v1 • لباس محلی فعال':'Classic Shirt v1 • Local garment active'}</span>
            <input aria-label="garment opacity" type="range" min="0.55" max="1" step="0.05" value={blendOpacity} onChange={e=>setBlendOpacity(Number(e.target.value))} className="w-24"/>
          </div>
          <div className="pointer-events-auto flex gap-2">
            <button onClick={saveSnapshot} className="rounded-xl border border-slate-700 bg-slate-950/85 p-2 text-slate-200" title={lang==='fa'?'ذخیره تصویر':'Save snapshot'}><Download className="w-4 h-4"/></button>
            <button onClick={toggleFullscreen} className="rounded-xl border border-slate-700 bg-slate-950/85 p-2 text-slate-200" title={lang==='fa'?'تمام صفحه':'Fullscreen'}><Maximize2 className="w-4 h-4"/></button>
          </div>
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
