import { isAllowed } from "./billing.engine.js";

/**
 * BILLING GUARD — Fastify preHandler
 *
 * Requer que tenantHook já tenha rodado (req.tenant deve existir).
 * Verifica o limite da organização, não do usuário individual.
 */
export async function billingGuard(req, reply) {
  if (!req.user) {
    return reply.code(401).send({ error: "UNAUTHORIZED" });
  }

  if (!req.tenant?.orgId) {
    return reply.code(403).send({ error: "NO_ORGANIZATION" });
  }

  const access = await isAllowed(req.tenant.orgId);

  if (!access.ok) {
    return reply.code(403).send({
      error: "ACCESS_DENIED",
      reason: access.reason,
      billing: access.billing,
    });
  }

  req.billing = access.billing;
}
