import { supabase } from "../../services/dbService.js";
import { activateSubscription, cancelSubscription } from "./subscription.engine.js";

export async function handleWebhook(event) {
  const eventId = event.id;

  // 🧠 idempotência (NUNCA processar 2x)
  const { data } = await supabase
    .from("webhook_events")
    .select("*")
    .eq("event_id", eventId)
    .single();

  if (data) return; // já processado

  await supabase.from("webhook_events").insert({
    event_id: eventId,
    type: event.type,
    created_at: new Date().toISOString(),
  });

  // 💳 eventos principais
  switch (event.type) {
    case "payment_success":
      await activateSubscription(event.userId, event.plan);
      break;

    case "payment_failed":
      await cancelSubscription(event.userId);
      break;
  }
}