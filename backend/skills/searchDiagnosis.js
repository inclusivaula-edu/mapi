import { supabase } from "../services/dbService.js";
import { chat } from "../services/aiService.js";

/**
 * SKILL: searchDiagnosis
 *
 * Busca estratégias pedagógicas adaptadas para um diagnóstico específico.
 *
 * Essa skill é o "dicionário de inclusão" do MAPI: para cada diagnóstico
 * retorna o que funciona pedagogicamente — ritmo, canais sensoriais,
 * tipo de atividade, sinais de alerta e recursos recomendados.
 *
 * @param {string} diagnosis - Diagnóstico do aluno (ex: "TEA", "TDAH", "Síndrome de Down")
 * @returns {Promise<{strategies: string[], sensoryChannel: string, pace: string, alerts: string[]}>}
 */
export async function searchDiagnosis(diagnosis) {
  if (!diagnosis) return null;

  // 1. Tenta base local curada (diagnósticos validados por especialistas)
  const { data } = await supabase
    .from("diagnosis_strategies")
    .select("strategies, sensory_channel, pace, alerts, resources")
    .ilike("diagnosis", `%${diagnosis}%`)
    .single();

  if (data) return data;

  // 2. Fallback via IA — gera perfil pedagógico baseado na literatura
  try {
    const raw = await chat({
      system: `Você é especialista em educação especial e neuropsicologia educacional.
Retorne APENAS JSON puro com este formato:
{
  "strategies": ["estratégia 1", "estratégia 2", "estratégia 3"],
  "sensoryChannel": "visual | auditivo | cinestésico | multimodal",
  "pace": "lento | moderado | flexível",
  "alerts": ["sinal de alerta 1", "sinal de alerta 2"],
  "resources": ["recurso recomendado 1", "recurso recomendado 2"]
}`,
      user: `Diagnóstico: ${diagnosis}. Quais são as melhores estratégias pedagógicas para este aluno?`,
      temperature: 0.2,
    });

    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return null;
  }
}
