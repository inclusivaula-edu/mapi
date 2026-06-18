import { supabase } from "../../services/dbService.js";
import { chat } from "../../services/aiService.js";

/**
 * SKILL: searchJurisprudencia
 *
 * Busca jurisprudência relevante (STF, STJ, TST, TRFs) para um tema.
 * Base local primeiro, fallback via IA com precedentes conhecidos.
 *
 * AVISO: Jurisprudência tem data — o modelo pode não conhecer
 * decisões recentes. Sempre inclua disclaimer de verificação.
 *
 * @param {string} tema    - Tema jurídico
 * @param {string} tribunal - Tribunal preferido (ex: "STJ", "TST", "STF")
 * @param {string} orgId   - ID da organização
 */
export async function searchJurisprudencia(tema, tribunal, orgId) {
  // 1. Base local da organização
  if (orgId) {
    const { data } = await supabase
      .from("legal_precedents")
      .select("tribunal, numero, ementa, data_julgamento")
      .eq("organization_id", orgId)
      .ilike("ementa", `%${tema}%`)
      .limit(3);

    if (data?.length > 0) return data;
  }

  // 2. Fallback via IA
  try {
    const raw = await chat({
      system: `Você é especialista em jurisprudência brasileira.
Cite precedentes reais e relevantes sobre o tema informado.
Retorne APENAS JSON puro — array com até 3 objetos:
[{
  "tribunal": "STJ",
  "numero": "REsp 1.234.567/SP",
  "ementa": "resumo da decisão em até 2 linhas",
  "data_julgamento": "2019",
  "relevancia": "por que este precedente se aplica"
}]
Cite apenas decisões reais. Se não souber com certeza, omita.`,
      user: `Tema: ${tema} | Tribunal preferido: ${tribunal ?? "qualquer"}`,
      temperature: 0,
    });

    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return [];
  }
}
