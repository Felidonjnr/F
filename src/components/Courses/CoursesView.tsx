import React, { useState } from 'react';
import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  ChevronRight,
  Layers,
  Plus,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { Course, CourseMaterial, Topic } from '../../types';

interface CoursesViewProps {
  courses: Course[];
  topics: Topic[];
  materials: CourseMaterial[];
  onAddCourse: (course: Omit<Course, 'id' | 'semester_id'>) => void;
  onSelectCourse: (course: Course) => void;
  onOpenUploadMaterial: (course?: Course) => void;
}

export const CoursesView: React.FC<CoursesViewProps> = ({
  courses,
  topics,
  materials,
  onAddCourse,
  onSelectCourse,
  onOpenUploadMaterial,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [units, setUnits] = useState(3);
  const [targetGrade, setTargetGrade] = useState('A');
  const [priorityWeight, setPriorityWeight] = useState(4);
  const [examDate, setExamDate] = useState('2026-05-15');
  const [color, setColor] = useState('#0284c7');

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    onAddCourse({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      units,
      target_grade: targetGrade,
      priority_weight: priorityWeight,
      color,
      exam_date: examDate,
      is_mandatory: true,
      current_academic_debt_minutes: 0,
    });

    setCode('');
    setName('');
    setShowAddModal(false);
  };

  const totalUnits = courses.reduce((acc, c) => acc + c.units, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Academic Structure</span>
            <span className="text-xs font-bold px-2 py-0.5 bg-slate-900 text-white rounded-full">
              {totalUnits} Total Credit Units
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Course Catalog & Knowledge Graph</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your academic courses, breakdown syllabi into hierarchical topics, and measure mastery.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onOpenUploadMaterial()}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Syllabus / Past Papers</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      {/* Courses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {courses.map((course) => {
          const courseTopics = topics.filter((t) => t.course_id === course.id);
          const courseMaterials = materials.filter((m) => m.course_id === course.id);
          const avgScore = courseTopics.length > 0
            ? Math.round(
                courseTopics.reduce((acc, t) => acc + (t.mastery?.overall || 0), 0) / courseTopics.length
              )
            : 0;

          return (
            <div
              key={course.id}
              onClick={() => onSelectCourse(course)}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-amber-400/80 p-5 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-black text-slate-950 font-mono tracking-wide"
                      style={{ backgroundColor: course.color }}
                    >
                      {course.code}
                    </span>
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {course.units} Units
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Target: {course.target_grade}
                  </span>
                </div>

                {/* Course Name */}
                <h3 className="font-bold text-slate-900 text-base mt-3 group-hover:text-amber-600 transition-colors">
                  {course.name}
                </h3>

                {/* Exam Date */}
                {course.exam_date && (
                  <div className="flex items-center text-xs text-slate-500 mt-2">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                    <span>Exam: {course.exam_date}</span>
                  </div>
                )}

                {/* Stats Pill */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                    <div className="text-xs font-bold text-slate-900">{courseTopics.length}</div>
                    <div className="text-[10px] uppercase font-semibold text-slate-400">Topics</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                    <div className="text-xs font-bold text-slate-900">{courseMaterials.length}</div>
                    <div className="text-[10px] uppercase font-semibold text-slate-400">Documents</div>
                  </div>
                </div>
              </div>

              {/* Mastery Progress */}
              <div className="mt-5 pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-500 font-medium">Topic Mastery Index</span>
                  <span className="font-bold text-slate-900">{avgScore}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${
                      avgScore >= 75 ? 'bg-emerald-500' : avgScore >= 60 ? 'bg-sky-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, avgScore)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mt-3 pt-2 group-hover:text-amber-600">
                  <span>Open Knowledge Map</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleCreateCourse}
            className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">Add New Semester Course</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Course Code
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. MEE 221"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono uppercase focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Units (Credit Load)
                </label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={units}
                  onChange={(e) => setUnits(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Course Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Applied Engineering Thermodynamics"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Target Grade
                </label>
                <select
                  value={targetGrade}
                  onChange={(e) => setTargetGrade(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
                >
                  <option value="A">Grade A (70%+)</option>
                  <option value="B">Grade B (60%+)</option>
                  <option value="C">Grade C (50%+)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Exam Date
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Badge Color
                </label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 cursor-pointer p-1"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-slate-900 text-amber-300 hover:bg-slate-800 rounded-xl shadow-xs transition-all"
              >
                Create Course
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
