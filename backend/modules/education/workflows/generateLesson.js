import { teacherAgent } from "../../../agents/TeacherAgent.js";
import { reviewerAgent } from "../../../agents/ReviewerAgent.js";

/**
 * WORKFLOW: gerar-aula
 *
 * Orquestra TeacherAgent + ReviewerAgent para produzir uma aula
 * inclusiva validada e pronta para uso.
 *
 * O workflow é intencional e fino — não tem lógica de negócio própria.
 * Toda a inteligência está nos agentes. O workflow apenas:
 *   1. Valida os inputs obrigatórios
 *   2. Chama o TeacherAgent para criar
 *   3. Chama o ReviewerAgent para validar/corrigir
 *   4. Retorna o resultado final
 */
export default async function generateLesson({ input, context }) {
  const { student, topic, userId, chatId, tenantId } = context;

  if (!student?.name || !topic?.trim()) {
    throw new Error("MISSING_CONTEXT: student.name e topic são obrigatórios");
  }
  if (topic.length > 500) {
    throw new Error("TOPIC_TOO_LONG: máximo 500 caracteres");
  }

  // 1. TeacherAgent cria a aula (com loop de tool use interno)
  const lesson = await teacherAgent.run({
    topic,
    student,
    context: { userId, chatId, tenantId },
  });

  // 2. ReviewerAgent valida — reescreve automaticamente se score < 7
  const { lesson: reviewedLesson, revised, score } = await reviewerAgent.review({
    lesson,
    student,
  });

  return {
    ...reviewedLesson,
    _meta: {
      ...lesson._meta,
      reviewScore: score,
      revised,
    },
  };
}
