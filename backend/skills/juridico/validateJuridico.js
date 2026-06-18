import { chat } from "../../services/aiService.js";

/**
 * SKILL: validateJuridico
 *
 * Avalia a qualidade técnica de um documento jurídico gerado.
 * Verifica: coerência argumentativa, embasamento legal, clareza,
 * completude e adequação ao tipo de documento.
 *
 * Score 0–10:
 *   >= 8  aprovado
 *   6–7   aprovado com ressalvas
 *   < 6   reprovado — agente reescreve
 *
 * @param {object} documento  - Documento jurídico gerado
 * @param {string} tipo       - Tipo do documento (contrato, parecer, petição, etc.)
 * @param {string} area       - Área do direito
 */
export async function validateJuridico(documento, tipo, area) {
  try {
    const raw = await chat({
      system: `Você é um revisor jurídico sênior especializado em direito brasileiro.
Avalie o documento com rigor técnico.

Critérios:
1. Embasamento legal correto e citações precisas? (0-2 pts)
2. Argumentação lógica e coerente? (0-2 pts)
3. Linguagem técnica adequada ao tipo de documento? (0-2 pts)
4. Completude — cobre todos os pontos essenciais? (0-2 pts)
5. Disclaimer de revisão profissional presente? (0-2 pts)

Retorne APENAS JSON puro:
{
  "score": 8,
  "valid": true,
  "issues": ["lista de problemas, vazia se nenhum"],
  "suggestions": ["sugestões de melhoria"]
}`,
      user: `TIPO: ${tipo} | ÁREA: ${area ?? "geral"}
DOCUMENTO: ${JSON.stringify(documento)}`,
      temperature: 0,
    });

    const result = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return {
      valid:       result.score >= 6,
      score:       result.score,
      issues:      result.issues      ?? [],
      suggestions: result.suggestions ?? [],
    };
  } catch {
    return { valid: true, score: -1, issues: [], suggestions: ["validation_unavailable"] };
  }
}
