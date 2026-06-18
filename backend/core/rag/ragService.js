import { supabase } from "../../services/dbService.js";
import { openai }   from "../../services/aiService.js";
import { logger }   from "../../observability/logger.js";

/**
 * Gera embedding de um texto.
 */
async function createEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 8000),
  });
  return response.data[0].embedding;
}

/**
 * Busca documentos relevantes via similaridade semântica.
 * Falha silenciosamente — RAG é opcional, nunca bloqueia a aula.
 */
export async function searchContext(text, organizationId, matchCount = 5) {
  try {
    const embedding = await createEmbedding(text);

    const { data, error } = await supabase.rpc("match_documents", {
      query_embedding: embedding,
      match_count:     matchCount,
      org_id:          organizationId ?? null,
    });

    if (error) {
      logger.warn("RAG searchContext error:", { detail: error.message });
      return [];
    }

    return data ?? [];

  } catch (err) {
    logger.warn("RAG exception:", { detail: err.message });
    return [];
  }
}

/**
 * Salva documento no índice vetorial.
 */
export async function saveContext(text, organizationId, chatId) {
  try {
    const embedding = await createEmbedding(text);

    const { error } = await supabase.from("documents").insert({
      content:         text,
      embedding,
      organization_id: organizationId,
      chat_id:         chatId,
      created_at:      new Date().toISOString(),
    });

    if (error) logger.warn("RAG saveContext error:", { detail: error.message });

  } catch (err) {
    logger.warn("RAG saveContext exception:", { detail: err.message });
  }
}
