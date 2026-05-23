import { supabase } from "../services/dbService.js";

export async function saveMemory(userId, data) {
  try {
    await supabase.from("ai_memory").insert({
      user_id: userId,
      memory: data,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("SAVE MEMORY ERROR:", err);
  }
}

export async function getMemory(userId) {
  try {
    const { data } = await supabase
      .from("ai_memory")
      .select("memory, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5); // 🔥 pega só as últimas memórias

    return data || [];
  } catch (err) {
    console.error("GET MEMORY ERROR:", err);
    return [];
  }
}