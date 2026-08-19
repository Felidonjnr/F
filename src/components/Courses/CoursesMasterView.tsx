import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  Layers,
  Plus,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { Course, CourseMaterial, Semester, Topic } from '../../types';
import { CoursesView } from './CoursesView';
import { SemesterView } from '../Semester/SemesterView';

interface CoursesMasterViewProps {
  semester: Semester;
  courses: Course[];
  topics: Topic[];
  materials: CourseMaterial[];
  onUpdateSemester: (updated: Partial<Semester>) => void;
  onAddCourse: (course: Omit<Course, 'id' | 'semester_id'>) => void;
  onSelectCourse: (course: Course) => void;
  onOpenUploadMaterial: (course?: Course) => void;
}

export const CoursesMasterView: React.FC<CoursesMasterViewProps> = ({
  semester,
  courses,
  topics,
  materials,
  onUpdateSemester,
  onAddCourse,
  onSelectCourse,
  onOpenUploadMaterial,
}) => {
  const [subTab, setSubTab] = useState<'catalog' | 'semester'>('catalog');

  const totalUnits = courses.reduce((acc, c) => acc + c.units, 0);

  return (
    <div id="courses-master-view-root" className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Segment Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2 bg-slate-100/80 rounded-2xl border border-slate-200/80">
        <div className="flex items-center space-x-1 p-1 bg-white rounded-xl shadow-2xs border border-slate-200/60">
          <button
            onClick={() => setSubTab('catalog')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              subTab === 'catalog'
                ? 'bg-slate-900 text-amber-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Course Catalog ({courses.length})</span>
          </button>

          <button
            onClick={() => setSubTab('semester')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              subTab === 'semester'
                ? 'bg-slate-900 text-amber-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Semester Blueprint & Timeline</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 px-3 text-xs font-semibold text-slate-600">
          <span className="font-mono font-bold text-slate-900">{totalUnits}</span> Credit Load •{' '}
          <span className="font-bold text-amber-700">Week {semester.current_week}</span> of {semester.total_weeks}
        </div>
      </div>

      {/* SUB-VIEW RENDERING */}
      {subTab === 'catalog' ? (
        <CoursesView
          courses={courses}
          topics={topics}
          materials={materials}
          onAddCourse={onAddCourse}
          onSelectCourse={onSelectCourse}
          onOpenUploadMaterial={onOpenUploadMaterial}
        />
      ) : (
        <SemesterView
          semester={semester}
          courses={courses}
          onUpdateSemester={onUpdateSemester}
        />
      )}
    </div>
  );
};
