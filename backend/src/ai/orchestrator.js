import { searchKnowledge } from "./rag.engine.js";

/**
 * 🧠 ORQUESTRADOR DE IA (NÍVEL PRODUÇÃO)
 * controla entrada + contexto + segurança + saída
 */
export async function buildAIContext({
  userId,
  topic,
  level,
  studentProfile,
  getMemory,
}) {
  // 🧠 MEMÓRIA CURTA (performance)
  const memories = await getMemory(userId);

  const memoryText = (memories || [])
    .slice(0, 5)
    .map((m) => (m?.memory ? JSON.stringify(m.memory) : ""))
    .filter(Boolean)
    .join("\n");

  // 📚 RAG HÍBRIDO
  let knowledgeText = "";

  try {
    const knowledge = await searchKnowledge(topic);

    knowledgeText =
      Array.isArray(knowledge) && knowledge.length > 0
        ? knowledge.map((k) => k.content || "").join("\n")
        : "Sem base específica — use metodologia pedagógica padrão MEC.";
  } catch {
    knowledgeText =
      "Fallback ativado — conhecimento pedagógico geral aplicado.";
  }

  return {
    memoryText,
    knowledgeText,
    safeTopic: topic?.slice(0, 120),
    safeLevel: level || "básico",
    safeProfile: studentProfile || "geral",
  };
}