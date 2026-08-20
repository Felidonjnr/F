import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  HelpCircle,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { DailyQueue, QueueItem, QueueItemType } from '../../types';
import { formatDateLabel, formatMinutes, todayISO } from '../../lib/utils';

interface FullQueueViewProps {
  queue: DailyQueue | null;
  onNavigate?: (path: string) => void;
  onStartItem?: (item: QueueItem) => void;
  onOpenPrompt?: (item: QueueItem) => void;
  onQuizMe?: (item: QueueItem) => void;
  onToggleComplete?: (item: QueueItem) => void;
}

export const FullQueueView: React.FC<FullQueueViewProps> = ({
  queue: initialQueue,
  onNavigate = (path: string) => {
    window.location.href = path;
  },
  onStartItem,
  onOpenPrompt,
  onQuizMe,
  onToggleComplete,
}) => {
  const [queue, setQueue] = React.useState<DailyQueue | null>(initialQueue);

  React.useEffect(() => {
    setQueue(initialQueue);
  }, [initialQueue]);

  const items = queue?.items || [];
  const totalCount = items.length;
  const completedCount = items.filter((i) => i.completed).length;
  const totalMinutes =
    queue?.total_estimated_minutes ||
    items.reduce((acc, it) => acc + (it.estimated_minutes || 0), 0);

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
      T0_UNTESTED: { label: 'Tier 0', color: 'text-slate-400 bg-slate-800/60 border-slate-700' },
      T1_FOUNDATIONAL: { label: 'Tier 1: Foundational', color: 'text-sky-300 bg-sky-950/60 border-sky-800/50' },
      T2_APPLICATION: { label: 'Tier 2: Application', color: 'text-indigo-300 bg-indigo-950/60 border-indigo-800/50' },
      T3_SYNTHESIS: { label: 'Tier 3: Synthesis', color: 'text-purple-300 bg-purple-950/60 border-purple-800/50' },
      T4_INTUITIVE: { label: 'Tier 4: Intuitive', color: 'text-amber-300 bg-amber-950/60 border-amber-800/50' },
    };
    const t = tierMap[tier] || { label: tier, color: 'text-slate-300 bg-slate-800 border-slate-700' };
    return (
      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${t.color}`}>
        {t.label}
      </span>
    );
  };

  const handleToggle = (item: QueueItem) => {
    if (onToggleComplete) {
      onToggleComplete(item);
    }
    setQueue((prev) => {
      if (!prev) return prev;
      const updatedItems = prev.items.map((it) =>
        it.id === item.id ? { ...it, completed: !it.completed } : it
      );
      return {
        ...prev,
        items: updatedItems,
        completed_items: updatedItems.filter((i) => i.completed).length,
      };
    });
  };

  const handleStart = (item: QueueItem) => {
    if (onStartItem) {
      onStartItem(item);
    } else {
      const today = queue?.date || todayISO();
      onNavigate(`/session/${today}?unit=${item.unit_id || item.id}`);
    }
  };

  const handleOpenPrompt = (item: QueueItem) => {
    if (onOpenPrompt) {
      onOpenPrompt(item);
    } else {
      onNavigate(`/prompt/${item.unit_id || item.id}`);
    }
  };

  const handleQuiz = (item: QueueItem) => {
    if (onQuizMe) {
      onQuizMe(item);
    } else {
      const today = queue?.date || todayISO();
      onNavigate(`/session/${today}?unit=${item.unit_id || item.id}&mode=quiz`);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#080c14]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 text-slate-100">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {/* Back button and title */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate('/')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-mono transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white font-mono uppercase">
                FULL QUEUE DETAIL
              </h1>
              <p className="text-[11px] text-slate-400 font-mono">
                {formatDateLabel(queue?.date)}: {totalCount} items ({formatMinutes(totalMinutes)})
              </p>
            </div>
          </div>

          {/* Vitals */}
          <div className="flex items-center space-x-2">
            <div
              className="flex items-center space-x-1.5 px-2 py-1 rounded-md text-xs font-mono border bg-emerald-950/80 text-emerald-300 border-emerald-800/60"
              title="Pressure Score"
            >
              <ShieldAlert className="w-3.5 h-3.5 opacity-80" />
              <span className="font-semibold">{queue?.pressure_score ?? 34}</span>
            </div>
            <div className="flex items-center space-x-1 px-2 py-1 rounded-md bg-amber-950/40 border border-amber-800/40 text-amber-300 text-xs font-mono">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>{queue?.streak_count ?? 14}d</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 space-y-4">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-[#0f1422]/60 p-8 text-center space-y-3">
            <p className="text-sm text-slate-400 font-mono">
              No items in today's full queue.
            </p>
            <button
              onClick={() => onNavigate('/')}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono"
            >
              Return to Today
            </button>
          </div>
        ) : (
          items.map((item, idx) => (
            <div
              key={item.id || `full-item-${idx}`}
              className={`rounded-xl border ${
                item.completed
                  ? 'bg-slate-950/40 border-slate-800/50 opacity-60'
                  : item.is_debt
                  ? 'bg-[#121624] border-slate-800 border-l-4 border-l-rose-500'
                  : 'bg-[#0f1422] border-slate-800'
              } p-4 space-y-3`}
            >
              {/* Row Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                    {item.course_code}
                  </span>
                  <span
                    className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${getTypeBadgeStyle(
                      item.type
                    )}`}
                  >
                    {item.type}
                  </span>
                  {getTierBadge(item.mastery_tier)}
                  {item.is_debt && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-2.5 h-2.5" />
                      DEBT
                    </span>
                  )}
                  {item.is_weak_spot && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 flex items-center gap-1 font-semibold">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      WEAK SPOT
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleToggle(item)}
                  className={`w-6 h-6 rounded flex items-center justify-center transition-colors border ${
                    item.completed
                      ? 'bg-emerald-600 border-emerald-500 text-slate-950'
                      : 'border-slate-700 hover:border-slate-500 bg-slate-900/80 text-transparent'
                  }`}
                  title={item.completed ? 'Mark pending' : 'Mark completed'}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>

              {/* Title & Duration */}
              <div>
                <h3
                  className={`text-sm font-semibold leading-snug ${
                    item.completed ? 'line-through text-slate-500' : 'text-slate-100'
                  }`}
                >
                  {item.title}
                </h3>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    Est: {formatMinutes(item.estimated_minutes)}
                  </span>
                  <span>Priority #{item.priority_order || idx + 1}</span>
                </div>
              </div>

              {/* Per-Item Actions: Start, Open Prompt, Quiz Me */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2 flex-wrap">
                <button
                  onClick={() => handleQuiz(item)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/50 text-xs font-mono font-semibold transition-colors"
                  title="Practice with Level 3.5 Diagnostic Questions"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Quiz Me</span>
                </button>

                <button
                  onClick={() => handleOpenPrompt(item)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 text-xs font-mono font-semibold transition-colors"
                  title="Open AI Prompt"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open Prompt</span>
                </button>

                <button
                  onClick={() => handleStart(item)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono transition-colors shadow-sm"
                  title="Start Study Session"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start</span>
                </button>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};
