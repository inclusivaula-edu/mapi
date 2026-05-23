import { supabase } from "../services/dbService.js";

export async function buildContext({ userId, topic }) {
  // 📚 memória do aluno
  const memory = await supabase
    .from("ai_memory")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  // 📖 base pedagógica (RAG)
  const knowledge = await supabase
    .from("knowledge_base")
    .select("*")
    .ilike("content", `%${topic}%`)
    .limit(5);

  return {
    memory: memory.data || [],
    knowledge: knowledge.data || [],
  };
}