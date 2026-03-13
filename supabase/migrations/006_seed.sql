-- 1. School Profile
INSERT INTO school_settings (school_name, school_motto, country, school_address)
VALUES (
    'GradeMaster Academy', 
    'Excellence in Digital Education', 
    'Rwanda', 
    'Kigali Heights, Kimihurura, Kigali'
) ON CONFLICT DO NOTHING;

-- 2. Academic Year (Current)
INSERT INTO academic_years (label, start_date, end_date, is_current)
VALUES ('2025-2026', '2025-01-05', '2025-11-20', true)
ON CONFLICT (label) DO NOTHING;

-- 3. Terms
INSERT INTO terms (academic_year_id, name, start_date, end_date, is_open)
SELECT 
    id, 
    'Term_One', 
    '2025-01-10', 
    '2025-04-05', 
    true 
FROM academic_years WHERE label = '2025-2026'
ON CONFLICT DO NOTHING;

INSERT INTO terms (academic_year_id, name, start_date, end_date, is_open)
SELECT 
    id, 
    'Term_Two', 
    '2025-05-01', 
    '2025-08-15', 
    false 
FROM academic_years WHERE label = '2025-2026'
ON CONFLICT DO NOTHING;

INSERT INTO terms (academic_year_id, name, start_date, end_date, is_open)
SELECT 
    id, 
    'Term_Three', 
    '2025-09-10', 
    '2025-11-20', 
    false 
FROM academic_years WHERE label = '2025-2026'
ON CONFLICT DO NOTHING;

-- 4. Subjects
INSERT INTO subjects (name, code, description) VALUES
('Mathematics', 'MATH-S1', 'Core mathematics and algebra foundation.'),
('English Literature', 'ENG-S1', 'Language arts and library analysis.'),
('Physics', 'PHY-S1', 'Introductory mechanics and thermodynamics.'),
('History', 'HIST-S1', 'African and World civilizations.'),
('Kinyarwanda', 'KINY-S1', 'National language and culture study.')
ON CONFLICT DO NOTHING;

-- 5. Classes
INSERT INTO classes (academic_year_id, name, level, section, capacity)
SELECT 
    id, 
    'Senior 1A', 
    'S1', 
    'A', 
    45 
FROM academic_years WHERE label = '2025-2026'
ON CONFLICT DO NOTHING;

-- 6. Students (Sample Batch)
INSERT INTO students (student_id, first_name, last_name, gender, date_of_birth, enrollment_date, academic_year_id, class_id)
SELECT 
    'STU-2025-001', 'David', 'Kagame', 'male', '2012-05-14', '2025-01-05', 
    ay.id, c.id
FROM academic_years ay, classes c 
WHERE ay.label = '2025-2026' AND c.name = 'Senior 1A'
ON CONFLICT DO NOTHING;

INSERT INTO students (student_id, first_name, last_name, gender, date_of_birth, enrollment_date, academic_year_id, class_id)
SELECT 
    'STU-2025-002', 'Grace', 'Mutoni', 'female', '2012-08-22', '2025-01-05', 
    ay.id, c.id
FROM academic_years ay, classes c 
WHERE ay.label = '2025-2026' AND c.name = 'Senior 1A'
ON CONFLICT DO NOTHING;

INSERT INTO students (student_id, first_name, last_name, gender, date_of_birth, enrollment_date, academic_year_id, class_id)
SELECT 
    'STU-2025-003', 'John', 'Smith', 'male', '2012-03-10', '2025-01-08', 
    ay.id, c.id
FROM academic_years ay, classes c 
WHERE ay.label = '2025-2026' AND c.name = 'Senior 1A'
ON CONFLICT DO NOTHING;

-- 7. Assignments (Mock Class Teacher)
-- Assuming we have at least one user, this part is manually handled normally.
-- But we can add Class-Subject links for Senior 1A and Math.
INSERT INTO class_subjects (class_id, subject_id, teacher_id, academic_year_id)
SELECT 
    c.id, s.id, 'd07a1bb5-7b5c-4d3e-9614-749cad643642', ay.id -- Replace with a valid teacher ID during setup
FROM classes c, subjects s, academic_years ay
WHERE c.name = 'Senior 1A' AND s.name = 'Mathematics' AND ay.label = '2025-2026'
ON CONFLICT DO NOTHING;
