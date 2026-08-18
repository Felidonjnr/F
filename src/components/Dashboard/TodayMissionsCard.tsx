import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  Clock,
  Play,
  Sparkles,
  Target,
} from 'lucide-react';
import { AppTab, StudyMission } from '../../types';

interface TodayMissionsCardProps {
  missions: StudyMission[];
  onNavigate: (tab: AppTab) => void;
  onLaunchStudySession: (mission: StudyMission) => void;
}

export const TodayMissionsCard: React.FC<TodayMissionsCardProps> = ({
  missions,
  onNavigate,
  onLaunchStudySession,
}) => {
  const completedCount = missions.filter((m) => m.status === 'completed').length;
  const totalMinutes = missions.reduce((sum, m) => sum + m.estimated_duration_minutes, 0);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Remediate':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'Priority':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Pre-Exam':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-200/60">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Today's Study Missions</h3>
            <p className="text-[11px] text-slate-500">
              {completedCount} of {missions.length} completed • {totalMinutes} planned mins
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('study')}
          className="text-xs font-semibold text-sky-600 hover:text-sky-700 underline"
        >
          Weekly Schedule
        </button>
      </div>

      {/* Mission Items */}
      <div className="mt-4 space-y-3">
        {missions.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">
            No missions scheduled for today. Click 'Study Missions' to generate a plan.
          </div>
        ) : (
          missions.map((m) => {
            const isCompleted = m.status === 'completed';

            return (
              <div
                key={m.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-emerald-50/40 border-emerald-200/80 opacity-80'
                    : 'bg-white border-slate-200 hover:border-sky-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono">
                        {m.course_code}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${getPriorityBadge(m.priority)}`}>
                        {m.priority}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-slate-400" />
                        {m.estimated_duration_minutes} min
                      </span>
                      {m.is_debt_recovery && (
                        <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200">
                          Debt Recovery
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-1.5">
                      {m.topic_name}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                      <span className="font-semibold text-slate-700">Objective: </span>
                      {m.learning_objective}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center space-x-2">
                    {isCompleted ? (
                      <div className="flex items-center space-x-1 text-xs font-bold text-emerald-600 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Done</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onLaunchStudySession(m)}
                        className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs transition-all active:scale-95"
                      >
                        <Play className="w-3 h-3 fill-amber-300" />
                        <span>Launch</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
