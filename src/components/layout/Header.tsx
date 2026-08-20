import React from 'react';
import { Flame, Settings, ShieldAlert, Sparkles } from 'lucide-react';
import { PressureBand } from '../../types';
import { formatDateLabel } from '../../lib/utils';

interface HeaderProps {
  pressureScore?: number;
  pressureBand?: PressureBand | string;
  streakCount?: number;
  dateStr?: string;
  studentName?: string;
  onOpenSettings?: () => void;
  onNavigateHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  pressureScore = 34,
  pressureBand = 'Stable',
  streakCount = 14,
  dateStr,
  studentName = 'Godshand',
  onOpenSettings,
  onNavigateHome,
}) => {
  const getPressureBadgeStyle = (band: string) => {
    switch (band) {
      case 'Stable':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60';
      case 'Watch':
        return 'bg-sky-950/80 text-sky-300 border-sky-800/60';
      case 'At Risk':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/60';
      case 'High Pressure':
        return 'bg-orange-950/80 text-orange-300 border-orange-800/60';
      case 'Critical':
        return 'bg-rose-950/90 text-rose-300 border-rose-800/80';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#080c14]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 text-slate-100">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {/* Brand & Date */}
        <div
          onClick={onNavigateHome}
          className="flex items-center space-x-2.5 cursor-pointer group select-none"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-sm tracking-wider group-hover:bg-amber-500/30 transition-colors">
            F1
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-sm tracking-tight text-white group-hover:text-amber-300 transition-colors font-mono">
                FIRSTCLASS
              </span>
              <span className="text-[10px] text-amber-400/80 font-mono px-1 py-0.5 bg-amber-950/50 border border-amber-500/30 rounded">
                OS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {formatDateLabel(dateStr)}
            </p>
          </div>
        </div>

        {/* Vital Indicators: Pressure, Streak, Settings */}
        <div className="flex items-center space-x-2">
          {/* Pressure Badge */}
          <div
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-mono border ${getPressureBadgeStyle(
              String(pressureBand)
            )}`}
            title={`Academic Pressure: ${pressureScore}/100 (${pressureBand})`}
          >
            <ShieldAlert className="w-3.5 h-3.5 opacity-80" />
            <span className="font-semibold">{pressureScore}</span>
            <span className="text-[10px] uppercase tracking-wider opacity-90 hidden sm:inline">
              {pressureBand}
            </span>
          </div>

          {/* Streak Indicator */}
          <div
            className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-amber-950/40 border border-amber-800/40 text-amber-300 text-xs font-mono"
            title={`${streakCount} Day Study Streak`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
            <span className="font-bold">{streakCount}d</span>
          </div>

          {/* Settings Button */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-700"
              title="Settings"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
