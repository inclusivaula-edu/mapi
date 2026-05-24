import OpenAI from "openai";
import { buildMemory } from "../../../core/memory/memoryBuilder.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function assistant({ input, context }) {
  const { student, userId, chatId, tenantId } = context;

  const messages = await buildMemory({
    module: "education",
    input,
    chatId,
    tenantId,
  });

  const systemPrompt = `
Você é um assistente pedagógico especializado em educação inclusiva.
${student ? `Contexto do aluno: ${student.name}, ${student.diagnosis || "sem diagnóstico informado"}.` : ""}
Responda de forma clara, prática e acessível.
`;

  const finalMessages = [
    { role: "system", content: systemPrompt },
    ...messages.filter((m) => m.role !== "system"),
    { role: "user", content: input },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: finalMessages,
    temperature: 0.7,
  });

  return response.choices?.[0]?.message?.content || "";
}
