import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Compass,
  Flame,
  Info,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { AppTab, PressureBreakdown } from '../../types';

interface PressureCardProps {
  pressure: PressureBreakdown;
  onNavigate: (tab: AppTab) => void;
}

export const PressureCard: React.FC<PressureCardProps> = ({ pressure, onNavigate }) => {
  const getBandStyles = (band: string) => {
    switch (band) {
      case 'Stable':
        return {
          bg: 'bg-emerald-500',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          text: 'text-emerald-700',
          progressBg: 'bg-emerald-500',
        };
      case 'Watch':
        return {
          bg: 'bg-blue-500',
          badge: 'bg-blue-100 text-blue-800 border-blue-300',
          text: 'text-blue-700',
          progressBg: 'bg-blue-500',
        };
      case 'At Risk':
        return {
          bg: 'bg-amber-500',
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          text: 'text-amber-700',
          progressBg: 'bg-amber-500',
        };
      case 'High Pressure':
        return {
          bg: 'bg-orange-500',
          badge: 'bg-orange-100 text-orange-800 border-orange-300',
          text: 'text-orange-700',
          progressBg: 'bg-orange-500',
        };
      case 'Critical':
        return {
          bg: 'bg-rose-600',
          badge: 'bg-rose-100 text-rose-800 border-rose-300',
          text: 'text-rose-700',
          progressBg: 'bg-rose-600',
        };
      default:
        return {
          bg: 'bg-slate-500',
          badge: 'bg-slate-100 text-slate-800 border-slate-300',
          text: 'text-slate-700',
          progressBg: 'bg-slate-500',
        };
    }
  };

  const styles = getBandStyles(pressure.band);

  const riskFactors = [
    { label: 'Exam Deadline Distance (25%)', value: pressure.components.deadline_risk, color: 'bg-sky-500' },
    { label: 'Active Academic Debt (20%)', value: pressure.components.debt_risk, color: 'bg-rose-500' },
    { label: 'Topic Mastery Deficit (20%)', value: pressure.components.mastery_risk, color: 'bg-amber-500' },
    { label: 'Study Consistency Lag (15%)', value: pressure.components.consistency_risk, color: 'bg-indigo-500' },
    { label: 'Recent Assessment Scores (10%)', value: pressure.components.assessment_risk, color: 'bg-emerald-500' },
    { label: 'Target CGPA Gap (10%)', value: pressure.components.goal_gap_risk, color: 'bg-purple-500' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 transition-all hover:shadow-md flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Pressure Engine</h3>
              <p className="text-[11px] text-slate-500 font-mono">Formula {pressure.formula_version}</p>
            </div>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${styles.badge}`}>
            {pressure.band} ({pressure.score}/100)
          </span>
        </div>

        {/* System Guidance Note */}
        <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 leading-relaxed">
          <span className="font-bold text-slate-900">System Response: </span>
          {pressure.system_response}
        </div>

        {/* Next Mandatory Action */}
        <div className="mt-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start space-x-2.5">
          <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-[11px] uppercase tracking-wider text-amber-800">Mandatory Next Action</div>
            <div className="font-medium mt-0.5">{pressure.next_mandatory_action}</div>
          </div>
        </div>

        {/* 6 Deterministic Risk Components */}
        <div className="mt-4 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Deterministic Risk Breakdown</span>
            <span>Weight Contribution</span>
          </div>

          {riskFactors.map((rf, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>{rf.label}</span>
                <span className="font-bold text-slate-900">{rf.value}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full ${rf.color} transition-all duration-300`}
                  style={{ width: `${Math.min(100, Math.max(2, rf.value))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Quick Action */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          Updated {new Date(pressure.calculated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <button
          onClick={() => onNavigate('debt')}
          className="flex items-center space-x-1 text-xs font-bold text-amber-600 hover:text-amber-700"
        >
          <span>Open Recovery Actions</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
