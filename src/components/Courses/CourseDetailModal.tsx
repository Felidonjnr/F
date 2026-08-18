import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  Edit3,
  FileText,
  Layers,
  Plus,
  Sparkles,
  Target,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { Course, CourseMaterial, Topic } from '../../types';

interface CourseDetailModalProps {
  course: Course | null;
  topics: Topic[];
  materials: CourseMaterial[];
  isOpen: boolean;
  onClose: () => void;
  onOpenAddTopic: (course: Course) => void;
  onOpenEditTopic: (course: Course, topic: Topic) => void;
  onOpenUploadMaterial: (course: Course) => void;
  onUpdateCourse: (courseId: string, updated: Partial<Course>) => void;
  onDeleteCourse: (courseId: string) => void;
}

export const CourseDetailModal: React.FC<CourseDetailModalProps> = ({
  course,
  topics,
  materials,
  isOpen,
  onClose,
  onOpenAddTopic,
  onOpenEditTopic,
  onOpenUploadMaterial,
  onUpdateCourse,
  onDeleteCourse,
}) => {
  const [activeTab, setActiveTab] = useState<'topics' | 'materials' | 'dimensions'>('topics');

  if (!isOpen || !course) return null;

  const courseTopics = topics.filter((t) => t.course_id === course.id);
  const courseMaterials = materials.filter((m) => m.course_id === course.id);

  const avgOverall = courseTopics.length > 0
    ? Math.round(courseTopics.reduce((sum, t) => sum + (t.mastery?.overall || 0), 0) / courseTopics.length)
    : 0;

  const avgDimensions = {
    recall: courseTopics.length ? Math.round(courseTopics.reduce((s, t) => s + (t.mastery?.recall || 0), 0) / courseTopics.length) : 0,
    conceptual: courseTopics.length ? Math.round(courseTopics.reduce((s, t) => s + (t.mastery?.conceptual || 0), 0) / courseTopics.length) : 0,
    procedural: courseTopics.length ? Math.round(courseTopics.reduce((s, t) => s + (t.mastery?.procedural || 0), 0) / courseTopics.length) : 0,
    application: courseTopics.length ? Math.round(courseTopics.reduce((s, t) => s + (t.mastery?.application || 0), 0) / courseTopics.length) : 0,
    transfer: courseTopics.length ? Math.round(courseTopics.reduce((s, t) => s + (t.mastery?.transfer || 0), 0) / courseTopics.length) : 0,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl flex flex-col">
        {/* Course Header Banner */}
        <div className="p-6 bg-slate-900 text-white rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-md text-xs font-bold text-slate-950 uppercase"
              style={{ backgroundColor: course.color }}
            >
              {course.code}
            </span>
            <span className="text-xs bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-md">
              {course.units} Credit Units
            </span>
            <span className="text-xs bg-slate-800 text-amber-300 font-semibold px-2 py-0.5 rounded-md">
              Weight: {course.priority_weight}/5
            </span>
            <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold px-2 py-0.5 rounded-md">
              Target: Grade {course.target_grade}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white mt-2 tracking-tight">
            {course.name}
          </h2>

          {course.exam_date && (
            <p className="text-xs text-slate-400 mt-1 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Final Exam Date: <span className="text-slate-200 font-semibold ml-1">{course.exam_date}</span>
            </p>
          )}

          {/* Quick Mastery Summary Bar */}
          <div className="mt-4 p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Award className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-xs font-bold text-white">Course Mastery Index: {avgOverall}%</div>
                <div className="text-[11px] text-slate-400">{courseTopics.length} Knowledge Modules mapped</div>
              </div>
            </div>
            <div className="w-36 bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full ${
                  avgOverall >= 75 ? 'bg-emerald-400' : avgOverall >= 60 ? 'bg-sky-400' : 'bg-rose-400'
                }`}
                style={{ width: `${Math.min(100, avgOverall)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Modal Tab Switcher */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => setActiveTab('topics')}
            className={`py-3 px-4 border-b-2 transition-all ${
              activeTab === 'topics'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Academic Topics ({courseTopics.length})
          </button>
          <button
            onClick={() => setActiveTab('dimensions')}
            className={`py-3 px-4 border-b-2 transition-all ${
              activeTab === 'dimensions'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Cognitive Skill Breakdown
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`py-3 px-4 border-b-2 transition-all ${
              activeTab === 'materials'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Source Materials & Syllabi ({courseMaterials.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: Topics */}
          {activeTab === 'topics' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
                  Topic Knowledge Graph
                </span>
                <button
                  onClick={() => onOpenAddTopic(course)}
                  className="flex items-center space-x-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-900 text-amber-300 hover:bg-slate-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Topic</span>
                </button>
              </div>

              <div className="space-y-3">
                {courseTopics.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                    <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-800">No topics mapped for this course yet</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Upload your syllabus or click 'Add Topic' to map your curriculum.
                    </p>
                  </div>
                ) : (
                  courseTopics.map((topic, idx) => {
                    const mastery = topic.mastery?.overall || 0;
                    return (
                      <div
                        key={topic.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-amber-300 hover:shadow-xs transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-bold text-slate-400">#{idx + 1}</span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                                Diff: {topic.difficulty}/5
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                Weight: {topic.importance}/5
                              </span>
                              <span className="text-[10px] text-slate-500 flex items-center">
                                <Clock className="w-3 h-3 mr-0.5" /> {topic.estimated_minutes} min
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-slate-900 mt-1.5">{topic.name}</h4>
                            <p className="text-xs text-slate-600 mt-0.5">{topic.description}</p>

                            {/* Learning Objectives list */}
                            {topic.learning_objectives?.length > 0 && (
                              <div className="mt-2.5 space-y-1">
                                <div className="text-[10px] uppercase font-bold text-slate-400">
                                  Learning Objectives:
                                </div>
                                <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-0.5">
                                  {topic.learning_objectives.map((obj, oIdx) => (
                                    <li key={oIdx}>{obj}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          <div className="shrink-0 flex flex-col items-end space-y-2">
                            <div className="text-right">
                              <div className="text-xs font-black text-slate-900">{mastery}%</div>
                              <div className="text-[10px] text-slate-400 uppercase font-semibold">Mastery</div>
                            </div>

                            <button
                              onClick={() => onOpenEditTopic(course, topic)}
                              className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Edit Topic"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Cognitive Dimensions */}
          {activeTab === 'dimensions' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                FirstClass OS tracks mastery across 5 distinct cognitive skill dimensions rather than a naive single score.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-900">1. Active Recall (Facts & Formulas)</span>
                    <span className="text-xs font-bold text-sky-600">{avgDimensions.recall}%</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">Can retrieve definitions, units, equations without cues.</p>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-sky-500 h-2 rounded-full" style={{ width: `${avgDimensions.recall}%` }} />
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-900">2. Conceptual Reasoning</span>
                    <span className="text-xs font-bold text-indigo-600">{avgDimensions.conceptual}%</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">Can explain governing physics and boundary behaviors.</p>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${avgDimensions.conceptual}%` }} />
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-900">3. Procedural Execution</span>
                    <span className="text-xs font-bold text-amber-600">{avgDimensions.procedural}%</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">Can calculate analytical and step-by-step algorithms correctly.</p>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${avgDimensions.procedural}%` }} />
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-900">4. Contextual Application</span>
                    <span className="text-xs font-bold text-purple-600">{avgDimensions.application}%</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">Can apply concepts to unfamiliar, multi-step problem sets.</p>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${avgDimensions.application}%` }} />
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white sm:col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-900">5. Knowledge Transfer & Synthesis</span>
                    <span className="text-xs font-bold text-emerald-600">{avgDimensions.transfer}%</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">Can apply knowledge across cross-disciplinary scenarios.</p>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${avgDimensions.transfer}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Materials */}
          {activeTab === 'materials' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
                  Indexed Source Documents
                </span>
                <button
                  onClick={() => onOpenUploadMaterial(course)}
                  className="flex items-center space-x-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-900 text-amber-300 hover:bg-slate-800"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Document</span>
                </button>
              </div>

              <div className="space-y-3">
                {courseMaterials.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                    <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-800">No documents uploaded for {course.code}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Upload past exam papers, lecture slides, or syllabi to ground AI tutoring.
                    </p>
                  </div>
                ) : (
                  courseMaterials.map((mat) => (
                    <div
                      key={mat.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{mat.name}</h4>
                          <p className="text-[11px] text-slate-500">
                            Type: {mat.type} • {mat.file_size_kb} KB • Indexed {mat.extracted_topics_count} topics
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Indexed for RAG
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between rounded-b-2xl">
          <button
            onClick={() => {
              if (confirm(`Delete course ${course.code}? This will remove all associated topics.`)) {
                onDeleteCourse(course.id);
                onClose();
              }
            }}
            className="flex items-center space-x-1 text-xs font-bold text-rose-600 hover:text-rose-700"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Course</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
