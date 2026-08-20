import React, { useEffect, useState } from 'react';
import { AICoachView } from './components/AICoach/AICoachView';
import { AssessmentRunnerModal } from './components/Assessments/AssessmentRunnerModal';
import { SignInView } from './components/Auth/SignInView';
import { CourseDetailModal } from './components/Courses/CourseDetailModal';
import { CoursesMasterView } from './components/Courses/CoursesMasterView';
import { MaterialUploadModal } from './components/Courses/MaterialUploadModal';
import { TopicModal } from './components/Courses/TopicModal';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { ReviewMasterView } from './components/Review/ReviewMasterView';
import { SettingsView } from './components/Settings/SettingsView';
import { ActiveSessionModal } from './components/Study/ActiveSessionModal';
import { TodayView } from './components/Dashboard/LegacyTodayView';
import OnboardingPage from './app/onboarding/page';
import FullQueueTodayPage from './app/queue/today/page';
import { AppState, StateManager } from './services/storage';
import { getSupabaseClient, isSupabaseConfigured } from './services/supabase';
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
  const [currentTab, setCurrentTab] = useState<AppTab>('today');
  const [currentPath, setCurrentPath] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  // Listen to popstate (back/forward navigation)
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

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

  // Supabase Auth Listener
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    // Get current active session
    client.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setAuthLoading(false);
    });

    // Subscribe to auth state transitions
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Subscribe to storage updates
  useEffect(() => {
    const unsubscribe = stateManager.subscribe((newState) => {
      setState({ ...newState });
    });
    return () => unsubscribe();
  }, []);

  // Show Auth Loading Spinner
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">
          Loading FirstClass OS...
        </span>
      </div>
    );
  }

  // Auth Wall: If Supabase is configured, not in offline mode, and no active session exists
  if (isSupabaseConfigured && !session && !offlineMode) {
    return (
      <SignInView
        onSuccess={() => {}}
        onContinueOffline={() => setOfflineMode(true)}
      />
    );
  }

  const pressure = stateManager.getPressureBreakdown();
  const academicHealth = stateManager.getAcademicHealth();
  const activeDebtCount = state.debts.filter((d) => d.status !== 'resolved').length;
  const pendingMissionsCount = state.missions.filter((m) => m.status === 'pending').length;
  const readyAssessmentsCount = state.assessments.filter((a) => a.status === 'ready').length;

  // Standalone page routes
  if (currentPath === '/onboarding') {
    return <OnboardingPage />;
  }

  if (currentPath === '/queue/today') {
    return <FullQueueTodayPage />;
  }

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
        {(currentTab === 'today' || currentTab === 'dashboard' || currentTab === 'study') && (
          <TodayView
            profile={state.profile}
            semester={state.semester}
            courses={state.courses}
            topics={state.topics}
            debts={state.debts}
            missions={state.missions}
            assessments={state.assessments}
            pressure={pressure}
            academicHealth={academicHealth}
            onStartSession={(m) => setActiveStudyMission(m)}
            onSelectCourse={(course) => setSelectedCourseForDetail(course)}
            onRegenerateMissions={() => stateManager.regenerateDailyMissions()}
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onResolveDebt={(id, ev) => stateManager.resolveDebt(id, ev)}
            onOpenUploadMaterial={() => setIsUploadMaterialOpen(true)}
            onTakeAssessment={(a) => setActiveAssessmentRunner(a)}
          />
        )}

        {(currentTab === 'courses' || currentTab === 'semester') && (
          <CoursesMasterView
            semester={state.semester}
            courses={state.courses}
            topics={state.topics}
            materials={state.materials}
            onUpdateSemester={(updated) => stateManager.updateSemester(updated)}
            onAddCourse={(c) => stateManager.addCourse(c)}
            onSelectCourse={(course) => setSelectedCourseForDetail(course)}
            onOpenUploadMaterial={(course) => {
              setUploadTargetCourse(course || null);
              setIsUploadMaterialOpen(true);
            }}
          />
        )}

        {(currentTab === 'review' ||
          currentTab === 'assessments' ||
          currentTab === 'debt' ||
          currentTab === 'analytics') && (
          <ReviewMasterView
            profile={state.profile}
            courses={state.courses}
            topics={state.topics}
            debts={state.debts}
            missions={state.missions}
            assessments={state.assessments}
            errors={state.errors}
            recoveryPlans={state.recoveryPlans}
            pressure={pressure}
            academicHealth={academicHealth}
            initialSubTab={
              currentTab === 'debt'
                ? 'debt'
                : currentTab === 'analytics'
                ? 'analytics'
                : 'assessments'
            }
            onTakeAssessment={(a) => setActiveAssessmentRunner(a)}
            onAddAssessment={(a) => stateManager.addAssessment(a)}
            onResolveDebt={(id, ev) => stateManager.resolveDebt(id, ev)}
            onDeleteDebt={(id) => stateManager.deleteDebt(id)}
            onAddDebt={(d) => stateManager.addDebt(d)}
            onCreateRecoveryPlan={(p) => stateManager.createRecoveryPlan(p)}
            onCompletePlanStep={(pId, sIdx) => stateManager.completeRecoveryPlanStep(pId, sIdx)}
            onResolveError={(eId) => stateManager.markErrorResolved(eId)}
          />
        )}

        {currentTab === 'coach' && <AICoachView />}

        {currentTab === 'settings' && (
          <SettingsView
            profile={state.profile}
            onUpdateProfile={(u) => stateManager.updateProfile(u)}
            onResetFactorySeed={() => stateManager.resetToFactorySeed()}
            onSignOut={() => {
              setSession(null);
              setOfflineMode(false);
            }}
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
