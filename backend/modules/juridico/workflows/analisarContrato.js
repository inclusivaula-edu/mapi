import { juridicoAgent } from "../../../agents/juridico/JuridicoAgent.js";

/**
 * WORKFLOW: analisar-contrato
 *
 * Analisa um contrato existente fornecido pelo usuário:
 * identifica cláusulas abusivas, riscos jurídicos, pontos de atenção
 * e sugere modificações com base na legislação vigente.
 */
export default async function analisarContrato({ input, context }) {
  const { contrato, area, userId, organizationId } = context;

  if (!contrato?.trim() && !input?.trim()) {
    throw new Error("MISSING_INPUT: texto do contrato é obrigatório");
  }
  if ((contrato ?? input).length > 15000) {
    throw new Error("CONTRATO_TOO_LONG: máximo 15.000 caracteres");
  }

  return juridicoAgent.run({
    tipo:      "analise-contratual",
    area:      area ?? "civil",
    descricao: `Analise o seguinte contrato e identifique:
1. Cláusulas abusivas ou nulas (à luz do CDC, CC e legislação aplicável)
2. Riscos jurídicos para cada parte
3. Pontos ausentes que deveriam estar presentes
4. Sugestões de modificação fundamentadas em lei

CONTRATO A ANALISAR:
${contrato ?? input}`,
    partes:   [],
    context:  { userId, organizationId },
  });
}
