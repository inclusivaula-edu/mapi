import { supabase } from "../../services/dbService.js";
import { chat } from "../../services/aiService.js";

/**
 * SKILL: searchLegislacao
 *
 * Busca legislação brasileira relevante para um tema jurídico.
 * Tenta base local curada primeiro (leis, decretos, normas cadastradas
 * pela organização), depois fallback via IA com legislação conhecida.
 *
 * @param {string} tema     - Tema jurídico (ex: "rescisão contratual CLT")
 * @param {string} area     - Área do direito (ex: "trabalhista", "civil", "tributário")
 * @param {string} orgId    - ID da organização para filtrar base local
 * @returns {Promise<Array<{lei: string, artigo: string, ementa: string}>>}
 */
export async function searchLegislacao(tema, area, orgId) {
  // 1. Tenta base local da organização (normas cadastradas pelo admin)
  if (orgId) {
    const { data } = await supabase
      .from("legal_references")
      .select("lei, artigo, ementa, tipo")
      .eq("organization_id", orgId)
      .ilike("ementa", `%${tema}%`)
      .limit(5);

    if (data?.length > 0) return data;
  }

  // 2. Fallback via IA — legislação brasileira conhecida até o corte de treinamento
  try {
    const raw = await chat({
      system: `Você é especialista em direito brasileiro.
Liste as principais leis e artigos aplicáveis ao tema informado.
Retorne APENAS JSON puro — array com até 5 objetos:
[{
  "lei": "Lei nº 10.406/2002 — Código Civil",
  "artigo": "Art. 421",
  "ementa": "Liberdade de contratar — função social do contrato",
  "tipo": "federal"
}]
IMPORTANTE: cite apenas legislação real e vigente no Brasil.`,
      user: `Tema: ${tema} | Área: ${area ?? "geral"}`,
      temperature: 0,
    });

    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return [];
  }
}
