import { supabase } from "../../services/dbService.js";

export async function writeLedger({
  userId,
  eventType,
  amount = 0,
  plan = "free",
  metadata = {},
}) {
  await supabase.from("ledger").insert({
    user_id: userId,
    event_type: eventType,
    amount,
    plan,
    metadata,
    created_at: new Date().toISOString(),
  });
}