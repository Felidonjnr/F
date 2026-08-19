import React, { useState } from 'react';
import {
  AlertOctagon,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  FileCheck2,
  GraduationCap,
  Plus,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
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
import { Badge, Button, Card, EmptyState, Tabs } from '../ui';

export interface ReviewViewProps {
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

export const ReviewView: React.FC<ReviewViewProps> = ({
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
  const [activeSubTab, setActiveSubTab] = useState<string>(initialSubTab);

  const activeDebts = debts.filter((d) => d.status !== 'resolved');
  const readyAssessments = assessments.filter((a) => a.status === 'ready');
  const activeErrors = errors.filter((e) => !e.resolved);

  const subTabs = [
    {
      id: 'assessments',
      label: 'Assessments',
      count: readyAssessments.length > 0 ? readyAssessments.length : undefined,
      icon: <FileCheck2 className="w-3.5 h-3.5" />,
    },
    {
      id: 'debt',
      label: 'Debt & Recovery',
      count: activeDebts.length > 0 ? activeDebts.length : undefined,
      icon: <AlertOctagon className="w-3.5 h-3.5" />,
    },
    {
      id: 'errors',
      label: 'Error Bank',
      count: activeErrors.length > 0 ? activeErrors.length : undefined,
      icon: <ShieldAlert className="w-3.5 h-3.5" />,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div id="review-view-root" className="max-w-5xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* 1. Header & Sub-tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
        <Tabs
          tabs={subTabs}
          activeTab={activeSubTab}
          onChange={(tabId) => setActiveSubTab(tabId)}
        />

        <div className="flex items-center space-x-2 px-3">
          <Badge variant="accent" size="sm">
            Health: {academicHealth}/100
          </Badge>
          <Badge
            variant={
              pressure.band === 'Stable'
                ? 'stable'
                : pressure.band === 'Optimal'
                ? 'optimal'
                : pressure.band === 'High'
                ? 'high'
                : 'critical'
            }
            size="sm"
          >
            {pressure.band}
          </Badge>
        </div>
      </div>

      {/* 2. TAB 1: ASSESSMENTS */}
      {activeSubTab === 'assessments' && (
        <AssessmentsView
          assessments={assessments}
          courses={courses}
          topics={topics}
          onTakeAssessment={onTakeAssessment}
          onAddAssessment={onAddAssessment}
        />
      )}

      {/* 3. TAB 2: DEBT & RECOVERY */}
      {activeSubTab === 'debt' && (
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

      {/* 4. TAB 3: ERROR BANK */}
      {activeSubTab === 'errors' && (
        <div className="space-y-4 animate-in fade-in">
          <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  Misconception Registry
                </span>
                <Badge variant={activeErrors.length > 0 ? 'critical' : 'stable'} size="sm">
                  {activeErrors.length} Active
                </Badge>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                Diagnostic Error Logs & Targeted Remediation
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every diagnostic mistake and formula retrieval failure is indexed here to prevent recurring exam mistakes.
              </p>
            </div>
          </Card>

          <div className="space-y-3">
            {errors.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                title="Zero Logged Misconceptions"
                description="Mistakes during diagnostics and study missions will automatically appear here with AI root-cause analysis."
              />
            ) : (
              errors.map((err) => (
                <Card
                  key={err.id}
                  className={`p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-all ${
                    err.resolved ? 'bg-slate-50 opacity-60' : ''
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-900 text-white">
                        {err.course_code}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{err.topic_name}</span>
                      <Badge variant="critical" size="sm">
                        {err.category || 'Misconception'}
                      </Badge>
                      {err.recurrence_count > 1 && (
                        <Badge variant="high" size="sm">
                          Repeated {err.recurrence_count}x
                        </Badge>
                      )}
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="text-slate-500 font-medium">Question:</div>
                      <div className="text-slate-900 font-medium">{err.question_prompt}</div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100 text-rose-900">
                        <span className="font-bold">Your Response: </span>
                        {err.student_answer}
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-900">
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
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onResolveError(err.id)}
                      >
                        Mark Mastered
                      </Button>
                    ) : (
                      <div className="flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Remediated</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. TAB 4: ANALYTICS */}
      {activeSubTab === 'analytics' && (
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
    </div>
  );
};
