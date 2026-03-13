-- [GRADE MASTER COMPREHENSIVE SEED]
-- Run this AFTER full_setup.sql in the Supabase SQL Editor

-- 1. School Profile
INSERT INTO public.school_settings (school_name, school_motto, country, school_address)
VALUES (
    'GradeMaster International Academy', 
    'Academic Excellence, Precisely Tracked', 
    'Rwanda', 
    'Kigali Heights, Kimihurura, Kigali'
) ON CONFLICT DO NOTHING;

-- 2. Logic Block for Relations
DO $$
DECLARE
    v_year_id UUID;
    v_term1_id UUID;
    v_term2_id UUID;
    v_term3_id UUID;
    v_class_s1_id UUID;
    v_class_s2_id UUID;
    v_class_s3_id UUID;
BEGIN
    -- Ensure year exists
    INSERT INTO public.academic_years (label, start_date, end_date, is_current)
    VALUES ('2025-2026', '2025-01-05', '2025-11-20', true)
    ON CONFLICT (label) DO UPDATE SET is_current = true
    RETURNING id INTO v_year_id;

    -- Create Terms (Enums: TERM_1, TERM_2, TERM_3)
    INSERT INTO public.terms (academic_year_id, name, start_date, end_date, is_locked)
    VALUES 
        (v_year_id, 'TERM_1', '2025-01-05', '2025-04-15', false),
        (v_year_id, 'TERM_2', '2025-05-01', '2025-08-15', false),
        (v_year_id, 'TERM_3', '2025-09-01', '2025-11-20', false)
    ON CONFLICT (academic_year_id, name) DO NOTHING;
    
    SELECT id INTO v_term1_id FROM public.terms WHERE academic_year_id = v_year_id AND name = 'TERM_1' LIMIT 1;
    SELECT id INTO v_term2_id FROM public.terms WHERE academic_year_id = v_year_id AND name = 'TERM_2' LIMIT 1;
    SELECT id INTO v_term3_id FROM public.terms WHERE academic_year_id = v_year_id AND name = 'TERM_3' LIMIT 1;

    -- Create Subjects
    INSERT INTO public.subjects (name, code, description) VALUES
    ('Mathematics', 'MATH-GEN', 'Core mathematics and algebra foundation.'),
    ('Physics', 'PHY-GEN', 'Introductory mechanics and thermodynamics.'),
    ('English', 'ENG-LIT', 'Language arts and library analysis.'),
    ('History', 'HIST-GEN', 'African and World civilizations.'),
    ('Biology', 'BIO-LAB', 'Life sciences and biological systems.'),
    ('Chemistry', 'CHEM-LAB', 'Chemical properties and lab experiments.'),
    ('Economics', 'ECON-01', 'Principles of macro and micro economics.')
    ON CONFLICT (name) DO NOTHING;

    -- Create Classes
    INSERT INTO public.classes (academic_year_id, name, level, section, capacity)
    VALUES 
        (v_year_id, 'Senior 1A', 'S1', 'A', 45),
        (v_year_id, 'Senior 1B', 'S1', 'B', 45),
        (v_year_id, 'Senior 2A', 'S2', 'A', 40),
        (v_year_id, 'Senior 3 Alpha', 'S3', 'Alpha', 35)
    ON CONFLICT (academic_year_id, name) DO UPDATE SET capacity = EXCLUDED.capacity;

    SELECT id INTO v_class_s1_id FROM public.classes WHERE name = 'Senior 1A' LIMIT 1;
    SELECT id INTO v_class_s2_id FROM public.classes WHERE name = 'Senior 2A' LIMIT 1;
    SELECT id INTO v_class_s3_id FROM public.classes WHERE name = 'Senior 3 Alpha' LIMIT 1;

    -- Create Students (Batch for S1A)
    INSERT INTO public.students (student_id, first_name, last_name, gender, date_of_birth, enrollment_date, academic_year_id, class_id)
    VALUES 
        ('STU-2025-001', 'David', 'Kagame', 'male', '2012-05-14', '2025-01-05', v_year_id, v_class_s1_id),
        ('STU-2025-002', 'Grace', 'Mutoni', 'female', '2012-08-22', '2025-01-05', v_year_id, v_class_s1_id),
        ('STU-2025-003', 'John', 'Smith', 'male', '2012-03-10', '2025-01-08', v_year_id, v_class_s1_id),
        ('STU-2025-004', 'Sarah', 'Uwineza', 'female', '2013-01-15', '2025-01-05', v_year_id, v_class_s1_id),
        ('STU-2025-005', 'Alain', 'Mugisha', 'male', '2012-11-30', '2025-01-05', v_year_id, v_class_s1_id),
        ('STU-2025-006', 'Sonia', 'Izere', 'female', '2012-04-12', '2025-01-05', v_year_id, v_class_s1_id),
        ('STU-2025-007', 'Eric', 'Byiringiro', 'male', '2012-07-05', '2025-01-05', v_year_id, v_class_s1_id),
        ('STU-2025-008', 'Betty', 'Umutoni', 'female', '2012-12-01', '2025-01-05', v_year_id, v_class_s1_id)
    ON CONFLICT (student_id) DO NOTHING;

    -- Create Students (Batch for S2A)
    INSERT INTO public.students (student_id, first_name, last_name, gender, date_of_birth, enrollment_date, academic_year_id, class_id)
    VALUES 
        ('STU-2025-010', 'Moses', 'Ndayisaba', 'male', '2011-02-14', '2025-01-05', v_year_id, v_class_s2_id),
        ('STU-2025-011', 'Lydia', 'Umubyeyi', 'female', '2011-10-22', '2025-01-05', v_year_id, v_class_s2_id),
        ('STU-2025-012', 'Frank', 'Habimana', 'male', '2011-06-10', '2025-01-10', v_year_id, v_class_s2_id)
    ON CONFLICT (student_id) DO NOTHING;

    -- Create Students (Batch for S3 Alpha)
    INSERT INTO public.students (student_id, first_name, last_name, gender, date_of_birth, enrollment_date, academic_year_id, class_id)
    VALUES 
        ('STU-2025-020', 'Kevin', 'Murenzi', 'male', '2010-09-14', '2025-01-05', v_year_id, v_class_s3_id),
        ('STU-2025-021', 'Sandra', 'Ishimwe', 'female', '2010-11-22', '2025-01-05', v_year_id, v_class_s3_id)
    ON CONFLICT (student_id) DO NOTHING;

END $$;
