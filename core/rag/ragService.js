import { createEmbedding } from "./embeddingService.js";
import { supabase } from "../../backend/services/dbService.js";

// 🔍 BUSCAR CONTEXTO
export async function searchContext(text, tenantId) {
  const embedding = await createEmbedding(text);

  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_count: 5,
    tenant_id: tenantId,
  });

  if (error) {
    console.error("Erro no RAG:", error);
    return [];
  }

  return data;
}

// 💾 SALVAR CONTEXTO
export async function saveContext(text, tenantId, chatId) {
  const embedding = await createEmbedding(text);

  const { error } = await supabase.from("documents").insert([
    {
      content: text,
      embedding,
      tenant_id: tenantId,
      chat_id: chatId,
    },
  ]);

  if (error) {
    console.error("Erro ao salvar contexto:", error);
  }
}