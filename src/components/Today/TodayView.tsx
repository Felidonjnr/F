import React, { useState } from 'react';
import {
  AlertOctagon,
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
  X,
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
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Dialog,
  Gauge,
  ProgressRing,
} from '../ui';

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
  onOpenAddCourse?: () => void;
  onOpenAddAssessment?: () => void;
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
  onOpenAddCourse,
  onOpenAddAssessment,
}) => {
  const [resolvingDebt, setResolvingDebt] = useState<AcademicDebt | null>(null);
  const [resolveEvidence, setResolveEvidence] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showQuickActionMenu, setShowQuickActionMenu] = useState(false);
  const [dismissedHero, setDismissedHero] = useState(false);

  const activeDebts = debts.filter((d) => d.status !== 'resolved');
  const pendingMissions = missions.filter((m) => m.status !== 'completed');
  const completedMissions = missions.filter((m) => m.status === 'completed');

  const topMission = pendingMissions[0] || missions[0];

  const todayStudyMinutesCompleted = completedMissions.reduce(
    (acc, m) => acc + (m.completed_minutes || m.estimated_duration_minutes || 0),
    0
  );
  const todayStudyMinutesPlanned = missions.reduce(
    (acc, m) => acc + (m.estimated_duration_minutes || 45),
    0
  );

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerateMissions();
    } finally {
      setTimeout(() => setIsRegenerating(false), 400);
    }
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div id="today-view-root" className="max-w-5xl mx-auto space-y-7 pb-16 animate-in fade-in duration-200">
      {/* 1. GREETING + DATE LINE (Small & Clean) */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Good day, {profile.name.split(' ')[0]}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {formattedDate} • {semester.title} (Week {semester.current_week} of {semester.total_weeks})
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="accent" size="sm">
            Target CGPA: {profile.target_cgpa.toFixed(2)}
          </Badge>
          <Badge variant="secondary" size="sm">
            Floor: {Math.round(profile.weekly_available_minutes / 60)}h/wk
          </Badge>
        </div>
      </div>

      {/* 2. PRESSURE GAUGE + HEALTH RING (Side by side on desktop, stacked on mobile) */}
      <section id="today-gauges-panel" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Deterministic Pressure Gauge */}
        <Card className="p-5 sm:p-6 flex flex-col items-center justify-between text-center relative overflow-hidden">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Deterministic Pressure Engine
            </span>
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

          <Gauge value={pressure.score} band={pressure.band} size={190} showDetails={false} />

          <p className="text-xs text-slate-500 max-w-xs mt-2 leading-relaxed">
            {pressure.score >= 70
              ? 'Urgent attention required. Deficits threaten your First-Class target floor.'
              : pressure.score >= 40
              ? 'Balanced velocity. Maintain steady active recall to prevent debt escalation.'
              : 'Optimal academic flow. Prerequisite mastery thresholds are currently satisfied.'}
          </p>
        </Card>

        {/* Right: Academic Health Ring */}
        <Card className="p-5 sm:p-6 flex flex-col items-center justify-between text-center relative overflow-hidden">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Academic Health Score
            </span>
            <Badge variant="stable" size="sm">
              0 - 100 Index
            </Badge>
          </div>

          <div className="py-2">
            <ProgressRing
              value={academicHealth}
              size={120}
              strokeWidth={10}
              subLabel="HEALTH"
              color="#0ea5e9"
            />
          </div>

          <p className="text-xs text-slate-500 max-w-xs mt-2 leading-relaxed">
            Composite index of active mastery, syllabus velocity, consistency streak, and debt remediation.
          </p>
        </Card>
      </section>

      {/* 3. NEXT MOVE HERO CARD */}
      {!dismissedHero && (
        <section id="today-next-move-hero">
          <Card className="bg-slate-950 text-white border-slate-800 p-5 sm:p-6 shadow-xl relative overflow-hidden">
            {/* Background Accent Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Next Move Recommended
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    Pressure Band: <span className="text-amber-400">{pressure.band}</span>
                  </span>
                </div>

                {pressure.top_risk_topic && (
                  <span className="text-xs font-semibold text-rose-300 bg-rose-950/60 border border-rose-800/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    Top Risk: {pressure.top_risk_topic}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {pressure.next_mandatory_action ||
                    'Execute today’s active recall mission to maintain target CGPA velocity.'}
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  {topMission
                    ? `Immediate deliberate practice session scheduled for ${topMission.topic_name} (${topMission.course_code}).`
                    : 'All priority queues clear. Ready for exploratory synthesis or diagnostic check.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {topMission && (
                  <Button
                    variant="accent"
                    size="md"
                    onClick={() => onStartSession(topMission)}
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>Start Session Now</span>
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setDismissedHero(true)}
                  className="text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800"
                >
                  <span>Dismiss for Today</span>
                </Button>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* 4. RISK STRIP: Courses sorted by pressure contribution */}
      <section id="today-risk-strip" className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Course Risk & Pressure Strip
          </h2>
          <button
            onClick={() => onNavigateTab('courses')}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center space-x-0.5 cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {courses.map((course) => {
            const courseTopics = topics.filter((t) => t.course_id === course.id);
            const mastery = courseTopics.length
              ? Math.round(
                  courseTopics.reduce((acc, t) => acc + (t.mastery?.overall || 0), 0) /
                    courseTopics.length
                )
              : 0;

            return (
              <Card
                key={course.id}
                variant="interactive"
                onClick={() => onSelectCourse(course)}
                className="p-3.5 space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-xs text-slate-900 group-hover:text-amber-600 transition-colors">
                    {course.code}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                    {course.units}U
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium text-[11px] truncate max-w-[85px]">
                    {course.name}
                  </span>
                  <span className="font-bold font-mono text-slate-900">{mastery}%</span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      mastery >= 70
                        ? 'bg-emerald-500'
                        : mastery >= 50
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${mastery}%` }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 5. TODAY'S MISSIONS CHECKLIST & ACTIVE DEBTS QUEUE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: TODAY'S MISSIONS CHECKLIST */}
        <section id="today-missions-checklist" className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  Execution Plan
                </span>
                <Badge variant="accent" size="sm">
                  {completedMissions.length} / {missions.length} Completed
                </Badge>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">Today's Study Missions</h2>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              isLoading={isRegenerating}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </Button>
          </div>

          {/* Time tracker bar */}
          <Card className="p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-600 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                Time Executed Today
              </span>
              <span className="text-slate-900 font-mono">
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
          </Card>

          {/* Missions Items */}
          <div className="space-y-3">
            {missions.length === 0 ? (
              <Card className="p-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">All missions clear for today</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Regenerate your daily plan to generate new deliberate practice targets.
                </p>
                <Button variant="default" size="sm" onClick={handleRegenerate}>
                  Generate Missions
                </Button>
              </Card>
            ) : (
              missions.map((mission) => {
                const isDone = mission.status === 'completed';
                const topicObj = topics.find((t) => t.id === mission.topic_id);
                const currentMastery = topicObj?.mastery?.overall || 50;

                return (
                  <Card
                    key={mission.id}
                    className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-all ${
                      isDone
                        ? 'border-emerald-200 bg-emerald-50/20 opacity-75'
                        : 'hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-start space-x-3 flex-1">
                      {/* Interactive checkbox */}
                      <Checkbox
                        checked={isDone}
                        onChange={() => onStartSession(mission)}
                        className="mt-0.5"
                      />

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-900 text-amber-300">
                            {mission.course_code}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            {mission.estimated_duration_minutes} Mins
                          </span>
                          <Badge variant="secondary" size="sm">
                            Mastery: {currentMastery}%
                          </Badge>
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-slate-900">
                          {mission.topic_name}
                        </h3>

                        <p className="text-xs text-slate-500 line-clamp-2">
                          {mission.description ||
                            'Active recall self-explanation followed by timed multi-step practice drill.'}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 pt-0.5">
                      {!isDone ? (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => onStartSession(mission)}
                        >
                          <Play className="w-3 h-3 fill-amber-300" />
                          <span className="hidden sm:inline">Launch</span>
                        </Button>
                      ) : (
                        <Badge variant="stable" size="sm">
                          Done
                        </Badge>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </section>

        {/* RIGHT 1 COL: ACTIVE DEBTS QUEUE */}
        <section id="today-debt-queue" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-rose-600">
              <AlertOctagon className="w-4 h-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider">
                Active Debts ({activeDebts.length})
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('review')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center cursor-pointer"
            >
              <span>Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {activeDebts.length === 0 ? (
              <Card className="p-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                <div className="text-xs font-bold text-slate-800">Zero Academic Deficits</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  All prerequisite mastery thresholds satisfied.
                </div>
              </Card>
            ) : (
              activeDebts.map((debt) => (
                <Card
                  key={debt.id}
                  className="p-4 space-y-2 hover:border-rose-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-slate-900 text-white">
                      {debt.course_code}
                    </span>
                    <Badge
                      variant={
                        debt.severity === 'critical'
                          ? 'critical'
                          : debt.severity === 'high'
                          ? 'high'
                          : 'medium'
                      }
                      size="sm"
                    >
                      {debt.severity}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{debt.title}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{debt.reason}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">
                      ~{debt.estimated_recovery_minutes} mins
                    </span>
                    <button
                      onClick={() => {
                        setResolveEvidence('');
                        setResolvingDebt(debt);
                      }}
                      className="text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      Resolve
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>
      </div>

      {/* 6. UNIFIED FLOATING / TOP QUICK ACTION "+" BUTTON */}
      <div className="fixed bottom-20 sm:bottom-8 right-6 z-40">
        <div className="relative">
          {showQuickActionMenu && (
            <div className="absolute bottom-14 right-0 w-56 bg-slate-950 text-white rounded-2xl shadow-2xl border border-slate-800 p-2 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                Quick Actions
              </div>
              <button
                onClick={() => {
                  setShowQuickActionMenu(false);
                  onOpenUploadMaterial();
                }}
                className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 rounded-xl transition-colors text-left cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-purple-400" />
                <span>Upload Syllabus / PDF</span>
              </button>

              <button
                onClick={() => {
                  setShowQuickActionMenu(false);
                  if (onOpenAddAssessment) onOpenAddAssessment();
                  else onNavigateTab('review');
                }}
                className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 rounded-xl transition-colors text-left cursor-pointer"
              >
                <Target className="w-4 h-4 text-sky-400" />
                <span>Create Diagnostic Test</span>
              </button>

              <button
                onClick={() => {
                  setShowQuickActionMenu(false);
                  if (onOpenAddCourse) onOpenAddCourse();
                  else onNavigateTab('courses');
                }}
                className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 rounded-xl transition-colors text-left cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Add New Course</span>
              </button>
            </div>
          )}

          <button
            onClick={() => setShowQuickActionMenu(!showQuickActionMenu)}
            className="w-13 h-13 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-400/25 transition-transform active:scale-95 cursor-pointer"
            aria-label="Quick Actions"
          >
            {showQuickActionMenu ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* RESOLVE DEBT DIALOG */}
      <Dialog
        isOpen={Boolean(resolvingDebt)}
        onClose={() => setResolvingDebt(null)}
        title={`Resolve Academic Debt: ${resolvingDebt?.title}`}
        description="Provide verifiable study evidence or problem solutions demonstrating that this deficit has been remediated."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Remediation Evidence Notes
            </label>
            <textarea
              rows={4}
              value={resolveEvidence}
              onChange={(e) => setResolveEvidence(e.target.value)}
              placeholder="e.g. Completed 4 past-paper problems on Stokes theorem boundary limits with verified algebra."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setResolvingDebt(null)}>
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                if (resolvingDebt) {
                  onResolveDebt(resolvingDebt.id, resolveEvidence || 'Remediated via evidence drill');
                  setResolvingDebt(null);
                }
              }}
            >
              Confirm Resolution
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
