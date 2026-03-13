-- Trigger function to create a profile after auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- If another profile exists with this email but a different ID, rename the old one
  -- This prevents unique constraint violations while preserving data integrity/FKs
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
      WHEN (new.raw_user_meta_data->>'role') = 'subject_teacher' THEN 'subject_teacher'::user_role
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

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
