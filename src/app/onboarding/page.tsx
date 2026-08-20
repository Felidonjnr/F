import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Layers,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import { OnboardingState } from '../../types';

const INITIAL_ONBOARDING_STATE: OnboardingState = {
  step: 1,
  profile: {
    name: 'Godshand Udoh',
    department: 'Electrical & Electronics Engineering',
    level: '300 Level',
    target_cgpa: 4.75,
    scale_cgpa: 5.0,
    weekly_available_hours: 25,
  },
  semester: {
    name: 'Harmattan 2026 Semester',
    start_date: '2026-09-01',
    end_date: '2026-12-20',
    exam_start_date: '2026-12-01',
  },
  courses: [
    { code: 'MTH 311', name: 'Advanced Engineering Mathematics III', units: 3, priority_weight: 5, target_grade: 'A' },
    { code: 'EEE 311', name: 'Electric Circuit Theory & Analysis', units: 3, priority_weight: 4, target_grade: 'A' },
    { code: 'EEE 313', name: 'Physical Electronics & Solid State', units: 3, priority_weight: 4, target_grade: 'A' },
    { code: 'CPE 315', name: 'Microprocessor Systems Architecture', units: 3, priority_weight: 4, target_grade: 'A' },
  ],
  outlines: [
    { course_code: 'MTH 311', topics_count: 8, source: 'Syllabus Extracted' },
    { course_code: 'EEE 311', topics_count: 7, source: 'Syllabus Extracted' },
    { course_code: 'EEE 313', topics_count: 6, source: 'Syllabus Extracted' },
    { course_code: 'CPE 315', topics_count: 8, source: 'Syllabus Extracted' },
  ],
};

const ONBOARDING_STORAGE_KEY = 'firstclass_onboarding';

