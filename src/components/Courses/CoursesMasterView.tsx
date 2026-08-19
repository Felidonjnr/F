import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Edit3,
  ExternalLink,
  FileText,
  Flame,
  GraduationCap,
  Layers,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  Trash2,
  UploadCloud,
  Zap,
} from 'lucide-react';
import { Course, CourseMaterial, Semester, Topic } from '../../types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  ProgressRing,
  Radar,
} from '../ui';

interface CoursesMasterViewProps {
  semester: Semester;
  courses: Course[];
  topics: Topic[];
  materials: CourseMaterial[];
  onUpdateSemester: (updated: Partial<Semester>) => void;
  onAddCourse: (course: Omit<Course, 'id' | 'semester_id'>) => void;
  onSelectCourse?: (course: Course) => void;
  onOpenUploadMaterial: (course?: Course) => void;
  onOpenAddTopic?: (course: Course) => void;
  onOpenEditTopic?: (course: Course, topic: Topic) => void;
  onDeleteTopic?: (topicId: string) => void;
  onUpdateCourse?: (id: string, updated: Partial<Course>) => void;
  onDeleteCourse?: (id: string) => void;
}

export const CoursesMasterView: React.FC<CoursesMasterViewProps> = ({
  semester,
  courses,
  topics,
  materials,
  onUpdateSemester,
  onAddCourse,
  onOpenUploadMaterial,
  onOpenAddTopic,
  onOpenEditTopic,
  onDeleteTopic,
  onUpdateCourse,
  onDeleteCourse,
}) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [isSemesterExpanded, setIsSemesterExpanded] = useState(false);
  const [isEditingSemester, setIsEditingSemester] = useState(false);

  // New Course Modal Form
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newUnits, setNewUnits] = useState(3);
  const [newTargetGrade, setNewTargetGrade] = useState('A');
  const [newExamDate, setNewExamDate] = useState('');

  // Semester Form
  const [semTitle, setSemTitle] = useState(semester.title);
  const [semStart, setSemStart] = useState(semester.start_date);
  const [semEnd, setSemEnd] = useState(semester.end_date);
  const [semExamWindow, setSemExamWindow] = useState(semester.exam_start_date || '');
  const [semFloorHours, setSemFloorHours] = useState(semester.academic_floor_hours_per_week || 24);

  const totalUnits = courses.reduce((acc, c) => acc + c.units, 0);

  const handleSaveSemester = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSemester({
      title: semTitle,
      start_date: semStart,
      end_date: semEnd,
      exam_start_date: semExamWindow,
      academic_floor_hours_per_week: Number(semFloorHours),
    });
    setIsEditingSemester(false);
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;
    onAddCourse({
      code: newCode.trim().toUpperCase(),
      name: newName.trim(),
      units: Number(newUnits),
      target_grade: newTargetGrade,
      color: '#d97706',
      exam_date: newExamDate || undefined,
    });
    setNewCode('');
    setNewName('');
    setIsAddingCourse(false);
  };

  return (
    <div id="courses-master-root" className="max-w-5xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* 1. COLLAPSIBLE SEMESTER BLUEPRINT HEADER CARD */}
      <section id="semester-blueprint-header">
        <Card className="overflow-hidden">
          <div
            onClick={() => setIsSemesterExpanded(!isSemesterExpanded)}
            className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors select-none"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-300 flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                    Semester Blueprint
                  </span>
                  <Badge variant="accent" size="sm">
                    Week {semester.current_week} of {semester.total_weeks}
                  </Badge>
                </div>
                <h2 className="text-base font-bold text-slate-900">{semester.title}</h2>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3 text-xs font-semibold text-slate-600">
                <span>{totalUnits} Units</span>
                <span>•</span>
                <span>{semester.academic_floor_hours_per_week}h/week Floor</span>
              </div>

              <div className="p-1 text-slate-400">
                {isSemesterExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>
          </div>

          {/* Collapsible Details */}
          {isSemesterExpanded && (
            <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4 animate-in fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-400 font-bold uppercase text-[10px]">Start Date</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">{semester.start_date}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-400 font-bold uppercase text-[10px]">Exam Window</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">{semester.exam_start_date || 'TBD'}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-400 font-bold uppercase text-[10px]">Total Units</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">{totalUnits} Credits</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-400 font-bold uppercase text-[10px]">Academic Floor</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">{semester.academic_floor_hours_per_week} Hours/Wk</div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingSemester(true)}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Semester Calibration</span>
                </Button>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* 2. COURSE DETAIL DRILL-IN VIEW (IF A COURSE IS SELECTED) */}
      {selectedCourse ? (
        <div className="space-y-6 animate-in fade-in">
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCourse(null);
                setSelectedTopic(null);
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Course Catalog</span>
            </Button>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenUploadMaterial(selectedCourse)}
                className="text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200/80"
              >
                <UploadCloud className="w-3.5 h-3.5 text-purple-600" />
                <span>Upload Material</span>
              </Button>

              {onOpenAddTopic && (
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => onOpenAddTopic(selectedCourse)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Topic</span>
                </Button>
              )}
            </div>
          </div>

          {/* Course Hero Banner */}
          <Card className="p-6 bg-slate-950 text-white border-slate-800 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-black bg-amber-400 text-slate-950 uppercase">
                  {selectedCourse.code}
                </span>
                <span className="text-xs text-slate-400">{selectedCourse.units} Credit Units</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black">{selectedCourse.name}</h1>
              <p className="text-xs text-slate-400">
                Target Grade: <span className="text-amber-300 font-bold">{selectedCourse.target_grade}</span> • Exam:{' '}
                {selectedCourse.exam_date || 'Scheduled Week 15'}
              </p>
            </div>

            {(() => {
              const cTopics = topics.filter((t) => t.course_id === selectedCourse.id);
              const avgMastery = cTopics.length
                ? Math.round(
                    cTopics.reduce((acc, t) => acc + (t.mastery?.overall || 0), 0) / cTopics.length
                  )
                : 0;

              return (
                <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl shrink-0">
                  <ProgressRing value={avgMastery} size={50} strokeWidth={5} showLabel={false} color="#f59e0b" />
                  <div className="text-left pr-2">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Mastery: {avgMastery}%</div>
                    <div className="text-xs text-slate-300">{cTopics.length} Topics Indexed</div>
                  </div>
                </div>
              );
            })()}
          </Card>

          {/* TOPIC MASTERY MAP GRID */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Topic Knowledge Map
              </h3>
              <span className="text-xs text-slate-400">
                Tap any topic to inspect 5-spoke cognitive radar
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {topics
                .filter((t) => t.course_id === selectedCourse.id)
                .map((topic) => {
                  const mastery = topic.mastery?.overall || 50;
                  const isSelected = selectedTopic?.id === topic.id;

                  return (
                    <Card
                      key={topic.id}
                      variant="interactive"
                      onClick={() => setSelectedTopic(topic)}
                      className={`p-4 space-y-3 ${
                        isSelected
                          ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/20 shadow-sm'
                          : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight">
                          {topic.name}
                        </h4>
                        <ProgressRing value={mastery} size={36} strokeWidth={3.5} showLabel={false} color="#f59e0b" />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>Weight: {topic.exam_weight_pct}%</span>
                        <span className="font-semibold text-amber-700">
                          {isSelected ? 'Viewing Radar' : 'Inspect Spoke'}
                        </span>
                      </div>
                    </Card>
                  );
                })}
            </div>
          </div>

          {/* TOPIC DETAIL CARD WITH 5-SPOKE RADAR (IF A TOPIC IS CLICKED) */}
          {selectedTopic && (
            <Card className="p-6 space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-slate-900 text-white rounded">
                      {selectedCourse.code}
                    </span>
                    <span className="text-xs text-slate-400">Exam Weight: {selectedTopic.exam_weight_pct}%</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedTopic.name}</h3>
                </div>

                <div className="flex items-center space-x-2">
                  {onOpenEditTopic && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenEditTopic(selectedCourse, selectedTopic)}
                    >
                      Edit Topic
                    </Button>
                  )}
                  {onDeleteTopic && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete topic ${selectedTopic.name}?`)) {
                          onDeleteTopic(selectedTopic.id);
                          setSelectedTopic(null);
                        }
                      }}
                      className="text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* 5-Spoke Radar Visualization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="flex justify-center bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
                  <Radar
                    dimensions={{
                      recall: selectedTopic.mastery?.recall || 60,
                      conceptual: selectedTopic.mastery?.conceptual || 65,
                      procedural: selectedTopic.mastery?.procedural || 50,
                      application: selectedTopic.mastery?.application || 55,
                      transfer: selectedTopic.mastery?.transfer || 40,
                      overall: selectedTopic.mastery?.overall || 50,
                    }}
                    size={240}
                  />
                </div>

                <div className="space-y-3 text-xs">
                  <h4 className="font-bold uppercase text-slate-400 text-[10px]">
                    Cognitive Breakdown
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                      <span className="font-semibold text-slate-700">1. Blind Active Recall</span>
                      <span className="font-mono font-bold text-slate-900">{selectedTopic.mastery?.recall || 60}%</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                      <span className="font-semibold text-slate-700">2. Conceptual First-Principles</span>
                      <span className="font-mono font-bold text-slate-900">{selectedTopic.mastery?.conceptual || 65}%</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                      <span className="font-semibold text-slate-700">3. Procedural Fluency</span>
                      <span className="font-mono font-bold text-slate-900">{selectedTopic.mastery?.procedural || 50}%</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                      <span className="font-semibold text-slate-700">4. Multi-Step Application</span>
                      <span className="font-mono font-bold text-slate-900">{selectedTopic.mastery?.application || 55}%</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                      <span className="font-semibold text-slate-700">5. Novel Context Transfer</span>
                      <span className="font-mono font-bold text-slate-900">{selectedTopic.mastery?.transfer || 40}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* COURSE MATERIALS LIST */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Course Materials & Syllabi
              </h3>
              <button
                onClick={() => onOpenUploadMaterial(selectedCourse)}
                className="text-xs font-bold text-purple-700 hover:text-purple-800 cursor-pointer"
              >
                + Upload Document
              </button>
            </div>

            <div className="space-y-2">
              {materials.filter((m) => m.course_id === selectedCourse.id).length === 0 ? (
                <Card className="p-6 text-center text-xs text-slate-500">
                  No materials uploaded yet for this course. Upload lecture slides or syllabi to auto-extract topics.
                </Card>
              ) : (
                materials
                  .filter((m) => m.course_id === selectedCourse.id)
                  .map((mat) => (
                    <Card
                      key={mat.id}
                      className="p-3.5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900">{mat.title}</div>
                          <div className="text-[11px] text-slate-400 uppercase font-mono">
                            {mat.file_type || 'PDF'}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400">Indexed</span>
                    </Card>
                  ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* 3. COURSE CATALOG GRID (WHEN NO COURSE IS DRILLED-IN) */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Enrolled Courses ({courses.length})</h2>
              <p className="text-xs text-slate-500">
                Tap any course card to inspect topics, mastery radar, and uploaded documents.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenUploadMaterial()}
                className="text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200/80"
              >
                <UploadCloud className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden sm:inline">Upload Syllabus</span>
              </Button>

              <Button
                variant="accent"
                size="sm"
                onClick={() => setIsAddingCourse(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Course</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {courses.map((course) => {
              const courseTopics = topics.filter((t) => t.course_id === course.id);
              const mastery = courseTopics.length
                ? Math.round(
                    courseTopics.reduce((acc, t) => acc + (t.mastery?.overall || 0), 0) /
                      courseTopics.length
                  )
                : 0;

              return (
                <Card
                  key={course.id}
                  variant="interactive"
                  onClick={() => setSelectedCourse(course)}
                  className="p-5 space-y-3 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-black text-sm text-slate-900 group-hover:text-amber-600 transition-colors">
                        {course.code}
                      </span>
                      <h3 className="text-xs font-bold text-slate-600 line-clamp-1 mt-0.5">
                        {course.name}
                      </h3>
                    </div>
                    <ProgressRing value={mastery} size={42} strokeWidth={4} showLabel={false} color="#f59e0b" />
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        mastery >= 70
                          ? 'bg-emerald-500'
                          : mastery >= 50
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${mastery}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                    <span>{course.units} Units • Target: {course.target_grade}</span>
                    <span className="font-bold text-slate-700 group-hover:text-slate-900 flex items-center">
                      <span>{courseTopics.length} Topics</span>
                      <ChevronRight className="w-3 h-3 ml-0.5" />
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ADD COURSE DIALOG */}
      <Dialog
        isOpen={isAddingCourse}
        onClose={() => setIsAddingCourse(false)}
        title="Add New Enrolled Course"
      >
        <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Course Code</label>
            <input
              type="text"
              required
              placeholder="e.g. MEE401"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono uppercase font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Course Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Advanced Fluid Dynamics"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Units / Credits</label>
              <input
                type="number"
                min={1}
                max={6}
                value={newUnits}
                onChange={(e) => setNewUnits(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Target Grade</label>
              <select
                value={newTargetGrade}
                onChange={(e) => setNewTargetGrade(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="A">A (First Class)</option>
                <option value="B">B (Second Class Upper)</option>
                <option value="C">C</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddingCourse(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              type="submit"
            >
              Add Course
            </Button>
          </div>
        </form>
      </Dialog>

      {/* EDIT SEMESTER DIALOG */}
      <Dialog
        isOpen={isEditingSemester}
        onClose={() => setIsEditingSemester(false)}
        title="Edit Semester Blueprint"
      >
        <form onSubmit={handleSaveSemester} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Semester Title</label>
            <input
              type="text"
              value={semTitle}
              onChange={(e) => setSemTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Start Date</label>
              <input
                type="date"
                value={semStart}
                onChange={(e) => setSemStart(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Exam Window</label>
              <input
                type="date"
                value={semExamWindow}
                onChange={(e) => setSemExamWindow(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Academic Floor (Hours / Week)</label>
            <input
              type="number"
              min={10}
              max={60}
              value={semFloorHours}
              onChange={(e) => setSemFloorHours(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingSemester(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              type="submit"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
