import { supabase } from "../../backend/services/dbService.js";

export async function getRecentMessages(chatId) {
  const { data } = await supabase
    .from("messages")
    .select("role, content")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: false })
    .limit(6);

  return (data || []).reverse();
}