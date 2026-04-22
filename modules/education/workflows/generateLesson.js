import { generateAIResponse } from "../../../core/ai/openaiService.js";

export default async function generateLesson({ input }) {

  const { topic, context } = input;

  const messages = [
    {
      role: "system",
      content: "Você é um professor especialista em educação inclusiva."
    },
    {
      role: "user",
      content: `
Tema: ${topic}

Contexto:
${context || "nenhum"}

Crie uma aula adaptada para alunos com necessidades especiais.
      `
    }
  ];

  const aiResponse = await generateAIResponse(messages);

  return {
    response: aiResponse
  };
}