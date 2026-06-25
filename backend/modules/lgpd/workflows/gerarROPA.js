import { lgpdAgent } from "../../../agents/lgpd/LGPDAgent.js";

export default async function gerarROPA({ input, context }) {
  return lgpdAgent.run({
    tipo: "ropa",
    descricao: context.descricao ?? input ?? "Gerar Registro de Atividades de Tratamento (ROPA) conforme Art. 37 da LGPD",
    answers: context.answers,
    context,
  });
}
