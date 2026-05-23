import { supabase } from "../src/services/dbService.js";

export async function writeLedger({
  userId,
  eventType,
  amount = 0,
  plan = "free",
  metadata = {},
}) {
  if (!userId || !eventType) return;

  // 🧠 proteção contra spam duplicado (idempotência simples)
  const key = `${userId}-${eventType}-${Date.now()}`;

  await supabase.from("ledger").insert({
    idempotency_key: key,
    user_id: userId,
    event_type: eventType,
    amount,
    plan,
    metadata,
    created_at: new Date().toISOString(),
  });
}