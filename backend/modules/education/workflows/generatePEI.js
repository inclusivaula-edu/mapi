import { peiOrchestrator } from "../../../agents/PEIOrchestrator.js";

/**
 * WORKFLOW: gerar-pei
 *
 * Delega para o PEIOrchestrator que roda 4 subagentes em paralelo.
 * O workflow só valida inputs e passa o contexto.
 */
export default async function generatePEI({ input, context }) {
  const { student, userId } = context;

  if (!student?.name || !student?.diagnosis) {
    throw new Error("MISSING_CONTEXT: student.name e student.diagnosis são obrigatórios para o PEI");
  }

  return peiOrchestrator.run({ student, context: { userId } });
}
