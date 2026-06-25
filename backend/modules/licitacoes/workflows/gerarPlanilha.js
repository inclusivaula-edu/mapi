import { licitacaoAgent } from "../../../agents/licitacoes/LicitacaoAgent.js";

export default async function gerarPlanilha({ input, context }) {
  const descricao = context.descricao ?? input;
  if (!descricao?.trim()) throw new Error("MISSING_CONTEXT: descrição dos itens é obrigatória");

  return licitacaoAgent.run({
    tipo: "planilha-precos",
    descricao,
    editalText: context.editalText,
    context,
  });
}
