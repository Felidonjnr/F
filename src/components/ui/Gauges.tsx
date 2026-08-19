import React from 'react';
import { MasteryDimensions } from '../../types';

interface HealthRingProps {
  score: number; // 0-100
  size?: number;
  strokeWidth?: number;
}

export const HealthRing: React.FC<HealthRingProps> = ({
  score,
  size = 80,
  strokeWidth = 7,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const offset = circumference - (clampedScore / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 75) return '#10b981'; // emerald-500
    if (s >= 60) return '#f59e0b'; // amber-500
    return '#f43f5e'; // rose-500
  };

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(clampedScore)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-base sm:text-lg font-black font-mono text-white leading-none">
          {clampedScore}
        </span>
        <span className="text-[9px] uppercase font-bold text-slate-400 mt-0.5">Health</span>
      </div>
    </div>
  );
};

interface PressureGaugeProps {
  score: number; // 0-100
  band: string;
  size?: number;
}

export const PressureGauge: React.FC<PressureGaugeProps> = ({
  score,
  band,
  size = 80,
}) => {
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const offset = circumference - (clampedScore / 100) * circumference;

  const getBandColor = (b: string) => {
    switch (b) {
      case 'Critical':
        return '#e11d48'; // rose-600
      case 'High Pressure':
        return '#f97316'; // orange-500
      case 'At Risk':
        return '#f59e0b'; // amber-500
      case 'Watch':
        return '#0284c7'; // sky-600
      default:
        return '#10b981'; // emerald-500
    }
  };

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getBandColor(band)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-base sm:text-lg font-black font-mono text-amber-300 leading-none">
          {clampedScore}
        </span>
        <span className="text-[8px] font-bold uppercase tracking-tight text-slate-300 truncate max-w-[55px] mt-0.5">
          {band}
        </span>
      </div>
    </div>
  );
};

interface MasteryRingProps {
  score: number; // 0-100
  size?: number;
  strokeWidth?: number;
}

export const MasteryRing: React.FC<MasteryRingProps> = ({
  score,
  size = 40,
  strokeWidth = 4,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const offset = circumference - (clampedScore / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 75) return '#10b981';
    if (s >= 55) return '#0284c7';
    if (s >= 40) return '#f59e0b';
    return '#f43f5e';
  };

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(clampedScore)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold font-mono text-slate-800">
        {clampedScore}%
      </div>
    </div>
  );
};

interface Radar5SpokeProps {
  dimensions: MasteryDimensions | {
    recall: number;
    conceptual: number;
    procedural: number;
    application: number;
    transfer: number;
  };
  size?: number;
}

export const Radar5Spoke: React.FC<Radar5SpokeProps> = ({
  dimensions,
  size = 260,
}) => {
  const center = size / 2;
  const radius = size * 0.36;

  const categories = [
    { key: 'recall', label: 'Recall', val: dimensions.recall || 0 },
    { key: 'conceptual', label: 'Conceptual', val: dimensions.conceptual || 0 },
    { key: 'procedural', label: 'Procedural', val: dimensions.procedural || 0 },
    { key: 'application', label: 'Application', val: dimensions.application || 0 },
    { key: 'transfer', label: 'Transfer', val: dimensions.transfer || 0 },
  ];

  const total = categories.length;
  // Angle offset so first spoke points straight up
  const angleStep = (2 * Math.PI) / total;
  const startAngle = -Math.PI / 2;

  // Generate polygon points for a given scale (0 to 1)
  const getPolygonPoints = (scale: number) => {
    return categories
      .map((_, i) => {
        const angle = startAngle + i * angleStep;
        const x = center + radius * scale * Math.cos(angle);
        const y = center + radius * scale * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(' ');
  };

  // Generate data polygon points
  const dataPoints = categories
    .map((cat, i) => {
      const scale = Math.max(0.05, Math.min(1, cat.val / 100));
      const angle = startAngle + i * angleStep;
      const x = center + radius * scale * Math.cos(angle);
      const y = center + radius * scale * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background concentric radar grid */}
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((level) => (
          <polygon
            key={level}
            points={getPolygonPoints(level)}
            fill={level === 1.0 ? '#f8fafc' : 'transparent'}
            stroke="#e2e8f0"
            strokeWidth="1"
            strokeDasharray={level < 1.0 ? '2 2' : 'none'}
          />
        ))}

        {/* 5 Spoke Axis Lines */}
        {categories.map((_, i) => {
          const angle = startAngle + i * angleStep;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={dataPoints}
          fill="rgba(245, 158, 11, 0.25)"
          stroke="#f59e0b"
          strokeWidth="2.5"
          className="transition-all duration-500 ease-out"
        />

        {/* Data Points / Vertices */}
        {categories.map((cat, i) => {
          const scale = Math.max(0.05, Math.min(1, cat.val / 100));
          const angle = startAngle + i * angleStep;
          const x = center + radius * scale * Math.cos(angle);
          const y = center + radius * scale * Math.sin(angle);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill="#d97706"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Category Labels */}
        {categories.map((cat, i) => {
          const angle = startAngle + i * angleStep;
          const labelRadius = radius + 22;
          const x = center + labelRadius * Math.cos(angle);
          const y = center + labelRadius * Math.sin(angle);
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-[10px] font-bold fill-slate-700 uppercase tracking-tight"
            >
              {cat.label} ({cat.val}%)
            </text>
          );
        })}
      </svg>
    </div>
  );
};
