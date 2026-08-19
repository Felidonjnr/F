import React, { useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  Flame,
  HelpCircle,
  Loader2,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { Course, StudyMission, Topic } from '../../types';

interface ActiveSessionModalProps {
  mission: StudyMission | null;
  topic?: Topic | null;
  course?: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onCompleteSession: (params: {
    missionId: string;
    completedMinutes: number;
    notes: string;
    recalledSuccessfully: boolean;
    practiceScorePercent: number;
    confidenceRating: number;
  }) => void;
}

export const ActiveSessionModal: React.FC<ActiveSessionModalProps> = ({
  mission,
  topic,
  course,
  isOpen,
  onClose,
  onCompleteSession,
}) => {
  if (!isOpen || !mission) return null;

  const targetMinutes = mission.estimated_duration_minutes || 45;
  const [secondsRemaining, setSecondsRemaining] = useState(targetMinutes * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [activeStep, setActiveStep] = useState<'recall' | 'practice' | 'finish'>('recall');

  // Step 1: Active Recall State
  const [showRecallPrompt, setShowRecallPrompt] = useState(true);
  const [recallAnswer, setRecallAnswer] = useState('');
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [recalledSuccessfully, setRecalledSuccessfully] = useState(true);

  // Step 2: Practice & Socratic Hint State
  const [practiceNotes, setPracticeNotes] = useState('');
  const [practiceScorePercent, setPracticeScorePercent] = useState(85);
  const [showAiHint, setShowAiHint] = useState(false);
  const [aiHintLoading, setAiHintLoading] = useState(false);
  const [aiHintText, setAiHintText] = useState('');

  // Step 3: Confidence & Completion
  const [confidenceRating, setConfidenceRating] = useState(80);

  // Timer Interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, secondsRemaining]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const elapsedMinutes = Math.max(1, Math.round((targetMinutes * 60 - secondsRemaining) / 60));
  const progressPercent = Math.min(
    100,
    Math.round(((targetMinutes * 60 - secondsRemaining) / (targetMinutes * 60)) * 100)
  );

  const fetchAiSocraticHint = async () => {
    if (aiHintText) {
      setShowAiHint(!showAiHint);
      return;
    }
    setShowAiHint(true);
    setAiHintLoading(true);
    try {
      const res = await fetch('/api/ai/coach-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: `Give me a concise 2-sentence first-principles Socratic hint for practicing ${mission.topic_name} in ${mission.course_code}. Focus on physical intuition or governing constraints.`,
          context: {
            topic: mission.topic_name,
            course: mission.course_code,
          },
        }),
      });
      const data = await res.json();
      setAiHintText(
        data.reply ||
          `Always anchor on the fundamental conservation relation. In ${mission.topic_name}, observe how boundary conditions dictate the allowable eigensolutions.`
      );
    } catch {
      setAiHintText(
        `Focus on the governing relation: Verify boundary limits first before performing algebraic integration.`
      );
    } finally {
      setAiHintLoading(false);
    }
  };

  const handleFinish = () => {
    onCompleteSession({
      missionId: mission.id,
      completedMinutes: elapsedMinutes,
      notes: `${recallAnswer}\n\n${practiceNotes}`.trim(),
      recalledSuccessfully,
      practiceScorePercent,
      confidenceRating,
    });
    onClose();
  };

  return (
    <div
      id="fullscreen-focus-session"
      className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between select-none animate-in fade-in duration-200"
    >
      {/* TOP HEADER: Focus Bar */}
      <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase bg-amber-400 text-slate-950 shadow-xs">
            {mission.course_code}
          </span>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight line-clamp-1">
              {mission.topic_name}
            </h1>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Deliberate Practice • {targetMinutes} Mins Allocated
            </p>
          </div>
        </div>

        {/* Center Live Timer Display */}
        <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-2xl shadow-inner">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping mr-1" />
          <span className="font-mono text-xl sm:text-2xl font-black text-amber-300 tracking-wider">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title={isTimerRunning ? 'Pause timer' : 'Resume timer'}
          >
            {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          </button>
        </div>

        {/* Close / Abandon Button */}
        <button
          onClick={() => {
            if (confirm('Leave this focus session? Progress will not be saved.')) {
              onClose();
            }
          }}
          className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-900 transition-colors"
          title="Exit Focus Mode"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-slate-900 h-1">
        <div
          className="bg-amber-400 h-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* MAIN BODY: 3 Focused Phases */}
      <div className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center overflow-y-auto">
        {/* STEP 1: ACTIVE RECALL */}
        {activeStep === 'recall' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
                Phase 1: Blind Active Recall
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-3">
                Explain {mission.topic_name} from Memory
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Before looking at any notes, type or summarize the primary governing formula, assumptions, or core definition.
              </p>
            </div>

            <textarea
              rows={5}
              value={recallAnswer}
              onChange={(e) => setRecallAnswer(e.target.value)}
              placeholder="State the core principle, governing equation, and physical meaning..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400 leading-relaxed"
            />

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setShowModelAnswer(!showModelAnswer)}
                className="flex items-center space-x-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold"
              >
                {showModelAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{showModelAnswer ? 'Hide Reference Principles' : 'Reveal Core Principle Card'}</span>
              </button>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setRecalledSuccessfully(true);
                    setActiveStep('practice');
                  }}
                  className="px-6 py-2.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl shadow-md transition-all active:scale-95 flex items-center space-x-1.5"
                >
                  <span>Continue to Practice</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {showModelAnswer && (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2 animate-in fade-in">
                <div className="font-bold text-amber-400 uppercase text-[10px]">Reference Concept Checklist:</div>
                <p className="leading-relaxed">
                  1. Governing Equations & Units • 2. Boundary / Initial Conditions • 3. Key Physical Approximations.
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: PRACTICE & PROBLEM SOLVING */}
        {activeStep === 'practice' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-sky-400 bg-sky-400/10 border border-sky-400/20 px-3 py-1 rounded-full">
                Phase 2: Timed Procedural Practice
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-3">
                Problem Drill & Derivation
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Work through a practice problem or derivation on paper or below.
              </p>
            </div>

            <textarea
              rows={5}
              value={practiceNotes}
              onChange={(e) => setPracticeNotes(e.target.value)}
              placeholder="Record final answers, key algebra steps, or difficulty bottlenecks..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-400 leading-relaxed"
            />

            {/* Collapsible Socratic AI Hint */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <button
                type="button"
                onClick={fetchAiSocraticHint}
                className="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white"
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Socratic AI Coach Hint</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${showAiHint ? 'rotate-180' : ''}`} />
              </button>

              {showAiHint && (
                <div className="p-4 pt-0 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80">
                  {aiHintLoading ? (
                    <div className="flex items-center space-x-2 text-slate-400 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Synthesizing first-principles hint...</span>
                    </div>
                  ) : (
                    <p className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-amber-100">
                      {aiHintText}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setActiveStep('recall')}
                className="text-xs text-slate-400 hover:text-slate-200 font-semibold"
              >
                Back to Recall
              </button>

              <button
                type="button"
                onClick={() => setActiveStep('finish')}
                className="px-6 py-2.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl shadow-md transition-all active:scale-95 flex items-center space-x-1.5"
              >
                <span>Rate & Complete</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CONFIDENCE RATING & COMPLETE */}
        {activeStep === 'finish' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-amber-400/20">
                <Award className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Session Complete
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                You invested {elapsedMinutes} focused minutes in {mission.topic_name}.
              </p>
            </div>

            {/* Confidence Slider */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  Self-Reported Confidence
                </span>
                <span className="text-lg font-black font-mono text-amber-400">
                  {confidenceRating}%
                </span>
              </div>

              <input
                type="range"
                min={20}
                max={100}
                step={5}
                value={confidenceRating}
                onChange={(e) => setConfidenceRating(Number(e.target.value))}
                className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                <span>Needs Review (20%)</span>
                <span>Solid (60%)</span>
                <span>Exam Ready (100%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setActiveStep('practice')}
                className="text-xs text-slate-400 hover:text-slate-200 font-semibold"
              >
                Back to Practice
              </button>

              <button
                type="button"
                onClick={handleFinish}
                className="px-8 py-3 text-xs sm:text-sm font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center space-x-2"
              >
                <CheckCircle2 className="w-5 h-5 text-slate-950" />
                <span>Log & Update Topic Mastery</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER: Minimal Focus Note */}
      <div className="px-6 py-3 border-t border-slate-900 text-center text-[11px] text-slate-500">
        FirstClass OS Focus Mode • Deep work without context switching
      </div>
    </div>
  );
};
