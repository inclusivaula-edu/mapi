import { lgpdAgent } from "../../../agents/lgpd/LGPDAgent.js";

export default async function gerarDPA({ input, context }) {
  return lgpdAgent.run({
    tipo: "dpa",
    descricao: context.descricao ?? input ?? "Gerar Acordo de Processamento de Dados (DPA) entre controlador e operador",
    answers: context.answers,
    context,
  });
}
