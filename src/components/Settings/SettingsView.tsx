import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  GraduationCap,
  LogOut,
  RotateCcw,
  Save,
  Settings,
  ShieldAlert,
  Sparkles,
  User,
} from 'lucide-react';
import { RetrievalHealth, StudentProfile } from '../../types';
import { getSupabaseClient } from '../../services/supabase';
import { Badge, Button, Card, Dialog } from '../ui';

interface SettingsViewProps {
  profile: StudentProfile;
  onUpdateProfile: (updated: Partial<StudentProfile>) => void;
  onResetFactorySeed: () => void;
  onSignOut?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateProfile,
  onResetFactorySeed,
  onSignOut,
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
  const [signingOut, setSigningOut] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [retrievalHealth, setRetrievalHealth] = useState<RetrievalHealth | null>(null);

  useEffect(() => {
    fetch('/api/ai/retrieve/health')
      .then((r) => r.json())
      .then((d) => setRetrievalHealth(d))
      .catch(() => {});
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const client = getSupabaseClient();
      if (client) {
        await client.auth.signOut();
      }
      if (onSignOut) {
        onSignOut();
      }
    } catch (e) {
      console.error('Sign out error:', e);
    } finally {
      setSigningOut(false);
    }
  };

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
    <div id="settings-view-root" className="max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Banner */}
      <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
              System Preferences
            </span>
            <Badge variant="secondary" size="sm">
              Level: {profile.level}
            </Badge>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Student Profile & Calibration Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure target CGPA goals, weekly study hour commitments, and accountability strictness.
          </p>
          {retrievalHealth && (
            <div className="mt-2 inline-flex items-center space-x-1.5 text-[11px] font-mono text-slate-500 bg-slate-100/80 border border-slate-200/80 px-2.5 py-0.5 rounded-md">
              <Database className="w-3 h-3 text-slate-400 shrink-0" />
              <span>
                Indexed: <strong className="text-slate-700 font-semibold">{retrievalHealth.keywordChunks}</strong> chunks | Embeddings:{' '}
                <strong className={retrievalHealth.hasEmbeddings ? 'text-emerald-600 font-semibold' : 'text-slate-600 font-semibold'}>
                  {retrievalHealth.hasEmbeddings ? 'on' : 'off'}
                </strong>{' '}
                | Gemini key:{' '}
                <strong className={retrievalHealth.geminiConfigured ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                  {retrievalHealth.geminiConfigured ? 'configured' : 'missing'}
                </strong>
              </span>
            </div>
          )}
        </div>
      </Card>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Academic Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Gentle">Gentle — Reminders only</option>
                  <option value="Moderate">Moderate — Warning badges on overdue debts</option>
                  <option value="Strict">Strict — Auto-schedules mandatory debt recovery</option>
                  <option value="Hardcore">Hardcore — Maximum pressure sensitivity & strict floor</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit & Session Controls */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center space-x-1.5 text-xs text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Factory Seed</span>
              </button>

              <span className="text-slate-300">|</span>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500" />
                <span>{signingOut ? 'Signing Out...' : 'Sign Out of FirstClass OS'}</span>
              </button>
            </div>

            <Button
              variant="default"
              size="md"
              type="submit"
            >
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </Button>
          </div>
        </Card>
      </form>

      {/* RESET CONFIRM DIALOG */}
      <Dialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Reset to Factory Dataset?"
        description="This will restore all default engineering courses, topics, sample diagnostic tests, and mastery data. Any custom edits will be reset."
      >
        <div className="flex justify-end space-x-3 pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowResetConfirm(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onResetFactorySeed();
              setShowResetConfirm(false);
            }}
          >
            Yes, Reset Dataset
          </Button>
        </div>
      </Dialog>
    </div>
  );
};
