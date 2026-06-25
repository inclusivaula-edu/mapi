import { lgpdAgent } from "../../../agents/lgpd/LGPDAgent.js";

export default async function gerarRIPD({ input, context }) {
  return lgpdAgent.run({
    tipo: "ripd",
    descricao: context.descricao ?? input ?? "Gerar Relatório de Impacto à Proteção de Dados (RIPD) conforme Art. 38 da LGPD",
    answers: context.answers,
    context,
  });
}
