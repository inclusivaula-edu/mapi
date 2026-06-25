import { licitacaoAgent } from "../../../agents/licitacoes/LicitacaoAgent.js";

export default async function gerarDeclaracao({ input, context }) {
  const descricao = context.descricao ?? input;

  return licitacaoAgent.run({
    tipo: "declaracao",
    descricao: descricao || "Gerar declarações obrigatórias para licitação (inexistência de menor, inexistência de vínculo, idoneidade)",
    editalText: context.editalText,
    context,
  });
}
