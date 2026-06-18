import { juridicoAgent } from "../../../agents/juridico/JuridicoAgent.js";

/**
 * WORKFLOW: gerar-peticao
 *
 * Gera minuta de petição inicial, recurso ou requerimento administrativo.
 * Tipos: inicial | recurso | agravo | mandado-seguranca | requerimento-admin
 *
 * Context: { tipoPeticao, area, fatos, pedidos, partes, userId, organizationId }
 *
 * IMPORTANTE: Petições precisam de advogado habilitado com OAB.
 * O disclaimer é obrigatório e inviolável.
 */
export default async function gerarPeticao({ input, context }) {
  const { tipoPeticao, area, fatos, pedidos, partes, userId, organizationId } = context;

  if (!fatos?.trim() && !input?.trim()) {
    throw new Error("MISSING_INPUT: fatos são obrigatórios para gerar petição");
  }
  if (!pedidos?.trim()) {
    throw new Error("MISSING_INPUT: pedidos são obrigatórios para gerar petição");
  }

  return juridicoAgent.run({
    tipo:      tipoPeticao ?? "peticao-inicial",
    area:      area ?? "civil",
    descricao: `Elabore minuta de ${tipoPeticao ?? "petição inicial"} com a seguinte base:

ÁREA: ${area ?? "não especificada"}
FATOS: ${fatos ?? input}
PEDIDOS: ${pedidos}
PARTES: ${JSON.stringify(partes ?? [])}

A petição deve seguir o Código de Processo Civil (Lei 13.105/2015) e incluir:
1. Endereçamento ao juízo competente
2. Qualificação das partes
3. Dos Fatos — narrativa cronológica
4. Do Direito — fundamentos legais e jurisprudenciais
5. Dos Pedidos — de forma específica e objetiva
6. Do Valor da Causa
7. Pedido de provas
8. Fecho e assinatura

AVISO OBRIGATÓRIO: Esta é uma minuta — necessita revisão e assinatura de advogado(a) com registro na OAB.`,
    partes:  partes ?? [],
    context: { userId, organizationId },
  });
}
