import { logger } from "../observability/logger.js";
import { supabase } from "../services/dbService.js";

/**
 * WEBHOOK BILLING B2B
 *
 * Recebe eventos do Mercado Pago / Stripe e atualiza
 * a assinatura da ORGANIZAÇÃO (não do usuário).
 *
 * Payload esperado:
 *   { type, data: { organization_id, plan, period_end } }
 */
export default async function webhookController(req, reply) {
  const event = req.body;

  try {
    const type   = event.type ?? event.action;
    const orgId  = event.data?.organization_id;
    const planId = event.data?.plan ?? "starter";

    if (!type || !orgId) {
      return reply.code(400).send({ error: "INVALID_WEBHOOK_PAYLOAD" });
    }

    if (type === "payment.approved" || type === "subscription.created") {
      const periodEnd = event.data?.period_end
        ? new Date(event.data.period_end)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await supabase.from("subscriptions").upsert({
        organization_id:      orgId,
        plan_id:              planId,
        status:               "active",
        current_period_start: new Date().toISOString(),
        current_period_end:   periodEnd.toISOString(),
        external_id:          event.data?.external_id,
        updated_at:           new Date().toISOString(),
      });

      // Atualiza max_members da org conforme o plano
      const { getPlan } = await import("../config/plans.js");
      const plan = getPlan(planId);
      if (plan.maxMembers !== Infinity) {
        await supabase
          .from("organizations")
          .update({ plan_id: planId, max_members: plan.maxMembers })
          .eq("id", orgId);
      }
    }

    if (type === "payment.failed") {
      await supabase
        .from("subscriptions")
        .update({ status: "suspended", updated_at: new Date().toISOString() })
        .eq("organization_id", orgId);
    }

    if (type === "subscription.canceled") {
      await supabase
        .from("subscriptions")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("organization_id", orgId);
    }

    return reply.send({ received: true });

  } catch (err) {
    logger.error("WEBHOOK ERROR:", err.message);
    return reply.code(500).send({ error: "WEBHOOK_ERROR" });
  }
}
