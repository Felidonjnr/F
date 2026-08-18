import React from 'react';
import { BookOpen, ChevronRight, FileSpreadsheet, ShieldAlert, Sparkles } from 'lucide-react';
import { AppTab, Course, Topic } from '../../types';

interface CourseRiskCardProps {
  courses: Course[];
  topics: Topic[];
  onNavigate: (tab: AppTab) => void;
  onSelectCourse: (course: Course) => void;
}

export const CourseRiskCard: React.FC<CourseRiskCardProps> = ({
  courses,
  topics,
  onNavigate,
  onSelectCourse,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200/60">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Course Mastery & Trajectory</h3>
            <p className="text-[11px] text-slate-500">Active semester courses and topic coverage</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('courses')}
          className="text-xs font-semibold text-sky-600 hover:text-sky-700 underline"
        >
          Manage All Courses
        </button>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4">
        {courses.map((course) => {
          const courseTopics = topics.filter((t) => t.course_id === course.id);
          const avgScore = courseTopics.length > 0
            ? Math.round(
                courseTopics.reduce((acc, t) => acc + (t.mastery?.overall || 0), 0) / courseTopics.length
              )
            : 0;

          const isAtRisk = avgScore < 60;

          return (
            <div
              key={course.id}
              onClick={() => onSelectCourse(course)}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: course.color }}
                    />
                    <span className="font-bold text-xs text-slate-900 font-mono">{course.code}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-1.5 py-0.2 rounded">
                      {course.units} Units
                    </span>
                  </div>

                  {isAtRisk ? (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                      Deficit Risk
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      Target: {course.target_grade}
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-semibold text-slate-800 mt-1 line-clamp-1 group-hover:text-amber-600 transition-colors">
                  {course.name}
                </h4>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-slate-500 font-medium mb-1">
                  <span>{courseTopics.length} Topics Mapped</span>
                  <span className="font-bold text-slate-900">{avgScore}% Mastery</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${
                      avgScore >= 75 ? 'bg-emerald-500' : avgScore >= 60 ? 'bg-sky-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, avgScore)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
