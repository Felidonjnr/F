import React, { useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Flame,
  GraduationCap,
  Layers,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Target,
  UploadCloud,
  Zap,
} from 'lucide-react';
import {
  AcademicDebt,
  Assessment,
  Course,
  PressureBreakdown,
  Semester,
  StudentProfile,
  StudyMission,
  Topic,
} from '../../types';

interface TodayViewProps {
  profile: StudentProfile;
  semester: Semester;
  courses: Course[];
  topics: Topic[];
  missions: StudyMission[];
  debts: AcademicDebt[];
  assessments: Assessment[];
  pressure: PressureBreakdown;
  academicHealth: number;
  onStartSession: (mission: StudyMission) => void;
  onSelectCourse: (course: Course) => void;
  onRegenerateMissions: () => void;
  onNavigateTab: (tab: any) => void;
  onResolveDebt: (debtId: string, evidence: string) => void;
  onOpenUploadMaterial: () => void;
  onTakeAssessment: (assessment: Assessment) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  profile,
  semester,
  courses,
  topics,
  missions,
  debts,
  assessments,
  pressure,
  academicHealth,
  onStartSession,
  onSelectCourse,
  onRegenerateMissions,
  onNavigateTab,
  onResolveDebt,
  onOpenUploadMaterial,
  onTakeAssessment,
}) => {
  const [resolvingDebt, setResolvingDebt] = useState<AcademicDebt | null>(null);
  const [resolveEvidence, setResolveEvidence] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const activeDebts = debts.filter((d) => d.status !== 'resolved');
  const readyAssessments = assessments.filter((a) => a.status === 'ready');
  const pendingMissions = missions.filter((m) => m.status !== 'completed');
  const completedMissions = missions.filter((m) => m.status === 'completed');

  const todayStudyMinutesCompleted = completedMissions.reduce(
    (acc, m) => acc + (m.completed_minutes || m.estimated_duration_minutes || 0),
    0
  );
  const todayStudyMinutesPlanned = missions.reduce(
    (acc, m) => acc + (m.estimated_duration_minutes || 45),
    0
  );

  const getPressureBadge = (band: string) => {
    switch (band) {
      case 'Critical':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'High Pressure':
        return 'bg-rose-900/40 text-rose-300 border-rose-700/60';
      case 'At Risk':
        return 'bg-amber-900/40 text-amber-300 border-amber-700/60';
      case 'Watch':
        return 'bg-sky-900/40 text-sky-300 border-sky-700/60';
      default:
        return 'bg-emerald-900/40 text-emerald-300 border-emerald-700/60';
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerateMissions();
    } finally {
      setTimeout(() => setIsRegenerating(false), 600);
    }
  };

  return (
    <div id="today-view-root" className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* HERO COMMAND CENTER BANNER */}
      <div
        id="today-hero-banner"
        className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800/90 text-white p-6 sm:p-8 shadow-xl shadow-slate-950/20"
      >
        {/* Background decorative glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono font-bold tracking-widest text-amber-400 uppercase bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full">
                Target CGPA: {profile.target_cgpa.toFixed(2)}
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                {semester.title} • Week {semester.current_week} of {semester.total_weeks}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Good day, <span className="text-amber-300">{profile.name}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {pressure.next_mandatory_action ||
                'Complete today’s prioritized active-recall study missions to maintain your academic trajectory.'}
            </p>
          </div>

          {/* Vitals Quick Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4 shrink-0">
            {/* Academic Health Card */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-left space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Academic Health</span>
                <GraduationCap className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                {academicHealth}
                <span className="text-xs font-normal text-slate-500">/100</span>
              </div>
              <div className="text-[10px] font-bold text-emerald-400 flex items-center">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                First-Class Floor
              </div>
            </div>

            {/* Pressure State Card */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-left space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Pressure Index</span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-amber-300">
                {pressure.score}
                <span className="text-xs font-normal text-slate-500">/100</span>
              </div>
              <div className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${getPressureBadge(pressure.band)}`}>
                {pressure.band}
              </div>
            </div>
          </div>
        </div>

        {/* Pressure Component Risk Matrix Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-left">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Deadline Risk</span>
            <div className="text-xs font-bold font-mono text-white">{pressure.components.deadline_risk}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-sky-400 h-full rounded-full" style={{ width: `${pressure.components.deadline_risk}%` }} />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Debt Risk</span>
            <div className="text-xs font-bold font-mono text-white">{pressure.components.debt_risk}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-rose-400 h-full rounded-full" style={{ width: `${pressure.components.debt_risk}%` }} />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Mastery Risk</span>
            <div className="text-xs font-bold font-mono text-white">{pressure.components.mastery_risk}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: `${pressure.components.mastery_risk}%` }} />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Consistency</span>
            <div className="text-xs font-bold font-mono text-white">{pressure.components.consistency_risk}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${pressure.components.consistency_risk}%` }} />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Assessment Risk</span>
            <div className="text-xs font-bold font-mono text-white">{pressure.components.assessment_risk}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-purple-400 h-full rounded-full" style={{ width: `${pressure.components.assessment_risk}%` }} />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Goal Gap Risk</span>
            <div className="text-xs font-bold font-mono text-white">{pressure.components.goal_gap_risk}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${pressure.components.goal_gap_risk}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTION HUB */}
      <div id="today-action-hub" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => {
            if (pendingMissions[0]) {
              onStartSession(pendingMissions[0]);
            }
          }}
          disabled={pendingMissions.length === 0}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-amber-400 hover:shadow-md transition-all text-left group disabled:opacity-50"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Play className="w-4 h-4 fill-amber-500 text-amber-500" />
          </div>
          <div className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
            Start Next Mission
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {pendingMissions[0] ? pendingMissions[0].course_code : 'All done today'}
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('review')}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-rose-300 hover:shadow-md transition-all text-left group"
        >
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xs font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
            Resolve Debts
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {activeDebts.length} active deficit items
          </div>
        </button>

        <button
          onClick={() => {
            if (readyAssessments[0]) {
              onTakeAssessment(readyAssessments[0]);
            } else {
              onNavigateTab('review');
            }
          }}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-sky-300 hover:shadow-md transition-all text-left group"
        >
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Target className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xs font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
            Take Diagnostic Test
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {readyAssessments.length} ready for testing
          </div>
        </button>

        <button
          onClick={() => onOpenUploadMaterial()}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-purple-300 hover:shadow-md transition-all text-left group"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <UploadCloud className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
            Upload Syllabus / PDF
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Auto-extract topics</div>
        </button>
      </div>

      {/* MAIN TWO COLUMN LAYOUT: DAILY MISSIONS & CRITICAL DEBTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: DAILY STUDY MISSIONS */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Execution Plan</span>
                <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full">
                  {completedMissions.length}/{missions.length} Finished
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">Today's Study Missions</h2>
            </div>

            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-amber-500' : ''}`} />
              <span>{isRegenerating ? 'Generating...' : 'Re-plan Missions'}</span>
            </button>
          </div>

          {/* Time Progress Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-600 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                Study Budget Today
              </span>
              <span className="text-slate-900">
                {todayStudyMinutesCompleted} / {todayStudyMinutesPlanned} mins
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${todayStudyMinutesPlanned > 0 ? Math.min(100, Math.round((todayStudyMinutesCompleted / todayStudyMinutesPlanned) * 100)) : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Missions List */}
          <div className="space-y-3">
            {missions.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">All study missions complete</p>
                <p className="text-xs text-slate-500 mt-1">
                  You have satisfied today's deterministic academic floor.
                </p>
              </div>
            ) : (
              missions.map((mission) => {
                const isDone = mission.status === 'completed';
                const topicObj = topics.find((t) => t.id === mission.topic_id);
                const currentMastery = topicObj?.mastery?.overall || 50;

                return (
                  <div
                    key={mission.id}
                    className={`p-5 bg-white rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isDone
                        ? 'border-emerald-200 bg-emerald-50/20 opacity-80'
                        : 'border-slate-200/90 shadow-xs hover:shadow-md hover:border-amber-300'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-900 text-amber-300">
                          {mission.course_code}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {mission.estimated_duration_minutes} Mins
                        </span>
                        <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          Mastery: {currentMastery}%
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        {mission.topic_name}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2">
                        {mission.description ||
                          'Active recall self-explanation followed by timed multi-step practice drill.'}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center space-x-2">
                      {isDone ? (
                        <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Cleared</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => onStartSession(mission)}
                          className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
                        >
                          <Play className="w-3.5 h-3.5 fill-amber-300" />
                          <span>Launch Session</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT 1 COL: ACTIVE DEBTS & COURSE RISKS */}
        <div className="space-y-6">
          {/* Active Debt Ledger Card */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-1.5 text-rose-600">
                  <AlertOctagon className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Active Academic Debts</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeDebts.length} unresolved knowledge deficits
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('review')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center"
              >
                <span>All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {activeDebts.length === 0 ? (
                <div className="p-4 text-center bg-slate-50 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                  <div className="text-xs font-bold text-slate-700">Zero Academic Debt</div>
                  <div className="text-[11px] text-slate-400">All topic competencies intact</div>
                </div>
              ) : (
                activeDebts.slice(0, 3).map((debt) => (
                  <div
                    key={debt.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-slate-900 text-white">
                        {debt.course_code}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                        {debt.severity}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-900 line-clamp-1">{debt.title}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{debt.reason}</div>

                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono">
                        Est. {debt.estimated_recovery_minutes}m
                      </span>
                      <button
                        onClick={() => {
                          setResolveEvidence('');
                          setResolvingDebt(debt);
                        }}
                        className="text-[11px] font-bold text-amber-700 hover:text-amber-800 underline"
                      >
                        Resolve with Evidence
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Course Risk & Mastery Card */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Courses at a Glance</h3>
                <p className="text-xs text-slate-500 mt-0.5">Syllabus mastery index</p>
              </div>
              <button
                onClick={() => onNavigateTab('courses')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center"
              >
                <span>Catalog</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {courses.map((c) => {
                const cTopics = topics.filter((t) => t.course_id === c.id);
                const avgMastery =
                  cTopics.length > 0
                    ? Math.round(
                        cTopics.reduce((acc, t) => acc + (t.mastery?.overall || 0), 0) / cTopics.length
                      )
                    : 0;

                return (
                  <div
                    key={c.id}
                    onClick={() => onSelectCourse(c)}
                    className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="font-mono font-bold text-xs text-slate-900 group-hover:text-amber-700">
                          {c.code}
                        </span>
                      </div>
                      <span className="text-xs font-black font-mono text-slate-900">
                        {avgMastery}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${
                          avgMastery >= 70 ? 'bg-emerald-500' : avgMastery >= 50 ? 'bg-sky-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${avgMastery}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* RESOLVE DEBT MODAL */}
      {resolvingDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Resolve Academic Debt: {resolvingDebt.title}
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
                onClick={() => setResolvingDebt(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onResolveDebt(resolvingDebt.id, resolveEvidence || 'Remediated via evidence drill');
                  setResolvingDebt(null);
                }}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