export default function OnboardingPage() {
  const [data, setData] = useState<OnboardingState>(() => {
    try {
      const saved = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return INITIAL_ONBOARDING_STATE;
  });

  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseUnits, setNewCourseUnits] = useState(3);

  // Sync to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }, [data]);

  const step = data.step || 1;

  const setStep = (s: number) => {
    setData((prev) => ({ ...prev, step: s }));
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleAddCourse = () => {
    if (!newCourseCode.trim()) return;
    const newCourse = {
      code: newCourseCode.toUpperCase().trim(),
      name: newCourseName.trim() || newCourseCode.toUpperCase().trim(),
      units: Number(newCourseUnits) || 3,
      priority_weight: 3,
      target_grade: 'A' as const,
    };
    setData((prev) => ({
      ...prev,
      courses: [...prev.courses, newCourse],
    }));
    setNewCourseCode('');
    setNewCourseName('');
  };

  const handleRemoveCourse = (idx: number) => {
    setData((prev) => ({
      ...prev,
      courses: prev.courses.filter((_, i) => i !== idx),
    }));
  };

  const handleGeneratePlan = () => {
    // Save onboarding completion
    try {
      localStorage.setItem('firstclass_onboarding_done', 'true');
      localStorage.setItem(
        'firstclass_profile',
        JSON.stringify({
          id: 'user-godshand',
          name: data.profile.name,
          department: data.profile.department,
          level: data.profile.level,
          current_cgpa: 4.38,
          target_cgpa: data.profile.target_cgpa,
          scale_cgpa: data.profile.scale_cgpa,
          weekly_available_minutes: data.profile.weekly_available_hours * 60,
          streak_days: 14,
          onboarding_completed: true,
        })
      );
    } catch {
      // ignore
    }

    // Redirect to Today screen (S1)
    window.location.href = '/';
  };

  const stepTitles = [
    'Academic Profile',
    'Semester Timeline',
    'Course Roster',
    'Topic Outlines',
    'Generate Plan',
  ];

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col justify-between p-4 sm:p-6">
      <div className="max-w-2xl mx-auto w-full space-y-6 pt-4">
        {/* Header Branding */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold font-mono text-sm">
              F1
            </div>
            <div>
              <h1 className="font-bold text-sm text-white font-mono uppercase tracking-tight">
                FIRSTCLASS OS SETUP
              </h1>
              <p className="text-[11px] text-slate-400 font-mono">
                Step {step} of 5: {stepTitles[step - 1]}
              </p>
            </div>
          </div>

          <span className="text-xs font-mono text-amber-400 font-bold bg-amber-950/40 border border-amber-800/40 px-2.5 py-1 rounded-md">
            {Math.round((step / 5) * 100)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300 rounded-full"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Step 1: Profile */}
        {step === 1 && (
          <div className="space-y-4 rounded-2xl bg-[#0f1422] border border-slate-800 p-6">
            <div>
              <h2 className="text-base font-bold text-white font-mono">
                Student Academic Profile
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your academic parameters for adaptive workload calibration.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={data.profile.name}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      profile: { ...prev.profile, name: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={data.profile.department}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      profile: { ...prev.profile, department: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Academic Level
                </label>
                <input
                  type="text"
                  value={data.profile.level}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      profile: { ...prev.profile, level: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Target CGPA
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={data.profile.target_cgpa}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      profile: { ...prev.profile, target_cgpa: Number(e.target.value) },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Weekly Available Study Hours
                </label>
                <input
                  type="number"
                  value={data.profile.weekly_available_hours}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      profile: { ...prev.profile, weekly_available_hours: Number(e.target.value) },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Semester Timeline */}
        {step === 2 && (
          <div className="space-y-4 rounded-2xl bg-[#0f1422] border border-slate-800 p-6">
            <div>
              <h2 className="text-base font-bold text-white font-mono">
                Semester Timeline
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure key milestones to drive deadline and pressure algorithms.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Semester Name
                </label>
                <input
                  type="text"
                  value={data.semester.name}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      semester: { ...prev.semester, name: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Semester Start Date
                </label>
                <input
                  type="date"
                  value={data.semester.start_date}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      semester: { ...prev.semester, start_date: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Exam Start Date
                </label>
                <input
                  type="date"
                  value={data.semester.exam_start_date}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      semester: { ...prev.semester, exam_start_date: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Courses */}
        {step === 3 && (
          <div className="space-y-4 rounded-2xl bg-[#0f1422] border border-slate-800 p-6">
            <div>
              <h2 className="text-base font-bold text-white font-mono">
                Course Roster
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                List the courses enrolled for this academic term.
              </p>
            </div>

            {/* Course List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {data.courses.map((c, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400">{c.code}</span>
                      <span className="text-xs text-slate-400 font-mono">({c.units} Units)</span>
                    </div>
                    <p className="text-xs text-slate-300 truncate">{c.name}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveCourse(idx)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors ml-2"
                    title="Remove course"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Course Input */}
            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Code (e.g. MTH 311)"
                value={newCourseCode}
                onChange={(e) => setNewCourseCode(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100"
              />
              <input
                type="text"
                placeholder="Course Name"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Units"
                  value={newCourseUnits}
                  onChange={(e) => setNewCourseUnits(Number(e.target.value))}
                  className="w-16 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100 text-center"
                />
                <button
                  onClick={handleAddCourse}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-mono text-slate-200 font-semibold"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Outlines */}
        {step === 4 && (
          <div className="space-y-4 rounded-2xl bg-[#0f1422] border border-slate-800 p-6">
            <div>
              <h2 className="text-base font-bold text-white font-mono">
                Topic Outlines & Syllabi
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Outlines prepared for curriculum topic trees and retrieval chunking.
              </p>
            </div>

            <div className="space-y-2.5">
              {data.courses.map((c, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {c.code}
                    </span>
                    <h4 className="text-xs text-slate-200 mt-0.5">{c.name}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                      Ready (7 topics)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Generate */}
        {step === 5 && (
          <div className="space-y-6 rounded-2xl bg-[#0f1422] border border-slate-800 p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white font-mono">
                Ready to Generate Plan
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Your target CGPA of {data.profile.target_cgpa} across {data.courses.length} courses
                will be synthesized into calibrated daily study queues.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleGeneratePlan}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm font-mono transition-colors shadow-lg shadow-amber-500/20"
              >
                Generate My Semester Plan
              </button>
            </div>
          </div>
        )}

        {/* Navigation Buttons (Back & Next) */}
        <div className="flex items-center justify-between pt-2">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 5 && (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold transition-colors"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
