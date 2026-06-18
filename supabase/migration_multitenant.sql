-- ============================================================
-- MAPI — Multi-tenant B2B Migration
-- Rodar no Supabase SQL Editor uma vez
-- ============================================================

-- ── 1. ORGANIZATIONS ────────────────────────────────────────
-- O tenant raiz. Cada escola é uma organização.
CREATE TABLE IF NOT EXISTS organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,        -- ex: "escola-municipal-santos"
  plan_id     TEXT NOT NULL DEFAULT 'trial',
  status      TEXT NOT NULL DEFAULT 'active',  -- active | suspended | canceled
  max_members INT  NOT NULL DEFAULT 10,
  settings    JSONB DEFAULT '{}',          -- configurações customizadas da escola
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ── 2. MEMBERS ──────────────────────────────────────────────
-- Associação usuário ↔ organização com papel (role).
-- Um usuário pode estar em múltiplas organizações.
CREATE TABLE IF NOT EXISTS members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL,           -- auth.users.id do Supabase
  role            TEXT NOT NULL DEFAULT 'teacher',  -- admin | teacher | viewer
  status          TEXT NOT NULL DEFAULT 'active',   -- active | suspended
  invited_by      UUID,                    -- user_id de quem convidou
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (organization_id, user_id)        -- um usuário tem um papel por org
);

-- ── 3. SUBSCRIPTIONS (por organização, não por usuário) ─────
DROP TABLE IF EXISTS subscriptions;  -- remove a antiga (era por user_id)

CREATE TABLE IF NOT EXISTS subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end   TIMESTAMPTZ DEFAULT (now() + interval '1 month'),
  external_id     TEXT,                    -- ID no Mercado Pago / Stripe
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (organization_id)
);

-- ── 4. USAGE_LOGS (por organização + usuário) ───────────────
DROP TABLE IF EXISTS usage_logs;

CREATE TABLE IF NOT EXISTS usage_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id         UUID NOT NULL,
  endpoint        TEXT,
  tokens_used     INT  DEFAULT 0,
  model           TEXT DEFAULT 'gpt-4o-mini',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── 5. LEDGER (por organização) ──────────────────────────────
DROP TABLE IF EXISTS ledger;

CREATE TABLE IF NOT EXISTS ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id         UUID NOT NULL,
  event_type      TEXT NOT NULL,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── 6. STUDENTS (por organização) ───────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  age             TEXT,
  grade           TEXT,
  diagnosis       TEXT,
  notes           TEXT,
  created_by      UUID NOT NULL,           -- user_id do professor que cadastrou
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── 7. LESSONS (por organização) ────────────────────────────
DROP TABLE IF EXISTS lessons;

CREATE TABLE IF NOT EXISTS lessons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL,           -- professor que gerou
  student_id      UUID REFERENCES students(id),
  topic           TEXT NOT NULL,
  bncc_code       TEXT,
  content         JSONB NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── 8. REPORTS (por organização) ────────────────────────────
DROP TABLE IF EXISTS reports;

CREATE TABLE IF NOT EXISTS reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL,
  student_id      UUID REFERENCES students(id),
  type            TEXT NOT NULL,           -- ANAMNESE | PEI | PAEE
  content         JSONB NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── 9. DOCUMENTS / RAG (por organização) ────────────────────
DROP TABLE IF EXISTS documents;

CREATE TABLE IF NOT EXISTS documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  chat_id         UUID,
  content         TEXT NOT NULL,
  embedding       VECTOR(1536),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── 10. MEMORY SUMMARIES (por organização) ──────────────────
DROP TABLE IF EXISTS memory_summaries;

CREATE TABLE IF NOT EXISTS memory_summaries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  chat_id         UUID NOT NULL,
  summary         TEXT NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (organization_id, chat_id)
);

