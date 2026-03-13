-- ╔═══════════════════════════════════════════════════════════════╗
-- ║   FIX DIRECTOR ROLE + VERIFY DATA                            ║
-- ║   Run this in Supabase SQL Editor                            ║
-- ╚═══════════════════════════════════════════════════════════════╝

-- 1. Fix ALL users who should be directors
-- (anyone who registered via /register-admin or was seeded as director)
UPDATE public.users 
SET role = 'director', updated_at = now()
WHERE email = 'director@grademaster.rw';

-- 2. Also promote the FIRST registered user to director
-- (this is whoever you created via /register-admin)
UPDATE public.users 
SET role = 'director', updated_at = now()
WHERE created_at = (SELECT MIN(created_at) FROM public.users);

-- 3. Verify all users and roles
SELECT id, email, role, first_name, last_name, created_at 
FROM public.users 
ORDER BY created_at;

-- 4. Verify students exist
SELECT COUNT(*) as student_count FROM public.students;

-- 5. Verify classes
SELECT id, name, level, section FROM public.classes ORDER BY name;

-- 6. Verify subjects
SELECT id, name, code FROM public.subjects ORDER BY name;
