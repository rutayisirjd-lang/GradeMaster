CREATE TYPE user_role AS ENUM ('director', 'class_teacher', 'subject_teacher');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE term_name AS ENUM ('TERM_1', 'TERM_2', 'TERM_3');
CREATE TYPE assessment_category AS ENUM ('quiz', 'homework', 'exercise', 'exam');
CREATE TYPE mark_status AS ENUM ('draft', 'submitted', 'reviewed', 'locked');
CREATE TYPE absence_type AS ENUM ('present', 'excused', 'unexcused', 'not_applicable');
CREATE TYPE promotion_status AS ENUM ('promoted', 'not_promoted', 'conditionally_promoted', 'pending');
