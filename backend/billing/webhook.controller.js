import {
  activateSubscription,
  suspendUser,
  cancelSubscription
} from "./subscriptions.service.js";

export default async function webhookController(req, reply) {
  const event = req.body;

  try {
    // 🔥 MERCADO PAGO / STRIPE EVENT SIMPLIFICADO
    const type = event.type || event.action;

    if (type === "payment.approved" || type === "subscription.created") {
      const userId = event.data?.user_id || event.user_id;
      await activateSubscription(userId, "pro");
    }

    if (type === "payment.failed") {
      const userId = event.data?.user_id;
      await suspendUser(userId);
    }

    if (type === "subscription.canceled") {
      const userId = event.data?.user_id;
      await cancelSubscription(userId);
    }

    return reply.send({ received: true });

  } catch (err) {
    console.error(err);
    return reply.code(500).send({ error: "WEBHOOK_ERROR" });
  }
}