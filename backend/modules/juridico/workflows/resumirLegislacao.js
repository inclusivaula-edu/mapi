import { chat } from "../../../services/aiService.js";
import { searchLegislacao }    from "../../../skills/juridico/searchLegislacao.js";
import { searchJurisprudencia } from "../../../skills/juridico/searchJurisprudencia.js";

/**
 * WORKFLOW: resumir-legislacao
 *
 * Gera um resumo executivo de legislação sobre um tema específico.
 * Ideal para onboarding de clientes, treinamentos e consultas rápidas.
 *
 * Context: { tema, area, nivelDetalhe, userId, organizationId }
 *   nivelDetalhe: "executivo" | "tecnico" | "completo"
 */
export default async function resumirLegislacao({ input, context }) {
  const { tema, area, nivelDetalhe = "executivo", userId, organizationId } = context;

  if (!tema?.trim() && !input?.trim()) {
    throw new Error("MISSING_INPUT: tema é obrigatório");
  }

  const temaFinal = tema ?? input;

  // Busca legislação e jurisprudência em paralelo
  const [legislacao, jurisprudencia] = await Promise.all([
    searchLegislacao(temaFinal, area, organizationId),
    searchJurisprudencia(temaFinal, null, organizationId),
  ]);

  const nivelInstrucao = {
    executivo: "Linguagem simples, sem jargão jurídico, para leigos. Máximo 500 palavras.",
    tecnico:   "Linguagem técnica para profissionais da área jurídica. Máximo 800 palavras.",
    completo:  "Análise aprofundada com todos os detalhes. Sem limite de tamanho.",
  }[nivelDetalhe] ?? "Linguagem simples para leigos.";

  const raw = await chat({
    system: `Você é um especialista em direito brasileiro que explica legislação com clareza.
${nivelInstrucao}
Retorne APENAS JSON puro:
{
  "tema": "string",
  "area": "string",
  "resumo_executivo": "parágrafo resumindo o tema em 3 linhas",
  "pontos_chave": ["ponto 1", "ponto 2", "ponto 3"],
  "legislacao_principal": [{ "lei": "...", "artigo": "...", "o_que_diz": "..." }],
  "jurisprudencia_relevante": [{ "tribunal": "...", "numero": "...", "entendimento": "..." }],
  "o_que_voce_pode_fazer": ["ação prática 1", "ação prática 2"],
  "o_que_voce_nao_pode_fazer": ["proibição 1", "proibição 2"],
  "quando_procurar_advogado": "situações que exigem assistência profissional",
  "disclaimer": "Este resumo é informativo e não substitui consultoria jurídica profissional."
}`,
    user: `TEMA: ${temaFinal}
ÁREA: ${area ?? "geral"}
NÍVEL: ${nivelDetalhe}
LEGISLAÇÃO ENCONTRADA: ${JSON.stringify(legislacao)}
JURISPRUDÊNCIA ENCONTRADA: ${JSON.stringify(jurisprudencia)}
Gere o resumo.`,
    temperature: 0.3,
  });

  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}
