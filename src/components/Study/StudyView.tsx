import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  Filter,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { Course, StudyMission, Topic } from '../../types';

interface StudyViewProps {
  missions: StudyMission[];
  courses: Course[];
  topics: Topic[];
  onLaunchStudySession: (mission: StudyMission) => void;
  onRegenerateMissions: () => void;
}

export const StudyView: React.FC<StudyViewProps> = ({
  missions,
  courses,
  topics,
  onLaunchStudySession,
  onRegenerateMissions,
}) => {
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');

  const filteredMissions = missions.filter((m) => {
    if (filterPriority !== 'all' && m.priority !== filterPriority) return false;
    if (selectedCourse !== 'all' && m.course_code !== selectedCourse) return false;
    return true;
  });

  const completedCount = missions.filter((m) => m.status === 'completed').length;
  const totalPlannedMins = missions.reduce((sum, m) => sum + m.estimated_duration_minutes, 0);
  const completedMins = missions
    .filter((m) => m.status === 'completed')
    .reduce((sum, m) => sum + (m.completed_minutes || m.estimated_duration_minutes), 0);

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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Execution Loop</span>
            <span className="text-xs font-bold px-2 py-0.5 bg-amber-500 text-slate-950 rounded-full">
              {completedCount} / {missions.length} Missions Complete
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Study Missions & Execution Scheduler</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic daily study missions generated from topic mastery deficits, unit weights, and active debts.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onRegenerateMissions}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl shadow-xs transition-all active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recalculate Today's Schedule</span>
          </button>
        </div>
      </div>

      {/* Progress Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Target Time</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{totalPlannedMins} <span className="text-xs font-normal text-slate-500">mins</span></div>
          </div>
          <Clock className="w-8 h-8 text-sky-500 p-1.5 bg-sky-50 rounded-xl" />
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Time Executed</div>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">{completedMins} <span className="text-xs font-normal text-slate-500">mins</span></div>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-500 p-1.5 bg-emerald-50 rounded-xl" />
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Active Debt Interventions</div>
            <div className="text-2xl font-black text-amber-600 mt-0.5">
              {missions.filter((m) => m.is_debt_recovery).length}
            </div>
          </div>
          <Zap className="w-8 h-8 text-amber-500 p-1.5 bg-amber-50 rounded-xl" />
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Filter By:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="Remediate">Remediate (Debt Recovery)</option>
            <option value="Priority">Priority</option>
            <option value="Pre-Exam">Pre-Exam Review</option>
            <option value="Routine">Routine</option>
          </select>
        </div>
      </div>

      {/* Mission Cards List */}
      <div className="space-y-3.5">
        {filteredMissions.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
            <CheckSquare className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-base font-bold text-slate-800">No missions match your current filter</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting the filter or recalculate daily missions.</p>
          </div>
        ) : (
          filteredMissions.map((m) => {
            const isCompleted = m.status === 'completed';

            return (
              <div
                key={m.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'bg-emerald-50/30 border-emerald-200/80'
                    : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-slate-900 text-white font-mono">
                        {m.course_code}
                      </span>
                      <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded border ${getPriorityBadge(m.priority)}`}>
                        {m.priority}
                      </span>
                      <span className="text-xs text-slate-500 font-medium flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {m.estimated_duration_minutes} Minutes
                      </span>
                      {m.is_debt_recovery && (
                        <span className="text-[11px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded border border-rose-300">
                          Debt Recovery Mission
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{m.topic_name}</h3>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      <span className="font-bold text-slate-800">Learning Objective: </span>
                      {m.learning_objective}
                    </p>

                    {isCompleted && m.completion_evidence && (
                      <div className="mt-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                        <span className="font-bold">Logged Evidence: </span>
                        {m.completion_evidence} ({m.completed_minutes} mins elapsed)
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center space-x-3">
                    {isCompleted ? (
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3.5 py-2 rounded-xl">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Completed & Verified</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onLaunchStudySession(m)}
                        className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-amber-300" />
                        <span>Launch Session</span>
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
