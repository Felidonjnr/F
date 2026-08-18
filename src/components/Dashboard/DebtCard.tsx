import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { AcademicDebt, AppTab } from '../../types';

interface DebtCardProps {
  debts: AcademicDebt[];
  onNavigate: (tab: AppTab) => void;
  onOpenResolveModal: (debt: AcademicDebt) => void;
}

export const DebtCard: React.FC<DebtCardProps> = ({ debts, onNavigate, onOpenResolveModal }) => {
  const activeDebts = debts.filter((d) => d.status !== 'resolved');

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'low':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 transition-all hover:shadow-md flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200/60">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Academic Debt Ledger</h3>
              <p className="text-[11px] text-slate-500">Unresolved weaknesses & missed practice</p>
            </div>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
              activeDebts.length > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {activeDebts.length} Active
          </span>
        </div>

        {/* Debt List */}
        <div className="mt-4 space-y-3">
          {activeDebts.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-100">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">Zero Academic Debt</p>
              <p className="text-xs text-slate-500 mt-0.5">All course topics are passing evidence thresholds.</p>
            </div>
          ) : (
            activeDebts.slice(0, 3).map((debt) => (
              <div
                key={debt.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-amber-300 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-mono">
                        {debt.course_code}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${getSeverityBadge(debt.severity)}`}>
                        {debt.severity}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center">
                        <Clock className="w-3 h-3 mr-0.5" /> Due {debt.due_at}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mt-1">{debt.title}</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">{debt.reason}</p>
                  </div>

                  <button
                    onClick={() => onOpenResolveModal(debt)}
                    className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg bg-white group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-700 border border-slate-200 group-hover:border-amber-500 transition-all shadow-2xs"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          Estimated recovery time: {activeDebts.reduce((sum, d) => sum + d.estimated_recovery_minutes, 0)} mins
        </span>
        <button
          onClick={() => onNavigate('debt')}
          className="flex items-center space-x-1 text-xs font-bold text-rose-600 hover:text-rose-700"
        >
          <span>View All Debts ({activeDebts.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
