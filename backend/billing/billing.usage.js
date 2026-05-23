import { supabase } from "../services/dbService.js";

export async function trackUsage(userId, endpoint, tokens = 0) {
  await supabase.from("requests").insert({
    user_id: userId,
    endpoint,
    tokens,
    created_at: new Date().toISOString(),
  });
}