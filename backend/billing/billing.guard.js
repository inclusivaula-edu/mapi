import { isAllowed } from "./billing.engine.js";

export async function billingGuard(req, reply) {
  const user = req.user;

  if (!user) {
    return reply.code(401).send({ error: "UNAUTHORIZED" });
  }

  const access = await isAllowed(user.id);

  if (!access.ok) {
    return reply.code(403).send({
      error: "ACCESS_DENIED",
      reason: access.reason,
      billing: access.billing,
    });
  }

  req.billing = access.billing;
}
