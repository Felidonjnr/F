import React from 'react';
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  GraduationCap,
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
  StudentProfile,
  StudyMission,
  Topic,
} from '../../types';

interface AnalyticsViewProps {
  profile: StudentProfile;
  courses: Course[];
  topics: Topic[];
  debts: AcademicDebt[];
  missions: StudyMission[];
  assessments: Assessment[];
  errors: ErrorEvent[];
  pressure: PressureBreakdown;
  academicHealth: number;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  profile,
  courses,
  topics,
  debts,
  missions,
  assessments,
  errors,
  pressure,
  academicHealth,
}) => {
  const avgDimensions = {
    recall: topics.length ? Math.round(topics.reduce((s, t) => s + (t.mastery?.recall || 0), 0) / topics.length) : 0,
    conceptual: topics.length ? Math.round(topics.reduce((s, t) => s + (t.mastery?.conceptual || 0), 0) / topics.length) : 0,
    procedural: topics.length ? Math.round(topics.reduce((s, t) => s + (t.mastery?.procedural || 0), 0) / topics.length) : 0,
    application: topics.length ? Math.round(topics.reduce((s, t) => s + (t.mastery?.application || 0), 0) / topics.length) : 0,
    transfer: topics.length ? Math.round(topics.reduce((s, t) => s + (t.mastery?.transfer || 0), 0) / topics.length) : 0,
  };

  const totalStudyMinutes = missions
    .filter((m) => m.status === 'completed')
    .reduce((sum, m) => sum + (m.completed_minutes || m.estimated_duration_minutes), 0);

  const gradedAssessments = assessments.filter((a) => a.status === 'graded');
  const avgAssessmentScore = gradedAssessments.length > 0
    ? Math.round(
        gradedAssessments.reduce(
          (sum, a) => sum + (a.diagnostic_report?.overall_score ?? (a.score && a.max_score ? (a.score / a.max_score) * 100 : 0)),
          0
        ) / gradedAssessments.length
      )
    : 80;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Deep Diagnostics</span>
            <span className="text-xs font-bold px-2 py-0.5 bg-slate-900 text-amber-300 rounded-full">
              Target CGPA: {profile.target_cgpa}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Academic Analytics & Forecast Engine</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Holistic intelligence on cognitive skill dimensions, consistency curves, error types, and exam trajectory.
          </p>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Health Index</span>
            <GraduationCap className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{academicHealth} <span className="text-xs font-normal text-slate-400">/ 100</span></div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">First-Class Trajectory</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Current Pressure</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{pressure.score} <span className="text-xs font-normal text-slate-400">({pressure.band})</span></div>
          <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">Deterministic v1.0</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Time Executed</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{totalStudyMinutes} <span className="text-xs font-normal text-slate-400">mins</span></div>
          <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">Study Missions</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Diagnostic Score</span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{avgAssessmentScore}%</div>
          <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">Verified Evidence</span>
        </div>
      </div>

      {/* 5-Dimension Cognitive Radar / Progress Panel */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">5-Dimensional Cognitive Mastery Spectrum</h3>
            <p className="text-xs text-slate-500">
              Aggregated across all {topics.length} topics in your semester knowledge graph.
            </p>
          </div>
        </div>

        <div className="space-y-3.5">
          <div>
            <div className="flex justify-between text-xs font-bold mb-1 text-slate-800">
              <span>1. Active Recall (Definitions, Equations, Constants)</span>
              <span className="text-sky-600">{avgDimensions.recall}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${avgDimensions.recall}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1 text-slate-800">
              <span>2. Conceptual Reasoning (Physical Intuition, Governing Assumptions)</span>
              <span className="text-indigo-600">{avgDimensions.conceptual}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${avgDimensions.conceptual}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1 text-slate-800">
              <span>3. Procedural Execution (Calculations, Derivations, Proof Steps)</span>
              <span className="text-amber-600">{avgDimensions.procedural}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${avgDimensions.procedural}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1 text-slate-800">
              <span>4. Application (Multi-Step Problems, Real-World Scenarios)</span>
              <span className="text-purple-600">{avgDimensions.application}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${avgDimensions.application}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1 text-slate-800">
              <span>5. Transfer & Synthesis (Cross-Topic Synthesis, Novel Exam Questions)</span>
              <span className="text-emerald-600">{avgDimensions.transfer}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${avgDimensions.transfer}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Course Breakdown Table */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">Course Risk & GPA Contribution Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Course</th>
                <th className="p-3">Units</th>
                <th className="p-3">Weight</th>
                <th className="p-3">Topics</th>
                <th className="p-3">Mastery</th>
                <th className="p-3">Target</th>
                <th className="p-3">Projected Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {courses.map((course) => {
                const cTopics = topics.filter((t) => t.course_id === course.id);
                const score = cTopics.length
                  ? Math.round(cTopics.reduce((acc, t) => acc + (t.mastery?.overall || 0), 0) / cTopics.length)
                  : 50;

                const projectedGrade = score >= 70 ? 'A' : score >= 60 ? 'B' : score >= 50 ? 'C' : 'F';

                return (
                  <tr key={course.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900 font-mono">
                      <span className="mr-2 inline-block w-2 h-2 rounded-full" style={{ backgroundColor: course.color }} />
                      {course.code}
                    </td>
                    <td className="p-3">{course.units}</td>
                    <td className="p-3">{course.priority_weight} / 5</td>
                    <td className="p-3">{cTopics.length}</td>
                    <td className="p-3 font-bold">{score}%</td>
                    <td className="p-3">{course.target_grade}</td>
                    <td className="p-3 font-black">
                      <span
                        className={`px-2 py-0.5 rounded ${
                          projectedGrade === 'A' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        Grade {projectedGrade}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
