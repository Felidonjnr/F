import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  GraduationCap,
  RotateCcw,
  Save,
  Settings,
  ShieldAlert,
  Sparkles,
  User,
} from 'lucide-react';
import { StudentProfile } from '../../types';

interface SettingsViewProps {
  profile: StudentProfile;
  onUpdateProfile: (updated: Partial<StudentProfile>) => void;
  onResetFactorySeed: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateProfile,
  onResetFactorySeed,
}) => {
  const [name, setName] = useState(profile.name);
  const [institution, setInstitution] = useState(profile.institution);
  const [department, setDepartment] = useState(profile.department);
  const [level, setLevel] = useState(profile.level);
  const [targetCgpa, setTargetCgpa] = useState(profile.target_cgpa);
  const [currentCgpa, setCurrentCgpa] = useState(profile.current_cgpa);
  const [weeklyMinutes, setWeeklyMinutes] = useState(profile.weekly_available_minutes);
  const [accountabilityLevel, setAccountabilityLevel] = useState(profile.accountability_level);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name,
      institution,
      department,
      level,
      target_cgpa: Number(targetCgpa),
      current_cgpa: Number(currentCgpa),
      weekly_available_minutes: Number(weeklyMinutes),
      accountability_level: accountabilityLevel,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">System Preferences</span>
            <span className="text-xs font-bold px-2 py-0.5 bg-slate-900 text-white rounded-full">
              Level: {profile.level}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Student Profile & Accountability Engine</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure target CGPA goals, weekly study hour commitments, and accountability strictness.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-6">
        {savedSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center space-x-2 font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Profile and accountability settings saved successfully.</span>
          </div>
        )}

        {/* Section 1: Academic Identity */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
            <User className="w-3.5 h-3.5" />
            <span>Academic Identity</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Institution / University
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Department / Program
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Academic Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
              >
                <option value="100 Level">100 Level (Freshman)</option>
                <option value="200 Level">200 Level (Sophomore)</option>
                <option value="300 Level">300 Level (Junior)</option>
                <option value="400 Level">400 Level (Senior)</option>
                <option value="500 Level">500 Level (Final Year)</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: CGPA & Goal Calibration */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>CGPA Goal Calibration (0.00 - 5.00 Scale)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Target CGPA (First Class Benchmark = 4.50+)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="5.00"
                value={targetCgpa}
                onChange={(e) => setTargetCgpa(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Current Cumulative CGPA
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="5.00"
                value={currentCgpa}
                onChange={(e) => setCurrentCgpa(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Study Capacity & Strictness */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Accountability & Capacity Engine</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Weekly Study Capacity ({Math.round(weeklyMinutes / 60)} Hours / Week)
              </label>
              <input
                type="number"
                min={300}
                max={3000}
                step={60}
                value={weeklyMinutes}
                onChange={(e) => setWeeklyMinutes(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Used to mathematically constrain daily mission generation (~{Math.round(weeklyMinutes / 7)} mins/day).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Accountability Strictness
              </label>
              <select
                value={accountabilityLevel}
                onChange={(e) => setAccountabilityLevel(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
              >
                <option value="Gentle">Gentle — Reminders only</option>
                <option value="Moderate">Moderate — Warning badges on overdue debts</option>
                <option value="Strict">Strict — Auto-schedules mandatory debt recovery</option>
                <option value="Hardcore">Hardcore — Maximum pressure sensitivity & strict floor</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (confirm('Reset entire system to factory sample dataset? This cannot be undone.')) {
                onResetFactorySeed();
              }
            }}
            className="flex items-center space-x-1.5 text-xs text-rose-600 hover:text-rose-700 font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Factory Seed Data</span>
          </button>

          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
