import { logger } from "../observability/logger.js";
import { supabase } from "../services/dbService.js";
import { getPlan } from "../config/plans.js";

/**
 * BILLING ENGINE — B2B por organização
 *
 * O limite de requests é da escola, não do usuário individual.
 * A verificação e o incremento são atômicos via função PostgreSQL
 * (check_and_increment_usage), eliminando a race condition de burst.
 */
export async function isAllowed(organizationId) {
  try {
    // 1. Assinatura da organização
    const { data: sub, error: subErr } = await supabase
      .from("subscriptions")
      .select("plan_id, status, current_period_start")
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
          const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d.toISOString();
        })();

    // 3. Verifica e incrementa atomicamente
    const maxRequests = plan.maxRequests === Infinity ? -1 : plan.maxRequests;

    const { data: newCount, error: rpcErr } = await supabase.rpc(
      "check_and_increment_usage",
      {
        p_organization_id: organizationId,
        p_period_start:    periodStart,
        p_max_requests:    maxRequests,
      }
    );

    if (rpcErr) {
      logger.error("BILLING: erro no check atômico:", rpcErr.message);
      return result(false, "BILLING_ERROR", null);
    }

    if (newCount === -1) {
      // Quota excedida — lê o count atual para incluir na resposta
      const { data: ctr } = await supabase
        .from("usage_counters")
        .select("count")
        .eq("organization_id", organizationId)
        .single();
      const usage = ctr?.count ?? maxRequests;
      return result(false, "USAGE_LIMIT_EXCEEDED", { planId, status, usage, plan });
    }

    return result(true, null, { planId, status, usage: newCount, plan });

  } catch (err) {
    logger.error("BILLING ENGINE EXCEPTION:", err.message);
    return result(false, "BILLING_ERROR", null);
  }
}

function result(ok, reason, billing) {
  return { ok, ...(reason && { reason }), billing };
}
