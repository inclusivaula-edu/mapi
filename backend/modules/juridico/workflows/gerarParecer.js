import { juridicoAgent } from "../../../agents/juridico/JuridicoAgent.js";

/**
 * WORKFLOW: gerar-parecer
 *
 * Gera parecer jurídico fundamentado sobre uma questão de direito.
 * Estrutura: Relatório → Fundamentação → Conclusão → Recomendações.
 *
 * Context: { questao, area, fatos, userId, organizationId }
 */
export default async function gerarParecer({ input, context }) {
  const { questao, area, fatos, userId, organizationId } = context;

  if (!questao?.trim() && !input?.trim()) {
    throw new Error("MISSING_INPUT: questão jurídica é obrigatória");
  }

  return juridicoAgent.run({
    tipo:      "parecer-juridico",
    area:      area ?? "civil",
    descricao: `Elabore um parecer jurídico completo sobre a seguinte questão:

QUESTÃO: ${questao ?? input}
ÁREA DO DIREITO: ${area ?? "não especificada"}
FATOS RELEVANTES: ${fatos ?? "não informados"}

O parecer deve ter:
1. Relatório — síntese dos fatos
2. Fundamentação Legal — legislação e doutrina aplicáveis
3. Jurisprudência Aplicável — precedentes relevantes
4. Conclusão — resposta objetiva à questão
5. Recomendações — próximos passos sugeridos`,
    partes:  [],
    context: { userId, organizationId },
  });
}
