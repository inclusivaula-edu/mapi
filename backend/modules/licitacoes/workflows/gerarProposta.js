import { licitacaoAgent } from "../../../agents/licitacoes/LicitacaoAgent.js";

export default async function gerarProposta({ input, context }) {
  const descricao = context.descricao ?? input;
  if (!descricao?.trim()) throw new Error("MISSING_CONTEXT: descrição do objeto é obrigatória");

  return licitacaoAgent.run({
    tipo: "proposta-tecnica",
    descricao,
    editalText: context.editalText,
    context,
  });
}
