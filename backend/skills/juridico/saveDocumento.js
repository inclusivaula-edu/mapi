import { logger } from "../../observability/logger.js";
import { supabase } from "../../services/dbService.js";
import { logUsage } from "../../billing/ledger.engine.js";

/**
 * SKILL: saveDocumento
 *
 * Persiste um documento jurídico gerado no Supabase.
 * Fire-and-forget — nunca bloqueia a resposta ao usuário.
 *
 * @param {object} documento     - Documento gerado
 * @param {object} context       - { userId, organizationId, tipo, area }
 * @param {number} tokensUsed    - Tokens consumidos na geração
 */
export async function saveDocumento(documento, context, tokensUsed = 0) {
  const { userId, organizationId, tipo, area } = context;

  const [docResult, usageResult] = await Promise.allSettled([
    supabase.from("legal_documents").insert({
      organization_id: organizationId,
      user_id:         userId,
      tipo,
      area,
      content:         documento,
      created_at:      new Date().toISOString(),
    }),
    logUsage({
      organizationId,
      userId,
      tokensUsed,
      model:    "gpt-4o-mini",
      endpoint: "/ai/juridico",
    }),
  ]);

  if (docResult.status  === "rejected") logger.error("saveDocumento error:", docResult.reason?.message);
  if (usageResult.status === "rejected") logger.error("logUsage error:", usageResult.reason?.message);
}
