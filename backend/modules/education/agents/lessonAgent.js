import { generateResponse } from "../../../backend/services/aiService.js";

export async function lessonAgent({ input }) {
  const prompt = `
Crie uma aula adaptada sobre: ${input}

Inclua:
- Objetivo
- Conteúdo
- Atividade adaptada
- Recursos
`;

  const result = await generateResponse(prompt, "professor especializado em educação inclusiva");

  return {
    type: "lesson",
    content: result,
  };
}