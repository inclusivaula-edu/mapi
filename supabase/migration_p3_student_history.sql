-- ══════════════════════════════════════════════════════════════
-- MIGRATION P3 — Histórico Longitudinal do Aluno
-- ══════════════════════════════════════════════════════════════

-- student_history: snapshot do estado do aluno a cada semestre
CREATE TABLE IF NOT EXISTS student_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  semester        TEXT NOT NULL,
  snapshot        JSONB NOT NULL,
  peis_generated  INT DEFAULT 0,
  objectives      JSONB DEFAULT '[]',
  strategies      JSONB DEFAULT '[]',
  evolution_notes TEXT,
  created_by      UUID NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_student_history_unique
  ON student_history(student_id, semester);

CREATE INDEX IF NOT EXISTS idx_student_history_org
  ON student_history(organization_id);

ALTER TABLE student_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "student_history_own_org" ON student_history
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM members WHERE user_id = auth.uid()
    )
  );

-- Vincular reports ao histórico do semestre
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS history_id UUID REFERENCES student_history(id);
