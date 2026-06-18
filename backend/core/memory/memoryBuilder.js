import { supabase } from "../../services/dbService.js";
import { searchContext } from "../rag/ragService.js";
import { chat } from "../../services/aiService.js";

const MAX_MESSAGES = 10;

/**
 * Constrói o array de mensagens (formato ChatGPT) para uma conversa.
 *
 * Combina três fontes de contexto:
 *  1. Histórico recente do chat (últimas MAX_MESSAGES mensagens do Supabase)
 *  2. Resumo comprimido de conversas anteriores (memória longa)
 *  3. Documentos relevantes recuperados via RAG
 *
 * Quando o histórico atinge MAX_MESSAGES, gera automaticamente um novo
 * resumo e o persiste — isso mantém o contexto sem explodir o context window.
 *
 * @param {object} opts
 * @param {string} opts.module    - Nome do módulo (ex: "education")
 * @param {string} opts.input     - Mensagem atual do usuário (usada no RAG)
 * @param {string} opts.chatId    - ID do chat para buscar histórico
 * @param {string} opts.organizationId  - ID do tenant para filtrar no RAG
 * @returns {Promise<Array<{role: string, content: string}>>}
 */
export async function buildMemory({ module, input, chatId, organizationId }) {
  // 1. Histórico recente
  const { data: messages } = await supabase
    .from("messages")
    .select("role, content")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: false })
    .limit(MAX_MESSAGES);

  const history = (messages ?? []).reverse().map((m) => ({
    role: m.role === "bot" ? "assistant" : "user",
    content: m.content,
  }));

  // 2. Resumo de memória longa
  const { data: memRow } = await supabase
    .from("memory_summaries")
    .select("summary")
    .eq("chat_id", chatId)
    .single();

  const summary = memRow?.summary ?? "";

  // 3. RAG — documentos relevantes ao input
  const docs = await searchContext(input, organizationId);
  const ragText = docs.map((d) => d.content).join("\n");

  // 4. Monta array final
  const systemContent = [
    `Você é uma IA do módulo ${module} do MAPI.`,
    summary ? `\nRESUMO DA CONVERSA ANTERIOR:\n${summary}` : "",
    ragText  ? `\nCONHECIMENTO RELEVANTE (RAG):\n${ragText}` : "",
  ].join("");

  const finalMessages = [
    { role: "system", content: systemContent },
    ...history,
    { role: "user", content: input },
  ];

  // 5. Auto-resumo quando o histórico fica grande
  if (history.length >= MAX_MESSAGES) {
    const newSummary = await summarize(history);
    await supabase.from("memory_summaries").upsert({
      chat_id: chatId,
      organization_id: organizationId,
      summary: newSummary,
      updated_at: new Date().toISOString(),
    });
  }

  return finalMessages;
}

/** Comprime um histórico de mensagens em um parágrafo de resumo. */
async function summarize(messages) {
  const transcript = messages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  return chat({
    system: "Resuma a conversa abaixo em no máximo 3 parágrafos, preservando os pontos pedagógicos principais.",
    user: transcript,
    temperature: 0.3,
  });
}
