import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Award,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  HelpCircle,
  Loader2,
  MessageSquare,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Timer,
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
  const [activeStep, setActiveStep] = useState<'recall' | 'practice' | 'socratic' | 'finish'>('recall');

  // Step 1: Active Recall State
  const [showRecallPrompt, setShowRecallPrompt] = useState(true);
  const [recallAnswer, setRecallAnswer] = useState('');
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [recalledSuccessfully, setRecalledSuccessfully] = useState(true);

  // Step 2: Practice Problem State
  const [scratchpadText, setScratchpadText] = useState('');
  const [practiceSelfScore, setPracticeSelfScore] = useState(85);

  // Step 3: Socratic AI Tutor State
  const [tutorQuery, setTutorQuery] = useState('');
  const [tutorMessages, setTutorMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    {
      sender: 'ai',
      text: `Hello! I'm your Socratic Tutor for **${mission.topic_name}** (${mission.course_code}). What specific derivation, step, or intuition would you like to verify?`,
    },
  ]);
  const [isTutorLoading, setIsTutorLoading] = useState(false);

  // Step 4: Submission State
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [confidenceRating, setConfidenceRating] = useState(4); // 1-5

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsRemaining]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleAskTutor = async () => {
    if (!tutorQuery.trim() || isTutorLoading) return;

    const userText = tutorQuery;
    setTutorMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setTutorQuery('');
    setIsTutorLoading(true);

    try {
      const res = await fetch('/api/ai/tutor-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicName: mission.topic_name,
          courseCode: mission.course_code,
          question: userText,
          learningObjective: mission.learning_objective,
        }),
      });
      const data = await res.json();
      setTutorMessages((prev) => [
        ...prev,
        { sender: 'ai', text: data.reply || 'Great question! Think about boundary conditions and physical symmetry.' },
      ]);
    } catch (e) {
      setTutorMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Consider the primary governing equation and test edge cases.' },
      ]);
    } finally {
      setIsTutorLoading(false);
    }
  };

  const handleFinalSubmit = () => {
    const elapsedMinutes = Math.max(1, Math.round((targetMinutes * 60 - secondsRemaining) / 60));
    onCompleteSession({
      missionId: mission.id,
      completedMinutes: elapsedMinutes,
      notes: evidenceNotes || `Completed active recall & practice on ${mission.topic_name}`,
      recalledSuccessfully,
      practiceScorePercent: practiceSelfScore,
      confidenceRating: confidenceRating * 20, // scale 1-5 to 20-100
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto border border-slate-200 shadow-2xl flex flex-col">
        {/* Top Focused Mission Header */}
        <div className="p-5 bg-slate-900 text-white rounded-t-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                  {mission.course_code}
                </span>
                <span className="text-xs text-slate-400 font-semibold">Active Study Mission</span>
                {mission.is_debt_recovery && (
                  <span className="text-[10px] uppercase font-bold bg-rose-900/60 text-rose-300 border border-rose-700 px-2 py-0.5 rounded-full">
                    Debt Recovery
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white mt-1">{mission.topic_name}</h2>
            </div>
          </div>

          {/* Mission Timer */}
          <div className="flex items-center space-x-3 bg-slate-800/90 border border-slate-700 px-4 py-2 rounded-xl">
            <Timer className="w-5 h-5 text-amber-400" />
            <div className="text-xl font-mono font-bold text-white tracking-wider">
              {formatTimer(secondsRemaining)}
            </div>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="text-xs text-slate-300 hover:text-amber-300 font-bold underline ml-2"
            >
              {isTimerRunning ? 'Pause' : 'Resume'}
            </button>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Phase Step Navigation */}
        <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50 text-xs font-bold divide-x divide-slate-200">
          <button
            onClick={() => setActiveStep('recall')}
            className={`p-3 text-center transition-all ${
              activeStep === 'recall' ? 'bg-white text-amber-700 border-b-2 border-amber-600' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            1. Active Recall
          </button>
          <button
            onClick={() => setActiveStep('practice')}
            className={`p-3 text-center transition-all ${
              activeStep === 'practice' ? 'bg-white text-amber-700 border-b-2 border-amber-600' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            2. Procedural Practice
          </button>
          <button
            onClick={() => setActiveStep('socratic')}
            className={`p-3 text-center transition-all ${
              activeStep === 'socratic' ? 'bg-white text-amber-700 border-b-2 border-amber-600' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            3. Socratic Tutor
          </button>
          <button
            onClick={() => setActiveStep('finish')}
            className={`p-3 text-center transition-all ${
              activeStep === 'finish' ? 'bg-white text-amber-700 border-b-2 border-amber-600' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            4. Submit Evidence
          </button>
        </div>

        {/* Mission Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: ACTIVE RECALL DRILL */}
          {activeStep === 'recall' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900">
                <div className="font-bold uppercase text-[11px] text-sky-800">Learning Objective:</div>
                <div className="font-medium mt-0.5">{mission.learning_objective}</div>
              </div>

              <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Active Recall Prompt (Without Looking at Notes)
                  </span>
                  <span className="text-[11px] text-slate-400">Testing Memory Retrieval</span>
                </div>

                <div className="text-sm font-bold text-slate-900 bg-white p-4 rounded-xl border border-slate-200">
                  "State the primary definition, governing formula, boundary conditions, or physical significance of{' '}
                  <span className="text-amber-700">{mission.topic_name}</span>."
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Your Mental Retrieval Notes / Equation:
                  </label>
                  <textarea
                    rows={4}
                    value={recallAnswer}
                    onChange={(e) => setRecallAnswer(e.target.value)}
                    placeholder="Write out definitions, equations, key steps from memory..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Model Reveal */}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowModelAnswer(!showModelAnswer)}
                    className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-200/80 px-3 py-1.5 rounded-lg"
                  >
                    {showModelAnswer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showModelAnswer ? 'Hide Reference Concept' : 'Reveal Reference Concept for Verification'}</span>
                  </button>

                  {showModelAnswer && (
                    <div className="mt-3 p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-950 animate-in fade-in">
                      <div className="font-bold text-[11px] uppercase tracking-wider text-amber-800">
                        Reference Verification:
                      </div>
                      <p className="mt-1 leading-relaxed">
                        For <strong>{mission.topic_name}</strong>, ensure you have correctly identified:
                        1) The fundamental differential or algebraic relationship.
                        2) The dimensional consistency of all constants and variables.
                        3) Physical boundary assumptions (e.g. steady state, laminar flow, zero divergence, conservative field).
                      </p>
                    </div>
                  )}
                </div>

                {/* Self-check toggle */}
                <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-700">Did you recall the key principles accurately?</div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setRecalledSuccessfully(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        recalledSuccessfully ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Yes, Accurate
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecalledSuccessfully(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        !recalledSuccessfully ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Deficit / Needed Cues
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setActiveStep('practice')}
                  className="flex items-center space-x-1.5 px-5 py-2 text-xs font-bold bg-slate-900 text-amber-300 hover:bg-slate-800 rounded-xl shadow-xs"
                >
                  <span>Continue to Step 2: Procedural Practice</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PROCEDURAL PRACTICE */}
          {activeStep === 'practice' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                <span className="font-bold text-slate-900">Step 2: Analytical & Problem Solving Drill. </span>
                Solve a representative problem from your lecture materials or textbook. Use the scratchpad to track step-by-step working.
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Calculation Scratchpad & Working
                </label>
                <textarea
                  rows={8}
                  value={scratchpadText}
                  onChange={(e) => setScratchpadText(e.target.value)}
                  placeholder="Step 1: Set up governing equation...&#10;Step 2: Apply boundary values...&#10;Step 3: Integrate and substitute initial values..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Practice Self Rating */}
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-950">Procedural Accuracy Self-Score:</span>
                  <span className="text-sm font-black text-amber-900 font-mono">{practiceSelfScore}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={practiceSelfScore}
                  onChange={(e) => setPracticeSelfScore(Number(e.target.value))}
                  className="w-full accent-amber-600"
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setActiveStep('recall')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Back to Recall
                </button>
                <button
                  onClick={() => setActiveStep('socratic')}
                  className="flex items-center space-x-1.5 px-5 py-2 text-xs font-bold bg-slate-900 text-amber-300 hover:bg-slate-800 rounded-xl shadow-xs"
                >
                  <span>Ask AI Tutor or Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SOCRATIC AI TUTOR */}
          {activeStep === 'socratic' && (
            <div className="space-y-4 animate-in fade-in flex flex-col h-[400px]">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-700" />
                  <span className="font-bold">Socratic AI Tutor (First-Principles Coaching)</span>
                </div>
                <span className="text-[10px] text-purple-700 font-semibold">Grounded in Course Syllabus</span>
              </div>

              {/* Chat history */}
              <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                {tutorMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-slate-900 text-white font-medium'
                          : 'bg-white border border-slate-200 text-slate-800 shadow-2xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {isTutorLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-500 flex items-center space-x-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                      <span>Socratic tutor reasoning...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={tutorQuery}
                  onChange={(e) => setTutorQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskTutor()}
                  placeholder="Ask a question about this derivation or concept..."
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={handleAskTutor}
                  disabled={isTutorLoading || !tutorQuery.trim()}
                  className="p-2.5 bg-slate-900 text-amber-300 rounded-xl hover:bg-slate-800 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActiveStep('finish')}
                  className="flex items-center space-x-1.5 px-5 py-2 text-xs font-bold bg-slate-900 text-amber-300 hover:bg-slate-800 rounded-xl shadow-xs"
                >
                  <span>Proceed to Final Evidence Submission</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SUBMIT EVIDENCE & FINISH */}
          {activeStep === 'finish' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                <div className="font-bold uppercase text-[11px]">Academic Evidence Standard</div>
                <div className="mt-0.5">
                  Submitting study session evidence confirms mastery updates in the deterministic database and resolves any associated academic debt items.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Evidence Notes (What was practiced / solved)
                </label>
                <textarea
                  rows={4}
                  value={evidenceNotes}
                  onChange={(e) => setEvidenceNotes(e.target.value)}
                  placeholder="e.g. Derived divergence equations for 3 problem sets. Verified boundary constraints with textbook solutions."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Post-Session Confidence */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Post-Session Confidence Level
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setConfidenceRating(lvl)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        confidenceRating === lvl
                          ? 'bg-slate-900 text-amber-300 border-slate-900 font-black shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-sm font-bold">{lvl} / 5</div>
                      <div className="text-[10px] opacity-80 mt-0.5">
                        {lvl === 5 ? 'Mastered' : lvl === 1 ? 'Fragile' : 'Solid'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary of Evidence */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="font-bold text-slate-900">Session Evidence Summary:</div>
                <div className="flex justify-between text-slate-600">
                  <span>Recall Accuracy:</span>
                  <span className="font-bold text-slate-900">{recalledSuccessfully ? 'Verified' : 'Flagged Deficit'}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Procedural Score:</span>
                  <span className="font-bold text-slate-900">{practiceSelfScore}%</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Confidence:</span>
                  <span className="font-bold text-slate-900">{confidenceRating * 20}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setActiveStep('practice')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Back
                </button>
                <button
                  onClick={handleFinalSubmit}
                  className="flex items-center space-x-2 px-6 py-2.5 text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Log Evidence & Update Mastery</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
