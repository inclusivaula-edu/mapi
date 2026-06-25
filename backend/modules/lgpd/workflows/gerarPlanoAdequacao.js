import { lgpdAgent } from "../../../agents/lgpd/LGPDAgent.js";

export default async function gerarPlanoAdequacao({ input, context }) {
  return lgpdAgent.run({
    tipo: "plano-adequacao",
    descricao: context.descricao ?? input ?? "Gerar plano de adequação LGPD com cronograma e responsabilidades",
    answers: context.answers,
    context,
  });
}
