import React, { useEffect, useState } from 'react';
import { DailyQueue } from '../../../types';
import { getTodayQueue } from '../../../lib/supabase/queries';
import { FullQueueView } from '../../../components/queue/FullQueueView';
import { Loader2 } from 'lucide-react';

export default function FullQueueTodayPage() {
  const [queue, setQueue] = useState<DailyQueue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const q = await getTodayQueue();
        setQueue(q);
      } catch (err) {
        console.error('Failed to load queue in full queue view:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
        <span className="text-xs font-mono font-semibold tracking-wider uppercase text-slate-500">
          Loading Full Queue...
        </span>
      </div>
    );
  }

  return (
    <FullQueueView
      queue={queue}
      onNavigate={(path) => {
        if (typeof window !== 'undefined') {
          window.location.href = path;
        }
      }}
    />
  );
}
