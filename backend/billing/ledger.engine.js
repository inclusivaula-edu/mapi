import { logger } from "../observability/logger.js";
import { supabase } from "../services/dbService.js";

/**
 * LEDGER ENGINE — registro de uso por organização
 *
 * Todas as escritas são fire-and-forget — nunca bloqueiam a resposta.
 */

export async function writeLedger({ organizationId, userId, eventType, metadata = {} }) {
  if (!organizationId || !userId || !eventType) return;

  const { error } = await supabase.from("ledger").insert({
    organization_id: organizationId,
    user_id:         userId,
    event_type:      eventType,
    metadata,
    created_at:      new Date().toISOString(),
  });

  if (error) logger.error("LEDGER WRITE ERROR:", error.message);
}

export async function logUsage({ organizationId, userId, tokensUsed = 0, model = "gpt-4o-mini", endpoint = "" }) {
  if (!organizationId || !userId) return;

  const { error } = await supabase.from("usage_logs").insert({
    organization_id: organizationId,
    user_id:         userId,
    tokens_used:     tokensUsed,
    model,
    endpoint,
    created_at:      new Date().toISOString(),
  });

  if (error) logger.error("USAGE LOG ERROR:", error.message);
}
