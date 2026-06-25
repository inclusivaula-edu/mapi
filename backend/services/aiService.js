import { logger } from "../observability/logger.js";
import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  logger.warn("⚠️  OPENAI_API_KEY não definida — respostas de IA estarão indisponíveis.");
}

// Instância única reutilizada em todo o projeto.
export const openai = new OpenAI({
  apiKey:     process.env.OPENAI_API_KEY,
  timeout:    60_000,  // 60s — IA jurídica e PEI podem ser lentos
  maxRetries: 1,
});

/**
 * Chamada genérica ao modelo de chat.
 *
 * @param {object} opts
 * @param {string} opts.system   - Papel/sistema que define o comportamento do modelo.
 * @param {string} opts.user     - Mensagem do usuário.
 * @param {Array}  [opts.history] - Histórico de mensagens no formato ChatGPT [{role, content}].
 * @param {string} [opts.model]  - Modelo a usar (padrão: gpt-4o-mini).
 * @param {number} [opts.temperature] - Criatividade (padrão: 0.6).
 * @returns {Promise<string>} Conteúdo textual da resposta.
 */
export async function chat({ system, user, history = [], model = "gpt-4o-mini", temperature = 0.6 }) {
  const messages = [
    { role: "system", content: system },
    ...history,
    { role: "user", content: String(user) },
  ];

  const response = await openai.chat.completions.create({
    model,
    messages,
    temperature,
  });

  return response.choices[0].message.content ?? "";
}