-- ── ÍNDICES de performance ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_members_user       ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_org        ON members(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_org_date     ON usage_logs(organization_id, created_at);
CREATE INDEX IF NOT EXISTS idx_lessons_org        ON lessons(organization_id);
CREATE INDEX IF NOT EXISTS idx_students_org       ON students(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_org      ON documents(organization_id);

-- ── RLS (Row Level Security) — isolamento por organização ────
-- Ativa RLS em todas as tabelas sensíveis
ALTER TABLE organizations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE members           ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE students          ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons           ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents         ENABLE ROW LEVEL SECURITY;

-- Policy: usuário só vê dados da sua organização
-- (o backend usa service_role key e bypass RLS — isso protege acesso direto via SDK no cliente)
CREATE POLICY "members_own_org" ON members
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "students_own_org" ON students
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "lessons_own_org" ON lessons
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM members WHERE user_id = auth.uid()
    )
  );

-- ── FUNÇÃO: match_documents (RAG) ───────────────────────────
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(1536),
  match_count     INT,
  org_id          UUID
)
RETURNS TABLE (content TEXT, similarity FLOAT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.content,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM documents d
  WHERE d.organization_id = org_id
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ── COMENTÁRIOS ──────────────────────────────────────────────
COMMENT ON TABLE organizations IS 'Tenant raiz — cada escola é uma organização';
COMMENT ON TABLE members IS 'Associação usuário ↔ organização com papel (admin/teacher/viewer)';
COMMENT ON TABLE subscriptions IS 'Plano da organização — billing B2B por escola';
COMMENT ON TABLE usage_logs IS 'Consumo agregado por organização + usuário';

-- ── TRACES — rastreamento de requisições de IA ───────────────
CREATE TABLE IF NOT EXISTS traces (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL,
  workflow         TEXT NOT NULL,
  input_length     INT  DEFAULT 0,
  duration_ms      INT  DEFAULT 0,
  tokens_used      INT  DEFAULT 0,
  quality_score    FLOAT,
  iterations       INT,
  error            TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_traces_org_date ON traces(organization_id, created_at);
ALTER TABLE traces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "traces_own_org" ON traces FOR ALL USING (
  organization_id IN (SELECT organization_id FROM members WHERE user_id = auth.uid())
);

COMMENT ON TABLE traces IS 'Rastreamento completo de cada requisição de IA — latência, tokens, score';

-- ============================================================
-- MÓDULO JURÍDICO
-- ============================================================

-- ── LEGAL_DOCUMENTS — documentos gerados ────────────────────
CREATE TABLE IF NOT EXISTS legal_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL,
  tipo            TEXT NOT NULL,   -- contrato | parecer | peticao | resumo
  area            TEXT,            -- trabalhista | civil | tributário | etc.
  content         JSONB NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_legal_docs_org ON legal_documents(organization_id, created_at);
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "legal_docs_own_org" ON legal_documents FOR ALL USING (
  organization_id IN (SELECT organization_id FROM members WHERE user_id = auth.uid())
);

-- ── LEGAL_REFERENCES — base de legislação da organização ────
CREATE TABLE IF NOT EXISTS legal_references (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lei             TEXT NOT NULL,
  artigo          TEXT,
  ementa          TEXT,
  tipo            TEXT DEFAULT 'federal',  -- federal | estadual | municipal | normativa
  area            TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_legal_refs_org ON legal_references(organization_id);
ALTER TABLE legal_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY "legal_refs_own_org" ON legal_references FOR ALL USING (
  organization_id IN (SELECT organization_id FROM members WHERE user_id = auth.uid())
);

-- ── LEGAL_PRECEDENTS — base de jurisprudência da organização ─
CREATE TABLE IF NOT EXISTS legal_precedents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tribunal         TEXT NOT NULL,
  numero           TEXT,
  ementa           TEXT NOT NULL,
  data_julgamento  TEXT,
  area             TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_legal_prec_org ON legal_precedents(organization_id);
ALTER TABLE legal_precedents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "legal_prec_own_org" ON legal_precedents FOR ALL USING (
  organization_id IN (SELECT organization_id FROM members WHERE user_id = auth.uid())
);

COMMENT ON TABLE legal_documents  IS 'Documentos jurídicos gerados por IA — contratos, pareceres, petições';
COMMENT ON TABLE legal_references IS 'Base de legislação curada pela organização (fallback para searchLegislacao)';
COMMENT ON TABLE legal_precedents IS 'Base de jurisprudência curada pela organização (fallback para searchJurisprudencia)';
