-- Staff Invitations
CREATE TABLE IF NOT EXISTS invitations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL UNIQUE,
  role       user_role NOT NULL,
  token      TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '48 hours'),
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS for Invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Directors can manage invitations" ON invitations;
CREATE POLICY "Directors can manage invitations"
  ON invitations
  FOR ALL
  TO authenticated
  USING (auth_user_role() = 'director');

DROP POLICY IF EXISTS "Users can see their own invitation" ON invitations;
CREATE POLICY "Users can see their own invitation"
  ON invitations
  FOR SELECT
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));
