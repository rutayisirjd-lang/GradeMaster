CREATE INDEX idx_marks_assessment ON marks(assessment_id);
CREATE INDEX idx_marks_student ON marks(student_id);
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_students_year ON students(academic_year_id);
CREATE INDEX idx_assessments_class_subject ON assessments(class_subject_id);
CREATE INDEX idx_term_results_student ON term_results(student_id);
CREATE INDEX idx_annual_results_year ON annual_results(academic_year_id);
