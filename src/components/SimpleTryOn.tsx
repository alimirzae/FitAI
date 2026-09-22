/**
 * The simplest possible try-on screen.
 *
 * Three steps, one column, no dashboards:
 *   1. stand in front of the camera and take a photo
 *   2. pick a garment
 *   3. look at the photorealistic result
 *
 * Everything shown here is real: the result image comes from the generative
 * renderer, and when the renderer is unavailable this screen says so instead
 * of drawing a substitute.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Loader2, RefreshCw, Download, AlertTriangle } from 'lucide-react';
import {
  captureFrame,
  fetchEngines,
  generateTryOn,
  type EngineStatus,
  type GarmentCategory,
  type TryOnOutcome,
} from '../services/tryOnApi';

export interface SimpleGarment {
  id: string;
  name: string;
  imageUrl: string;
  category: GarmentCategory;
}

type Stage = 'camera' | 'photo' | 'rendering' | 'result';

interface Props {
  garments: SimpleGarment[];
  videoRef: React.RefObject<HTMLVideoElement>;
  isCameraActive: boolean;
  onToggleCamera: () => void;
}

export function SimpleTryOn({ garments, videoRef, isCameraActive, onToggleCamera }: Props) {
  const [stage, setStage] = useState<Stage>('camera');
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [garment, setGarment] = useState<SimpleGarment | null>(null);
  const [outcome, setOutcome] = useState<TryOnOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [engines, setEngines] = useState<Record<string, EngineStatus> | null>(null);

  const previewRef = useRef<HTMLVideoElement>(null);
  const rendererReady = engines ? Object.values(engines).some((e) => e.available) : null;

  // Mirror the shared camera stream into this screen's preview element.
  useEffect(() => {
    const source = videoRef.current;
    const preview = previewRef.current;
    if (!source || !preview) return;
    preview.srcObject = source.srcObject;
    preview.play().catch(() => undefined);
  }, [videoRef, isCameraActive, stage]);

  useEffect(() => {
    fetchEngines().then(setEngines).catch(() => setEngines({}));
  }, []);

  useEffect(() => () => {
    if (photo) URL.revokeObjectURL(photo.url);
    if (outcome) URL.revokeObjectURL(outcome.imageUrl);
  }, [photo, outcome]);

  const takePhoto = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setError('دوربین هنوز آماده نیست. چند لحظه صبر کنید.');
      return;
    }
    try {
      const blob = await captureFrame(video);
      setPhoto({ blob, url: URL.createObjectURL(blob) });
      setError(null);
      setStage('photo');
    } catch (err: any) {
      setError(err?.message ?? 'گرفتن عکس ناموفق بود.');
    }
  }, [videoRef]);

  const runTryOn = useCallback(async (selected: SimpleGarment) => {
    if (!photo) return;
    setGarment(selected);
    setStage('rendering');
    setError(null);
    try {
      const garmentBlob = await (await fetch(selected.imageUrl)).blob();
      const result = await generateTryOn(photo.blob, garmentBlob, selected.category);
      setOutcome(result);
      setStage('result');
    } catch (err: any) {
      setError(describe(err));
      setStage('photo');
    }
  }, [photo]);

  const restart = () => {
    setStage('camera');
    setPhoto(null);
    setGarment(null);
    setOutcome(null);
    setError(null);
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <Steps stage={stage} />

      {rendererReady === false && (
        <Notice tone="warning">
          موتور رندر فتورئالیستیک روی این دستگاه نصب نیست، بنابراین پرو مجازی کار نمی‌کند.
          برای فعال شدن آن <code className="font-mono">backend/requirements-vto.txt</code> را نصب کنید.
        </Notice>
      )}

      {error && <Notice tone="error">{error}</Notice>}

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="relative aspect-[3/4] w-full bg-black sm:aspect-[4/3]">
          {stage === 'camera' && (
            <video ref={previewRef} autoPlay playsInline muted
              className="h-full w-full scale-x-[-1] object-contain" />
          )}
          {(stage === 'photo' || stage === 'rendering') && photo && (
            <img src={photo.url} alt="عکس گرفته‌شده"
              className="h-full w-full scale-x-[-1] object-contain" />
          )}
          {stage === 'result' && outcome && (
            <img src={outcome.imageUrl} alt="نتیجه‌ی پرو"
              className="h-full w-full scale-x-[-1] object-contain" />
          )}

          {stage === 'rendering' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
              <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
              <p className="text-sm text-slate-200">در حال پوشاندن «{garment?.name}» روی شما…</p>
              <p className="text-xs text-slate-500">این کار چند ده ثانیه طول می‌کشد.</p>
            </div>
          )}

          {stage === 'camera' && !isCameraActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80">
              <button onClick={onToggleCamera}
                className="rounded-xl bg-amber-500 px-6 py-3 font-medium text-slate-950">
                روشن کردن دوربین
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-800 p-4">
          {stage === 'camera' && (
            <button onClick={takePhoto} disabled={!isCameraActive}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-medium text-slate-950 disabled:opacity-40">
              <Camera className="h-5 w-5" /> گرفتن عکس
            </button>
          )}
          {stage !== 'camera' && (
            <button onClick={restart}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-slate-200">
              <RefreshCw className="h-4 w-4" /> از اول
            </button>
          )}
          {stage === 'result' && outcome && garment && (
            <>
              {/* The generator is not deterministic, and roughly one run in
                  four gets the garment's cut wrong even when its colour and
                  material are right. Regenerating is the practical fix, so it
                  needs to be one obvious tap rather than a hidden behaviour of
                  re-picking the same garment. */}
              <button onClick={() => runTryOn(garment)}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 font-medium text-slate-950">
                <RefreshCw className="h-4 w-4" /> نسخه‌ی دیگر
              </button>
              <a href={outcome.imageUrl} download="fitai-tryon.png"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-slate-200">
                <Download className="h-4 w-4" /> ذخیره
              </a>
              <span className="text-xs text-slate-500" dir="ltr">
                {outcome.engine} · {Math.round(outcome.latencyMs)}ms
              </span>
            </>
          )}
        </div>
      </div>

      {(stage === 'photo' || stage === 'result') && (
        <div>
          <h2 className="mb-3 text-sm text-slate-400">یک لباس انتخاب کنید</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {garments.map((item) => (
              <button key={item.id} onClick={() => runTryOn(item)}
                className={`overflow-hidden rounded-xl border p-2 text-right transition ${
                  garment?.id === item.id
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-slate-800 bg-slate-900 hover:border-slate-600'
                }`}>
                <img src={item.imageUrl} alt={item.name}
                  className="mb-2 aspect-[3/4] w-full rounded-lg object-cover" />
                <span className="line-clamp-1 text-xs text-slate-300">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Steps({ stage }: { stage: Stage }) {
  const steps = ['بایستید و عکس بگیرید', 'لباس را انتخاب کنید', 'نتیجه را ببینید'];
  const active = stage === 'camera' ? 0 : stage === 'result' ? 2 : 1;
  return (
    <ol className="flex gap-2 text-xs">
      {steps.map((label, index) => (
        <li key={label}
          className={`flex-1 rounded-lg border px-3 py-2 ${
            index === active
              ? 'border-amber-500 bg-amber-500/10 text-amber-300'
              : 'border-slate-800 text-slate-500'
          }`}>
          <span className="font-mono">{index + 1}</span> {label}
        </li>
      ))}
    </ol>
  );
}

function Notice({ tone, children }: { tone: 'warning' | 'error'; children: React.ReactNode }) {
  const palette = tone === 'error'
    ? 'border-rose-800 bg-rose-950/50 text-rose-200'
    : 'border-amber-800 bg-amber-950/40 text-amber-200';
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${palette}`}>
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
      <div>{children}</div>
    </div>
  );
}

function describe(err: any): string {
  const status = err?.status;
  if (status === 422) return 'کسی در عکس دیده نمی‌شود. کامل روبه‌روی دوربین بایستید و دوباره عکس بگیرید.';
  if (status === 503) return `موتور رندر در دسترس نیست: ${err.message}`;
  return err?.message ?? 'پرو مجازی ناموفق بود.';
}

export default SimpleTryOn;
