-- ╔═══════════════════════════════════════════════════════════════╗
-- ║   GRADEMASTER - COMPLETE RLS POLICY RESET                   ║
-- ║   Run this AFTER seeding data to unlock all tables           ║
-- ╚═══════════════════════════════════════════════════════════════╝

-- 1. Drop ALL existing policies
DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 2. Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- 3. Helper functions
CREATE OR REPLACE FUNCTION auth_user_role() RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ═══════════════════════════════════════════
-- USERS TABLE
-- ═══════════════════════════════════════════
-- Everyone authenticated can read users
CREATE POLICY "users_select" ON public.users FOR SELECT TO authenticated USING (true);
-- Directors can do everything
CREATE POLICY "users_director_all" ON public.users FOR ALL TO authenticated USING (auth_user_role() = 'director');
-- Allow trigger inserts (for new user registration)
CREATE POLICY "users_insert_bypass" ON public.users FOR INSERT WITH CHECK (true);

-- ═══════════════════════════════════════════
-- ACADEMIC YEARS
-- ═══════════════════════════════════════════
CREATE POLICY "years_select" ON public.academic_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "years_director" ON public.academic_years FOR ALL TO authenticated USING (auth_user_role() = 'director');

-- ═══════════════════════════════════════════
-- TERMS
-- ═══════════════════════════════════════════
CREATE POLICY "terms_select" ON public.terms FOR SELECT TO authenticated USING (true);
CREATE POLICY "terms_director" ON public.terms FOR ALL TO authenticated USING (auth_user_role() = 'director');

-- ═══════════════════════════════════════════
-- CLASSES
-- ═══════════════════════════════════════════
CREATE POLICY "classes_select" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "classes_director" ON public.classes FOR ALL TO authenticated USING (auth_user_role() = 'director');

-- ═══════════════════════════════════════════
-- SUBJECTS
-- ═══════════════════════════════════════════
CREATE POLICY "subjects_select" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "subjects_director" ON public.subjects FOR ALL TO authenticated USING (auth_user_role() = 'director');

-- ═══════════════════════════════════════════
-- CLASS_SUBJECTS
-- ═══════════════════════════════════════════
CREATE POLICY "cs_select" ON public.class_subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "cs_director" ON public.class_subjects FOR ALL TO authenticated USING (auth_user_role() = 'director');

-- ═══════════════════════════════════════════
-- STUDENTS
-- ═══════════════════════════════════════════
-- Director can do everything
CREATE POLICY "students_director" ON public.students FOR ALL TO authenticated USING (auth_user_role() = 'director');
-- Class teachers can read students in their assigned class
CREATE POLICY "students_ct_select" ON public.students FOR SELECT TO authenticated 
  USING (auth_user_role() = 'class_teacher' AND class_id IN (SELECT id FROM classes WHERE class_teacher_id = auth.uid()));
-- Subject teachers can read students in classes where they teach
CREATE POLICY "students_st_select" ON public.students FOR SELECT TO authenticated 
  USING (auth_user_role() = 'subject_teacher' AND class_id IN (SELECT class_id FROM class_subjects WHERE teacher_id = auth.uid()));

-- ═══════════════════════════════════════════
-- ASSESSMENTS
-- ═══════════════════════════════════════════
CREATE POLICY "assessments_select" ON public.assessments FOR SELECT TO authenticated USING (true);
CREATE POLICY "assessments_director" ON public.assessments FOR ALL TO authenticated USING (auth_user_role() = 'director');
-- Subject teachers can manage their own assessments
CREATE POLICY "assessments_st" ON public.assessments FOR ALL TO authenticated 
  USING (auth_user_role() = 'subject_teacher' AND class_subject_id IN (SELECT id FROM class_subjects WHERE teacher_id = auth.uid()));

-- ═══════════════════════════════════════════
-- MARKS
-- ═══════════════════════════════════════════
CREATE POLICY "marks_select" ON public.marks FOR SELECT TO authenticated USING (true);
CREATE POLICY "marks_director" ON public.marks FOR ALL TO authenticated USING (auth_user_role() = 'director');
-- Subject teachers can manage marks for their assessments
CREATE POLICY "marks_st" ON public.marks FOR ALL TO authenticated 
  USING (auth_user_role() = 'subject_teacher' AND assessment_id IN (
    SELECT a.id FROM assessments a JOIN class_subjects cs ON a.class_subject_id = cs.id WHERE cs.teacher_id = auth.uid()
  ));

-- ═══════════════════════════════════════════
-- SCHOOL SETTINGS
-- ═══════════════════════════════════════════
CREATE POLICY "settings_select" ON public.school_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings_director" ON public.school_settings FOR ALL TO authenticated USING (auth_user_role() = 'director');

-- ═══════════════════════════════════════════
-- INVITATIONS
-- ═══════════════════════════════════════════
CREATE POLICY "invites_director" ON public.invitations FOR ALL TO authenticated USING (auth_user_role() = 'director');
