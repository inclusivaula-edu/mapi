import { supabase } from "../../services/dbService.js";
import { logger } from "../../observability/logger.js";

/**
 * getBidHistory — busca histórico de licitações da organização
 */
export async function getBidHistory(orgId, { limit = 20, resultado } = {}) {
  let query = supabase
    .from("bid_history")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (resultado) query = query.eq("resultado", resultado);

  const { data, error } = await query;
  if (error) {
    logger.warn("bid_history.query.error", { error: error.message });
    return [];
  }
  return data ?? [];
}

/**
 * saveBidHistory — registra participação em licitação
 */
export async function saveBidHistory(orgId, userId, entry) {
  const { data, error } = await supabase
    .from("bid_history")
    .insert({
      organization_id: orgId,
      created_by: userId,
      numero_edital: entry.numeroEdital,
      orgao_licitante: entry.orgaoLicitante,
      modalidade: entry.modalidade,
      objeto: entry.objeto,
      valor_proposta: entry.valorProposta,
      valor_contrato: entry.valorContrato,
      resultado: entry.resultado ?? "em_andamento",
      posicao_final: entry.posicaoFinal,
      motivo_perda: entry.motivoPerda,
      data_abertura: entry.dataAbertura,
      data_resultado: entry.dataResultado,
      bid_project_id: entry.bidProjectId,
      itens: entry.itens ?? [],
      preco_referencia: entry.precoReferencia,
      desconto_aplicado: entry.descontoAplicado,
      notas: entry.notas,
    })
    .select()
    .single();
  if (error) throw new Error(`bid_history.save.error: ${error.message}`);
  return data;
}

/**
 * getBidStats — métricas resumidas do histórico
 */
export async function getBidStats(orgId) {
  const history = await getBidHistory(orgId, { limit: 100 });

  const total = history.length;
  const vencidas = history.filter(h => h.resultado === "vencida").length;
  const perdidas = history.filter(h => h.resultado === "perdida").length;
  const andamento = history.filter(h => h.resultado === "em_andamento").length;
  const valorTotal = history
    .filter(h => h.resultado === "vencida" && h.valor_contrato)
    .reduce((sum, h) => sum + Number(h.valor_contrato), 0);

  return {
    total,
    vencidas,
    perdidas,
    em_andamento: andamento,
    taxa_sucesso: total > 0 ? Math.round((vencidas / (vencidas + perdidas || 1)) * 100) : 0,
    valor_total_vencido: valorTotal,
    orgaos_frequentes: [...new Set(history.map(h => h.orgao_licitante).filter(Boolean))].slice(0, 5),
  };
}

/**
 * injectHistoryContext — contexto para o agente sobre participações anteriores
 */
export function injectHistoryContext(stats, recentHistory) {
  if (!stats || stats.total === 0) return "";
  const recentes = (recentHistory ?? []).slice(0, 5).map(h =>
    `- ${h.objeto} | ${h.orgao_licitante ?? "—"} | ${h.resultado} | R$ ${h.valor_proposta ?? "—"}`
  ).join("\n");

  return `
HISTÓRICO DE LICITAÇÕES DA EMPRESA:
- Total de participações: ${stats.total}
- Vencidas: ${stats.vencidas} | Perdidas: ${stats.perdidas} | Em andamento: ${stats.em_andamento}
- Taxa de sucesso: ${stats.taxa_sucesso}%
- Valor total vencido: R$ ${stats.valor_total_vencido.toLocaleString("pt-BR")}
- Órgãos frequentes: ${stats.orgaos_frequentes.join(", ") || "—"}
${recentes ? `\nÚltimas participações:\n${recentes}` : ""}

Use estas informações para personalizar propostas e referências de experiência anterior.`.trim();
}
