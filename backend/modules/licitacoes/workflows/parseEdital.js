import { licitacaoAgent } from "../../../agents/licitacoes/LicitacaoAgent.js";

export default async function parseEditalWorkflow({ input, context }) {
  const editalText = context.editalText ?? input;
  if (!editalText?.trim()) throw new Error("MISSING_CONTEXT: texto do edital é obrigatório");

  return licitacaoAgent.run({
    tipo: "parse-edital",
    descricao: "Extrair requisitos e informações do edital",
    editalText,
    context,
  });
}
