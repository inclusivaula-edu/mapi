import { supabase } from "../../backend/services/dbService.js";
import { searchContext } from "../rag/ragService.js";
import { summarizeMessages } from "./summarizer.js";
import { getMemory, saveMemory } from "./memoryStore.js";

const MAX_MESSAGES = 10;

export async function buildMemory({ module, input, chatId, tenantId }) {

  // 🔹 1. pega histórico recente
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: false })
    .limit(MAX_MESSAGES);

  const reversed = messages.reverse();

  // 🔹 2. pega resumo salvo
  const summary = await getMemory(chatId);

  // 🔹 3. RAG
  const docs = await searchContext(input, tenantId);
  const ragText = docs.map(d => d.content).join("\n");

  // 🔹 4. monta mensagens estilo ChatGPT
  const finalMessages = [
    {
      role: "system",
      content: `
Você é uma IA do MAPI.

MEMÓRIA DA CONVERSA:
${summary}

CONHECIMENTO (RAG):
${ragText}
      `
    },
    ...reversed.map(m => ({
      role: m.role === "bot" ? "assistant" : "user",
      content: m.content
    })),
    {
      role: "user",
      content: input
    }
  ];

  // 🔥 5. AUTO RESUMO (quando crescer muito)
  if (messages.length >= MAX_MESSAGES) {
    const newSummary = await summarizeMessages(reversed);

    await saveMemory(chatId, tenantId, newSummary);
  }

  return finalMessages;
}