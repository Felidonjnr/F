import React, { useEffect, useState } from 'react';
import { AICoachView } from './components/AICoach/AICoachView';
import { AnalyticsView } from './components/Analytics/AnalyticsView';
import { AssessmentRunnerModal } from './components/Assessments/AssessmentRunnerModal';
import { AssessmentsView } from './components/Assessments/AssessmentsView';
import { CourseDetailModal } from './components/Courses/CourseDetailModal';
import { CoursesView } from './components/Courses/CoursesView';
import { MaterialUploadModal } from './components/Courses/MaterialUploadModal';
import { TopicModal } from './components/Courses/TopicModal';
import { DashboardView } from './components/Dashboard/DashboardView';
import { AcademicDebtView } from './components/Debt/AcademicDebtView';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { SemesterView } from './components/Semester/SemesterView';
import { SettingsView } from './components/Settings/SettingsView';
import { ActiveSessionModal } from './components/Study/ActiveSessionModal';
import { StudyView } from './components/Study/StudyView';
import { AppState, StateManager } from './services/storage';
import {
  AcademicDebt,
  AppTab,
  Assessment,
  Course,
  StudyMission,
  Topic,
} from './types';

export default function App() {
  const stateManager = StateManager.getInstance();
  const [state, setState] = useState<AppState>(stateManager.getState());
  const [currentTab, setCurrentTab] = useState<AppTab>('dashboard');

  // Modals state
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState<Course | null>(null);
  const [activeStudyMission, setActiveStudyMission] = useState<StudyMission | null>(null);
  const [activeAssessmentRunner, setActiveAssessmentRunner] = useState<Assessment | null>(null);
  const [isUploadMaterialOpen, setIsUploadMaterialOpen] = useState(false);
  const [uploadTargetCourse, setUploadTargetCourse] = useState<Course | null>(null);
  const [topicModalConfig, setTopicModalConfig] = useState<{
    isOpen: boolean;
    course: Course | null;
    topic: Topic | null;
  }>({
    isOpen: false,
    course: null,
    topic: null,
  });

  // Subscribe to storage updates
  useEffect(() => {
    const unsubscribe = stateManager.subscribe((newState) => {
      setState({ ...newState });
    });
    return () => unsubscribe();
  }, []);

  const pressure = stateManager.getPressureBreakdown();
  const academicHealth = stateManager.getAcademicHealth();
  const activeDebtCount = state.debts.filter((d) => d.status !== 'resolved').length;
  const pendingMissionsCount = state.missions.filter((m) => m.status === 'pending').length;
  const readyAssessmentsCount = state.assessments.filter((a) => a.status === 'ready').length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-amber-200 selection:text-slate-900">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        academicHealth={academicHealth}
        pressure={pressure}
        activeDebtCount={activeDebtCount}
        notifications={state.notifications}
        onMarkNotificationRead={(id) => stateManager.markNotificationRead(id)}
        onMarkAllNotificationsRead={() => stateManager.markAllNotificationsRead()}
        studentName={state.profile.name}
        department={state.profile.department}
      />

      {/* Main Tab Navigation */}
      <Navigation
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeDebtCount={activeDebtCount}
        todayMissionsCount={pendingMissionsCount}
        pendingAssessmentsCount={readyAssessmentsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            profile={state.profile}
            semester={state.semester}
            courses={state.courses}
            topics={state.topics}
            debts={state.debts}
            missions={state.missions}
            pressure={pressure}
            academicHealth={academicHealth}
            onNavigate={setCurrentTab}
            onLaunchStudySession={(m) => setActiveStudyMission(m)}
            onOpenResolveModal={(debt) => {
              setCurrentTab('debt');
            }}
            onOpenNewAssessment={() => setCurrentTab('assessments')}
            onOpenUploadMaterial={() => setIsUploadMaterialOpen(true)}
            onRegenerateMissions={() => stateManager.regenerateDailyMissions()}
            onSelectCourse={(course) => setSelectedCourseForDetail(course)}
          />
        )}

        {currentTab === 'semester' && (
          <SemesterView
            semester={state.semester}
            courses={state.courses}
            topics={state.topics}
            profile={state.profile}
            onUpdateSemester={(updated) => stateManager.updateSemester(updated)}
          />
        )}

        {currentTab === 'courses' && (
          <CoursesView
            courses={state.courses}
            topics={state.topics}
            materials={state.materials}
            onAddCourse={(c) => stateManager.addCourse(c)}
            onSelectCourse={(course) => setSelectedCourseForDetail(course)}
            onOpenUploadMaterial={(course) => {
              setUploadTargetCourse(course || null);
              setIsUploadMaterialOpen(true);
            }}
          />
        )}

        {currentTab === 'study' && (
          <StudyView
            missions={state.missions}
            courses={state.courses}
            topics={state.topics}
            onLaunchStudySession={(m) => setActiveStudyMission(m)}
            onRegenerateMissions={() => stateManager.regenerateDailyMissions()}
          />
        )}

        {currentTab === 'assessments' && (
          <AssessmentsView
            assessments={state.assessments}
            courses={state.courses}
            topics={state.topics}
            onTakeAssessment={(a) => setActiveAssessmentRunner(a)}
            onAddAssessment={(a) => stateManager.addAssessment(a)}
          />
        )}

        {currentTab === 'debt' && (
          <AcademicDebtView
            debts={state.debts}
            courses={state.courses}
            topics={state.topics}
            errors={state.errors}
            recoveryPlans={state.recoveryPlans}
            onResolveDebt={(id, ev) => stateManager.resolveDebt(id, ev)}
            onDeleteDebt={(id) => stateManager.deleteDebt(id)}
            onAddDebt={(d) => stateManager.addDebt(d)}
            onCreateRecoveryPlan={(p) => stateManager.createRecoveryPlan(p)}
            onCompletePlanStep={(pId, sIdx) => stateManager.completeRecoveryPlanStep(pId, sIdx)}
            onResolveError={(eId) => stateManager.markErrorResolved(eId)}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView
            profile={state.profile}
            courses={state.courses}
            topics={state.topics}
            debts={state.debts}
            missions={state.missions}
            assessments={state.assessments}
            errors={state.errors}
            pressure={pressure}
            academicHealth={academicHealth}
          />
        )}

        {currentTab === 'coach' && <AICoachView />}

        {currentTab === 'settings' && (
          <SettingsView
            profile={state.profile}
            onUpdateProfile={(u) => stateManager.updateProfile(u)}
            onResetFactorySeed={() => stateManager.resetToFactorySeed()}
          />
        )}
      </main>

      {/* Global Modals */}

      {/* 1. Active Study Session Runner */}
      {activeStudyMission && (
        <ActiveSessionModal
          mission={activeStudyMission}
          topic={state.topics.find((t) => t.id === activeStudyMission.topic_id)}
          course={state.courses.find((c) => c.code === activeStudyMission.course_code)}
          isOpen={Boolean(activeStudyMission)}
          onClose={() => setActiveStudyMission(null)}
          onCompleteSession={(params) => stateManager.completeStudyMission(params)}
        />
      )}

      {/* 2. Timed Assessment Runner */}
      {activeAssessmentRunner && (
        <AssessmentRunnerModal
          assessment={activeAssessmentRunner}
          courses={state.courses}
          topics={state.topics}
          isOpen={Boolean(activeAssessmentRunner)}
          onClose={() => setActiveAssessmentRunner(null)}
          onSubmitAssessment={(id, attempts) => stateManager.submitAssessment(id, attempts)}
        />
      )}

      {/* 3. Course Detail / Topic Hierarchy Modal */}
      {selectedCourseForDetail && (
        <CourseDetailModal
          course={selectedCourseForDetail}
          topics={state.topics}
          materials={state.materials}
          isOpen={Boolean(selectedCourseForDetail)}
          onClose={() => setSelectedCourseForDetail(null)}
          onOpenAddTopic={(course) => {
            setTopicModalConfig({ isOpen: true, course, topic: null });
          }}
          onOpenEditTopic={(course, topic) => {
            setTopicModalConfig({ isOpen: true, course, topic });
          }}
          onOpenUploadMaterial={(course) => {
            setUploadTargetCourse(course);
            setIsUploadMaterialOpen(true);
          }}
          onUpdateCourse={(id, u) => stateManager.updateCourse(id, u)}
          onDeleteCourse={(id) => stateManager.deleteCourse(id)}
        />
      )}

      {/* 4. Topic Add / Edit Modal */}
      {topicModalConfig.isOpen && topicModalConfig.course && (
        <TopicModal
          course={topicModalConfig.course}
          topic={topicModalConfig.topic}
          existingTopics={state.topics.filter((t) => t.course_id === topicModalConfig.course?.id)}
          isOpen={topicModalConfig.isOpen}
          onClose={() => setTopicModalConfig({ isOpen: false, course: null, topic: null })}
          onSave={(topicData, isEdit, topicId) => {
            if (isEdit && topicId) {
              stateManager.updateTopic(topicId, topicData);
            } else {
              stateManager.addTopic(topicData);
            }
          }}
          onDelete={(tId) => stateManager.deleteTopic(tId)}
        />
      )}

      {/* 5. Document Upload & AI Topic Extraction Modal */}
      {isUploadMaterialOpen && (
        <MaterialUploadModal
          courses={state.courses}
          isOpen={isUploadMaterialOpen}
          onClose={() => {
            setIsUploadMaterialOpen(false);
            setUploadTargetCourse(null);
          }}
          onUploadAndExtract={(material, extractedTopics) => {
            stateManager.addMaterial(material);
            extractedTopics.forEach((t) => stateManager.addTopic(t));
          }}
        />
      )}
    </div>
  );
}
