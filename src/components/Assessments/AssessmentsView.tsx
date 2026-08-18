import React, { useState } from 'react';
import {
  AlertOctagon,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileSpreadsheet,
  Loader2,
  Play,
  Plus,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Assessment, Course, Topic } from '../../types';

interface AssessmentsViewProps {
  assessments: Assessment[];
  courses: Course[];
  topics: Topic[];
  onTakeAssessment: (assessment: Assessment) => void;
  onAddAssessment: (assessment: Omit<Assessment, 'id' | 'status'>) => void;
}

export const AssessmentsView: React.FC<AssessmentsViewProps> = ({
  assessments,
  courses,
  topics,
  onTakeAssessment,
  onAddAssessment,
}) => {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');
  const [assessmentType, setAssessmentType] = useState<Assessment['type']>('rapid_diagnostic');
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState(3);
  const [timeLimit, setTimeLimit] = useState(15);
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];
  const courseTopics = topics.filter((t) => t.course_id === selectedCourseId);
  const selectedTopic = topics.find((t) => t.id === selectedTopicId);

  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const res = await fetch('/api/ai/generate-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseCode: selectedCourse.code,
          courseName: selectedCourse.name,
          topicName: selectedTopic ? selectedTopic.name : `${selectedCourse.code} Comprehensive`,
          type: assessmentType,
          questionCount,
          difficulty,
        }),
      });

      const data = await res.json();
      const generatedQuestions = (data.questions || []).map((q: any, idx: number) => ({
        id: `q-${Date.now()}-${idx}`,
        topic_id: selectedTopicId !== 'all' ? selectedTopicId : courseTopics[0]?.id || 'top-1',
        prompt: q.prompt || 'Solve the following question:',
        options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
        correct_answer: q.correct_answer || 'A',
        explanation: q.explanation || 'Verified from core principles.',
        dimension: q.dimension || 'conceptual',
        points: q.points || 1,
      }));

      onAddAssessment({
        course_id: selectedCourse.id,
        course_code: selectedCourse.code,
        title: data.title || `${selectedCourse.code} ${assessmentType.replace('_', ' ')}`,
        type: assessmentType,
        time_limit_minutes: timeLimit,
        created_at: new Date().toISOString(),
        questions: generatedQuestions,
      });

      setIsGenerating(false);
      setShowGenerateModal(false);
    } catch (err) {
      console.error(err);
      // Fallback local assessment
      onAddAssessment({
        course_id: selectedCourse.id,
        course_code: selectedCourse.code,
        title: `${selectedCourse.code} Quick Diagnostic Test`,
        type: assessmentType,
        time_limit_minutes: timeLimit,
        created_at: new Date().toISOString(),
        questions: [
          {
            id: `q-${Date.now()}-1`,
            topic_id: courseTopics[0]?.id || 'top-1',
            prompt: `In ${selectedCourse.code}, state the primary governing relation for boundary flux.`,
            options: [
              'Surface integral over vector field equals divergence over volume',
              'Line integral equals total kinetic momentum',
              'Energy loss is zero under all real thermodynamic conditions',
              'Entropy remains constant in irreversible processes',
            ],
            correct_answer: 'A',
            explanation: 'Divergence Theorem guarantees flux equality.',
            dimension: 'conceptual',
            points: 1,
          },
          {
            id: `q-${Date.now()}-2`,
            topic_id: courseTopics[0]?.id || 'top-1',
            prompt: 'Calculate the rate of heat transfer through a composite slab with steady thermal conductivity.',
            options: ['Q = -k * A * (dT/dx)', 'Q = m * c * v^2', 'Q = P * V / T', 'Q = 0'],
            correct_answer: 'A',
            explanation: "Fourier's Law of Conduction.",
            dimension: 'procedural',
            points: 1,
          },
        ],
      });
      setIsGenerating(false);
      setShowGenerateModal(false);
    }
  };

  const readyAssessments = assessments.filter((a) => a.status === 'ready');
  const gradedAssessments = assessments.filter((a) => a.status === 'graded');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Measurement Loop</span>
            <span className="text-xs font-bold px-2 py-0.5 bg-sky-100 text-sky-800 rounded-full border border-sky-300">
              Evidence Over Intention
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Academic Assessments & Diagnostics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Timed diagnostics, weekly checkpoints, and mock exams that accurately measure 5 cognitive skill dimensions.
          </p>
        </div>

        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Generate AI Assessment</span>
        </button>
      </div>

      {/* Available Ready Assessments */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <FileCheck2 className="w-4 h-4 text-sky-600" />
            <span>Ready for Testing ({readyAssessments.length})</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {readyAssessments.length === 0 ? (
            <div className="col-span-2 p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
              <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">No active assessments ready</p>
              <p className="text-xs text-slate-500 mt-1">
                Click "Generate AI Assessment" above to create a rapid diagnostic test or weekly mock.
              </p>
            </div>
          ) : (
            readyAssessments.map((a) => (
              <div
                key={a.id}
                className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-sky-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-900 text-amber-300">
                      {a.course_code}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {a.time_limit_minutes} Mins
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 mt-2">{a.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 capitalize">
                    {a.type.replace('_', ' ')} • {a.questions?.length || 0} Questions
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Created {new Date(a.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => onTakeAssessment(a)}
                    className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-xs transition-all active:scale-95"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Start Test</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Graded Assessment History */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <Award className="w-4 h-4 text-emerald-600" />
          <span>Graded Diagnostic History ({gradedAssessments.length})</span>
        </h3>

        <div className="space-y-3">
          {gradedAssessments.map((a) => {
            const scorePct = a.diagnostic_report?.overall_score ?? (a.score && a.max_score ? Math.round((a.score / a.max_score) * 100) : 0);

            return (
              <div
                key={a.id}
                className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {a.course_code}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{a.title}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Completed on {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : 'Recent'}
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div
                      className={`text-lg font-black font-mono ${
                        scorePct >= 70 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {scorePct}%
                    </div>
                    <div className="text-[10px] uppercase font-semibold text-slate-400">Diagnostic Score</div>
                  </div>

                  <button
                    onClick={() => onTakeAssessment(a)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                  >
                    View Report
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Generate AI Assessment Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleGenerateAI}
            className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-base">Generate AI Assessment</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Target Course
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setSelectedTopicId('all');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Specific Topic (or All Course Topics)
              </label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
              >
                <option value="all">Comprehensive (All Topics in {selectedCourse.code})</option>
                {courseTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (Current Mastery: {t.mastery?.overall || 50}%)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Assessment Blueprint Type
                </label>
                <select
                  value={assessmentType}
                  onChange={(e) => setAssessmentType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
                >
                  <option value="rapid_diagnostic">Rapid Diagnostic (5-10 min)</option>
                  <option value="weekly_checkpoint">Weekly Checkpoint</option>
                  <option value="full_mock">Full Exam Mock</option>
                  <option value="debt_recovery_test">Debt Clearance Test</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Questions
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
                >
                  <option value={3}>3 Questions (Express)</option>
                  <option value={5}>5 Questions (Standard)</option>
                  <option value={10}>10 Questions (Deep)</option>
                  <option value={15}>15 Questions (Full)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Difficulty Level (1-5)
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
                >
                  <option value={1}>Level 1 - Foundational Recall</option>
                  <option value={2}>Level 2 - Conceptual Definitions</option>
                  <option value={3}>Level 3 - Standard University Exam</option>
                  <option value={4}>Level 4 - Multi-step Analytical</option>
                  <option value={5}>Level 5 - Advanced Synthesis</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Time Limit (Minutes)
                </label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  step={5}
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                disabled={isGenerating}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGenerating}
                className="flex items-center space-x-2 px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Synthesizing Questions...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate & Build Assessment</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
