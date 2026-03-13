-- [COMPLETE DATABASE INITIALIZER]
-- Run this in Supabase SQL Editor

-- 1. Enums
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('director', 'class_teacher', 'subject_teacher');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_type') THEN
        CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'term_name') THEN
        CREATE TYPE term_name AS ENUM ('TERM_1', 'TERM_2', 'TERM_3');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assessment_category') THEN
        CREATE TYPE assessment_category AS ENUM ('quiz', 'homework', 'exercise', 'exam');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mark_status') THEN
        CREATE TYPE mark_status AS ENUM ('draft', 'submitted', 'reviewed', 'locked');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'absence_type') THEN
        CREATE TYPE absence_type AS ENUM ('present', 'excused', 'unexcused', 'not_applicable');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'promotion_status') THEN
        CREATE TYPE promotion_status AS ENUM ('promoted', 'not_supported', 'conditionally_promoted', 'pending');
    END IF;
END $$;

-- 2. Core Tables
CREATE TABLE IF NOT EXISTS academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS school_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name TEXT NOT NULL DEFAULT 'GradeMaster Academy',
  school_logo_url TEXT,
  school_address TEXT,
  school_motto TEXT,
  country TEXT DEFAULT 'Rwanda',
  principal_name TEXT,
  principal_signature_url TEXT,
  report_footer_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role user_role NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  mfa_enabled BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  section TEXT NOT NULL,
  class_teacher_id UUID REFERENCES users(id),
  room TEXT,
  capacity INT DEFAULT 40,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(academic_year_id, name)
);

CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS class_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, subject_id, academic_year_id)
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender gender_type NOT NULL,
  date_of_birth DATE NOT NULL,
  enrollment_date DATE NOT NULL,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  class_id UUID NOT NULL REFERENCES classes(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  name term_name NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_locked BOOLEAN DEFAULT false,
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(academic_year_id, name)
);

CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_subject_id UUID NOT NULL REFERENCES class_subjects(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category assessment_category NOT NULL,
  max_score NUMERIC(5,2) NOT NULL DEFAULT 100,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  raw_score NUMERIC(5,2),
  normalized_score NUMERIC(5,2),
  entered_by UUID NOT NULL REFERENCES users(id),
  status mark_status DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(assessment_id, student_id)
);

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL,
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '48 hours'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Trigger Logic
CREATE SEQUENCE IF NOT EXISTS student_seq START 100;
CREATE OR REPLACE FUNCTION generate_student_id() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.student_id IS NULL THEN
    NEW.student_id := 'STU-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('student_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_student_id ON students;
CREATE TRIGGER trg_student_id BEFORE INSERT ON students
  FOR EACH ROW EXECUTE FUNCTION generate_student_id();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- If a different user has this email, rename theirs to free it up.
  -- This avoids "Database error" when foreign keys block a DELETE.
  UPDATE public.users 
  SET email = email || '_old_' || to_char(now(), 'YYYYMMDDHH24MISS')
  WHERE email = new.email AND id != new.id;

  INSERT INTO public.users (id, email, first_name, last_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', 'Admin'),
    COALESCE(new.raw_user_meta_data->>'last_name', 'User'),
    CASE 
      WHEN (new.raw_user_meta_data->>'role') = 'director' THEN 'director'::user_role
      WHEN (new.raw_user_meta_data->>'role') = 'class_teacher' THEN 'class_teacher'::user_role
      ELSE 'subject_teacher'::user_role 
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Security & RLS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION auth_user_role() RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_user_class() RETURNS UUID AS $$
  SELECT id FROM classes WHERE class_teacher_id = auth.uid() LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "public_read_users" ON public.users;
CREATE POLICY "public_read_users" ON public.users FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "director_all_users" ON public.users;
CREATE POLICY "director_all_users" ON public.users FOR ALL TO authenticated USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'director');

DROP POLICY IF EXISTS "public_read_years" ON academic_years;
CREATE POLICY "public_read_years" ON academic_years FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "director_all_years" ON academic_years;
CREATE POLICY "director_all_years" ON academic_years FOR ALL TO authenticated USING (auth_user_role() = 'director');

DROP POLICY IF EXISTS "public_read_settings" ON school_settings;
CREATE POLICY "public_read_settings" ON school_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "director_all_settings" ON school_settings;
CREATE POLICY "director_all_settings" ON school_settings FOR ALL TO authenticated USING (auth_user_role() = 'director');

DROP POLICY IF EXISTS "director_students" ON students;
CREATE POLICY "director_students" ON students FOR ALL TO authenticated USING (auth_user_role() = 'director');

DROP POLICY IF EXISTS "class_teacher_students" ON students;
CREATE POLICY "class_teacher_students" ON students FOR SELECT TO authenticated USING (auth_user_role() = 'class_teacher' AND class_id = auth_user_class());

DROP POLICY IF EXISTS "director_invites" ON invitations;
CREATE POLICY "director_invites" ON invitations FOR ALL TO authenticated USING (auth_user_role() = 'director');

-- 5. Seed
INSERT INTO academic_years (label, start_date, end_date, is_current)
VALUES ('2025-2026', '2025-01-05', '2025-11-20', true)
ON CONFLICT DO NOTHING;

INSERT INTO subjects (name, code) VALUES
('Mathematics', 'MATH-S1'), ('Physics', 'PHY-S1'), ('English', 'ENG-S1')
ON CONFLICT DO NOTHING;
