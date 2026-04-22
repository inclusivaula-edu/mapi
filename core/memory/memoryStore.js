import { supabase } from "../../backend/services/dbService.js";

export async function getMemory(chatId) {
  const { data } = await supabase
    .from("chat_memory")
    .select("*")
    .eq("chat_id", chatId)
    .single();

  return data?.summary || "";
}

export async function saveMemory(chatId, tenantId, summary) {
  await supabase
    .from("chat_memory")
    .upsert([
      {
        chat_id: chatId,
        tenant_id: tenantId,
        summary,
        updated_at: new Date()
      }
    ]);
}