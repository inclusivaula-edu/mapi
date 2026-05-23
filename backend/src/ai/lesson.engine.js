import { getMemory } from "./memory.engine.js";
import { searchKnowledge } from "./rag.engine.js";

export async function generateLesson({ userId, topic, disability }) {
  const memory = await getMemory(userId);
  const knowledge = await searchKnowledge(topic);

  return {
    title: `Aula adaptada: ${topic}`,
    studentProfile: memory,
    references: knowledge,
    content: `
AULA ADAPTADA

Tema: ${topic}
Necessidade: ${disability || "não informado"}

Estratégias aplicadas:
- linguagem simples
- apoio visual
- multimodalidade
- ensino estruturado

Baseado no histórico do aluno + conhecimento pedagógico + boas práticas inclusivas
    `,
  };
}