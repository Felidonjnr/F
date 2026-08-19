import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  FileCheck2,
  Flame,
  GraduationCap,
  Layers,
  PieChart,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  AcademicDebt,
  Assessment,
  Course,
  ErrorEvent,
  PressureBreakdown,
  RecoveryPlan,
  StudentProfile,
  StudyMission,
  Topic,
} from '../../types';
import { AssessmentsView } from '../Assessments/AssessmentsView';
import { AcademicDebtView } from '../Debt/AcademicDebtView';
import { AnalyticsView } from '../Analytics/AnalyticsView';

interface ReviewMasterViewProps {
  profile: StudentProfile;
  courses: Course[];
  topics: Topic[];
  debts: AcademicDebt[];
  missions: StudyMission[];
  assessments: Assessment[];
  errors: ErrorEvent[];
  recoveryPlans: RecoveryPlan[];
  pressure: PressureBreakdown;
  academicHealth: number;
  initialSubTab?: 'assessments' | 'debt' | 'analytics' | 'errors';
  onTakeAssessment: (assessment: Assessment) => void;
  onAddAssessment: (assessment: Omit<Assessment, 'id' | 'status'>) => void;
  onResolveDebt: (debtId: string, evidence: string) => void;
  onDeleteDebt: (debtId: string) => void;
  onAddDebt: (debtData: any) => void;
  onCreateRecoveryPlan: (plan: Omit<RecoveryPlan, 'id' | 'created_at' | 'status'>) => void;
  onCompletePlanStep: (planId: string, slotIndex: number) => void;
  onResolveError: (errorId: string) => void;
}

export const ReviewMasterView: React.FC<ReviewMasterViewProps> = ({
  profile,
  courses,
  topics,
  debts,
  missions,
  assessments,
  errors,
  recoveryPlans,
  pressure,
  academicHealth,
  initialSubTab = 'assessments',
  onTakeAssessment,
  onAddAssessment,
  onResolveDebt,
  onDeleteDebt,
  onAddDebt,
  onCreateRecoveryPlan,
  onCompletePlanStep,
  onResolveError,
}) => {
  const [subTab, setSubTab] = useState<'assessments' | 'debt' | 'analytics' | 'errors'>(initialSubTab);

  const activeDebts = debts.filter((d) => d.status !== 'resolved');
  const readyAssessments = assessments.filter((a) => a.status === 'ready');
  const activeErrors = errors.filter((e) => !e.resolved);

  return (
    <div id="review-master-view-root" className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Sub-navigation Segment bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2 bg-slate-100/80 rounded-2xl border border-slate-200/80">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-white rounded-xl shadow-2xs border border-slate-200/60">
          <button
            onClick={() => setSubTab('assessments')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              subTab === 'assessments'
                ? 'bg-slate-900 text-amber-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Assessments</span>
            {readyAssessments.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded-full text-[10px] font-black font-mono">
                {readyAssessments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('debt')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              subTab === 'debt'
                ? 'bg-slate-900 text-amber-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Debt & Recovery</span>
            {activeDebts.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-black font-mono">
                {activeDebts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('analytics')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              subTab === 'analytics'
                ? 'bg-slate-900 text-amber-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics & Radar</span>
          </button>

          <button
            onClick={() => setSubTab('errors')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              subTab === 'errors'
                ? 'bg-slate-900 text-amber-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Error Bank</span>
            {activeErrors.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-slate-200 text-slate-800 rounded-full text-[10px] font-black font-mono">
                {activeErrors.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center space-x-3 px-3 text-xs">
          <span className="font-semibold text-slate-500">Academic Evidence Engine</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 font-mono font-bold text-[11px]">
            Health: {academicHealth}/100
          </span>
        </div>
      </div>

      {/* SUB-VIEW RENDERING */}
      {subTab === 'assessments' && (
        <AssessmentsView
          assessments={assessments}
          courses={courses}
          topics={topics}
          onTakeAssessment={onTakeAssessment}
          onAddAssessment={onAddAssessment}
        />
      )}

      {subTab === 'debt' && (
        <AcademicDebtView
          debts={debts}
          courses={courses}
          topics={topics}
          errors={errors}
          recoveryPlans={recoveryPlans}
          onResolveDebt={onResolveDebt}
          onDeleteDebt={onDeleteDebt}
          onAddDebt={onAddDebt}
          onCreateRecoveryPlan={onCreateRecoveryPlan}
          onCompletePlanStep={onCompletePlanStep}
          onResolveError={onResolveError}
        />
      )}

      {subTab === 'analytics' && (
        <AnalyticsView
          profile={profile}
          courses={courses}
          topics={topics}
          debts={debts}
          missions={missions}
          assessments={assessments}
          errors={errors}
          pressure={pressure}
          academicHealth={academicHealth}
        />
      )}

      {subTab === 'errors' && (
        <div className="space-y-4">
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Misconception Bank</span>
                <span className="text-xs font-bold px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full">
                  {activeErrors.length} Active Misconceptions
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">Error Logs & Targeted Remediation</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every diagnostic mistake and formula retrieval failure is indexed here to prevent repeated exam errors.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {errors.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h3 className="text-base font-bold text-slate-800">Zero Logged Misconceptions</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Mistakes during diagnostics and missions will automatically appear here with AI root-cause analysis.
                </p>
              </div>
            ) : (
              errors.map((err) => (
                <div
                  key={err.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                    err.resolved
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-900 text-white">
                        {err.course_code}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{err.topic_name}</span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                        {err.category || 'Misconception'}
                      </span>
                      {err.recurrence_count > 1 && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          Repeated {err.recurrence_count}x
                        </span>
                      )}
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="text-slate-500 font-medium">Question:</div>
                      <div className="text-slate-900 font-medium">{err.question_prompt}</div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 text-rose-900">
                        <span className="font-bold">Your Response: </span>
                        {err.student_answer}
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-emerald-900">
                        <span className="font-bold">Correct Principle: </span>
                        {err.correct_answer}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed pt-1">
                      <span className="font-bold text-slate-800">AI Remediation: </span>
                      {err.diagnosis || err.remediation_action}
                    </p>
                  </div>

                  <div className="shrink-0 pt-1">
                    {!err.resolved ? (
                      <button
                        onClick={() => onResolveError(err.id)}
                        className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition-all active:scale-95"
                      >
                        Mark Mastered
                      </button>
                    ) : (
                      <div className="flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Remediated</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
