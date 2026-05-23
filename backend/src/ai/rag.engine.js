import { supabase } from "../services/dbService.js";
import { createEmbedding } from "./embedding.engine.js";

/**
 * 🔍 RAG - BUSCA SEMÂNTICA ESTÁVEL (PROD)
 */
export async function searchKnowledge(query) {
  try {
    if (!query || typeof query !== "string") {
      return [];
    }

    const embedding = await createEmbedding(query);

    if (!Array.isArray(embedding) || embedding.length === 0) {
      console.error("❌ embedding inválido na busca");
      return [];
    }

    const { data, error } = await supabase.rpc("match_knowledge", {
      query_embedding: embedding,
      match_threshold: 0.75,
      match_count: 5,
    });

    if (error) {
      console.error("❌ RAG RPC ERROR:", error);
      return [];
    }

    return (data || [])
      .filter((item) => item?.content)
      .slice(0, 5);
  } catch (err) {
    console.error("❌ SEARCH KNOWLEDGE FATAL:", err);
    return [];
  }
}

/**
 * 💾 INSERÇÃO SEGURA NO RAG
 */
export async function insertKnowledge(content) {
  try {
    if (!content || typeof content !== "string") {
      return;
    }

    const embedding = await createEmbedding(content);

    if (!Array.isArray(embedding) || embedding.length === 0) {
      console.error("❌ embedding inválido na inserção");
      return;
    }

    const { error } = await supabase.from("knowledge_base").insert({
      content,
      embedding,
      approved: true,
    });

    if (error) {
      console.error("❌ INSERT ERROR:", error);
    }
  } catch (err) {
    console.error("❌ INSERT FATAL:", err);
  }
}