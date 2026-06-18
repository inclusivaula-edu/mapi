import { supabase } from "../services/dbService.js";
import { chat } from "../services/aiService.js";

/**
 * SKILL: searchBNCC
 *
 * Busca objetivos de aprendizagem da BNCC para um tema e série.
 *
 * Tenta primeiro a tabela `bncc_codes` no Supabase (base local curada).
 * Se não encontrar, gera sugestões via IA como fallback — isso garante
 * que o agente nunca fica sem contexto BNCC, mesmo em base vazia.
 *
 * @param {string} topic  - Assunto da aula (ex: "frações")
 * @param {string} grade  - Série do aluno (ex: "3º ano")
 * @returns {Promise<Array<{code: string, objective: string, competency: string}>>}
 */
export async function searchBNCC(topic, grade) {
  // 1. Tenta busca na base local
  const { data, error } = await supabase
    .from("bncc_codes")
    .select("code, objective, competency")
    .ilike("objective", `%${topic}%`)
    .eq("grade", grade)
    .limit(3);

  if (!error && data?.length > 0) return data;

  // 2. Fallback via IA — gera sugestões BNCC plausíveis
  try {
    const raw = await chat({
      system: `Você é especialista em BNCC.
Retorne APENAS JSON puro — array com até 3 objetos:
[{ "code": "EF03MA07", "objective": "...", "competency": "..." }]`,
      user: `Tema: ${topic} | Série: ${grade ?? "não informada"}`,
      temperature: 0,
    });

    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    // Skill nunca lança erro para cima — retorna vazio e deixa o agente decidir
    return [];
  }
}
