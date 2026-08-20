import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  Layers,
  MapPin,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { DailyQueue, QueueItem } from '../../types';
import { Header } from '../layout/Header';
import { QueueList } from './QueueList';
import { formatMinutes, todayISO } from '../../lib/utils';

interface TodayViewProps {
  queue: DailyQueue | null;
  onNavigate?: (path: string) => void;
  onStartAll?: () => void;
  onStartItem?: (item: QueueItem) => void;
  onOpenPrompt?: (item: QueueItem) => void;
  onToggleComplete?: (item: QueueItem) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  queue: initialQueue,
  onNavigate = (path: string) => {
    window.location.href = path;
  },
  onStartAll,
  onStartItem,
  onOpenPrompt,
  onToggleComplete,
}) => {
  const [queueState, setQueueState] = useState<DailyQueue | null>(initialQueue);

  // If initialQueue changes, update local state
  React.useEffect(() => {
    setQueueState(initialQueue);
  }, [initialQueue]);

  const items = queueState?.items || [];
  const totalCount = items.length;
  const completedCount = items.filter((i) => i.completed).length;
  const totalMinutes = queueState?.total_estimated_minutes || items.reduce((acc, it) => acc + (it.estimated_minutes || 0), 0);
  const availableMinutes = queueState?.available_minutes_today || 180;
  const compressionRatio = queueState?.compression_ratio ?? (totalMinutes > 0 ? (availableMinutes / totalMinutes).toFixed(2) : 1.0);

  const handleToggle = (item: QueueItem) => {
    if (onToggleComplete) {
      onToggleComplete(item);
    }
    setQueueState((prev) => {
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
      const today = queueState?.date || todayISO();
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

  const handleStartAll = () => {
    if (onStartAll) {
      onStartAll();
    } else if (items.length > 0) {
      const first = items.find((i) => !i.completed) || items[0];
      handleStart(first);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col">
      {/* App Header */}
      <Header
        pressureScore={queueState?.pressure_score ?? 34}
        pressureBand={queueState?.pressure_band ?? 'Stable'}
        streakCount={queueState?.streak_count ?? 14}
        dateStr={queueState?.date || todayISO()}
        onOpenSettings={() => onNavigate('/settings')}
        onNavigateHome={() => onNavigate('/')}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* If Queue is empty or null */}
        {!queueState || items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-[#0f1422]/60 p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 font-mono">
                No queue for today
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Your study queue has not been generated for today yet.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('/onboarding')}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono transition-colors shadow-sm"
              >
                Generate Today's Queue
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Section Header: Title & Start All */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
                  TODAY'S QUEUE ({totalCount} items, {formatMinutes(totalMinutes)})
                </h2>
                {completedCount > 0 && (
                  <p className="text-[11px] text-emerald-400 font-mono mt-0.5">
                    {completedCount} of {totalCount} completed
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* See Full Queue button (if > 1 item) */}
                {totalCount > 1 && (
                  <button
                    onClick={() => onNavigate('/queue/today')}
                    className="flex items-center gap-1 text-xs font-mono text-amber-400 hover:text-amber-300 px-2.5 py-1.5 rounded-lg border border-amber-500/30 hover:border-amber-500/60 bg-amber-950/30 transition-colors"
                  >
                    <span>See Full Queue</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Start All Button */}
                <button
                  onClick={handleStartAll}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono transition-colors shadow-md shadow-amber-500/10"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start All</span>
                </button>
              </div>
            </div>

            {/* Queue List */}
            <QueueList
              items={items}
              onToggleComplete={handleToggle}
              onStart={handleStart}
              onOpenPrompt={handleOpenPrompt}
            />

            {/* Availability and Compression Ratio */}
            <div className="rounded-xl bg-[#0c101c] border border-slate-800/80 px-4 py-3 flex items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Available today: {formatMinutes(availableMinutes)}</span>
              </div>
              <div>
                <span className="text-slate-500">Compression: </span>
                <span className="text-slate-200 font-bold">{compressionRatio}x</span>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="pt-2">
              <div className="text-[11px] font-mono font-bold tracking-wider text-slate-500 uppercase mb-2.5">
                QUICK ACCESS
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {/* Calendar */}
                <button
                  onClick={() => onNavigate('/calendar')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#0f1422] border border-slate-800/90 hover:border-slate-700 text-slate-300 hover:text-white transition-colors group"
                >
                  <Calendar className="w-4 h-4 text-amber-400 mb-1.5 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-mono font-semibold">Calendar</span>
                </button>

                {/* Mastery Map */}
                <button
                  onClick={() => onNavigate('/mastery')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#0f1422] border border-slate-800/90 hover:border-slate-700 text-slate-300 hover:text-white transition-colors group"
                >
                  <MapPin className="w-4 h-4 text-sky-400 mb-1.5 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-mono font-semibold">Mastery Map</span>
                </button>

                {/* Debt View */}
                <button
                  onClick={() => onNavigate('/debt')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#0f1422] border border-slate-800/90 hover:border-slate-700 text-slate-300 hover:text-white transition-colors group"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-400 mb-1.5 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-mono font-semibold">Debt View</span>
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
