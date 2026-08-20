import React, { useEffect, useState } from 'react';
import { DailyQueue, UserProfile } from '../types';
import { getProfile, getTodayQueue, isOnboardingComplete } from '../lib/supabase/queries';
import { TodayView } from '../components/today/TodayView';
import { Loader2 } from 'lucide-react';

export default function TodayPage() {
  const [queue, setQueue] = useState<DailyQueue | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const completed = await isOnboardingComplete();
        if (!completed) {
          // If onboarding is not completed, redirect to /onboarding
          if (typeof window !== 'undefined') {
            const hasDraft = localStorage.getItem('firstclass_onboarding');
            if (!hasDraft) {
              window.location.href = '/onboarding';
              return;
            }
          }
        }

        const [fetchedQueue, fetchedProfile] = await Promise.all([
          getTodayQueue(),
          getProfile(),
        ]);

        setQueue(fetchedQueue);
        setProfile(fetchedProfile);
      } catch (err) {
        console.error('Failed to load today page data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
        <span className="text-xs font-mono font-semibold tracking-wider uppercase text-slate-500">
          Loading Today's Queue...
        </span>
      </div>
    );
  }

  return (
    <TodayView
      queue={queue}
      onNavigate={(path) => {
        if (typeof window !== 'undefined') {
          window.location.href = path;
        }
      }}
    />
  );
}
