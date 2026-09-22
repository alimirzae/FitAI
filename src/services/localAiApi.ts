export interface LocalPersonAnalysis {
  detected: boolean;
  image: { width: number; height: number };
  persons: Array<{ x: number; y: number; width: number; height: number; confidence?: number | null }>;
  faces: Array<{ x: number; y: number; width: number; height: number; confidence?: number | null }>;
  person_count: number;
  face_count: number;
  dominant_color_rgb: [number, number, number];
  capabilities: Record<string, boolean>;
  notes: string[];
}

const API_BASE = import.meta.env.VITE_FITAI_API_URL || 'http://127.0.0.1:8000';

export async function analyzeImage(file: Blob): Promise<LocalPersonAnalysis> {
  const body = new FormData();
  body.append('file', file, 'frame.jpg');
  const response = await fetch(`${API_BASE}/api/v1/person/analyze`, { method: 'POST', body });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function fetchRuntimeHealth() {
  const response = await fetch(`${API_BASE}/api/v1/health`);
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export function cameraStreamUrl(camera = 0) {
  return `${API_BASE}/api/v1/camera/stream?camera=${camera}`;
}
