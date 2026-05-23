import { buildSystemPrompt } from "./prompt.engine.js";
import { buildContext } from "./context.builder.js";
import fetch from "node-fetch";

export async function generateLessonSaaS({
  userId,
  topic,
  disability,
}) {
  const context = await buildContext({ userId, topic });

  const systemPrompt = buildSystemPrompt();

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `
Crie uma aula adaptada:

Tema: ${topic}
Necessidade: ${disability}

MEMÓRIA DO ALUNO:
${JSON.stringify(context.memory)}

BASE PEDAGÓGICA:
${JSON.stringify(context.knowledge)}

Retorne:
- título
- objetivos
- atividade adaptada
- metodologia inclusiva
- avaliação simples
          `,
        },
      ],
    }),
  });

  const data = await response.json();

  return {
    success: true,
    lesson: data.choices?.[0]?.message?.content,
    contextUsed: true,
  };
}