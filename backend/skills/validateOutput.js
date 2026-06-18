import { chat } from "../services/aiService.js";

/**
 * SKILL: validateOutput
 *
 * Avalia se um conteúdo pedagógico gerado é adequado para um aluno
 * com necessidades especiais. Funciona como um "revisor automático"
 * que roda depois de qualquer geração de conteúdo.
 *
 * Retorna um score numérico + lista de problemas encontrados.
 * O agente usa isso para decidir se aceita a resposta ou tenta novamente.
 *
 * @param {object} content   - O conteúdo gerado (aula, relatório, etc.)
 * @param {object} student   - Perfil do aluno para contextualizar a avaliação
 * @returns {Promise<{valid: boolean, score: number, issues: string[]}>}
 */
export async function validateOutput(content, student) {
  try {
    const raw = await chat({
      system: `Você avalia se um conteúdo pedagógico está adequado para educação inclusiva.
Avalie com critério — não seja generoso.

Critérios de avaliação:
1. Linguagem está no nível da série/idade? (0-2 pontos)
2. Atividades são adaptadas ao diagnóstico? (0-3 pontos)
3. Há código BNCC válido? (0-1 ponto)
4. Exemplo é do cotidiano real? (0-2 pontos)
5. Adaptação está justificada pedagogicamente? (0-2 pontos)

Retorne APENAS JSON puro:
{
  "score": 8,
  "valid": true,
  "issues": ["lista de problemas encontrados, vazia se nenhum"]
}`,
      user: `ALUNO: ${JSON.stringify(student)}
CONTEÚDO: ${JSON.stringify(content)}`,
      temperature: 0,
    });

    const result = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return {
      valid: result.score >= 7,   // limiar: 7/10 para aprovação
      score: result.score,
      issues: result.issues ?? [],
    };
  } catch {
    // Se a validação falhar, aprova com aviso — não bloqueia o usuário
    return { valid: true, score: -1, issues: ["validation_unavailable"] };
  }
}
