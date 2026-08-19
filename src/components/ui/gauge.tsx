import React from 'react';

export interface GaugeProps {
  value: number; // 0 - 100
  band?: 'Stable' | 'Optimal' | 'High' | 'Critical';
  size?: number;
  label?: string;
  showDetails?: boolean;
  className?: string;
}

export const Gauge: React.FC<GaugeProps> = ({
  value,
  band = 'Stable',
  size = 180,
  label = 'Pressure Gauge',
  showDetails = true,
  className = '',
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  // Semicircle geometry
  const width = size;
  const height = size * 0.6;
  const strokeWidth = 14;
  const cx = width / 2;
  const cy = height - 10;
  const r = width / 2 - strokeWidth - 6;

  // Semicircle arc length
  const arcLength = Math.PI * r;
  const strokeDashoffset = arcLength - (clamped / 100) * arcLength;

  // Band colors
  const bandColors = {
    Stable: '#10b981', // emerald-500
    Optimal: '#0ea5e9', // sky-500
    High: '#f59e0b', // amber-500
    Critical: '#f43f5e', // rose-500
  };

  const currentColor = bandColors[band] || '#f59e0b';

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <div className="relative" style={{ width, height }}>
        <svg width={width} height={height} className="overflow-visible">
          {/* Background Track Arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Value Progress Arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke={currentColor}
            strokeWidth={strokeWidth}
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />

          {/* Needle / Value Indicator */}
          {(() => {
            const angle = Math.PI - (clamped / 100) * Math.PI;
            const needleLen = r - 12;
            const nx = cx + needleLen * Math.cos(angle);
            const ny = cy - needleLen * Math.sin(angle);
            return (
              <g>
                <line
                  x1={cx}
                  y1={cy}
                  x2={nx}
                  y2={ny}
                  stroke="#1e293b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx={cx} cy={cy} r="4.5" fill="#1e293b" />
              </g>
            );
          })()}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black font-mono text-slate-900 leading-none">
            {clamped}
          </span>
          <span className="text-xs uppercase font-bold tracking-wider text-slate-600 mt-0.5">
            / 100
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="mt-1 flex items-center space-x-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: currentColor }}
          />
          <span className="text-xs font-bold text-slate-800">{band} Pressure</span>
        </div>
      )}
    </div>
  );
};
