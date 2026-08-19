// FirstClass OS Domain Types & Interfaces

export type SkillDimension = 'recall' | 'conceptual' | 'procedural' | 'application' | 'transfer';

export interface MasteryDimensions {
  recall: number; // 0-100
  conceptual: number; // 0-100
  procedural: number; // 0-100
  application: number; // 0-100
  transfer: number; // 0-100
  overall: number; // calculated weighted 0-100
  confidence: number; // self-reported 0-100
  last_practiced_at?: string;
  last_assessed_at?: string;
}

export type DebtSeverity = 'low' | 'medium' | 'high' | 'critical';
export type DebtStatus = 'active' | 'in_recovery' | 'resolved';
export type DebtSource = 'assessment_failure' | 'missed_target' | 'repeated_error' | 'prerequisite_gap';

export interface AcademicDebt {
  id: string;
  course_id: string;
  topic_id: string;
  topic_name: string;
  course_code: string;
  source: DebtSource;
  severity: DebtSeverity;
  title: string;
  reason: string;
  estimated_recovery_minutes: number;
  due_at: string;
  status: DebtStatus;
  created_at: string;
  resolved_at?: string;
  resolution_evidence?: string;
}

export type PressureBand = 'Stable' | 'Watch' | 'At Risk' | 'High Pressure' | 'Critical';

export interface PressureBreakdown {
  score: number; // 0-100
  band: PressureBand;
  components: {
    deadline_risk: number; // 0-100 (weight 0.25)
    debt_risk: number; // 0-100 (weight 0.20)
    mastery_risk: number; // 0-100 (weight 0.20)
    consistency_risk: number; // 0-100 (weight 0.15)
    assessment_risk: number; // 0-100 (weight 0.10)
    goal_gap_risk: number; // 0-100 (weight 0.10)
  };
  formula_version: string;
  system_response: string;
  top_risk_topic?: string;
  next_mandatory_action: string;
  calculated_at: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  institution: string;
  department: string;
  level: string; // e.g. "300 Level"
  current_cgpa: number; // e.g. 4.38
  target_cgpa: number; // e.g. 4.75
  scale_cgpa: number; // e.g. 5.0
  weekly_available_minutes: number; // e.g. 1500 (25 hrs)
  preferred_study_windows: ('morning' | 'afternoon' | 'evening' | 'night')[];
  accountability_level: 'Firm' | 'Strict' | 'Intensive' | 'Drillmaster';
}

export interface Semester {
  id: string;
  name: string; // e.g. "Harmattan 2026 Semester"
  start_date: string;
  end_date: string;
  exam_start_date: string;
  exam_end_date: string;
  status: 'active' | 'completed' | 'upcoming';
  total_units: number;
  academic_floor_hours_per_week: number;
}

export interface Course {
  id: string;
  semester_id: string;
  code: string; // e.g. "MTH 221"
  name: string; // e.g. "Advanced Engineering Mathematics II"
  units: number; // e.g. 3
  priority_weight: number; // 1-5 (5 = highest)
  color: string; // hex or tailwind class token
  exam_date?: string;
  target_grade: 'A' | 'B' | 'C';
}

export interface Topic {
  id: string;
  course_id: string;
  parent_topic_id?: string;
  name: string;
  description: string;
  difficulty: number; // 1-5
  importance: number; // 1-5
  estimated_minutes: number;
  order_index: number;
  learning_objectives: string[];
  prerequisites: string[]; // topic IDs
  source_references: string[];
  mastery: MasteryDimensions;
}

export interface CourseMaterial {
  id: string;
  course_id: string;
  name: string;
  type: 'syllabus' | 'lecture_notes' | 'textbook_excerpt' | 'past_questions' | 'lab_manual';
  uploaded_at: string;
  file_size_kb: number;
  extracted_topics_count: number;
  raw_content_preview: string;
  is_indexed: boolean;
}

export type MissionPriority = 'Priority' | 'Normal' | 'Remediate' | 'Pre-Exam';
export type MissionStatus = 'pending' | 'in_progress' | 'completed' | 'missed';

