import React from 'react';
import { Activity, Award, CheckCircle2, Flame, TrendingUp } from 'lucide-react';
import { AppTab, StudentProfile } from '../../types';

interface AcademicHealthCardProps {
  academicHealth: number; // 0-100
  avgMastery: number;
  pressureScore: number;
  weeklyCompletionRate: number;
  profile: StudentProfile;
  onNavigate: (tab: AppTab) => void;
}

export const AcademicHealthCard: React.FC<AcademicHealthCardProps> = ({
  academicHealth,
  avgMastery,
  pressureScore,
  weeklyCompletionRate,
  profile,
  onNavigate,
}) => {
  const getStatusColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 65) return 'text-sky-600 bg-sky-50 border-sky-200';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const getStatusLabel = (score: number) => {
    if (score >= 85) return 'First Class Trajectory (Optimal)';
    if (score >= 70) return 'Strong Pace — Target Attainable';
    if (score >= 55) return 'At Risk — Action Required';
    return 'Critical Deficit — Immediate Recovery';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 transition-all hover:shadow-md">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">System Vital</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(academicHealth)}`}>
              {getStatusLabel(academicHealth)}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Academic Health Index</h2>
        </div>
        <button
          onClick={() => onNavigate('analytics')}
          className="text-xs font-semibold text-sky-600 hover:text-sky-700 underline"
        >
          Detailed Forecast
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-5 items-center">
        {/* Main Big Score */}
        <div className="sm:col-span-1 flex flex-col items-center justify-center p-4 bg-slate-900 text-white rounded-xl shadow-xs">
          <span className="text-4xl sm:text-5xl font-black text-amber-400 tracking-tight">
            {academicHealth}
          </span>
          <span className="text-xs uppercase font-semibold text-slate-300 tracking-wider mt-1">
            Health / 100
          </span>
          <span className="text-[11px] text-slate-400 mt-1">Target CGPA: {profile.target_cgpa}</span>
        </div>

        {/* 3 Pillars Breakdown */}
        <div className="sm:col-span-3 grid grid-cols-3 gap-3">
          {/* Average Mastery */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Mastery</span>
              <Award className="w-3.5 h-3.5 text-sky-500" />
            </div>
            <div className="text-xl font-bold text-slate-900">{avgMastery}%</div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-sky-500 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, avgMastery)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-1">4 Dimensions</span>
          </div>

          {/* Academic Pressure */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Pressure</span>
              <Flame className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-slate-900">{pressureScore}</div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
              <div
                className={`h-1.5 rounded-full ${
                  pressureScore > 70 ? 'bg-rose-500' : pressureScore > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, pressureScore)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-1">Deterministic v1.0</span>
          </div>

          {/* Consistency Rate */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Execution</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-bold text-slate-900">{weeklyCompletionRate}%</div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-emerald-500 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, weeklyCompletionRate)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-1">Daily Missions</span>
          </div>
        </div>
      </div>
    </div>
  );
};
