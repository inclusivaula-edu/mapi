import { supabase } from "../../../backend/services/dbService.js";
import { createEmbedding } from "../embeddingService.js";

export async function search(text, tenantId) {
  const embedding = await createEmbedding(text);

  const { data } = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_count: 5,
    tenant_id: tenantId
  });

  return data;
}

export async function save(text, tenantId, chatId) {
  const embedding = await createEmbedding(text);

  await supabase.from("documents").insert([
    {
      content: text,
      embedding,
      tenant_id: tenantId,
      chat_id: chatId
    }
  ]);
}