-- Auto-generate student_id
CREATE SEQUENCE IF NOT EXISTS student_seq START 1;
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

-- Auto-normalize score to /100
CREATE OR REPLACE FUNCTION normalize_mark_score() RETURNS TRIGGER AS $$
DECLARE v_max NUMERIC;
BEGIN
  IF NEW.raw_score IS NOT NULL THEN
    SELECT max_score INTO v_max FROM assessments WHERE id = NEW.assessment_id;
    NEW.normalized_score := ROUND((NEW.raw_score / v_max) * 100, 2);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_score ON marks;
CREATE TRIGGER trg_normalize_score BEFORE INSERT OR UPDATE ON marks
  FOR EACH ROW EXECUTE FUNCTION normalize_mark_score();
