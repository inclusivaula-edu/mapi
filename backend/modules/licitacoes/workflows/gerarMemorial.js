import { licitacaoAgent } from "../../../agents/licitacoes/LicitacaoAgent.js";

export default async function gerarMemorial({ input, context }) {
  const descricao = context.descricao ?? input;
  if (!descricao?.trim()) throw new Error("MISSING_CONTEXT: descrição do serviço/obra é obrigatória");

  return licitacaoAgent.run({
    tipo: "memorial-descritivo",
    descricao,
    editalText: context.editalText,
    context,
  });
}
