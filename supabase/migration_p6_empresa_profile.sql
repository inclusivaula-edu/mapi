-- ═══════════════════════════════════════════════════════════════
-- MIGRATION P6 — Perfil de Empresa + Histórico de Licitações
-- ═══════════════════════════════════════════════════════════════

-- ── Perfil da empresa (dados reutilizáveis em todos os documentos) ──
CREATE TABLE IF NOT EXISTS company_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Dados jurídicos
  razao_social    TEXT NOT NULL,
  nome_fantasia   TEXT,
  cnpj            TEXT NOT NULL,
  inscricao_estadual TEXT,
  inscricao_municipal TEXT,

  -- Endereço
  endereco        TEXT,
  cidade          TEXT,
  uf              CHAR(2),
  cep             TEXT,

  -- Representante legal
  representante_nome  TEXT,
  representante_cpf   TEXT,
  representante_cargo TEXT,
  representante_rg    TEXT,

  -- Contato
  telefone        TEXT,
  email           TEXT,
  website         TEXT,

  -- Classificação
  porte           TEXT DEFAULT 'geral' CHECK (porte IN ('mei', 'me', 'epp', 'medio', 'grande', 'geral')),
  ramo_atividade  TEXT,
  cnae_principal  TEXT,

  -- Qualificação técnica
  atestados_capacidade JSONB DEFAULT '[]',
  certificacoes        JSONB DEFAULT '[]',
  equipe_tecnica       JSONB DEFAULT '[]',

  -- Dados bancários (para propostas)
  banco           TEXT,
  agencia         TEXT,
  conta           TEXT,

  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID NOT NULL
);

CREATE UNIQUE INDEX idx_company_profile_org ON company_profiles(organization_id);
CREATE INDEX idx_company_profile_cnpj ON company_profiles(cnpj);

ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY company_profiles_org_isolation ON company_profiles
  USING (organization_id = current_setting('app.current_org_id', true)::uuid);

-- ── Histórico de licitações (participações anteriores) ──────────
CREATE TABLE IF NOT EXISTS bid_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Dados do processo
  numero_edital   TEXT,
  orgao_licitante TEXT,
  modalidade      TEXT,
  objeto          TEXT NOT NULL,
  valor_proposta  NUMERIC(15,2),
  valor_contrato  NUMERIC(15,2),

  -- Resultado
  resultado       TEXT DEFAULT 'em_andamento' CHECK (resultado IN ('vencida', 'perdida', 'desclassificada', 'em_andamento', 'cancelada', 'deserta')),
  posicao_final   INT,
  motivo_perda    TEXT,

  -- Datas
  data_abertura   DATE,
  data_resultado  DATE,

  -- Documentos gerados (referência ao bid_documents)
  bid_project_id  UUID REFERENCES bid_projects(id) ON DELETE SET NULL,

  -- Métricas para aprendizado
  itens           JSONB DEFAULT '[]',
  preco_referencia NUMERIC(15,2),
  desconto_aplicado NUMERIC(5,2),

  -- Observações
  notas           TEXT,

  created_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID NOT NULL
);

CREATE INDEX idx_bid_history_org ON bid_history(organization_id);
CREATE INDEX idx_bid_history_resultado ON bid_history(resultado);
CREATE INDEX idx_bid_history_orgao ON bid_history(orgao_licitante);

ALTER TABLE bid_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY bid_history_org_isolation ON bid_history
  USING (organization_id = current_setting('app.current_org_id', true)::uuid);

-- ── Certidões vigentes (controle de validade) ───────────────────
CREATE TABLE IF NOT EXISTS company_certidoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL,
  numero          TEXT,
  data_emissao    DATE,
  data_validade   DATE,
  status          TEXT DEFAULT 'vigente' CHECK (status IN ('vigente', 'vencida', 'pendente')),
  observacao      TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_certidoes_org ON company_certidoes(organization_id);
CREATE INDEX idx_certidoes_validade ON company_certidoes(data_validade);

ALTER TABLE company_certidoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY certidoes_org_isolation ON company_certidoes
  USING (organization_id = current_setting('app.current_org_id', true)::uuid);
