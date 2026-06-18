import { chat } from "../../../services/aiService.js";

/**
 * WORKFLOW: assistente-juridico
 *
 * Assistente de perguntas jurídicas rápidas — tira dúvidas sobre
 * direitos, prazos, procedimentos e orientações gerais.
 *
 * Não gera documentos — para isso usa os outros workflows.
 */
export default async function assistenteJuridico({ input, context }) {
  if (!input?.trim()) {
    throw new Error("MISSING_INPUT: pergunta não pode estar vazia");
  }

  const response = await chat({
    system: `Você é um assistente jurídico especializado em direito brasileiro.
Responde perguntas sobre direitos, deveres, procedimentos e legislação.

REGRAS:
- Seja claro e objetivo
- Cite a legislação relevante quando aplicável
- Para situações complexas, indique que um advogado deve ser consultado
- Nunca dê orientação que possa prejudicar o usuário
- Sempre inclua: "Para sua situação específica, consulte um advogado habilitado."

Áreas de especialidade: trabalhista, civil, consumidor, empresarial,
tributário, família, previdenciário, criminal (apenas informativo).`,
    user: input,
    temperature: 0.4,
  });

  return {
    type:       "assistente-juridico",
    content:    response,
    disclaimer: "Esta resposta é informativa e não constitui consultoria jurídica. Para sua situação específica, consulte um advogado habilitado.",
  };
}
