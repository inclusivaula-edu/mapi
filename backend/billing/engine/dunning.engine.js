import { supabase } from "../../services/dbService.js";

export async function registerFailedPayment(userId, reason) {
  return supabase.from("billing_events").insert({
    user_id: userId,
    event_type: "payment_failed",
    metadata: { reason },
    created_at: new Date().toISOString(),
  });
}

export async function shouldRetry(userId) {
  const { data } = await supabase
    .from("billing_events")
    .select("*")
    .eq("user_id", userId)
    .eq("event_type", "payment_failed");

  const fails = data?.length || 0;

  return fails < 3; // Stripe-like rule
}