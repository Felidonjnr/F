import React from 'react';

export interface ProgressRingProps {
  value: number; // 0 - 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  showLabel?: boolean;
  label?: string;
  subLabel?: string;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size = 96,
  strokeWidth = 8,
  color,
  bgColor = '#f1f5f9',
  showLabel = true,
  label,
  subLabel,
  className = '',
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  // Auto pick color if not provided
  const ringColor =
    color ||
    (clamped >= 75
      ? '#10b981' // Emerald
      : clamped >= 50
      ? '#0ea5e9' // Sky
      : clamped >= 30
      ? '#f59e0b' // Amber
      : '#f43f5e'); // Rose

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
          <span className="text-xl font-black font-mono tracking-tight text-slate-900 leading-none">
            {label ?? clamped}
          </span>
          {subLabel && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
              {subLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
