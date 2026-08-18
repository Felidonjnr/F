import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  HelpCircle,
  Loader2,
  Sparkles,
  Timer,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  Assessment,
  AssessmentDiagnosticReport,
  Course,
  QuestionAttempt,
  Topic,
} from '../../types';

interface AssessmentRunnerModalProps {
  assessment: Assessment | null;
  courses: Course[];
  topics: Topic[];
  isOpen: boolean;
  onClose: () => void;
  onSubmitAssessment: (assessmentId: string, attempts: QuestionAttempt[]) => AssessmentDiagnosticReport | null;
}

export const AssessmentRunnerModal: React.FC<AssessmentRunnerModalProps> = ({
  assessment,
  courses,
  topics,
  isOpen,
  onClose,
  onSubmitAssessment,
}) => {
  if (!isOpen || !assessment) return null;

  const totalQuestions = assessment.questions?.length || 0;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [secondsRemaining, setSecondsRemaining] = useState((assessment.time_limit_minutes || 20) * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [diagnosticReport, setDiagnosticReport] = useState<AssessmentDiagnosticReport | null>(null);

  // Timer interval
  useEffect(() => {
    if (diagnosticReport) return; // graded already
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [diagnosticReport]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentQ = assessment.questions[currentIdx];

  const handleSelectOption = (qId: string, optKey: string) => {
    if (diagnosticReport) return;
    setAnswers((prev) => ({ ...prev, [qId]: optKey }));
  };

  const toggleFlag = (qId: string) => {
    setFlagged((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleAutoSubmit = () => {
    handleSubmit();
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    const attempts: QuestionAttempt[] = assessment.questions.map((q) => ({
      question_id: q.id,
      student_answer: answers[q.id] || '',
      is_flagged: Boolean(flagged[q.id]),
    }));

    const report = onSubmitAssessment(assessment.id, attempts);
    setDiagnosticReport(report);
    setIsSubmitting(false);
  };

  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.trim().length > 0).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto border border-slate-200 shadow-2xl flex flex-col">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-amber-300">
              {assessment.course_code}
            </span>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">{assessment.title}</h2>
              <p className="text-xs text-slate-400">
                {assessment.type.replace('_', ' ').toUpperCase()} • {totalQuestions} Questions
              </p>
            </div>
          </div>

          {!diagnosticReport && (
            <div className="flex items-center space-x-4">
              <div
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border ${
                  secondsRemaining < 180
                    ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
                    : 'bg-slate-800 text-white border-slate-700'
                }`}
              >
                <Timer className="w-4 h-4 text-amber-400" />
                <span className="font-mono font-bold text-sm">{formatTimer(secondsRemaining)}</span>
              </div>

              <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {diagnosticReport && (
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* IF DIAGNOSTIC REPORT IS ACTIVE: Show detailed diagnosis view */}
        {diagnosticReport ? (
          <div className="p-6 overflow-y-auto flex-1 space-y-6 animate-in fade-in">
            {/* Score & Verdict Banner */}
            <div
              className={`p-6 rounded-2xl border text-center ${
                diagnosticReport.overall_score >= 70
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <div className="text-xs font-bold uppercase tracking-wider opacity-75">Diagnostic Assessment Result</div>
              <div className="text-5xl font-black mt-2 font-mono">
                {diagnosticReport.overall_score}%
              </div>
              <p className="text-sm font-semibold mt-1">
                Raw Score: {diagnosticReport.raw_score} / {diagnosticReport.max_score} Points
              </p>
              <p className="text-xs mt-2 max-w-xl mx-auto opacity-90 leading-relaxed">
                {diagnosticReport.overall_score >= 70
                  ? 'Excellent execution. Knowledge evidence is robust across core dimensions.'
                  : 'Knowledge deficits identified. The system has automatically logged academic debt items to recover weak topics.'}
              </p>
            </div>

            {/* Dimensional Breakdown */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Cognitive Dimension Breakdown
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(diagnosticReport.dimensional_breakdown).map(([dim, val]) => {
                  const score = Number(val) || 0;
                  return (
                    <div key={dim} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center text-xs font-bold mb-1">
                        <span className="capitalize">{dim}</span>
                        <span className={score >= 70 ? 'text-emerald-600' : 'text-rose-600'}>{score}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${score >= 70 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          style={{ width: `${Math.min(100, score)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="flex items-center space-x-1.5 text-emerald-800 font-bold text-xs uppercase mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Demonstrated Strengths</span>
                </div>
                <ul className="text-xs text-emerald-950 space-y-1 list-disc list-inside">
                  {diagnosticReport.strength_areas.length > 0 ? (
                    diagnosticReport.strength_areas.map((s, i) => <li key={i}>{s}</li>)
                  ) : (
                    <li>Further consolidation needed</li>
                  )}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200">
                <div className="flex items-center space-x-1.5 text-rose-800 font-bold text-xs uppercase mb-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Deficit Areas (Debt Triggered)</span>
                </div>
                <ul className="text-xs text-rose-950 space-y-1 list-disc list-inside">
                  {diagnosticReport.weakness_areas.length > 0 ? (
                    diagnosticReport.weakness_areas.map((w, i) => <li key={i}>{w}</li>)
                  ) : (
                    <li>No severe weaknesses flagged</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Error Misconceptions Identified */}
            {diagnosticReport.misconceptions_identified.length > 0 && (
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase">
                  <Zap className="w-4 h-4" />
                  <span>Error Bank Diagnoses Logged</span>
                </div>
                <div className="space-y-2 text-xs text-slate-300">
                  {diagnosticReport.misconceptions_identified.map((m, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-800 rounded-xl border border-slate-700">
                      <span className="font-bold text-white">{m.concept}: </span>
                      {m.notes}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Done button */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-xl shadow-xs"
              >
                Close & Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE ASSESSMENT QUESTION VIEW */
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* Question Navigator Dots */}
            <div className="flex flex-wrap items-center gap-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
              {assessment.questions.map((q, idx) => {
                const isAnswered = Boolean(answers[q.id]?.trim());
                const isFlag = Boolean(flagged[q.id]);
                const isCurrent = idx === currentIdx;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all relative ${
                      isCurrent
                        ? 'bg-slate-900 text-amber-300 ring-2 ring-amber-400'
                        : isAnswered
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {idx + 1}
                    {isFlag && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Current Question */}
            {currentQ && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-slate-400">Question {currentIdx + 1} of {totalQuestions}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                      {currentQ.dimension}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {currentQ.points || 1} Point{currentQ.points === 1 ? '' : 's'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleFlag(currentQ.id)}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                      flagged[currentQ.id]
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'text-slate-500 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>{flagged[currentQ.id] ? 'Flagged' : 'Flag for Review'}</span>
                  </button>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-900 font-semibold text-sm leading-relaxed">
                  {currentQ.prompt}
                </div>

                {/* Multiple Choice Options */}
                {currentQ.options && currentQ.options.length > 0 && (
                  <div className="space-y-2.5">
                    {currentQ.options.map((opt, oIdx) => {
                      const optKey = String.fromCharCode(65 + oIdx); // A, B, C, D
                      const isSelected = answers[currentQ.id] === optKey;

                      return (
                        <div
                          key={oIdx}
                          onClick={() => handleSelectOption(currentQ.id, optKey)}
                          className={`p-3.5 rounded-xl border text-xs sm:text-sm font-medium cursor-pointer transition-all flex items-center space-x-3 ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                              isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {optKey}
                          </span>
                          <span className="flex-1">{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Nav & Submit */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center space-x-2">
                <button
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  disabled={currentIdx === totalQuestions - 1}
                  onClick={() => setCurrentIdx((prev) => Math.min(totalQuestions - 1, prev + 1))}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-30"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-400">
                  {answeredCount} / {totalQuestions} Answered
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-5 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Grading & Diagnosing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submit Exam</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
