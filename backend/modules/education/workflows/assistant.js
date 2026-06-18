import { chat } from "../../../services/aiService.js";

/**
 * WORKFLOW: assistente
 *
 * Assistente geral do módulo education — responde perguntas pedagógicas,
 * tira dúvidas sobre inclusão, BNCC, metodologias e legislação.
 *
 * Context esperado: { userId }
 */
export default async function assistant({ input, context }) {
  if (!input?.trim()) {
    throw new Error("MISSING_INPUT: mensagem não pode estar vazia");
  }

  const response = await chat({
    system: `Você é um assistente pedagógico especializado em educação inclusiva (AEE).
Ajuda professores, coordenadores e famílias a entender direitos, metodologias adaptadas,
legislação educacional (LDB, LBI, Política Nacional de Educação Especial) e boas práticas de inclusão.
Seja claro, objetivo e empático.`,
    user: input,
  });

  return { type: "assistant", content: response };
}
