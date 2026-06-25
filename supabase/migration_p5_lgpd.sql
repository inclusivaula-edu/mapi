-- ══════════════════════════════════════════════════════════════
-- MIGRATION P5 — Módulo Compliance LGPD
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lgpd_assessments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'in_progress',
  score           FLOAT,
  answers         JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '[]',
  created_by      UUID NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lgpd_assessments_org ON lgpd_assessments(organization_id, status);
ALTER TABLE lgpd_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "lgpd_assessments_own_org" ON lgpd_assessments
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id = auth.uid())
  );

CREATE TABLE IF NOT EXISTS lgpd_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assessment_id   UUID REFERENCES lgpd_assessments(id),
  tipo            TEXT NOT NULL,
  content         JSONB NOT NULL,
  version         INT DEFAULT 1,
  created_by      UUID NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lgpd_docs_org ON lgpd_documents(organization_id);
ALTER TABLE lgpd_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "lgpd_docs_own_org" ON lgpd_documents
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id = auth.uid())
  );

CREATE TABLE IF NOT EXISTS lgpd_references (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lei             TEXT NOT NULL,
  artigo          TEXT,
  ementa          TEXT,
  tipo            TEXT DEFAULT 'federal',
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lgpd_refs_org ON lgpd_references(organization_id);
ALTER TABLE lgpd_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "lgpd_refs_own_org" ON lgpd_references
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id = auth.uid())
  );
