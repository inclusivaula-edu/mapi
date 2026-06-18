import { logger } from "../observability/logger.js";
import { supabase } from "../services/dbService.js";
import { getPlan } from "../config/plans.js";

/**
 * BILLING ENGINE — B2B por organização
 *
 * O limite de requests é da escola, não do usuário individual.
 * Todos os professores da escola consomem do mesmo pool mensal.
 *
 * Fluxo:
 *   1. Busca assinatura da organização
 *   2. Valida status (active)
 *   3. Conta uso agregado da organização no mês corrente
 *   4. Compara com o limite do plano
 */
export async function isAllowed(organizationId) {
  try {
    // 1. Assinatura da organização
    const { data: sub, error: subErr } = await supabase
      .from("subscriptions")
      .select("plan_id, status, current_period_end")
      .eq("organization_id", organizationId)
      .single();

    const planId = sub?.plan_id ?? "trial";
    const status = sub?.status ?? "inactive";
    const plan   = getPlan(planId);

    if (subErr && subErr.code !== "PGRST116") {
      logger.error("BILLING: erro ao buscar subscription:", subErr.message);
    }

    if (status !== "active") {
      return result(false, "SUBSCRIPTION_INACTIVE", { planId, status, usage: 0, plan });
    }

    // 2. Período vigente (usa o período da assinatura, não o mês calendário)
    const periodStart = sub?.current_period_start
      ? new Date(sub.current_period_start).toISOString()
      : (() => {
          const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d.toISOString();
        })();

    // 3. Uso agregado da organização no período
    const { count, error: countErr } = await supabase
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("created_at", periodStart);

    if (countErr) logger.error("BILLING: erro ao contar uso:", countErr.message);

    const usage = count ?? 0;

    if (plan.maxRequests !== Infinity && usage >= plan.maxRequests) {
      return result(false, "USAGE_LIMIT_EXCEEDED", { planId, status, usage, plan });
    }

    return result(true, null, { planId, status, usage, plan });

  } catch (err) {
    logger.error("BILLING ENGINE EXCEPTION:", err.message);
    return result(false, "BILLING_ERROR", null);
  }
}

function result(ok, reason, billing) {
  return { ok, ...(reason && { reason }), billing };
}
