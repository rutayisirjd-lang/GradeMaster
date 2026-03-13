-- Helper functions
CREATE OR REPLACE FUNCTION auth_user_role() RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_user_class() RETURNS UUID AS $$
  SELECT id FROM classes WHERE class_teacher_id = auth.uid() LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER;

-- students: director full, class teacher own class, subject teacher assigned class
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "director_students" ON students;
CREATE POLICY "director_students" ON students FOR ALL USING (auth_user_role() = 'director');
DROP POLICY IF EXISTS "class_teacher_students" ON students;
CREATE POLICY "class_teacher_students" ON students FOR SELECT
  USING (auth_user_role() = 'class_teacher' AND class_id = auth_user_class());
DROP POLICY IF EXISTS "subject_teacher_students" ON students;
CREATE POLICY "subject_teacher_students" ON students FOR SELECT
  USING (auth_user_role() = 'subject_teacher' AND class_id IN (
    SELECT class_id FROM class_subjects WHERE teacher_id = auth.uid()
  ));

-- marks: director full, subject teacher own entries, class teacher read-only
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "director_marks" ON marks;
CREATE POLICY "director_marks" ON marks FOR ALL USING (auth_user_role() = 'director');
DROP POLICY IF EXISTS "subject_teacher_marks" ON marks;
CREATE POLICY "subject_teacher_marks" ON marks FOR ALL
  USING (auth_user_role() = 'subject_teacher' AND entered_by = auth.uid() AND status IN ('draft','submitted'));
DROP POLICY IF EXISTS "class_teacher_marks" ON marks;
CREATE POLICY "class_teacher_marks" ON marks FOR SELECT
  USING (auth_user_role() = 'class_teacher' AND assessment_id IN (
    SELECT a.id FROM assessments a
    JOIN class_subjects cs ON cs.id = a.class_subject_id
    WHERE cs.class_id = auth_user_class()
  ));

-- assessments
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "director_assessments" ON assessments;
CREATE POLICY "director_assessments" ON assessments FOR ALL USING (auth_user_role() = 'director');
DROP POLICY IF EXISTS "subject_teacher_assessments" ON assessments;
CREATE POLICY "subject_teacher_assessments" ON assessments FOR ALL
  USING (auth_user_role() = 'subject_teacher' AND class_subject_id IN (
    SELECT id FROM class_subjects WHERE teacher_id = auth.uid()
  ));
DROP POLICY IF EXISTS "class_teacher_assessments" ON assessments;
CREATE POLICY "class_teacher_assessments" ON assessments FOR SELECT
  USING (auth_user_role() = 'class_teacher' AND class_subject_id IN (
    SELECT id FROM class_subjects WHERE class_id = auth_user_class()
  ));

-- audit_log: director read only, system inserts
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "director_audit" ON audit_log;
CREATE POLICY "director_audit" ON audit_log FOR SELECT USING (auth_user_role() = 'director');
DROP POLICY IF EXISTS "system_audit_insert" ON audit_log;
CREATE POLICY "system_audit_insert" ON audit_log FOR INSERT WITH CHECK (true);

-- notifications: own only
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_notifications" ON notifications;
CREATE POLICY "own_notifications" ON notifications FOR ALL USING (user_id = auth.uid());

-- users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "director_users" ON users;
CREATE POLICY "director_users" ON users FOR ALL USING (auth_user_role() = 'director');
DROP POLICY IF EXISTS "own_user" ON users;
CREATE POLICY "own_user" ON users FOR SELECT USING (id = auth.uid());

-- academic_years
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "director_academic_years" ON academic_years;
CREATE POLICY "director_academic_years" ON academic_years FOR ALL USING (auth_user_role() = 'director');
DROP POLICY IF EXISTS "read_academic_years" ON academic_years;
CREATE POLICY "read_academic_years" ON academic_years FOR SELECT USING (true);

-- school_settings
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "director_school_settings" ON school_settings;
CREATE POLICY "director_school_settings" ON school_settings FOR ALL USING (auth_user_role() = 'director');
DROP POLICY IF EXISTS "read_school_settings" ON school_settings;
CREATE POLICY "read_school_settings" ON school_settings FOR SELECT USING (true);

-- classes
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "director_classes" ON classes;
CREATE POLICY "director_classes" ON classes FOR ALL USING (auth_user_role() = 'director');
DROP POLICY IF EXISTS "read_classes" ON classes;
CREATE POLICY "read_classes" ON classes FOR SELECT USING (auth_user_role() IS NOT NULL);

-- subjects
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "director_subjects" ON subjects;
CREATE POLICY "director_subjects" ON subjects FOR ALL USING (auth_user_role() = 'director');
DROP POLICY IF EXISTS "read_subjects" ON subjects;
CREATE POLICY "read_subjects" ON subjects FOR SELECT USING (auth_user_role() IS NOT NULL);

-- class_subjects
ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "director_class_subjects" ON class_subjects;
CREATE POLICY "director_class_subjects" ON class_subjects FOR ALL USING (auth_user_role() = 'director');
DROP POLICY IF EXISTS "read_class_subjects" ON class_subjects;
CREATE POLICY "read_class_subjects" ON class_subjects FOR SELECT USING (auth_user_role() IS NOT NULL);

-- terms
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "director_terms" ON terms;
CREATE POLICY "director_terms" ON terms FOR ALL USING (auth_user_role() = 'director');
DROP POLICY IF EXISTS "read_terms" ON terms;
CREATE POLICY "read_terms" ON terms FOR SELECT USING (auth_user_role() IS NOT NULL);

-- term_subject_results
ALTER TABLE term_subject_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "director_term_subject_results" ON term_subject_results;
CREATE POLICY "director_term_subject_results" ON term_subject_results FOR ALL USING (auth_user_role() = 'director');
DROP POLICY IF EXISTS "read_term_subject_results" ON term_subject_results;
CREATE POLICY "read_term_subject_results" ON term_subject_results FOR SELECT USING (auth_user_role() IS NOT NULL);

-- term_results
ALTER TABLE term_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "director_term_results" ON term_results;
CREATE POLICY "director_term_results" ON term_results FOR ALL USING (auth_user_role() = 'director');
DROP POLICY IF EXISTS "read_term_results" ON term_results;
CREATE POLICY "read_term_results" ON term_results FOR SELECT USING (auth_user_role() IS NOT NULL);

-- annual_results
ALTER TABLE annual_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "director_annual_results" ON annual_results;
CREATE POLICY "director_annual_results" ON annual_results FOR ALL USING (auth_user_role() = 'director');
DROP POLICY IF EXISTS "read_annual_results" ON annual_results;
CREATE POLICY "read_annual_results" ON annual_results FOR SELECT USING (auth_user_role() IS NOT NULL);

-- reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "director_reports" ON reports;
CREATE POLICY "director_reports" ON reports FOR ALL USING (auth_user_role() = 'director');
DROP POLICY IF EXISTS "read_reports" ON reports;
CREATE POLICY "read_reports" ON reports FOR SELECT USING (auth_user_role() IS NOT NULL);

-- student_year_history
ALTER TABLE student_year_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "director_student_year_history" ON student_year_history;
CREATE POLICY "director_student_year_history" ON student_year_history FOR ALL USING (auth_user_role() = 'director');
DROP POLICY IF EXISTS "read_student_year_history" ON student_year_history;
CREATE POLICY "read_student_year_history" ON student_year_history FOR SELECT USING (auth_user_role() IS NOT NULL);
