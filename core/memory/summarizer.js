import { generateAIResponse } from "../ai/openaiService.js";

export async function summarizeMessages(messages) {
  const text = messages
    .map(m => `${m.role}: ${m.content}`)
    .join("\n");

  const summary = await generateAIResponse([
    {
      role: "system",
      content: "Resuma a conversa mantendo os pontos importantes."
    },
    {
      role: "user",
      content: text
    }
  ]);

  return summary;
}