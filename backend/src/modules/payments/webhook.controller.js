import { preApprovalClient } from "../../services/payment.service.js";

export async function webhookHandler(req, reply) {
  try {
    const body = req.body;

    if (body?.type !== "preapproval") {
      return { ok: true };
    }

    const id = body.data?.id;
    if (!id) return { ok: true };

    const sub = await preApprovalClient.get({ id });

    console.log("🔔 STATUS:", sub.status);

    return { ok: true };
  } catch (err) {
    console.error(err);
    return reply.code(500).send({ error: "Webhook error" });
  }
}