import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Layers,
  Plus,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import { AcademicDebt, Course, ErrorEvent, RecoveryPlan, Topic } from '../../types';

interface AcademicDebtViewProps {
  debts: AcademicDebt[];
  courses: Course[];
  topics: Topic[];
  errors: ErrorEvent[];
  recoveryPlans: RecoveryPlan[];
  onResolveDebt: (debtId: string, evidence: string) => void;
  onDeleteDebt: (debtId: string) => void;
  onAddDebt: (debtData: any) => void;
  onCreateRecoveryPlan: (plan: Omit<RecoveryPlan, 'id' | 'created_at' | 'status'>) => void;
  onCompletePlanStep: (planId: string, slotIndex: number) => void;
  onResolveError: (errorId: string) => void;
}

export const AcademicDebtView: React.FC<AcademicDebtViewProps> = ({
  debts,
  courses,
  topics,
  errors,
  recoveryPlans,
  onResolveDebt,
  onDeleteDebt,
  onAddDebt,
  onCreateRecoveryPlan,
  onCompletePlanStep,
  onResolveError,
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'resolved' | 'plans' | 'errors'>('active');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState<AcademicDebt | null>(null);
  const [resolveEvidence, setResolveEvidence] = useState('');

  // Add Debt Form State
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [severity, setSeverity] = useState<AcademicDebt['severity']>('high');
  const [estMinutes, setEstMinutes] = useState(45);

  const activeDebts = debts.filter((d) => d.status !== 'resolved');
  const resolvedDebts = debts.filter((d) => d.status === 'resolved');

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];
  const courseTopics = topics.filter((t) => t.course_id === selectedCourseId);

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const handleCreateDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const tObj = topics.find((t) => t.id === selectedTopicId) || courseTopics[0];

    onAddDebt({
      course_id: selectedCourse.id,
      topic_id: tObj?.id || 'top-1',
      topic_name: tObj?.name || 'General Knowledge Deficit',
      course_code: selectedCourse.code,
      source: 'manual_flag',
      severity,
      title: title.trim() || `Deficit in ${tObj?.name}`,
      reason: reason.trim() || 'Identified learning deficit needing recovery practice.',
      estimated_recovery_minutes: estMinutes,
    });

    setTitle('');
    setReason('');
    setShowAddModal(false);
  };

  const handleAutoGenerateRecoveryPlan = () => {
    if (activeDebts.length === 0) return;

    const totalRecoveryMins = activeDebts.reduce((sum, d) => sum + d.estimated_recovery_minutes, 0);
    const slots = activeDebts.map((d, idx) => ({
      date: new Date(Date.now() + idx * 86400000).toISOString().split('T')[0],
      duration_minutes: d.estimated_recovery_minutes,
      topic_name: d.topic_name,
      course_code: d.course_code,
      status: 'scheduled' as const,
    }));

    onCreateRecoveryPlan({
      title: `Emergency Recovery Protocol (${activeDebts.length} Debts)`,
      debts_included: activeDebts.map((d) => d.id),
      total_recovery_minutes: totalRecoveryMins,
      target_completion_date: new Date(Date.now() + activeDebts.length * 86400000).toISOString().split('T')[0],
      scheduled_slots: slots,
    });

    setActiveTab('plans');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Accountability Core</span>
            <span className="text-xs font-bold px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full border border-rose-300">
              {activeDebts.length} Unresolved Debt Items
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Academic Debt Ledger & Recovery Engine</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Explicit tracking of knowledge deficits, failed assessments, and overdue topics that distort exam readiness.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {activeDebts.length > 0 && (
            <button
              onClick={handleAutoGenerateRecoveryPlan}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-xs transition-all"
            >
              <Zap className="w-4 h-4" />
              <span>Auto-Generate Recovery Plan</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Flag New Debt</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('active')}
          className={`py-2.5 px-3 border-b-2 transition-all ${
            activeTab === 'active'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Active Debts ({activeDebts.length})
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`py-2.5 px-3 border-b-2 transition-all ${
            activeTab === 'plans'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Recovery Plans ({recoveryPlans.length})
        </button>
        <button
          onClick={() => setActiveTab('errors')}
          className={`py-2.5 px-3 border-b-2 transition-all ${
            activeTab === 'errors'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Error Bank & Misconceptions ({errors.length})
        </button>
        <button
          onClick={() => setActiveTab('resolved')}
          className={`py-2.5 px-3 border-b-2 transition-all ${
            activeTab === 'resolved'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Resolved Archive ({resolvedDebts.length})
        </button>
      </div>

      {/* TAB 1: ACTIVE DEBTS */}
      {activeTab === 'active' && (
        <div className="space-y-3.5">
          {activeDebts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-800">No Active Academic Debt</h3>
              <p className="text-xs text-slate-500 mt-1">
                You are on schedule with verified mastery across all syllabus topics.
              </p>
            </div>
          ) : (
            activeDebts.map((debt) => (
              <div
                key={debt.id}
                className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-rose-300 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-900 text-white">
                      {debt.course_code}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getSeverityBadge(debt.severity)}`}>
                      {debt.severity} Severity
                    </span>
                    <span className="text-xs text-slate-500 flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      Est. {debt.estimated_recovery_minutes} Mins
                    </span>
                    <span className="text-xs text-slate-400">Due {debt.due_at}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{debt.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{debt.reason}</p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <button
                    onClick={() => {
                      setResolveEvidence('');
                      setShowResolveModal(debt);
                    }}
                    className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-xs transition-all active:scale-95"
                  >
                    Resolve with Evidence
                  </button>

                  <button
                    onClick={() => onDeleteDebt(debt.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Dismiss Debt"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: RECOVERY PLANS */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          {recoveryPlans.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <Zap className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">No active recovery plans</p>
              <p className="text-xs text-slate-500 mt-1">
                Click "Auto-Generate Recovery Plan" above to distribute academic debt across scheduled days.
              </p>
            </div>
          ) : (
            recoveryPlans.map((plan) => (
              <div key={plan.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{plan.title}</h3>
                    <p className="text-xs text-slate-500">
                      Total Recovery Budget: {plan.total_recovery_minutes} Mins • Target Completion: {plan.target_completion_date}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      plan.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {plan.status.toUpperCase()}
                  </span>
                </div>

                {/* Scheduled Slots */}
                <div className="space-y-2">
                  {plan.scheduled_slots.map((slot, sIdx) => {
                    const isDone = slot.status === 'completed';

                    return (
                      <div
                        key={sIdx}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                          isDone ? 'bg-emerald-50/50 border-emerald-200 opacity-80' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => onCompletePlanStep(plan.id, sIdx)}
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                              isDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300'
                            }`}
                          >
                            {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>
                          <div>
                            <div className="text-xs font-bold text-slate-900">
                              <span className="font-mono text-amber-700 mr-1.5">{slot.course_code}</span>
                              {slot.topic_name}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Scheduled {slot.date} • {slot.duration_minutes} Mins
                            </div>
                          </div>
                        </div>

                        <span className="text-[11px] font-semibold text-slate-600">
                          {isDone ? 'Cleared' : 'Pending'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: ERROR BANK */}
      {activeTab === 'errors' && (
        <div className="space-y-3">
          {errors.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-sm font-bold text-slate-800">No error misconceptions recorded</p>
            </div>
          ) : (
            errors.map((err) => (
              <div
                key={err.id}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                  err.resolved ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-slate-900 text-white">
                      {err.course_code}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{err.topic_name}</span>
                    <span className="text-[10px] text-slate-400">Type: {err.error_type}</span>
                  </div>
                  <p className="text-xs text-rose-700 font-medium">{err.misconception}</p>
                  <p className="text-[11px] text-slate-600">{err.ai_diagnosis_notes}</p>
                </div>

                {!err.resolved && (
                  <button
                    onClick={() => onResolveError(err.id)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg shrink-0"
                  >
                    Mark Mastered
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: RESOLVED ARCHIVE */}
      {activeTab === 'resolved' && (
        <div className="space-y-3">
          {resolvedDebts.map((d) => (
            <div key={d.id} className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-200 flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-slate-900 text-white">
                    {d.course_code}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{d.title}</span>
                </div>
                <p className="text-xs text-emerald-900 mt-1">
                  <span className="font-bold">Resolution Evidence: </span>
                  {d.resolution_evidence || 'Mastery confirmed via study drill'}
                </p>
              </div>
              <span className="text-[11px] text-slate-400">
                Resolved {d.resolved_at ? new Date(d.resolved_at).toLocaleDateString() : 'Recent'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Resolve Debt Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Resolve Academic Debt: {showResolveModal.title}
            </h3>
            <p className="text-xs text-slate-500">
              Provide verifiable study evidence or problem solutions that demonstrate remediation of this topic.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Remediation Evidence Notes
              </label>
              <textarea
                rows={4}
                value={resolveEvidence}
                onChange={(e) => setResolveEvidence(e.target.value)}
                placeholder="e.g. Worked through 4 complex problem sets on Stokes theorem with zero formula errors."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowResolveModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onResolveDebt(showResolveModal.id, resolveEvidence || 'Remediated via evidence drill');
                  setShowResolveModal(null);
                }}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Debt Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleCreateDebt}
            className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Flag New Academic Debt Item</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Course
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Topic
              </label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
              >
                {courseTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Debt Title / Weakness Description
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Boundary condition setup errors in cylindrical coordinates"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Severity
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
                >
                  <option value="critical">Critical (Immediate Block)</option>
                  <option value="high">High (Needs Intervention)</option>
                  <option value="medium">Medium (Deficit)</option>
                  <option value="low">Low (Minor Practice)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Est. Recovery Minutes
                </label>
                <input
                  type="number"
                  min={15}
                  max={240}
                  step={15}
                  value={estMinutes}
                  onChange={(e) => setEstMinutes(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-slate-900 text-amber-300 hover:bg-slate-800 rounded-xl shadow-xs"
              >
                Create Debt Item
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
