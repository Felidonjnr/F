import React from 'react';
import { MasteryDimensions } from '../../types';

export interface RadarProps {
  dimensions?: MasteryDimensions;
  size?: number;
  className?: string;
  showLabels?: boolean;
  benchmarkScore?: number;
}

export const Radar: React.FC<RadarProps> = ({
  dimensions = {
    recall: 50,
    conceptual: 50,
    procedural: 50,
    application: 50,
    transfer: 50,
    overall: 50,
  },
  size = 220,
  className = '',
  showLabels = true,
  benchmarkScore = 70,
}) => {
  const spokes = [
    { key: 'recall', label: 'Recall', val: dimensions.recall || 0 },
    { key: 'conceptual', label: 'Conceptual', val: dimensions.conceptual || 0 },
    { key: 'procedural', label: 'Procedural', val: dimensions.procedural || 0 },
    { key: 'application', label: 'Application', val: dimensions.application || 0 },
    { key: 'transfer', label: 'Transfer', val: dimensions.transfer || 0 },
  ];

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;
  const total = spokes.length;

  const getCoordinates = (index: number, value: number, radius: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  // Polygon points for mastery values
  const studentPoints = spokes
    .map((s, i) => {
      const { x, y } = getCoordinates(i, Math.min(100, Math.max(0, s.val)), maxR);
      return `${x},${y}`;
    })
    .join(' ');

  // Polygon points for First-Class target benchmark
  const benchmarkPoints = spokes
    .map((_, i) => {
      const { x, y } = getCoordinates(i, benchmarkScore, maxR);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg width={size} height={size} className="overflow-visible">
        {/* Background Concentric Rings (25%, 50%, 75%, 100%) */}
        {[0.25, 0.5, 0.75, 1].map((pct) => (
          <polygon
            key={pct}
            points={spokes
              .map((_, i) => {
                const { x, y } = getCoordinates(i, 100, maxR * pct);
                return `${x},${y}`;
              })
              .join(' ')}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1"
            strokeDasharray={pct < 1 ? '2 2' : 'none'}
          />
        ))}

        {/* 5 Axis Spoke Lines */}
        {spokes.map((_, i) => {
          const { x, y } = getCoordinates(i, 100, maxR);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          );
        })}

        {/* Benchmark Reference Polygon */}
        <polygon
          points={benchmarkPoints}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        {/* Student Mastery Filled Polygon */}
        <polygon
          points={studentPoints}
          fill="rgba(245, 158, 11, 0.2)"
          stroke="#f59e0b"
          strokeWidth="2"
        />

        {/* Data Vertices */}
        {spokes.map((s, i) => {
          const { x, y } = getCoordinates(i, Math.min(100, Math.max(0, s.val)), maxR);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3.5"
              fill="#f59e0b"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Spoke Labels */}
        {showLabels &&
          spokes.map((s, i) => {
            const labelCoord = getCoordinates(i, 100, maxR + 18);
            return (
              <text
                key={i}
                x={labelCoord.x}
                y={labelCoord.y + 3}
                textAnchor="middle"
                className="text-[9px] font-bold fill-slate-600 uppercase tracking-tighter"
              >
                {s.label} ({s.val}%)
              </text>
            );
          })}
      </svg>
    </div>
  );
};
