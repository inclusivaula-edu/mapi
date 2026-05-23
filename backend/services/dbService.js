import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("❌ SUPABASE não configurado no .env");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { transport: ws },
});
 
// ===============================
// 💾 SALVAR CONVERSA
// ===============================
export async function saveConversation(data) {
  const { error } = await supabase
    .from("conversations")
    .insert([data]);
 
  if (error) {
    console.error("❌ Erro ao salvar conversa:", error);
  }
}
 
// ===============================
// 📜 BUSCAR HISTÓRICO
// ===============================
export async function getHistory(tenantId) {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });
 
  if (error) {
    console.error("❌ Erro ao buscar histórico:", error);
    return [];
  }
 
  return data;
}