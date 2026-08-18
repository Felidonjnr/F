import {
  AcademicDebt,
  AppNotification,
  Assessment,
  AssessmentDiagnosticReport,
  Course,
  CourseMaterial,
  ErrorEvent,
  PressureBreakdown,
  QuestionAttempt,
  RecoveryPlan,
  Semester,
  StudentProfile,
  StudyMission,
  Topic,
} from '../types';
import {
  calculateAggregateMastery,
  updateMasteryFromAssessment,
  updateMasteryFromStudySession,
} from './deterministic/mastery';
import { calculatePressureScore } from './deterministic/pressure';
import { scoreAssessment } from './deterministic/assessment';
import { createDebtItem } from './deterministic/debt';
import { generateDailyStudyMissions } from './deterministic/planner';
import {
  initialAssessments,
  initialCourses,
  initialDebts,
  initialErrors,
  initialMaterials,
  initialMissions,
  initialNotifications,
  initialRecoveryPlans,
  initialSemester,
  initialStudentProfile,
  initialTopics,
} from './mockData';

const STORAGE_PREFIX = 'firstclass_os_';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage`, e);
  }
}

export interface AppState {
  profile: StudentProfile;
  semester: Semester;
  courses: Course[];
  topics: Topic[];
  debts: AcademicDebt[];
  missions: StudyMission[];
  materials: CourseMaterial[];
  assessments: Assessment[];
  errors: ErrorEvent[];
  recoveryPlans: RecoveryPlan[];
  notifications: AppNotification[];
}

export class StateManager {
  private static instance: StateManager;
  private state: AppState;
  private listeners: Set<(state: AppState) => void> = new Set();

  private constructor() {
    this.state = {
      profile: loadFromStorage('profile', initialStudentProfile),
      semester: loadFromStorage('semester', initialSemester),
      courses: loadFromStorage('courses', initialCourses),
      topics: loadFromStorage('topics', initialTopics),
      debts: loadFromStorage('debts', initialDebts),
      missions: loadFromStorage('missions', initialMissions),
      materials: loadFromStorage('materials', initialMaterials),
      assessments: loadFromStorage('assessments', initialAssessments),
      errors: loadFromStorage('errors', initialErrors),
      recoveryPlans: loadFromStorage('recoveryPlans', initialRecoveryPlans),
      notifications: loadFromStorage('notifications', initialNotifications),
    };
  }

  public static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  public getState(): AppState {
    return this.state;
  }

  public subscribe(listener: (state: AppState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.state));
  }

  // Profile Management
  public updateProfile(updated: Partial<StudentProfile>): void {
    this.state.profile = { ...this.state.profile, ...updated };
    saveToStorage('profile', this.state.profile);
    this.notify();
  }

  // Semester Management
  public updateSemester(updated: Partial<Semester>): void {
    this.state.semester = { ...this.state.semester, ...updated };
    saveToStorage('semester', this.state.semester);
    this.notify();
  }

  // Course Management
  public addCourse(course: Omit<Course, 'id' | 'semester_id'>): Course {
    const newCourse: Course = {
      ...course,
      id: `crs-${Date.now()}`,
      semester_id: this.state.semester.id,
    };
    this.state.courses = [...this.state.courses, newCourse];
    saveToStorage('courses', this.state.courses);
    this.notify();
    return newCourse;
  }

  public updateCourse(id: string, updated: Partial<Course>): void {
    this.state.courses = this.state.courses.map((c) => (c.id === id ? { ...c, ...updated } : c));
    saveToStorage('courses', this.state.courses);
    this.notify();
  }

  public deleteCourse(id: string): void {
    this.state.courses = this.state.courses.filter((c) => c.id !== id);
    this.state.topics = this.state.topics.filter((t) => t.course_id !== id);
    this.state.debts = this.state.debts.filter((d) => d.course_id !== id);
    this.state.materials = this.state.materials.filter((m) => m.course_id !== id);
    this.state.missions = this.state.missions.filter((m) => m.course_id !== id);
    this.state.assessments = this.state.assessments.filter((a) => a.course_id !== id);
    saveToStorage('courses', this.state.courses);
    saveToStorage('topics', this.state.topics);
    saveToStorage('debts', this.state.debts);
    saveToStorage('materials', this.state.materials);
    saveToStorage('missions', this.state.missions);
    saveToStorage('assessments', this.state.assessments);
    this.notify();
  }

  // Topic Management
  public addTopic(topicData: Omit<Topic, 'id' | 'mastery'>): Topic {
    const newTopic: Topic = {
      ...topicData,
      id: `top-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      mastery: {
        recall: 50,
        conceptual: 50,
        procedural: 50,
        application: 50,
        transfer: 50,
        overall: 50,
        confidence: 50,
        last_practiced_at: new Date().toISOString(),
      },
    };
    this.state.topics = [...this.state.topics, newTopic];
    saveToStorage('topics', this.state.topics);
    this.notify();
    return newTopic;
  }

  public updateTopic(id: string, updated: Partial<Topic>): void {
    this.state.topics = this.state.topics.map((t) => (t.id === id ? { ...t, ...updated } : t));
    saveToStorage('topics', this.state.topics);
    this.notify();
  }

  public deleteTopic(id: string): void {
    this.state.topics = this.state.topics.filter((t) => t.id !== id);
    this.state.debts = this.state.debts.filter((d) => d.topic_id !== id);
    this.state.missions = this.state.missions.filter((m) => m.topic_id !== id);
    saveToStorage('topics', this.state.topics);
    saveToStorage('debts', this.state.debts);
    saveToStorage('missions', this.state.missions);
    this.notify();
  }

  // Material Management
  public addMaterial(material: Omit<CourseMaterial, 'id' | 'uploaded_at'>): CourseMaterial {
    const newMat: CourseMaterial = {
      ...material,
      id: `mat-${Date.now()}`,
      uploaded_at: new Date().toISOString(),
    };
    this.state.materials = [newMat, ...this.state.materials];
    saveToStorage('materials', this.state.materials);
    this.notify();
    return newMat;
  }

  public deleteMaterial(id: string): void {
    this.state.materials = this.state.materials.filter((m) => m.id !== id);
    saveToStorage('materials', this.state.materials);
    this.notify();
  }

  // Study Mission & Active Session Completion
  public completeStudyMission(params: {
    missionId: string;
    completedMinutes: number;
    notes: string;
    recalledSuccessfully: boolean;
    practiceScorePercent: number;
    confidenceRating: number;
  }): void {
    const mission = this.state.missions.find((m) => m.id === params.missionId);
    if (!mission) return;

    // Update mission status
    this.state.missions = this.state.missions.map((m) =>
      m.id === params.missionId
        ? {
            ...m,
            status: 'completed',
            completed_minutes: params.completedMinutes,
            completion_evidence: params.notes,
            post_session_confidence: params.confidenceRating,
          }
        : m
    );

    // Update topic mastery
    const topic = this.state.topics.find((t) => t.id === mission.topic_id);
    if (topic) {
      const updatedMastery = updateMasteryFromStudySession(
        topic.mastery,
        params.recalledSuccessfully,
        params.practiceScorePercent
      );
      this.updateTopic(topic.id, { mastery: updatedMastery });
    }

    // If this mission was tied to a debt item, resolve the debt
    if (mission.is_debt_recovery && mission.debt_id) {
      this.resolveDebt(mission.debt_id, `Resolved via study mission: ${params.notes}`);
    }

    saveToStorage('missions', this.state.missions);
    this.notify();
  }

  public regenerateDailyMissions(): void {
    const dailyCap = Math.round(this.state.profile.weekly_available_minutes / 7);
    const newMissions = generateDailyStudyMissions({
      courses: this.state.courses,
      topics: this.state.topics,
      debts: this.state.debts,
      dailyAvailableMinutes: dailyCap || 180,
    });
    this.state.missions = newMissions;
    saveToStorage('missions', this.state.missions);
    this.notify();
  }

  // Assessment Management & Submission
  public addAssessment(assessment: Omit<Assessment, 'id' | 'status'>): Assessment {
    const newAss: Assessment = {
      ...assessment,
      id: `ass-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'ready',
    };
    this.state.assessments = [newAss, ...this.state.assessments];
    saveToStorage('assessments', this.state.assessments);
    this.notify();
    return newAss;
  }

  public submitAssessment(
    assessmentId: string,
    attempts: QuestionAttempt[]
  ): AssessmentDiagnosticReport | null {
    const assessment = this.state.assessments.find((a) => a.id === assessmentId);
    if (!assessment) return null;

    const result = scoreAssessment(assessment, attempts, this.state.topics);

    // Update assessment
    const updatedAss: Assessment = {
      ...assessment,
      status: 'graded',
      submitted_at: new Date().toISOString(),
      score: result.score,
      max_score: result.max_score,
      attempts,
      diagnostic_report: result.report,
    };

    this.state.assessments = this.state.assessments.map((a) =>
      a.id === assessmentId ? updatedAss : a
    );

    // Update topic masteries from question evidence
    const topicQuestions: Record<string, { dimension: any; isCorrect: boolean }[]> = {};
    assessment.questions.forEach((q) => {
      const attempt = attempts.find((att) => att.question_id === q.id);
      const isCorrect = attempt?.student_answer === q.correct_answer;
      const tId = q.topic_id;
      if (tId) {
        if (!topicQuestions[tId]) topicQuestions[tId] = [];
        topicQuestions[tId].push({ dimension: q.dimension, isCorrect });
      }
    });

    Object.entries(topicQuestions).forEach(([tId, evList]) => {
      const topic = this.state.topics.find((t) => t.id === tId);
      if (topic) {
        const updatedMastery = updateMasteryFromAssessment(topic.mastery, evList);
        this.state.topics = this.state.topics.map((t) =>
          t.id === tId ? { ...t, mastery: updatedMastery } : t
        );
      }
    });

    // Auto-create Academic Debt for weak topics identified
    result.topicsNeedingDebt.forEach((need) => {
      const course = this.state.courses.find((c) => c.code === need.course_code);
      const debt = createDebtItem({
        course_id: course?.id || this.state.courses[0]?.id || 'crs-1',
        topic_id: need.topic_id,
        topic_name: need.topic_name,
        course_code: need.course_code,
        source: 'assessment_failure',
        severity: need.severity,
        title: `Deficit in ${need.topic_name}`,
        reason: need.reason,
        estimated_recovery_minutes: need.severity === 'high' ? 40 : 25,
      });
      this.state.debts = [debt, ...this.state.debts];
    });

    // Log new errors into Error Bank
    result.newErrors.forEach((err) => {
      const newErr: ErrorEvent = {
        ...err,
        id: `err-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        occurred_at: new Date().toISOString(),
        resolved: false,
      };
      this.state.errors = [newErr, ...this.state.errors];
    });

    // Add notification
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: `Assessment Completed: ${assessment.title}`,
      message: `Scored ${result.score}/${result.max_score} (${result.report.overall_score}%). ${result.report.debt_created_count} debt item(s) flagged for recovery.`,
      type: 'assessment',
      urgency: result.report.overall_score < 60 ? 'high' : 'normal',
      timestamp: new Date().toISOString(),
      is_read: false,
      action_label: 'View Results',
      action_tab: 'assessments',
    };
    this.state.notifications = [newNotif, ...this.state.notifications];

    saveToStorage('assessments', this.state.assessments);
    saveToStorage('topics', this.state.topics);
    saveToStorage('debts', this.state.debts);
    saveToStorage('errors', this.state.errors);
    saveToStorage('notifications', this.state.notifications);
    this.notify();

    return result.report;
  }

  // Academic Debt
  public addDebt(debtData: Parameters<typeof createDebtItem>[0]): AcademicDebt {
    const debt = createDebtItem(debtData);
    this.state.debts = [debt, ...this.state.debts];
    saveToStorage('debts', this.state.debts);
    this.notify();
    return debt;
  }

  public resolveDebt(debtId: string, evidence: string): void {
    this.state.debts = this.state.debts.map((d) =>
      d.id === debtId
        ? {
            ...d,
            status: 'resolved',
            resolved_at: new Date().toISOString(),
            resolution_evidence: evidence,
          }
        : d
    );
    saveToStorage('debts', this.state.debts);
    this.notify();
  }

  public deleteDebt(debtId: string): void {
    this.state.debts = this.state.debts.filter((d) => d.id !== debtId);
    saveToStorage('debts', this.state.debts);
    this.notify();
  }

  // Error Bank Management
  public markErrorResolved(errId: string): void {
    this.state.errors = this.state.errors.map((e) =>
      e.id === errId ? { ...e, resolved: true } : e
    );
    saveToStorage('errors', this.state.errors);
    this.notify();
  }

  // Recovery Plans
  public createRecoveryPlan(plan: Omit<RecoveryPlan, 'id' | 'created_at' | 'status'>): RecoveryPlan {
    const newPlan: RecoveryPlan = {
      ...plan,
      id: `rec-${Date.now()}`,
      created_at: new Date().toISOString(),
      status: 'active',
    };
    this.state.recoveryPlans = [newPlan, ...this.state.recoveryPlans];
    saveToStorage('recoveryPlans', this.state.recoveryPlans);
    this.notify();
    return newPlan;
  }

  public completeRecoveryPlanStep(planId: string, slotIndex: number): void {
    this.state.recoveryPlans = this.state.recoveryPlans.map((p) => {
      if (p.id !== planId) return p;
      const updatedSlots = [...p.scheduled_slots];
      if (updatedSlots[slotIndex]) {
        updatedSlots[slotIndex].status = 'completed';
      }
      const allDone = updatedSlots.every((s) => s.status === 'completed');
      return {
        ...p,
        scheduled_slots: updatedSlots,
        status: allDone ? 'completed' : p.status,
      };
    });
    saveToStorage('recoveryPlans', this.state.recoveryPlans);
    this.notify();
  }

  // Notifications
  public markNotificationRead(notifId: string): void {
    this.state.notifications = this.state.notifications.map((n) =>
      n.id === notifId ? { ...n, is_read: true } : n
    );
    saveToStorage('notifications', this.state.notifications);
    this.notify();
  }

  public markAllNotificationsRead(): void {
    this.state.notifications = this.state.notifications.map((n) => ({ ...n, is_read: true }));
    saveToStorage('notifications', this.state.notifications);
    this.notify();
  }

  // Reset to default seed
  public resetToFactorySeed(): void {
    this.state = {
      profile: initialStudentProfile,
      semester: initialSemester,
      courses: initialCourses,
      topics: initialTopics,
      debts: initialDebts,
      missions: initialMissions,
      materials: initialMaterials,
      assessments: initialAssessments,
      errors: initialErrors,
      recoveryPlans: initialRecoveryPlans,
      notifications: initialNotifications,
    };
    saveToStorage('profile', this.state.profile);
    saveToStorage('semester', this.state.semester);
    saveToStorage('courses', this.state.courses);
    saveToStorage('topics', this.state.topics);
    saveToStorage('debts', this.state.debts);
    saveToStorage('missions', this.state.missions);
    saveToStorage('materials', this.state.materials);
    saveToStorage('assessments', this.state.assessments);
    saveToStorage('errors', this.state.errors);
    saveToStorage('recoveryPlans', this.state.recoveryPlans);
    saveToStorage('notifications', this.state.notifications);
    this.notify();
  }

  // Calculated Pressure State
  public getPressureBreakdown(): PressureBreakdown {
    return calculatePressureScore({
      semester: this.state.semester,
      courses: this.state.courses,
      topics: this.state.topics,
      debts: this.state.debts,
      missions: this.state.missions,
      assessments: this.state.assessments,
      profile: this.state.profile,
    });
  }

  // Overall Academic Health (0-100)
  public getAcademicHealth(): number {
    const avgMastery = calculateAggregateMastery(this.state.topics);
    const pressure = this.getPressureBreakdown().score;
    const completedMissions = this.state.missions.filter((m) => m.status === 'completed').length;
    const totalMissions = Math.max(1, this.state.missions.length);
    const completionRate = (completedMissions / totalMissions) * 100;
    
    // Academic Health is inverse of pressure + mastery + consistency
    const health = 0.40 * avgMastery + 0.35 * (100 - pressure) + 0.25 * completionRate;
    return Math.round(Math.min(100, Math.max(0, health)));
  }

  // Full Context for AI Coach
  public getAIContextPayload() {
    const pressure = this.getPressureBreakdown();
    const activeDebts = this.state.debts.filter((d) => d.status !== 'resolved');
    const weakTopics = this.state.topics
      .filter((t) => (t.mastery?.overall || 0) < 65)
      .map((t) => ({ name: t.name, mastery: t.mastery?.overall }));

    return {
      student: {
        name: this.state.profile.name,
        department: this.state.profile.department,
        level: this.state.profile.level,
        target_cgpa: this.state.profile.target_cgpa,
        current_cgpa: this.state.profile.current_cgpa,
        accountability_level: this.state.profile.accountability_level,
      },
      semester: {
        name: this.state.semester.name,
        exam_start_date: this.state.semester.exam_start_date,
      },
      academic_health: this.getAcademicHealth(),
      pressure: {
        score: pressure.score,
        band: pressure.band,
        top_risk: pressure.top_risk_topic,
        next_mandatory_action: pressure.next_mandatory_action,
      },
      active_debt_count: activeDebts.length,
      active_debts: activeDebts.map((d) => ({
        course: d.course_code,
        title: d.title,
        severity: d.severity,
        due_at: d.due_at,
      })),
      weak_topics: weakTopics,
      today_missions: this.state.missions.map((m) => ({
        course: m.course_code,
        topic: m.topic_name,
        priority: m.priority,
        status: m.status,
        duration: m.estimated_duration_minutes,
      })),
      courses: this.state.courses.map((c) => ({
        code: c.code,
        name: c.name,
        units: c.units,
        target_grade: c.target_grade,
      })),
    };
  }
}
