import { supabase } from "../services/dbService.js";

export default async function webhook(req, reply) {
  const event = req.body;

  const type = event.type || event.action;

  const userId = event.data?.external_reference;

  if (!userId) {
    return reply.send({ ok: true });
  }

  // 💳 pagamento aprovado
  if (type === "payment.approved") {
    await supabase.from("subscriptions").upsert({
      user_id: userId,
      plan_id: "pro",
      status: "active",
    });
  }

  // ❌ falha
  if (type === "payment.failed") {
    await supabase
      .from("subscriptions")
      .update({ status: "past_due" })
      .eq("user_id", userId);
  }

  // 🚫 cancelado
  if (type === "subscription.canceled") {
    await supabase
      .from("subscriptions")
      .update({ status: "canceled" })
      .eq("user_id", userId);
  }

  return reply.send({ received: true });
}