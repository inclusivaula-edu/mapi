import { getSubscription } from "./subscriptions.service.js";
import { getPlan } from "./plans.service.js";
import { getUsage } from "./usage.service.js";

export async function billingMiddleware(req, reply) {
  try {
    const user = req.user;

    if (!user?.id) {
      return reply.code(401).send({ error: "UNAUTHORIZED" });
    }

    const subscription = await getSubscription(user.id);

    if (!subscription || subscription.status !== "active") {
      return reply.code(403).send({ error: "ASSINATURA_INATIVA" });
    }

    const plan = getPlan(subscription.plan_id);
    const usage = await getUsage(user.id);

    if (usage.totalRequests >= plan.limit_requests) {
      return reply.code(429).send({ error: "LIMITE_REQUESTS_EXCEDIDO" });
    }

    if (usage.totalTokens >= plan.limit_tokens) {
      return reply.code(429).send({ error: "LIMITE_TOKENS_EXCEDIDO" });
    }

  } catch (err) {
    console.error(err);
    return reply.code(500).send({ error: "BILLING_ERROR" });
  }
}