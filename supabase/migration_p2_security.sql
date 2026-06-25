-- ============================================================
-- MAPI — Migration P2 Security
-- Executar APÓS migration_multitenant.sql
-- ============================================================

-- ── 1. TABELA DE CONTADORES ATÔMICOS ─────────────────────────
-- Separa contagem de quota (atômica) do log detalhado (usage_logs).
-- Uma linha por organização, resetada a cada período de faturamento.
CREATE TABLE IF NOT EXISTS usage_counters (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  period_start    TIMESTAMPTZ NOT NULL,
  count           INT NOT NULL DEFAULT 0
);

ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;
-- Sem policy = acesso negado para todos exceto service_role (backend)

-- ── 2. FUNÇÃO ATÔMICA DE BILLING ─────────────────────────────
-- Verifica quota E incrementa o contador em uma única transação.
-- Resolve a race condition do billing guard.
--
-- Retorna: novo count se aprovado, -1 se quota excedida.
CREATE OR REPLACE FUNCTION check_and_increment_usage(
  p_organization_id UUID,
  p_period_start    TIMESTAMPTZ,
  p_max_requests    INT          -- -1 = ilimitado
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
BEGIN
  -- Tenta inserir o contador do período (primeira requisição da org no período)
  INSERT INTO usage_counters (organization_id, period_start, count)
  VALUES (p_organization_id, p_period_start, 1)
  ON CONFLICT (organization_id) DO UPDATE
    SET count        = CASE
                         WHEN usage_counters.period_start < p_period_start
                           THEN 1                          -- novo período: zera
                         WHEN p_max_requests < 0
                           THEN usage_counters.count + 1  -- ilimitado: sempre incrementa
                         WHEN usage_counters.count < p_max_requests
                           THEN usage_counters.count + 1  -- dentro da quota: incrementa
                         ELSE usage_counters.count         -- quota cheia: não incrementa
                       END,
        period_start = GREATEST(usage_counters.period_start, p_period_start)
  RETURNING count INTO v_count;

  -- Se o count não mudou (era igual ao limite) → quota excedida
  IF p_max_requests >= 0 AND v_count >= p_max_requests THEN
    -- Verifica se foi incrementado ou não (re-lê para confirmar)
    SELECT count INTO v_count
    FROM usage_counters
    WHERE organization_id = p_organization_id;

    IF v_count >= p_max_requests THEN
      RETURN -1;
    END IF;
  END IF;

  RETURN v_count;
END;
$$;

-- ── 3. RLS POLICIES — TABELAS SEM POLICY ─────────────────────

-- organizations: membros leem apenas a própria org
CREATE POLICY IF NOT EXISTS "orgs_own_members" ON organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM members WHERE user_id = auth.uid())
  );

-- subscriptions: membros leem a subscription da própria org
CREATE POLICY IF NOT EXISTS "subscriptions_own_org" ON subscriptions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM members WHERE user_id = auth.uid()
    )
  );

-- usage_logs: membros leem logs da própria org (sem escrita direta)
CREATE POLICY IF NOT EXISTS "usage_logs_own_org" ON usage_logs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM members WHERE user_id = auth.uid()
    )
  );

-- reports: membros leem relatórios da própria org
CREATE POLICY IF NOT EXISTS "reports_own_org" ON reports
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM members WHERE user_id = auth.uid()
    )
  );

-- documents: membros leem documentos RAG da própria org
CREATE POLICY IF NOT EXISTS "documents_own_org" ON documents
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM members WHERE user_id = auth.uid()
    )
  );

-- ledger: nenhum acesso direto — somente service_role (backend)
ALTER TABLE ledger ENABLE ROW LEVEL SECURITY;
-- (sem policy = tudo bloqueado para usuários autenticados)

-- memory_summaries: membros leem resumos da própria org
ALTER TABLE memory_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "memory_summaries_own_org" ON memory_summaries
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM members WHERE user_id = auth.uid()
    )
  );

-- ── 4. ÍNDICE PARA USAGE_COUNTERS ────────────────────────────
-- Já é PK, mas adicionamos índice no period_start para filtragem
CREATE INDEX IF NOT EXISTS idx_usage_counters_period
  ON usage_counters(organization_id, period_start);

COMMENT ON TABLE  usage_counters IS 'Contador atômico de quota por org/período — usado pelo billing guard';
COMMENT ON FUNCTION check_and_increment_usage IS
  'Verifica e incrementa quota de forma atômica. Retorna o novo count ou -1 se quota excedida.';
