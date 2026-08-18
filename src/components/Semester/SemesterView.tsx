import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Flame,
  Layers,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { Course, Semester, StudentProfile, Topic } from '../../types';

interface SemesterViewProps {
  semester: Semester;
  courses: Course[];
  topics: Topic[];
  profile: StudentProfile;
  onUpdateSemester: (updated: Partial<Semester>) => void;
}

export const SemesterView: React.FC<SemesterViewProps> = ({
  semester,
  courses,
  topics,
  profile,
  onUpdateSemester,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(semester.name);
  const [startDate, setStartDate] = useState(semester.start_date);
  const [endDate, setEndDate] = useState(semester.end_date);
  const [examStartDate, setExamStartDate] = useState(semester.exam_start_date);
  const [examEndDate, setExamEndDate] = useState(semester.exam_end_date);
  const [floorMastery, setFloorMastery] = useState(semester.academic_floor_mastery);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSemester({
      name,
      start_date: startDate,
      end_date: endDate,
      exam_start_date: examStartDate,
      exam_end_date: examEndDate,
      academic_floor_mastery: floorMastery,
    });
    setIsEditing(false);
  };

  const totalWeeks = Math.max(
    1,
    Math.round(
      (new Date(semester.end_date).getTime() - new Date(semester.start_date).getTime()) /
        (7 * 86400000)
    )
  );

  const daysToExams = Math.max(
    0,
    Math.round((new Date(semester.exam_start_date).getTime() - Date.now()) / 86400000)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Macro Planning</span>
            <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full border border-amber-300">
              {daysToExams} Days to Final Exams
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">{semester.name} Master Blueprint</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous semester timeline, exam windows, weekly milestones, and academic floor enforcement.
          </p>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl shadow-xs transition-all"
        >
          <Edit3 className="w-4 h-4" />
          <span>{isEditing ? 'Cancel Edit' : 'Edit Semester Config'}</span>
        </button>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <form
          onSubmit={handleSave}
          className="p-5 bg-white border border-slate-200 rounded-2xl shadow-md space-y-4 animate-in fade-in"
        >
          <h3 className="font-bold text-slate-900 text-sm">Update Semester Boundaries</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Semester Title
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Academic Floor Mastery Threshold (%)
              </label>
              <input
                type="number"
                min={40}
                max={90}
                value={floorMastery}
                onChange={(e) => setFloorMastery(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Exam Start
              </label>
              <input
                type="date"
                value={examStartDate}
                onChange={(e) => setExamStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Exam End
              </label>
              <input
                type="date"
                value={examEndDate}
                onChange={(e) => setExamEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-slate-900 text-amber-300 hover:bg-slate-800 rounded-xl shadow-xs"
            >
              Save Timeline Settings
            </button>
          </div>
        </form>
      )}

      {/* 4 Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Total Duration</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalWeeks} Weeks</div>
          <span className="text-xs text-slate-500">{semester.start_date} to {semester.end_date}</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Exam Countdown</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{daysToExams} Days</div>
          <span className="text-xs text-slate-500">Commences {semester.exam_start_date}</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Academic Floor</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{semester.academic_floor_mastery}%</div>
          <span className="text-xs text-slate-500">Enforced Minimum Mastery</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Total Credit Load</div>
          <div className="text-2xl font-black text-sky-600 mt-1">
            {courses.reduce((sum, c) => sum + c.units, 0)} Units
          </div>
          <span className="text-xs text-slate-500">{courses.length} Registered Courses</span>
        </div>
      </div>

      {/* Visual Semester Timeline & Milestones */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">Academic Rhythm & Milestones</h3>

        <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6">
          <div className="relative">
            <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
            <h4 className="text-xs font-bold uppercase text-emerald-700">Phase 1: Syllabus Ingestion & Core Foundation</h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Extract lecture notes, define topic knowledge graph, establish initial recall baseline.
            </p>
          </div>

          <div className="relative">
            <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-sky-500 ring-4 ring-sky-100" />
            <h4 className="text-xs font-bold uppercase text-sky-700">Phase 2: Continuous Daily Missions & Checkpoints</h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Execute daily adaptive missions. Clear emerging academic debts within 48-72 hours.
            </p>
          </div>

          <div className="relative">
            <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-amber-500 ring-4 ring-amber-100" />
            <h4 className="text-xs font-bold uppercase text-amber-700">Phase 3: High-Yield Mock Examinations & Pre-Exam Synthesis</h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Full timed past question mocks, cross-topic transfer drills, and zero-debt enforcement.
            </p>
          </div>

          <div className="relative">
            <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-rose-500 ring-4 ring-rose-100" />
            <h4 className="text-xs font-bold uppercase text-rose-700">Phase 4: University Final Examination Window</h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Final execution with verified 80%+ mastery across all enrolled credit units.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
