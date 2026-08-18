import React from 'react';
import { AcademicHealthCard } from './AcademicHealthCard';
import { CourseRiskCard } from './CourseRiskCard';
import { DebtCard } from './DebtCard';
import { PressureCard } from './PressureCard';
import { QuickActionHub } from './QuickActionHub';
import { TodayMissionsCard } from './TodayMissionsCard';
import {
  AcademicDebt,
  AppTab,
  Course,
  PressureBreakdown,
  Semester,
  StudentProfile,
  StudyMission,
  Topic,
} from '../../types';

interface DashboardViewProps {
  profile: StudentProfile;
  semester: Semester;
  courses: Course[];
  topics: Topic[];
  debts: AcademicDebt[];
  missions: StudyMission[];
  pressure: PressureBreakdown;
  academicHealth: number;
  onNavigate: (tab: AppTab) => void;
  onLaunchStudySession: (mission: StudyMission) => void;
  onOpenResolveModal: (debt: AcademicDebt) => void;
  onOpenNewAssessment: () => void;
  onOpenUploadMaterial: () => void;
  onRegenerateMissions: () => void;
  onSelectCourse: (course: Course) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  semester,
  courses,
  topics,
  debts,
  missions,
  pressure,
  academicHealth,
  onNavigate,
  onLaunchStudySession,
  onOpenResolveModal,
  onOpenNewAssessment,
  onOpenUploadMaterial,
  onRegenerateMissions,
  onSelectCourse,
}) => {
  const avgMastery = topics.length > 0
    ? Math.round(topics.reduce((acc, t) => acc + (t.mastery?.overall || 0), 0) / topics.length)
    : 0;

  const completedMissions = missions.filter((m) => m.status === 'completed').length;
  const weeklyCompletionRate = missions.length > 0
    ? Math.round((completedMissions / missions.length) * 100)
    : 100;

  const handleLaunchFirst = () => {
    const pending = missions.find((m) => m.status === 'pending') || missions[0];
    if (pending) {
      onLaunchStudySession(pending);
    } else {
      onNavigate('study');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner with Semester context & Exam countdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <div>
            <span className="font-bold text-slate-900 text-sm">{semester.name}</span>
            <span className="text-xs text-slate-600 ml-2">
              Exam Period: {semester.exam_start_date} to {semester.exam_end_date}
            </span>
          </div>
        </div>
        <div className="text-xs font-semibold text-amber-900 bg-amber-200/60 px-3 py-1 rounded-lg w-fit">
          Accountability Level: <span className="font-bold">{profile.accountability_level}</span>
        </div>
      </div>

      {/* Quick Action Center */}
      <QuickActionHub
        onNavigate={onNavigate}
        onOpenNewAssessment={onOpenNewAssessment}
        onOpenUploadMaterial={onOpenUploadMaterial}
        onRegenerateMissions={onRegenerateMissions}
        onLaunchFirstPendingMission={handleLaunchFirst}
      />

      {/* Academic Health Index */}
      <AcademicHealthCard
        academicHealth={academicHealth}
        avgMastery={avgMastery}
        pressureScore={pressure.score}
        weeklyCompletionRate={weeklyCompletionRate}
        profile={profile}
        onNavigate={onNavigate}
      />

      {/* 2-Column Pressure & Debt Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PressureCard pressure={pressure} onNavigate={onNavigate} />
        <DebtCard debts={debts} onNavigate={onNavigate} onOpenResolveModal={onOpenResolveModal} />
      </div>

      {/* Today's Missions */}
      <TodayMissionsCard
        missions={missions}
        onNavigate={onNavigate}
        onLaunchStudySession={onLaunchStudySession}
      />

      {/* Course Mastery Trajectory */}
      <CourseRiskCard
        courses={courses}
        topics={topics}
        onNavigate={onNavigate}
        onSelectCourse={onSelectCourse}
      />
    </div>
  );
};
