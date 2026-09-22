import { PoseLandmark } from '../types';

export interface LocalPersonAnalysis {
  detected:boolean; confidence:number; latency_ms:number;
  landmarks:PoseLandmark[];
  faces:Array<{x:number;y:number;width:number;height:number;confidence:number}>;
  segmentation?:{foreground_ratio:number;mean_confidence:number}|null;
  body?:Record<string,number|null>;
  capabilities:Record<string,boolean>;
  notes:string[];
}
const BASE=import.meta.env.VITE_FITAI_API_URL||'http://127.0.0.1:8000';
export async function analyzeImage(file:Blob):Promise<LocalPersonAnalysis>{
 const body=new FormData(); body.append('file',file,'frame.jpg');
 const r=await fetch(`${BASE}/api/v1/person/analyze`,{method:'POST',body});
 if(!r.ok) throw new Error(await r.text()); return r.json();
}
export async function analyzeVideoFrame(video:HTMLVideoElement):Promise<LocalPersonAnalysis>{
 const c=document.createElement('canvas'); c.width=video.videoWidth||640; c.height=video.videoHeight||480;
 const ctx=c.getContext('2d'); if(!ctx) throw new Error('Canvas unavailable'); ctx.drawImage(video,0,0,c.width,c.height);
 const blob=await new Promise<Blob|null>(resolve=>c.toBlob(resolve,'image/jpeg',0.8));
 if(!blob) throw new Error('Frame encoding failed'); return analyzeImage(blob);
}
export async function runtimeHealth(){const r=await fetch(`${BASE}/api/v1/health`);if(!r.ok)throw new Error(await r.text());return r.json();}
