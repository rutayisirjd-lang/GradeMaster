-- Academic Years
CREATE TABLE academic_years (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label      TEXT NOT NULL UNIQUE,        -- '2024-2025'
  start_date DATE NOT NULL,
  end_date   DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- School Settings (singleton)
CREATE TABLE school_settings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name             TEXT NOT NULL DEFAULT 'GradeMaster School',
  school_logo_url         TEXT,
  school_address          TEXT,
  school_motto            TEXT,
  country                 TEXT DEFAULT 'Rwanda',
  principal_name          TEXT,
  principal_signature_url TEXT,
  report_footer_text      TEXT,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

-- Users (extends auth.users)
CREATE TABLE users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  role          user_role NOT NULL,
  phone         TEXT,
  avatar_url    TEXT,
  is_active     BOOLEAN DEFAULT true,
  mfa_enabled   BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Classes
CREATE TABLE classes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  name             TEXT NOT NULL,      -- 'S1A'
  level            TEXT NOT NULL,      -- 'S1'
  section          TEXT NOT NULL,      -- 'A'
  class_teacher_id UUID REFERENCES users(id),
  room             TEXT,
  capacity         INT DEFAULT 40,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(academic_year_id, name)
);

-- Subjects
CREATE TABLE subjects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  code        TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Class-Subject Assignments (which teacher teaches which subject in which class)
CREATE TABLE class_subjects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id         UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id       UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id       UUID NOT NULL REFERENCES users(id),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, subject_id, academic_year_id)
);

-- Students
CREATE TABLE students (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       TEXT UNIQUE,           -- auto-generated 'STU-2024-0001'
  first_name       TEXT NOT NULL,
  last_name        TEXT NOT NULL,
  gender           gender_type NOT NULL,
  date_of_birth    DATE NOT NULL,
  enrollment_date  DATE NOT NULL,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  class_id         UUID NOT NULL REFERENCES classes(id),
  guardian_name    TEXT,
  guardian_phone   TEXT,
  guardian_email   TEXT,
  guardian_relation TEXT,
  photo_url        TEXT,
  notes            TEXT,
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Terms
CREATE TABLE terms (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  name             term_name NOT NULL,
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  is_locked        BOOLEAN DEFAULT false,
  locked_at        TIMESTAMPTZ,
  locked_by        UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(academic_year_id, name)
);

-- Assessments
CREATE TABLE assessments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_subject_id UUID NOT NULL REFERENCES class_subjects(id) ON DELETE CASCADE,
  term_id          UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  category         assessment_category NOT NULL,
  max_score        NUMERIC(5,2) NOT NULL DEFAULT 100,
  date             DATE,
  description      TEXT,
  created_by       UUID NOT NULL REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Marks
CREATE TABLE marks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id    UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id       UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  raw_score        NUMERIC(5,2),
  normalized_score NUMERIC(5,2),
  absence_type     absence_type DEFAULT 'present',
  status           mark_status DEFAULT 'draft',
  entered_by       UUID NOT NULL REFERENCES users(id),
  reviewed_by      UUID REFERENCES users(id),
  override_by      UUID REFERENCES users(id),
  override_reason  TEXT,
  submitted_at     TIMESTAMPTZ,
  reviewed_at      TIMESTAMPTZ,
  locked_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(assessment_id, student_id)
);

-- Computed term results per student per subject
CREATE TABLE term_subject_results (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID NOT NULL REFERENCES students(id),
  class_subject_id UUID NOT NULL REFERENCES class_subjects(id),
  term_id          UUID NOT NULL REFERENCES terms(id),
  ca_average       NUMERIC(5,2),
  exam_score       NUMERIC(5,2),
  final_score      NUMERIC(5,2),
  letter_grade     TEXT,
  is_incomplete    BOOLEAN DEFAULT false,
  incomplete_reason TEXT,
  computed_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, class_subject_id, term_id)
);

-- Overall term result per student
CREATE TABLE term_results (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID NOT NULL REFERENCES students(id),
  term_id        UUID NOT NULL REFERENCES terms(id),
  class_id       UUID NOT NULL REFERENCES classes(id),
  term_average   NUMERIC(5,2),
  rank_in_class  INT,
  teacher_remark TEXT CHECK (char_length(teacher_remark) <= 500),
  is_published   BOOLEAN DEFAULT false,
  published_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, term_id)
);

-- Annual result per student
CREATE TABLE annual_results (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id               UUID NOT NULL REFERENCES students(id),
  academic_year_id         UUID NOT NULL REFERENCES academic_years(id),
  class_id                 UUID NOT NULL REFERENCES classes(id),
  term1_average            NUMERIC(5,2),
  term2_average            NUMERIC(5,2),
  term3_average            NUMERIC(5,2),
  annual_average           NUMERIC(5,2),
  rank_in_class            INT,
  promotion_status         promotion_status DEFAULT 'pending',
  promotion_override       BOOLEAN DEFAULT false,
  promotion_override_by    UUID REFERENCES users(id),
  promotion_override_reason TEXT,
  created_at               TIMESTAMPTZ DEFAULT now(),
  updated_at               TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, academic_year_id)
);

-- Generated PDF reports
CREATE TABLE reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID REFERENCES students(id),
  class_id         UUID REFERENCES classes(id),
  term_id          UUID REFERENCES terms(id),
  academic_year_id UUID REFERENCES academic_years(id),
  report_type      TEXT NOT NULL CHECK (report_type IN ('term_transcript','annual_report','class_summary')),
  file_url         TEXT,
  generated_by     UUID REFERENCES users(id),
  generated_at     TIMESTAMPTZ DEFAULT now()
);

-- Audit log
CREATE TABLE audit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id),
  action     TEXT NOT NULL,
  table_name TEXT,
  record_id  UUID,
  old_value  JSONB,
  new_value  JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- In-app notifications
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id),
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  type       TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT false,
  link       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Student class history across academic years
CREATE TABLE student_year_history (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID NOT NULL REFERENCES students(id),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  class_id         UUID NOT NULL REFERENCES classes(id),
  promotion_status promotion_status,
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, academic_year_id)
);
