import { supabase } from "../../services/dbService.js";
import { chat } from "../../services/aiService.js";
import { logger } from "../../observability/logger.js";

export async function searchLegislacaoLicitacao(tema, area, orgId) {
  try {
    let query = supabase
      .from("bid_references")
      .select("lei, artigo, ementa, tipo")
      .ilike("ementa", `%${tema}%`)
      .limit(8);

    if (orgId) {
      query = supabase
        .from("bid_references")
        .select("lei, artigo, ementa, tipo")
        .or(`organization_id.eq.${orgId},organization_id.is.null`)
        .ilike("ementa", `%${tema}%`)
        .limit(8);
    }

    const { data, error } = await query;
    if (!error && data?.length > 0) return data;
  } catch (err) {
    logger.error("searchLegislacaoLicitacao.db.error", { error: err.message });
  }

  try {
    const raw = await chat({
      system: `Você é especialista em licitações públicas brasileiras (Lei 14.133/2021 e Lei 8.666/1993).
Retorne APENAS JSON puro — array de objetos com lei, artigo e ementa:
[{ "lei": "Lei 14.133/2021", "artigo": "Art. XX", "ementa": "..." }]
Cite apenas legislação real e vigente.`,
      user: `Tema: ${tema}\nÁrea: ${area ?? "licitações"}`,
      temperature: 0,
    });
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return [];
  }
}
