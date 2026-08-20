import { DailyQueue, QueueItem, QueueItemType, UserProfile } from '../../types';
import { StateManager } from '../../services/storage';
import { getSupabaseClient } from './client';
import { todayISO } from '../utils';

/**
 * Fetches today's queue from Supabase (daily_queues or study_missions for today).
 * Gracefully returns null or cached state if empty/offline.
 */
export async function getTodayQueue(): Promise<DailyQueue | null> {
  const today = todayISO();
  const client = getSupabaseClient();

  if (client) {
    try {
      // 1. Try querying daily_queues table
      const { data: queueData, error: queueErr } = await client
        .from('daily_queues')
        .select('*')
        .eq('date', today)
        .maybeSingle();

      if (!queueErr && queueData) {
        // Query items if stored in sub-table
        const { data: itemRows } = await client
          .from('daily_queue_items')
          .select('*')
          .eq('queue_id', queueData.id)
          .order('priority_order', { ascending: true });

        const items: QueueItem[] = (itemRows && itemRows.length > 0)
          ? itemRows.map((it: any, idx: number) => ({
              id: it.id || `qi-${idx}`,
              queue_id: queueData.id,
              unit_id: it.unit_id || it.topic_id || `unit-${idx}`,
              course_id: it.course_id || 'course-1',
              course_code: it.course_code || 'GEN 101',
              course_color: it.course_color || '#3b82f6',
              title: it.title || it.topic_name || `Study Unit ${idx + 1}`,
              type: (it.type?.toUpperCase() || 'REVIEW') as QueueItemType,
              estimated_minutes: it.estimated_minutes || 45,
              completed: Boolean(it.completed),
              mastery_tier: it.mastery_tier || 'T1_FOUNDATIONAL',
              is_debt: Boolean(it.is_debt),
              is_weak_spot: Boolean(it.is_weak_spot),
              priority_order: it.priority_order ?? idx + 1,
              order_index: it.order_index ?? idx + 1,
              completed_at: it.completed_at,
            }))
          : Array.isArray(queueData.items)
          ? queueData.items
          : [];

        return {
          id: queueData.id,
          user_id: queueData.user_id || 'user-1',
          date: queueData.date || today,
          total_items: items.length,
          total_estimated_minutes: items.reduce((acc, it) => acc + (it.estimated_minutes || 0), 0),
          completed_items: items.filter((i) => i.completed).length,
          completed_minutes: items.filter((i) => i.completed).reduce((acc, it) => acc + (it.estimated_minutes || 0), 0),
          pressure_score: queueData.pressure_score || 34,
          pressure_band: queueData.pressure_band || 'Stable',
          streak_count: queueData.streak_count || 12,
          items,
          available_minutes_today: queueData.available_minutes_today || 180,
          compression_ratio: queueData.compression_ratio || 1.0,
        };
      }

      // 2. Fallback: Query study_missions for today from Supabase
      const { data: missions, error: mErr } = await client
        .from('study_missions')
        .select('*')
        .eq('date', today)
        .order('priority', { ascending: false });

      if (!mErr && missions && missions.length > 0) {
        const queueItems: QueueItem[] = missions.map((m: any, idx: number) => {
          let type: QueueItemType = 'REVIEW';
          if (m.priority === 'Priority') type = 'NEW';
          else if (m.priority === 'Remediate' || m.is_debt_recovery) type = 'PRACTICE';
          else if (m.priority === 'Pre-Exam') type = 'ASSESSMENT';

          return {
            id: m.id,
            unit_id: m.topic_id || m.id,
            course_id: m.course_id,
            course_code: m.course_code || 'CRS',
            title: m.topic_name || m.learning_objective || `Unit ${idx + 1}`,
            type,
            estimated_minutes: m.estimated_duration_minutes || 45,
            completed: m.status === 'completed',
            mastery_tier: 'T2_APPLICATION',
            is_debt: Boolean(m.is_debt_recovery || m.debt_id),
            is_weak_spot: m.priority === 'Remediate',
            priority_order: idx + 1,
            order_index: idx + 1,
          };
        });

        return {
          id: `queue-${today}`,
          user_id: 'current-user',
          date: today,
          total_items: queueItems.length,
          total_estimated_minutes: queueItems.reduce((acc, it) => acc + it.estimated_minutes, 0),
          completed_items: queueItems.filter((i) => i.completed).length,
          completed_minutes: queueItems.filter((i) => i.completed).reduce((acc, it) => acc + it.estimated_minutes, 0),
          pressure_score: 36,
          pressure_band: 'Stable',
          streak_count: 14,
          items: queueItems,
          available_minutes_today: 180,
          compression_ratio: 1.0,
        };
      }
    } catch (err) {
      console.warn('Supabase getTodayQueue warning:', err);
    }
  }

  // 3. Fallback to local StateManager
  try {
    const stateManager = StateManager.getInstance();
    const localState = stateManager.getState();
    const localPressure = stateManager.getPressureBreakdown();
    const todayMissions = (localState.missions || []).filter((m) => m.date === today || m.status === 'pending');

    if (todayMissions.length > 0) {
      const items: QueueItem[] = todayMissions.slice(0, 8).map((m, idx) => {
        let type: QueueItemType = 'REVIEW';
        if (m.priority === 'Priority') type = 'NEW';
        else if (m.priority === 'Remediate' || m.is_debt_recovery) type = 'PRACTICE';
        else if (m.priority === 'Pre-Exam') type = 'ASSESSMENT';

        return {
          id: m.id,
          unit_id: m.topic_id || m.id,
          course_id: m.course_id,
          course_code: m.course_code,
          title: m.topic_name,
          type,
          estimated_minutes: m.estimated_duration_minutes || 45,
          completed: m.status === 'completed',
          mastery_tier: 'T2_APPLICATION',
          is_debt: Boolean(m.is_debt_recovery || m.debt_id),
          is_weak_spot: m.priority === 'Remediate',
          priority_order: idx + 1,
          order_index: idx + 1,
        };
      });

      return {
        id: `local-queue-${today}`,
        user_id: localState.profile?.id || 'local-user',
        date: today,
        total_items: items.length,
        total_estimated_minutes: items.reduce((acc, it) => acc + it.estimated_minutes, 0),
        completed_items: items.filter((i) => i.completed).length,
        completed_minutes: items.filter((i) => i.completed).reduce((acc, it) => acc + it.estimated_minutes, 0),
        pressure_score: Math.round(localPressure?.score || 38),
        pressure_band: localPressure?.band || 'Stable',
        streak_count: 14,
        items,
        available_minutes_today: 210,
        compression_ratio: 0.95,
      };
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Fetches user profile from Supabase profiles table, or fallback local profile
 */
export async function getProfile(): Promise<UserProfile | null> {
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          name: data.name || 'Godshand Udoh',
          email: data.email,
          institution: data.institution || 'University',
          department: data.department || 'Electrical & Electronics Engineering',
          level: data.level || '300 Level',
          current_cgpa: Number(data.current_cgpa || 4.38),
          target_cgpa: Number(data.target_cgpa || 4.75),
          scale_cgpa: Number(data.scale_cgpa || 5.0),
          weekly_available_minutes: Number(data.weekly_available_minutes || 1500),
          streak_days: 14,
          onboarding_completed: true,
        };
      }
    } catch (err) {
      console.warn('Supabase getProfile warning:', err);
    }
  }

  // Local fallback
  try {
    const saved = localStorage.getItem('firstclass_profile');
    if (saved) {
      return JSON.parse(saved);
    }
    const localState = StateManager.getInstance().getState();
    if (localState.profile) {
      return {
        id: localState.profile.id,
        name: localState.profile.name,
        email: localState.profile.email,
        institution: localState.profile.institution,
        department: localState.profile.department,
        level: localState.profile.level,
        current_cgpa: localState.profile.current_cgpa,
        target_cgpa: localState.profile.target_cgpa,
        scale_cgpa: localState.profile.scale_cgpa,
        weekly_available_minutes: localState.profile.weekly_available_minutes,
        streak_days: 14,
        onboarding_completed: true,
      };
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Checks if onboarding is complete
 */
export async function isOnboardingComplete(): Promise<boolean> {
  try {
    const flag = localStorage.getItem('firstclass_onboarding_done');
    if (flag === 'true') return true;

    // Check if onboarding draft in progress without completion
    const profile = await getProfile();
    if (profile && profile.name && profile.department) {
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}