export interface StudyMission {
  id: string;
  course_id: string;
  topic_id: string;
  course_code: string;
  topic_name: string;
  date: string; // YYYY-MM-DD
  priority: MissionPriority;
  learning_objective: string;
  reason_for_priority: string;
  estimated_duration_minutes: number;
  completed_minutes: number;
  recall_prompt: string;
  practice_prompt: string;
  ai_tutoring_hint: string;
  status: MissionStatus;
  completion_evidence?: string;
  post_session_confidence?: number; // 1-5
  is_debt_recovery?: boolean;
  debt_id?: string;
}

export interface StudySession {
  id: string;
  mission_id: string;
  course_id: string;
  topic_id: string;
  started_at: string;
  ended_at?: string;
  planned_minutes: number;
  actual_minutes: number;
  notes: string;
  recalled_successfully: boolean;
  practice_score_percent?: number;
  confidence_rating: number; // 1-5
  status: 'active' | 'completed' | 'abandoned';
}

export type AssessmentType = 'diagnostic' | 'practice' | 'mini_test' | 'weekly_exam' | 'monthly_mock' | 'exam_simulation';
export type AssessmentStatus = 'scheduled' | 'ready' | 'in_progress' | 'submitted' | 'graded';

export interface Question {
  id: string;
  prompt: string;
  type: 'multiple_choice';
  options: string[];
  correct_answer: string;
  dimension: SkillDimension;
  difficulty: number; // 1-5
  explanation: string;
  topic_id?: string;
  topic_name?: string;
}

export interface QuestionAttempt {
  question_id: string;
  student_answer: string;
  is_correct: boolean;
  time_spent_seconds: number;
  is_flagged: boolean;
}

export interface AssessmentDiagnosticReport {
  overall_score: number; // percentage
  dimension_scores: Record<SkillDimension, number>;
  weak_topics: { topic_id: string; topic_name: string; score: number }[];
  error_classifications: { question_id: string; category: string; description: string }[];
  debt_created_count: number;
  ai_recommendation: string;
}

export interface Assessment {
  id: string;
  course_id?: string; // undefined if multi-course mock
  course_code?: string;
  title: string;
  type: AssessmentType;
  scheduled_at: string;
  started_at?: string;
  submitted_at?: string;
  duration_minutes: number;
  status: AssessmentStatus;
  questions: Question[];
  attempts?: QuestionAttempt[];
  score?: number; // raw correct
  max_score?: number;
  diagnostic_report?: AssessmentDiagnosticReport;
}

export type ErrorMisconceptionCategory =
  | 'concept_misconception'
  | 'procedural_error'
  | 'formula_retrieval_failure'
  | 'boundary_condition_omission'
  | 'misread_question';

export interface ErrorEvent {
  id: string;
  topic_id: string;
  topic_name: string;
  course_code: string;
  question_prompt: string;
  student_answer: string;
  correct_answer: string;
  category: ErrorMisconceptionCategory;
  diagnosis: string;
  remediation_action: string;
  recurrence_count: number;
  occurred_at: string;
  resolved: boolean;
}

export interface RecoveryPlan {
  id: string;
  title: string;
  target_debt_ids: string[];
  created_at: string;
  total_recovery_minutes: number;
  scheduled_slots: {
    date: string;
    topic_name: string;
    allocated_minutes: number;
    activity_type: 'concept_review' | 'drill' | 'retest';
    status: 'pending' | 'completed';
  }[];
  status: 'active' | 'completed';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'pressure' | 'debt' | 'study_mission' | 'assessment' | 'recovery';
  urgency: 'normal' | 'high' | 'critical';
  timestamp: string;
  is_read: boolean;
  action_label?: string;
  action_tab?: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  intent?: 'tutor' | 'planning' | 'diagnosis' | 'recovery' | 'general';
}

export type AppTab =
  | 'today'
  | 'courses'
  | 'review'
  | 'coach'
  | 'settings'
  | 'dashboard'
  | 'semester'
  | 'study'
  | 'assessments'
  | 'debt'
  | 'analytics';
