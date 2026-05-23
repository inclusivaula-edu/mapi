import { supabase } from "../../services/dbService.js";
import { shouldRetry } from "../engine/dunning.engine.js";

export async function retryFailedPayments() {
  const { data: users } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("status", "past_due");

  for (const user of users || []) {
    const retry = await shouldRetry(user.user_id);

    if (!retry) continue;

    console.log("🔁 retry payment:", user.user_id);

    // aqui chamaria Stripe/MercadoPago real
  }
}