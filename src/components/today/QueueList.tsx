import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Flame,
  Layers,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { QueueItem, QueueItemType } from '../../types';
import { formatMinutes } from '../../lib/utils';

interface QueueItemProps {
  item: QueueItem;
  index: number;
  onToggleComplete?: (item: QueueItem) => void;
  onStart?: (item: QueueItem) => void;
  onOpenPrompt?: (item: QueueItem) => void;
}

export const QueueItemCard: React.FC<QueueItemProps> = ({
  item,
  index,
  onToggleComplete,
  onStart,
  onOpenPrompt,
}) => {
  const getTypeBadgeStyle = (type: QueueItemType) => {
    switch (type) {
      case 'NEW':
        return 'bg-sky-950/80 text-sky-300 border-sky-800/60';
      case 'REVIEW':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60';
      case 'PRACTICE':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/60';
      case 'ASSESSMENT':
        return 'bg-rose-950/80 text-rose-300 border-rose-800/60';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  const getTierBadge = (tier?: string) => {
    if (!tier) return null;
    const tierMap: Record<string, { label: string; color: string }> = {
      T0_UNTESTED: { label: 'T0', color: 'text-slate-400 bg-slate-800/60 border-slate-700' },
      T1_FOUNDATIONAL: { label: 'T1', color: 'text-sky-300 bg-sky-950/60 border-sky-800/50' },
      T2_APPLICATION: { label: 'T2', color: 'text-indigo-300 bg-indigo-950/60 border-indigo-800/50' },
      T3_SYNTHESIS: { label: 'T3', color: 'text-purple-300 bg-purple-950/60 border-purple-800/50' },
      T4_INTUITIVE: { label: 'T4', color: 'text-amber-300 bg-amber-950/60 border-amber-800/50' },
    };
    const t = tierMap[tier] || { label: tier, color: 'text-slate-300 bg-slate-800 border-slate-700' };
    return (
      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold ${t.color}`}>
        {t.label}
      </span>
    );
  };

  return (
    <div
      className={`group relative rounded-xl transition-all duration-200 border ${
        item.completed
          ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
          : item.is_debt
          ? 'bg-[#121624] border-slate-800/90 border-l-4 border-l-rose-500 hover:border-slate-700'
          : 'bg-[#0f1422] border-slate-800/90 hover:border-slate-700/90'
      } p-3.5 shadow-sm`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left Side: Number, Checkbox, Item info */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Item sequence number chip */}
          <div className="flex flex-col items-center gap-1.5 pt-0.5">
            <span className="w-5 h-5 rounded flex items-center justify-center text-[11px] font-mono font-bold bg-slate-800/80 text-slate-400 border border-slate-700/60">
              {index + 1}
            </span>
            <button
              onClick={() => onToggleComplete && onToggleComplete(item)}
              className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${
                item.completed
                  ? 'bg-emerald-600 border-emerald-500 text-slate-950'
                  : 'border-slate-700 hover:border-slate-500 bg-slate-900/80 text-transparent'
              }`}
              title={item.completed ? 'Mark pending' : 'Mark completed'}
              aria-label="Toggle complete"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
              {/* Course code */}
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                {item.course_code}
              </span>

              {/* Type Badge */}
              <span
                className={`text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${getTypeBadgeStyle(
                  item.type
                )}`}
              >
                {item.type}
              </span>

              {/* Tier */}
              {getTierBadge(item.mastery_tier)}

              {/* Debt Flag */}
              {item.is_debt && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-2.5 h-2.5" />
                  DEBT
                </span>
              )}

              {/* Weak Spot Flag */}
              {item.is_weak_spot && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 flex items-center gap-1 font-semibold">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  WEAK SPOT
                </span>
              )}
            </div>

            {/* Title */}
            <h4
              className={`text-sm font-medium leading-snug break-words ${
                item.completed ? 'line-through text-slate-500' : 'text-slate-100 font-semibold'
              }`}
            >
              {item.title}
            </h4>

            {/* Duration */}
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                {formatMinutes(item.estimated_minutes)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side Actions: Start & Prompt */}
        <div className="flex items-center gap-1.5 self-center">
          {onOpenPrompt && (
            <button
              onClick={() => onOpenPrompt(item)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 transition-colors border border-slate-800"
              title="Open AI Prompt"
              aria-label="Open AI Prompt"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}

          {onStart && (
            <button
              onClick={() => onStart(item)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono transition-colors shadow-sm"
              title="Start Study Session"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Start</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface QueueListProps {
  items: QueueItem[];
  onToggleComplete?: (item: QueueItem) => void;
  onStart?: (item: QueueItem) => void;
  onOpenPrompt?: (item: QueueItem) => void;
}

export const QueueList: React.FC<QueueListProps> = ({
  items,
  onToggleComplete,
  onStart,
  onOpenPrompt,
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center bg-slate-950/40">
        <p className="text-sm text-slate-400 font-mono">No items in the queue.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((item, idx) => (
        <QueueItemCard
          key={item.id || `item-${idx}`}
          item={item}
          index={idx}
          onToggleComplete={onToggleComplete}
          onStart={onStart}
          onOpenPrompt={onOpenPrompt}
        />
      ))}
    </div>
  );
};
