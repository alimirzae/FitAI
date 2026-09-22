import React from 'react';
import { PoseLandmark } from '../types';

interface PoseOverlayProps {
  landmarks: PoseLandmark[];
  showSkeleton: boolean;
  showBoundingBox: boolean;
  showFaceMesh: boolean;
  detectedAgeRange?: string;
  detectedPresentation?: string;
}

export const PoseOverlay: React.FC<PoseOverlayProps> = ({
  landmarks,
  showSkeleton,
  showBoundingBox,
  showFaceMesh,
  detectedAgeRange = '25–34',
  detectedPresentation = 'unisex'
}) => {
  if (!landmarks || landmarks.length === 0) return null;

  // Key skeleton connection pairs based on MediaPipe BlazePose indices
  const connections: [string, string][] = [
    // Torso & Shoulders
    ['left_shoulder', 'right_shoulder'],
    ['left_shoulder', 'left_hip'],
    ['right_shoulder', 'right_hip'],
    ['left_hip', 'right_hip'],
    // Arms
    ['left_shoulder', 'left_elbow'],
    ['left_elbow', 'left_wrist'],
    ['right_shoulder', 'right_elbow'],
    ['right_elbow', 'right_wrist'],
    // Legs
    ['left_hip', 'left_knee'],
    ['left_knee', 'left_ankle'],
    ['right_hip', 'right_knee'],
    ['right_knee', 'right_ankle'],
  ];

  const landmarkMap = new Map(landmarks.map((lm) => [lm.name, lm]));

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
      <defs>
        <linearGradient id="poseLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* Person Bounding Box */}
      {showBoundingBox && (
        <g>
          <rect
            x="20%"
            y="12%"
            width="60%"
            height="84%"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="opacity-70"
          />
          {/* Bounding Box Corner Reticles */}
          <path d="M 20% 16% L 20% 12% L 25% 12%" fill="none" stroke="#22d3ee" strokeWidth="2.5" />
          <path d="M 75% 12% L 80% 12% L 80% 16%" fill="none" stroke="#22d3ee" strokeWidth="2.5" />
          <path d="M 20% 92% L 20% 96% L 25% 96%" fill="none" stroke="#22d3ee" strokeWidth="2.5" />
          <path d="M 75% 96% L 80% 96% L 80% 92%" fill="none" stroke="#22d3ee" strokeWidth="2.5" />

          {/* Probabilistic AI tag */}
          <foreignObject x="21%" y="13%" width="220" height="40">
            <div className="bg-slate-900/90 text-[10px] text-cyan-300 font-mono px-2 py-0.5 rounded border border-cyan-500/50 backdrop-blur-sm shadow-md inline-block">
              HUMAN DETECTED • {detectedPresentation.toUpperCase()} • AGE {detectedAgeRange}
            </div>
          </foreignObject>
        </g>
      )}

      {/* Skeletal Connections */}
      {showSkeleton &&
        connections.map(([fromName, toName], idx) => {
          const from = landmarkMap.get(fromName);
          const to = landmarkMap.get(toName);
          if (!from || !to) return null;

          return (
            <line
              key={`conn-${idx}`}
              x1={`${from.x * 100}%`}
              y1={`${from.y * 100}%`}
              x2={`${to.x * 100}%`}
              y2={`${to.y * 100}%`}
              stroke="url(#poseLineGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          );
        })}

      {/* Keypoints */}
      {showSkeleton &&
        landmarks.map((lm, idx) => {
          if (lm.name.includes('eye') || lm.name.includes('mouth') || lm.name.includes('ear')) {
            if (!showFaceMesh) return null;
          }

          return (
            <g key={`lm-${idx}`}>
              <circle
                cx={`${lm.x * 100}%`}
                cy={`${lm.y * 100}%`}
                r="4.5"
                fill="#38bdf8"
                stroke="#090d16"
                strokeWidth="1.5"
                className="animate-pulse"
              />
              <circle
                cx={`${lm.x * 100}%`}
                cy={`${lm.y * 100}%`}
                r="1.5"
                fill="#ffffff"
              />
            </g>
          );
        })}

      {/* Face Landmarks Oval Mesh */}
      {showFaceMesh && (
        <ellipse
          cx="50%"
          cy="20%"
          rx="6%"
          ry="7%"
          fill="none"
          stroke="#a855f7"
          strokeWidth="1.2"
          strokeDasharray="2 3"
          className="opacity-80"
        />
      )}
    </svg>
  );
};
