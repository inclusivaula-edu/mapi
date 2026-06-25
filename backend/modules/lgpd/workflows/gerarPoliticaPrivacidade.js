import { lgpdAgent } from "../../../agents/lgpd/LGPDAgent.js";

export default async function gerarPoliticaPrivacidade({ input, context }) {
  return lgpdAgent.run({
    tipo: "politica-privacidade",
    descricao: context.descricao ?? input ?? "Gerar política de privacidade completa conforme LGPD",
    answers: context.answers,
    context,
  });
}
