import { contratoOrchestrator } from "../../../agents/juridico/ContratoOrchestrator.js";

/**
 * WORKFLOW: gerar-contrato
 *
 * Gera contrato completo com subagentes paralelos por cláusula.
 * Tipos: prestacao-servicos | compra-venda | locacao |
 *        parceria-empresarial | trabalho-autonomo | nda
 *
 * Context: { tipo, area, descricao, partes, userId, organizationId }
 */
export default async function gerarContrato({ input, context }) {
  const { tipo, area, descricao, partes, userId, organizationId } = context;

  const TIPOS_VALIDOS = [
    "prestacao-servicos", "compra-venda", "locacao",
    "parceria-empresarial", "trabalho-autonomo", "nda",
  ];

  if (!tipo) {
    throw new Error(`MISSING_INPUT: tipo é obrigatório. Opções: ${TIPOS_VALIDOS.join(", ")}`);
  }
  if (!descricao?.trim() && !input?.trim()) {
    throw new Error("MISSING_INPUT: descrição do contrato é obrigatória");
  }

  return contratoOrchestrator.run({
    tipo,
    area:      area ?? "civil",
    descricao: descricao ?? input,
    partes:    partes ?? [],
    context:   { userId, organizationId },
  });
}
