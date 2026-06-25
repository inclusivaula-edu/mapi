import { chat } from "../../../services/aiService.js";

export default async function assistenteLicitacao({ input, context }) {
  if (!input?.trim()) throw new Error("MISSING_INPUT");

  const response = await chat({
    system: `Você é um especialista em licitações públicas brasileiras (Lei 14.133/2021, Lei 8.666/1993, LC 123/2006).
Responda dúvidas sobre processos licitatórios, modalidades, documentação, prazos, recursos e impugnações.
Cite sempre a legislação aplicável. Seja direto e objetivo.

DISCLAIMER: Suas respostas são informativas e não substituem assessoria jurídica profissional.`,
    user: input,
    model: "gpt-4o-mini",
    temperature: 0.4,
  });

  return {
    content: response,
    disclaimer: "Esta resposta é informativa e não substitui assessoria jurídica profissional em licitações.",
  };
}
