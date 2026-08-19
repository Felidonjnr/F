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
import { getSupabaseClient } from './supabase';

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

function parseJsonField<T>(val: any, fallback: T): T {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') return val as T;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

async function safeDbWrite(op: () => PromiseLike<any> | Promise<any>): Promise<void> {
  try {
    await op();
  } catch (e) {
    console.warn('Supabase DB write warning:', e);
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
  public isInitializedFromDB = false;

  private constructor() {
    // Initial synchronous load from offline localStorage cache
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

    // Asynchronous hydration and seeding from Supabase
    this.initFromSupabase();
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

  /**
   * Fetch all tables from Supabase, seed if empty, and update state
   */
  private async initFromSupabase(): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      // Check if semester table is populated
      const { data: semData, error: semErr } = await client.from('semesters').select('*');

      if (semErr) {
        console.warn('Supabase fetch failed, continuing with offline cache:', semErr.message);
        return;
      }

      if (!semData || semData.length === 0) {
        // Semesters table is empty -> Seed database with mockData
        console.log('Supabase tables empty. Performing initial seed...');
        await this.seedSupabase();
        return;
      }

      // Fetch all tables in parallel
      const [
        { data: profiles },
        { data: semesters },
        { data: courses },
        { data: topics },
        { data: debts },
        { data: missions },
        { data: materials },
        { data: assessments },
        { data: errors },
        { data: recoveryPlans },
        { data: notifications },
      ] = await Promise.all([
        client.from('profiles').select('*').limit(1),
        client.from('semesters').select('*').limit(1),
        client.from('courses').select('*'),
        client.from('topics').select('*'),
        client.from('academic_debts').select('*'),
        client.from('study_missions').select('*'),
        client.from('course_materials').select('*'),
        client.from('assessments').select('*'),
        client.from('error_events').select('*'),
        client.from('recovery_plans').select('*'),
        client.from('notifications').select('*'),
      ]);

      if (profiles && profiles.length > 0) {
        const p = profiles[0];
        this.state.profile = {
          id: p.id || 'me',
          name: p.name,
          email: p.email || '',
          institution: p.institution,
          department: p.department,
          level: p.level,
          current_cgpa: Number(p.current_cgpa),
          target_cgpa: Number(p.target_cgpa),
          scale_cgpa: Number(p.scale_cgpa),
          weekly_available_minutes: Number(p.weekly_available_minutes),
          preferred_study_windows: p.preferred_study_windows || ['morning', 'evening'],
          accountability_level: p.accountability_level,
        };
        saveToStorage('profile', this.state.profile);
      }

      if (semesters && semesters.length > 0) {
        const s = semesters[0];
        this.state.semester = {
          id: s.id,
          name: s.name,
          start_date: s.start_date,
          end_date: s.end_date,
          exam_start_date: s.exam_start_date,
          exam_end_date: s.exam_end_date,
          status: s.status,
          total_units: Number(s.total_units),
          academic_floor_hours_per_week: Number(s.academic_floor_hours_per_week),
        };
        saveToStorage('semester', this.state.semester);
      }

      if (courses) {
        this.state.courses = courses.map((c) => ({
          id: c.id,
          semester_id: c.semester_id,
          code: c.code,
          name: c.name,
          units: Number(c.units),
          priority_weight: Number(c.priority_weight),
          color: c.color,
          exam_date: c.exam_date || undefined,
          target_grade: c.target_grade,
        }));
        saveToStorage('courses', this.state.courses);
      }

      if (topics) {
        this.state.topics = topics.map((t) => ({
          id: t.id,
          course_id: t.course_id,
          parent_topic_id: t.parent_topic_id || undefined,
          name: t.name,
          description: t.description || '',
          difficulty: Number(t.difficulty),
          importance: Number(t.importance),
          estimated_minutes: Number(t.estimated_minutes),
          order_index: Number(t.order_index),
          learning_objectives: t.learning_objectives || [],
          prerequisites: t.prerequisites || [],
          source_references: t.source_references || [],
          mastery: parseJsonField(t.mastery, {
            recall: 50,
            conceptual: 50,
            procedural: 50,
            application: 50,
            transfer: 50,
            overall: 50,
            confidence: 50,
          }),
        }));
        saveToStorage('topics', this.state.topics);
      }

      if (debts) {
        this.state.debts = debts.map((d) => ({
          id: d.id,
          course_id: d.course_id,
          topic_id: d.topic_id,
          topic_name: d.topic_name,
          course_code: d.course_code,
          source: d.source,
          severity: d.severity,
          title: d.title,
          reason: d.reason,
          estimated_recovery_minutes: Number(d.estimated_recovery_minutes),
          due_at: d.due_at,
          status: d.status,
          created_at: d.created_at,
          resolved_at: d.resolved_at || undefined,
          resolution_evidence: d.resolution_evidence || undefined,
        }));
        saveToStorage('debts', this.state.debts);
      }

      if (missions) {
        this.state.missions = missions.map((m) => ({
          id: m.id,
          course_id: m.course_id,
          topic_id: m.topic_id,
          course_code: m.course_code,
          topic_name: m.topic_name,
          date: m.date,
          priority: m.priority,
          learning_objective: m.learning_objective,
          reason_for_priority: m.reason_for_priority,
          estimated_duration_minutes: Number(m.estimated_duration_minutes),
          completed_minutes: Number(m.completed_minutes),
          recall_prompt: m.recall_prompt || '',
          practice_prompt: m.practice_prompt || '',
          ai_tutoring_hint: m.ai_tutoring_hint || '',
          status: m.status,
          completion_evidence: m.completion_evidence || undefined,
          post_session_confidence: m.post_session_confidence ? Number(m.post_session_confidence) : undefined,
          is_debt_recovery: Boolean(m.is_debt_recovery),
          debt_id: m.debt_id || undefined,
        }));
        saveToStorage('missions', this.state.missions);
      }

      if (materials) {
        this.state.materials = materials.map((m) => ({
          id: m.id,
          course_id: m.course_id,
          name: m.name,
          type: m.type,
          uploaded_at: m.uploaded_at,
          file_size_kb: Number(m.file_size_kb),
          extracted_topics_count: Number(m.extracted_topics_count),
          raw_content_preview: m.raw_content_preview || '',
          is_indexed: Boolean(m.is_indexed),
          status: m.status || 'ready',
          extracted_text: m.extracted_text || undefined,
        }));
        saveToStorage('materials', this.state.materials);
      }

      if (assessments) {
        this.state.assessments = assessments.map((a) => ({
          id: a.id,
          course_id: a.course_id || undefined,
          course_code: a.course_code || undefined,
          title: a.title,
          type: a.type,
          scheduled_at: a.scheduled_at,
          started_at: a.started_at || undefined,
          submitted_at: a.submitted_at || undefined,
          duration_minutes: Number(a.duration_minutes),
          status: a.status,
          questions: parseJsonField(a.questions, []),
          attempts: parseJsonField(a.attempts, []),
          score: a.score !== null && a.score !== undefined ? Number(a.score) : undefined,
          max_score: a.max_score !== null && a.max_score !== undefined ? Number(a.max_score) : undefined,
          diagnostic_report: a.diagnostic_report ? parseJsonField(a.diagnostic_report, undefined) : undefined,
        }));
        saveToStorage('assessments', this.state.assessments);
      }

      if (errors) {
        this.state.errors = errors.map((e) => ({
          id: e.id,
          topic_id: e.topic_id,
          topic_name: e.topic_name,
          course_code: e.course_code,
          question_prompt: e.question_prompt,
          student_answer: e.student_answer,
          correct_answer: e.correct_answer,
          category: e.category,
          diagnosis: e.diagnosis,
          remediation_action: e.remediation_action,
          recurrence_count: Number(e.recurrence_count),
          occurred_at: e.occurred_at,
          resolved: Boolean(e.resolved),
        }));
        saveToStorage('errors', this.state.errors);
      }

      if (recoveryPlans) {
        this.state.recoveryPlans = recoveryPlans.map((p) => ({
          id: p.id,
          title: p.title,
          target_debt_ids: p.target_debt_ids || [],
          created_at: p.created_at,
          total_recovery_minutes: Number(p.total_recovery_minutes),
          scheduled_slots: parseJsonField(p.scheduled_slots, []),
          status: p.status,
        }));
        saveToStorage('recoveryPlans', this.state.recoveryPlans);
      }

      if (notifications) {
        this.state.notifications = notifications.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          urgency: n.urgency,
          timestamp: n.timestamp,
          is_read: Boolean(n.is_read),
          action_label: n.action_label || undefined,
          action_tab: n.action_tab || undefined,
        }));
        saveToStorage('notifications', this.state.notifications);
      }

      this.isInitializedFromDB = true;
      this.notify();
    } catch (err) {
      console.error('Error during Supabase initialization:', err);
    }
  }

  /**
   * Seed all tables into Supabase
   */
  private async seedSupabase(): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      // 1. Profile
      await client.from('profiles').upsert({
        id: 'me',
        name: initialStudentProfile.name,
        email: initialStudentProfile.email,
        institution: initialStudentProfile.institution,
        department: initialStudentProfile.department,
        level: initialStudentProfile.level,
        current_cgpa: initialStudentProfile.current_cgpa,
        target_cgpa: initialStudentProfile.target_cgpa,
        scale_cgpa: initialStudentProfile.scale_cgpa,
        weekly_available_minutes: initialStudentProfile.weekly_available_minutes,
        preferred_study_windows: initialStudentProfile.preferred_study_windows,
        accountability_level: initialStudentProfile.accountability_level,
      });

      // 2. Semester
      await client.from('semesters').upsert({
        id: initialSemester.id,
        name: initialSemester.name,
        start_date: initialSemester.start_date,
        end_date: initialSemester.end_date,
        exam_start_date: initialSemester.exam_start_date,
        exam_end_date: initialSemester.exam_end_date,
        status: initialSemester.status,
        total_units: initialSemester.total_units,
        academic_floor_hours_per_week: initialSemester.academic_floor_hours_per_week,
      });

      // 3. Courses
      if (initialCourses.length > 0) {
        await client.from('courses').upsert(
          initialCourses.map((c) => ({
            id: c.id,
            semester_id: c.semester_id,
            code: c.code,
            name: c.name,
            units: c.units,
            priority_weight: c.priority_weight,
            color: c.color,
            exam_date: c.exam_date || null,
            target_grade: c.target_grade,
          }))
        );
      }

      // 4. Topics
      if (initialTopics.length > 0) {
        await client.from('topics').upsert(
          initialTopics.map((t) => ({
            id: t.id,
            course_id: t.course_id,
            parent_topic_id: t.parent_topic_id || null,
            name: t.name,
            description: t.description,
            difficulty: t.difficulty,
            importance: t.importance,
            estimated_minutes: t.estimated_minutes,
            order_index: t.order_index,
            learning_objectives: t.learning_objectives,
            prerequisites: t.prerequisites,
            source_references: t.source_references,
            mastery: t.mastery,
          }))
        );
      }

      // 5. Materials
      if (initialMaterials.length > 0) {
        await client.from('course_materials').upsert(
          initialMaterials.map((m) => ({
            id: m.id,
            course_id: m.course_id,
            name: m.name,
            type: m.type,
            uploaded_at: m.uploaded_at,
            file_size_kb: m.file_size_kb,
            extracted_topics_count: m.extracted_topics_count,
            raw_content_preview: m.raw_content_preview,
            is_indexed: m.is_indexed,
          }))
        );
      }

      // 6. Debts
      if (initialDebts.length > 0) {
        await client.from('academic_debts').upsert(
          initialDebts.map((d) => ({
            id: d.id,
            course_id: d.course_id,
            topic_id: d.topic_id,
            topic_name: d.topic_name,
            course_code: d.course_code,
            source: d.source,
            severity: d.severity,
            title: d.title,
            reason: d.reason,
            estimated_recovery_minutes: d.estimated_recovery_minutes,
            due_at: d.due_at,
            status: d.status,
            created_at: d.created_at,
            resolved_at: d.resolved_at || null,
            resolution_evidence: d.resolution_evidence || null,
          }))
        );
      }

      // 7. Missions
      if (initialMissions.length > 0) {
        await client.from('study_missions').upsert(
          initialMissions.map((m) => ({
            id: m.id,
            course_id: m.course_id,
            topic_id: m.topic_id,
            course_code: m.course_code,
            topic_name: m.topic_name,
            date: m.date,
            priority: m.priority,
            learning_objective: m.learning_objective,
            reason_for_priority: m.reason_for_priority,
            estimated_duration_minutes: m.estimated_duration_minutes,
            completed_minutes: m.completed_minutes,
            recall_prompt: m.recall_prompt,
            practice_prompt: m.practice_prompt,
            ai_tutoring_hint: m.ai_tutoring_hint,
            status: m.status,
            completion_evidence: m.completion_evidence || null,
            post_session_confidence: m.post_session_confidence || null,
            is_debt_recovery: m.is_debt_recovery || false,
            debt_id: m.debt_id || null,
          }))
        );
      }

      // 8. Assessments
      if (initialAssessments.length > 0) {
        await client.from('assessments').upsert(
          initialAssessments.map((a) => ({
            id: a.id,
            course_id: a.course_id || null,
            course_code: a.course_code || null,
            title: a.title,
            type: a.type,
            scheduled_at: a.scheduled_at,
            started_at: a.started_at || null,
            submitted_at: a.submitted_at || null,
            duration_minutes: a.duration_minutes,
            status: a.status,
            questions: a.questions,
            attempts: a.attempts || [],
            score: a.score ?? null,
            max_score: a.max_score ?? null,
            diagnostic_report: a.diagnostic_report || null,
          }))
        );
      }

      // 9. Errors
      if (initialErrors.length > 0) {
        await client.from('error_events').upsert(
          initialErrors.map((e) => ({
            id: e.id,
            topic_id: e.topic_id,
            topic_name: e.topic_name,
            course_code: e.course_code,
            question_prompt: e.question_prompt,
            student_answer: e.student_answer,
            correct_answer: e.correct_answer,
            category: e.category,
            diagnosis: e.diagnosis,
            remediation_action: e.remediation_action,
            recurrence_count: e.recurrence_count,
            occurred_at: e.occurred_at,
            resolved: e.resolved,
          }))
        );
      }

      // 10. Recovery Plans
      if (initialRecoveryPlans.length > 0) {
        await client.from('recovery_plans').upsert(
          initialRecoveryPlans.map((p) => ({
            id: p.id,
            title: p.title,
            target_debt_ids: p.target_debt_ids,
            created_at: p.created_at,
            total_recovery_minutes: p.total_recovery_minutes,
            scheduled_slots: p.scheduled_slots,
            status: p.status,
          }))
        );
      }

      // 11. Notifications
      if (initialNotifications.length > 0) {
        await client.from('notifications').upsert(
          initialNotifications.map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            urgency: n.urgency,
            timestamp: n.timestamp,
            is_read: n.is_read,
            action_label: n.action_label || null,
            action_tab: n.action_tab || null,
          }))
        );
      }

      console.log('Supabase seeding complete.');
    } catch (err) {
      console.error('Error during Supabase seeding:', err);
    }
  }

  // Profile Management
  public updateProfile(updated: Partial<StudentProfile>): void {
    this.state.profile = { ...this.state.profile, ...updated };
    saveToStorage('profile', this.state.profile);
    this.notify();

    const client = getSupabaseClient();
    if (client) {
      safeDbWrite(() =>
        client.from('profiles').upsert({
          id: 'me',
          name: this.state.profile.name,
          email: this.state.profile.email,
          institution: this.state.profile.institution,
          department: this.state.profile.department,
          level: this.state.profile.level,
          current_cgpa: this.state.profile.current_cgpa,
          target_cgpa: this.state.profile.target_cgpa,
          scale_cgpa: this.state.profile.scale_cgpa,
          weekly_available_minutes: this.state.profile.weekly_available_minutes,
          preferred_study_windows: this.state.profile.preferred_study_windows,
          accountability_level: this.state.profile.accountability_level,
        })
      );
    }
  }

  // Semester Management
  public updateSemester(updated: Partial<Semester>): void {
    this.state.semester = { ...this.state.semester, ...updated };
    saveToStorage('semester', this.state.semester);
    this.notify();

    const client = getSupabaseClient();
    if (client) {
      safeDbWrite(() =>
        client.from('semesters').upsert({
          id: this.state.semester.id || 'sem-2026-1',
          name: this.state.semester.name,
          start_date: this.state.semester.start_date,
          end_date: this.state.semester.end_date,
          exam_start_date: this.state.semester.exam_start_date,
          exam_end_date: this.state.semester.exam_end_date,
          status: this.state.semester.status,
          total_units: this.state.semester.total_units,
          academic_floor_hours_per_week: this.state.semester.academic_floor_hours_per_week,
        })
      );
    }
  }

  // Course Management
  public addCourse(course: Omit<Course, 'id' | 'semester_id'>): Course {
    const newCourse: Course = {
      ...course,
      id: `crs-${Date.now()}`,
      semester_id: this.state.semester.id || 'sem-2026-1',
    };
    this.state.courses = [...this.state.courses, newCourse];
    saveToStorage('courses', this.state.courses);
    this.notify();

    const client = getSupabaseClient();
    if (client) {
      safeDbWrite(() =>
        client.from('courses').insert({
          id: newCourse.id,
          semester_id: newCourse.semester_id,
          code: newCourse.code,
          name: newCourse.name,
          units: newCourse.units,
          priority_weight: newCourse.priority_weight,
          color: newCourse.color,
          exam_date: newCourse.exam_date || null,
          target_grade: newCourse.target_grade,
        })
      );
    }

    return newCourse;
  }

  public updateCourse(id: string, updated: Partial<Course>): void {
    this.state.courses = this.state.courses.map((c) => (c.id === id ? { ...c, ...updated } : c));
    saveToStorage('courses', this.state.courses);
    this.notify();

    const client = getSupabaseClient();
    if (client) {
      const course = this.state.courses.find((c) => c.id === id);
      if (course) {
        safeDbWrite(() =>
          client
            .from('courses')
            .update({
              code: course.code,
              name: course.name,
              units: course.units,
              priority_weight: course.priority_weight,
              color: course.color,
              exam_date: course.exam_date || null,
              target_grade: course.target_grade,
            })
            .eq('id', id)
        );
      }
    }
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

    const client = getSupabaseClient();
    if (client) {
      safeDbWrite(() => client.from('courses').delete().eq('id', id));
    }
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

    const client = getSupabaseClient();
    if (client) {
      safeDbWrite(() =>
        client.from('topics').insert({
          id: newTopic.id,
          course_id: newTopic.course_id,
          parent_topic_id: newTopic.parent_topic_id || null,
          name: newTopic.name,
          description: newTopic.description,
          difficulty: newTopic.difficulty,
          importance: newTopic.importance,
          estimated_minutes: newTopic.estimated_minutes,
          order_index: newTopic.order_index,
          learning_objectives: newTopic.learning_objectives,
          prerequisites: newTopic.prerequisites,
          source_references: newTopic.source_references,
          mastery: newTopic.mastery,
        })
      );
    }

    return newTopic;
  }

  public updateTopic(id: string, updated: Partial<Topic>): void {
    this.state.topics = this.state.topics.map((t) => (t.id === id ? { ...t, ...updated } : t));
    saveToStorage('topics', this.state.topics);
    this.notify();

    const client = getSupabaseClient();
    if (client) {
      const topic = this.state.topics.find((t) => t.id === id);
      if (topic) {
        safeDbWrite(() =>
          client
            .from('topics')
            .update({
              name: topic.name,
              description: topic.description,
              difficulty: topic.difficulty,
              importance: topic.importance,
              estimated_minutes: topic.estimated_minutes,
              order_index: topic.order_index,
              learning_objectives: topic.learning_objectives,
              prerequisites: topic.prerequisites,
              source_references: topic.source_references,
              mastery: topic.mastery,
            })
            .eq('id', id)
        );
      }
    }
  }

  public deleteTopic(id: string): void {
    this.state.topics = this.state.topics.filter((t) => t.id !== id);
    this.state.debts = this.state.debts.filter((d) => d.topic_id !== id);
    this.state.missions = this.state.missions.filter((m) => m.topic_id !== id);
    saveToStorage('topics', this.state.topics);
    saveToStorage('debts', this.state.debts);
    saveToStorage('missions', this.state.missions);
    this.notify();

    const client = getSupabaseClient();
    if (client) {
      safeDbWrite(() => client.from('topics').delete().eq('id', id));
    }
  }

  // Material Management
  public addMaterial(material: Omit<CourseMaterial, 'id' | 'uploaded_at'>): CourseMaterial {
    const newMat: CourseMaterial = {
      ...material,
      id: `mat-${Date.now()}`,
      uploaded_at: new Date().toISOString(),
      status: material.status || 'ready',
    };
    this.state.materials = [newMat, ...this.state.materials];
    saveToStorage('materials', this.state.materials);
    this.notify();

    const client = getSupabaseClient();
    if (client) {
      safeDbWrite(() =>
        client.from('course_materials').insert({
          id: newMat.id,
          course_id: newMat.course_id,
          name: newMat.name,
          type: newMat.type,
          uploaded_at: newMat.uploaded_at,
          file_size_kb: newMat.file_size_kb,
          extracted_topics_count: newMat.extracted_topics_count,
          raw_content_preview: newMat.raw_content_preview,
          is_indexed: newMat.is_indexed,
          status: newMat.status,
          extracted_text: newMat.extracted_text || null,
        })
      );
    }

    return newMat;
  }

  public deleteMaterial(id: string): void {
    this.state.materials = this.state.materials.filter((m) => m.id !== id);
    saveToStorage('materials', this.state.materials);
    this.notify();

    const client = getSupabaseClient();
    if (client) {
      safeDbWrite(() => client.from('course_materials').delete().eq('id', id));
    }
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

    const client = getSupabaseClient();
    if (client) {
      safeDbWrite(() =>
        client
          .from('study_missions')
          .update({
            status: 'completed',
            completed_minutes: params.completedMinutes,
            completion_evidence: params.notes,
            post_session_confidence: params.confidenceRating,
          })
          .eq('id', params.missionId)
      );
    }
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

    const client = getSupabaseClient();
    if (client) {
      safeDbWrite(() =>
        client.from('study_missions').upsert(
          newMissions.map((m) => ({
            id: m.id,
            course_id: m.course_id,
            topic_id: m.topic_id,
            course_code: m.course_code,
            topic_name: m.topic_name,
            date: m.date,
            priority: m.priority,
            learning_objective: m.learning_objective,
            reason_for_priority: m.reason_for_priority,
            estimated_duration_minutes: m.estimated_duration_minutes,
            completed_minutes: m.completed_minutes,
            recall_prompt: m.recall_prompt,
            practice_prompt: m.practice_prompt,
            ai_tutoring_hint: m.ai_tutoring_hint,
            status: m.status,
            completion_evidence: m.completion_evidence || null,
            post_session_confidence: m.post_session_confidence || null,
            is_debt_recovery: m.is_debt_recovery || false,
            debt_id: m.debt_id || null,
          }))
        )
      );
    }
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

    const client = getSupabaseClient();
    if (client) {
      safeDbWrite(() =>
        client.from('assessments').insert({
          id: newAss.id,
          course_id: newAss.course_id || null,
          course_code: newAss.course_code || null,
          title: newAss.title,
          type: newAss.type,
          scheduled_at: newAss.scheduled_at,
          started_at: newAss.started_at || null,
          submitted_at: newAss.submitted_at || null,
          duration_minutes: newAss.duration_minutes,
          status: newAss.status,
          questions: newAss.questions,
          attempts: newAss.attempts || [],
          score: newAss.score ?? null,
          max_score: newAss.max_score ?? null,
          diagnostic_report: newAss.diagnostic_report || null,
        })
      );
    }

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
        this.updateTopic(tId, { mastery: updatedMastery });
      }
    });

    // Auto-create Academic Debt for weak topics identified
    result.topicsNeedingDebt.forEach((need) => {
      const course = this.state.courses.find((c) => c.code === need.course_code);
      this.addDebt({
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
    saveToStorage('errors', this.state.errors);
    saveToStorage('notifications', this.state.notifications);
    this.notify();

    const client = getSupabaseClient();
    if (client) {
      safeDbWrite(async () => {
        await client
          .from('assessments')
          .update({
            status: 'graded',
            submitted_at: updatedAss.submitted_at,
            score: updatedAss.score,
            max_score: updatedAss.max_score,
            attempts: updatedAss.attempts,
            diagnostic_report: updatedAss.diagnostic_report,
          })
          .eq('id', assessmentId);

        if (result.newErrors.length > 0) {
          await client.from('error_events').insert(
            result.newErrors.map((e) => ({
              id: `err-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              topic_id: e.topic_id,
              topic_name: e.topic_name,
              course_code: e.course_code,
              question_prompt: e.question_prompt,
              student_answer: e.student_answer,
              correct_answer: e.correct_answer,
              category: e.category,
              diagnosis: e.diagnosis,
              remediation_action: e.remediation_action,
              recurrence_count: e.recurrence_count,
              occurred_at: new Date().toISOString(),
              resolved: false,
            }))
          );
        }

        await client.from('notifications').insert({
          id: newNotif.id,
          title: newNotif.title,
          message: newNotif.message,
          type: newNotif.type,
          urgency: newNotif.urgency,
          timestamp: newNotif.timestamp,
          is_read: newNotif.is_read,
          action_label: newNotif.action_label || null,
          action_tab: newNotif.action_tab || null,
        });
      });
    }

    return result.report;
  }

  // Academic Debt
  public addDebt(debtData: Parameters<typeof createDebtItem>[0]): AcademicDebt {
    const debt = createDebtItem(debtData);
    this.state.debts = [debt, ...this.state.debts];
    saveToStorage('debts', this.state.debts);
    this.notify();

    const client = getSupabaseClient();
    if (client) {
      safeDbWrite(() =>
        client.from('academic_debts').insert({
          id: debt.id,
          course_id: debt.course_id,
          topic_id: debt.topic_id,
          topic_name: debt.topic_name,
          course_code: debt.course_code,
          source: debt.source,
          severity: debt.severity,
          title: debt.title,
          reason: debt.reason,
          estimated_recovery_minutes: debt.estimated_recovery_minutes,
          due_at: debt.due_at,
          status: debt.status,
          created_at: debt.created_at,
          resolved_at: debt.resolved_at || null,
          resolution_evidence: debt.resolution_evidence || null,
        })
      );
    }

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

    const client = getSupabaseClient();
    if (client) {
      safeDbWrite(() =>
        client
          .from('academic_debts')
          .update({
            status: 'resolved',
            resolved_at: new Date().toISOString(),
            resolution_evidence: evidence,
          })
          .eq('id', debtId)
      );
    }
  }

  public deleteDebt(debtId: string): void {
    this.state.debts = this.state.debts.filter((d) => d.id !== debtId);
    saveToStorage('debts', this.state.debts);
    this.notify();

    const client = getSupabaseClient();
    if (client) {
      safeDbWrite(() => client.from('academic_debts').delete().eq('id', debtId));
    }
  }

  // Error Bank Management
  public markErrorResolved(errId: string): void {
    this.state.errors = this.state.errors.map((e) =>
      e.id === errId ? { ...e, resolved: true } : e
    );
    saveToStorage('errors', this.state.errors);
    this.notify();

    const client = getSupabaseClient();
    if (client) {
      safeDbWrite(() =>
        client.from('error_events').update({ resolved: true }).eq('id', errId)
      );
    }
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

    const client = getSupabaseClient();
    if (client) {
      safeDbWrite(() =>
        client.from('recovery_plans').insert({
          id: newPlan.id,
          title: newPlan.title,
          target_debt_ids: newPlan.target_debt_ids,
          created_at: newPlan.created_at,
          total_recovery_minutes: newPlan.total_recovery_minutes,
          scheduled_slots: newPlan.scheduled_slots,
          status: newPlan.status,
        })
      );
    }

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

    const client = getSupabaseClient();
    if (client) {
      const plan = this.state.recoveryPlans.find((p) => p.id === planId);
      if (plan) {
        safeDbWrite(() =>
          client
            .from('recovery_plans')
            .update({
              scheduled_slots: plan.scheduled_slots,
              status: plan.status,
            })
            .eq('id', planId)
        );
      }
    }
  }

  // Notifications
  public markNotificationRead(notifId: string): void {
    this.state.notifications = this.state.notifications.map((n) =>
      n.id === notifId ? { ...n, is_read: true } : n
    );
    saveToStorage('notifications', this.state.notifications);
    this.notify();

    const client = getSupabaseClient();
    if (client) {
      safeDbWrite(() =>
        client.from('notifications').update({ is_read: true }).eq('id', notifId)
      );
    }
  }

  public markAllNotificationsRead(): void {
    this.state.notifications = this.state.notifications.map((n) => ({ ...n, is_read: true }));
    saveToStorage('notifications', this.state.notifications);
    this.notify();

    const client = getSupabaseClient();
    if (client) {
      safeDbWrite(() =>
        client.from('notifications').update({ is_read: true }).neq('id', '')
      );
    }
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

    this.seedSupabase();
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
