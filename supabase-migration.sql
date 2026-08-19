-- ==============================================================================
-- FirstClass OS: Supabase Foundation Migration Schema
-- Version: 1.0
-- Compatible with PostgreSQL 15+ / Supabase
-- DO NOT RUN DIRECTLY IN AI STUDIO PREVIEW - REFERENCE ONLY FOR STORAGE ADAPTERS
-- ==============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Student Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    institution TEXT NOT NULL DEFAULT 'University',
    department TEXT NOT NULL DEFAULT 'Engineering',
    level TEXT NOT NULL DEFAULT '300 Level',
    current_cgpa NUMERIC(4, 2) NOT NULL DEFAULT 4.00,
    target_cgpa NUMERIC(4, 2) NOT NULL DEFAULT 4.75,
    scale_cgpa NUMERIC(4, 2) NOT NULL DEFAULT 5.00,
    weekly_available_minutes INTEGER NOT NULL DEFAULT 1500,
    preferred_study_windows TEXT[] DEFAULT ARRAY['morning', 'evening']::TEXT[],
    accountability_level TEXT NOT NULL DEFAULT 'Firm',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Academic Semesters
CREATE TABLE IF NOT EXISTS semesters (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    exam_start_date DATE NOT NULL,
    exam_end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'upcoming')),
    total_units INTEGER NOT NULL DEFAULT 18,
    academic_floor_hours_per_week NUMERIC(4, 1) NOT NULL DEFAULT 25.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Courses
CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    semester_id TEXT REFERENCES semesters(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    units INTEGER NOT NULL DEFAULT 3,
    priority_weight INTEGER NOT NULL DEFAULT 3 CHECK (priority_weight BETWEEN 1 AND 5),
    color TEXT NOT NULL DEFAULT '#2563eb',
    exam_date DATE,
    target_grade TEXT NOT NULL DEFAULT 'A' CHECK (target_grade IN ('A', 'B', 'C')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Knowledge Map Topics
CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
    parent_topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    difficulty INTEGER NOT NULL DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
    importance INTEGER NOT NULL DEFAULT 4 CHECK (importance BETWEEN 1 AND 5),
    estimated_minutes INTEGER NOT NULL DEFAULT 90,
    order_index INTEGER NOT NULL DEFAULT 0,
    learning_objectives TEXT[] DEFAULT ARRAY[]::TEXT[],
    prerequisites TEXT[] DEFAULT ARRAY[]::TEXT[],
    source_references TEXT[] DEFAULT ARRAY[]::TEXT[],
    mastery JSONB NOT NULL DEFAULT '{
        "recall": 50,
        "conceptual": 50,
        "procedural": 50,
        "application": 50,
        "transfer": 50,
        "overall": 50,
        "confidence": 50
    }'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Course Materials & Syllabi
CREATE TABLE IF NOT EXISTS course_materials (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('syllabus', 'lecture_notes', 'textbook_excerpt', 'past_questions', 'lab_manual')),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    file_size_kb INTEGER NOT NULL DEFAULT 0,
    extracted_topics_count INTEGER NOT NULL DEFAULT 0,
    raw_content_preview TEXT DEFAULT '',
    is_indexed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Academic Debt Register
CREATE TABLE IF NOT EXISTS academic_debts (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
    topic_id TEXT REFERENCES topics(id) ON DELETE CASCADE,
    topic_name TEXT NOT NULL,
    course_code TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('assessment_failure', 'missed_target', 'repeated_error', 'prerequisite_gap')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    reason TEXT NOT NULL,
    estimated_recovery_minutes INTEGER NOT NULL DEFAULT 30,
    due_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'in_recovery', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolution_evidence TEXT
);

-- 7. Daily Study Missions
CREATE TABLE IF NOT EXISTS study_missions (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
    topic_id TEXT REFERENCES topics(id) ON DELETE CASCADE,
    course_code TEXT NOT NULL,
    topic_name TEXT NOT NULL,
    date DATE NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('Priority', 'Normal', 'Remediate', 'Pre-Exam')),
    learning_objective TEXT NOT NULL,
    reason_for_priority TEXT NOT NULL,
    estimated_duration_minutes INTEGER NOT NULL DEFAULT 45,
    completed_minutes INTEGER NOT NULL DEFAULT 0,
    recall_prompt TEXT DEFAULT '',
    practice_prompt TEXT DEFAULT '',
    ai_tutoring_hint TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'missed')),
    completion_evidence TEXT,
    post_session_confidence INTEGER CHECK (post_session_confidence BETWEEN 1 AND 5),
    is_debt_recovery BOOLEAN NOT NULL DEFAULT FALSE,
    debt_id TEXT REFERENCES academic_debts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Active Study Sessions & Telemetry
CREATE TABLE IF NOT EXISTS study_sessions (
    id TEXT PRIMARY KEY,
    mission_id TEXT REFERENCES study_missions(id) ON DELETE SET NULL,
    course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
    topic_id TEXT REFERENCES topics(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    planned_minutes INTEGER NOT NULL DEFAULT 45,
    actual_minutes INTEGER NOT NULL DEFAULT 0,
    notes TEXT DEFAULT '',
    recalled_successfully BOOLEAN NOT NULL DEFAULT FALSE,
    practice_score_percent NUMERIC(5, 2),
    confidence_rating INTEGER NOT NULL DEFAULT 3 CHECK (confidence_rating BETWEEN 1 AND 5),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('active', 'completed', 'abandoned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Assessments & Diagnostics
CREATE TABLE IF NOT EXISTS assessments (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
    course_code TEXT,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('diagnostic', 'practice', 'mini_test', 'weekly_exam', 'monthly_mock', 'exam_simulation')),
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('scheduled', 'ready', 'in_progress', 'submitted', 'graded')),
    questions JSONB NOT NULL DEFAULT '[]'::JSONB,
    attempts JSONB DEFAULT '[]'::JSONB,
    score NUMERIC(5, 2),
    max_score NUMERIC(5, 2),
    diagnostic_report JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Student Error Bank
CREATE TABLE IF NOT EXISTS error_events (
    id TEXT PRIMARY KEY,
    topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
    topic_name TEXT NOT NULL,
    course_code TEXT NOT NULL,
    question_prompt TEXT NOT NULL,
    student_answer TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'concept_misconception',
        'procedural_error',
        'formula_retrieval_failure',
        'boundary_condition_omission',
        'misread_question'
    )),
    diagnosis TEXT NOT NULL,
    remediation_action TEXT NOT NULL,
    recurrence_count INTEGER NOT NULL DEFAULT 1,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved BOOLEAN NOT NULL DEFAULT FALSE
);

-- 11. Structured Recovery Plans
CREATE TABLE IF NOT EXISTS recovery_plans (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    target_debt_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_recovery_minutes INTEGER NOT NULL DEFAULT 60,
    scheduled_slots JSONB NOT NULL DEFAULT '[]'::JSONB,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed'))
);

-- 12. System Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('pressure', 'debt', 'study_mission', 'assessment', 'recovery')),
    urgency TEXT NOT NULL CHECK (urgency IN ('normal', 'high', 'critical')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    action_label TEXT,
    action_tab TEXT
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_courses_semester ON courses(semester_id);
CREATE INDEX IF NOT EXISTS idx_topics_course ON topics(course_id);
CREATE INDEX IF NOT EXISTS idx_missions_date ON study_missions(date);
CREATE INDEX IF NOT EXISTS idx_debts_status ON academic_debts(status);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
