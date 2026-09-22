/**
 * Photorealistic try-on API client.
 *
 * The backend either returns a generated image or an error. There is no
 * client-side artwork fallback: if the renderer is unavailable the UI must say
 * so rather than draw something and call it a try-on.
 */

const API_BASE = import.meta.env.VITE_FITAI_API_URL || 'http://127.0.0.1:8000';

export type GarmentCategory = 'upper' | 'lower' | 'overall';

export interface EngineStatus {
  name: string;
  available: boolean;
  base_model?: string;
  device?: string;
  gpu?: string;
  vram_gb?: number;
  env?: string;
}

export interface TryOnOutcome {
  imageUrl: string;
  engine: string;
  latencyMs: number;
}

export class TryOnError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'TryOnError';
  }
}

async function readError(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text);
    return parsed.detail ?? text;
  } catch {
    return text || `HTTP ${response.status}`;
  }
}

/** Which rendering engines this machine can actually run. */
export async function fetchEngines(): Promise<Record<string, EngineStatus>> {
  const response = await fetch(`${API_BASE}/api/v1/render/providers`);
  if (!response.ok) throw new TryOnError(await readError(response), response.status);
  const data = await response.json();
  return data.vto ?? {};
}

/** Generate a photorealistic try-on. Throws on any failure. */
export async function generateTryOn(
  person: Blob,
  garment: Blob,
  category: GarmentCategory,
  options: { steps?: number; seed?: number; engine?: string } = {},
): Promise<TryOnOutcome> {
  const body = new FormData();
  body.append('person', person, 'person.jpg');
  body.append('garment', garment, 'garment.png');
  body.append('category', category);
  body.append('engine', options.engine ?? 'auto');
  body.append('steps', String(options.steps ?? 30));
  if (options.seed !== undefined) body.append('seed', String(options.seed));

  const response = await fetch(`${API_BASE}/api/v1/render/vto`, { method: 'POST', body });
  if (!response.ok) throw new TryOnError(await readError(response), response.status);

  const blob = await response.blob();
  return {
    imageUrl: URL.createObjectURL(blob),
    engine: response.headers.get('X-FitAI-Renderer') ?? 'unknown',
    latencyMs: Number(response.headers.get('X-FitAI-Latency-Ms') ?? 0),
  };
}

/** Grab a still frame from the live camera element. */
export function captureFrame(video: HTMLVideoElement): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('frame capture failed'))),
      'image/jpeg',
      0.95,
    );
  });
}
