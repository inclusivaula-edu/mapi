-- ══════════════════════════════════════════════════════════════
-- MIGRATION P4 — Módulo de Licitações
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bid_projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  edital_number   TEXT,
  organ           TEXT,
  modality        TEXT,
  status          TEXT NOT NULL DEFAULT 'draft',
  deadline        TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}',
  created_by      UUID NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bid_projects_org ON bid_projects(organization_id, status);
ALTER TABLE bid_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "bid_projects_own_org" ON bid_projects
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id = auth.uid())
  );

CREATE TABLE IF NOT EXISTS bid_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_project_id  UUID NOT NULL REFERENCES bid_projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL,
  content         JSONB NOT NULL,
  version         INT DEFAULT 1,
  created_by      UUID NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bid_docs_project ON bid_documents(bid_project_id);
ALTER TABLE bid_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "bid_docs_own_org" ON bid_documents
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id = auth.uid())
  );

CREATE TABLE IF NOT EXISTS bid_references (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lei             TEXT NOT NULL,
  artigo          TEXT,
  ementa          TEXT,
  tipo            TEXT DEFAULT 'federal',
  area            TEXT DEFAULT 'licitacoes',
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bid_refs_org ON bid_references(organization_id);
ALTER TABLE bid_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "bid_refs_own_org" ON bid_references
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id = auth.uid())
  );
