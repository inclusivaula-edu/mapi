import { chat } from "../../services/aiService.js";

/**
 * validateETP — valida Estudo Técnico Preliminar contra IN SEGES 67/2021
 * Retorna score, campos obrigatórios presentes/ausentes e recomendações
 */
export async function validateETP(etp) {
  if (!etp || typeof etp !== "object") return { score: 0, issues: ["ETP não fornecido"], valid: false };

  const CAMPOS_OBRIGATORIOS = [
    { key: "descricao_necessidade", label: "Descrição da necessidade" },
    { key: "estimativa_quantidade", label: "Estimativa de quantidade" },
    { key: "levantamento_mercado",  label: "Levantamento de mercado" },
    { key: "estimativa_valor",      label: "Estimativa do valor" },
    { key: "descricao_solucao",     label: "Descrição da solução" },
    { key: "justificativa",         label: "Justificativa para contratação" },
    { key: "declaracao_viabilidade",label: "Declaração de viabilidade" },
  ];

  const ausentes = CAMPOS_OBRIGATORIOS
    .filter(c => !etp[c.key] && !(etp.secoes ?? []).some(s => s.titulo?.toLowerCase().includes(c.label.toLowerCase())))
    .map(c => c.label);

  try {
    const raw = await chat({
      system: `Você é auditor de conformidade de licitações públicas federais.
Analise o ETP segundo a IN SEGES/ME nº 67/2021 e a Lei 14.133/2021.
Responda APENAS JSON: { "score": 0-10, "issues": ["..."], "recomendacoes": ["..."], "conforme_in67": true/false }`,
      user: `ETP para análise:\n${JSON.stringify(etp, null, 2)}\n\nCampos ausentes detectados: ${ausentes.join(", ") || "nenhum"}`,
      model: "gpt-4o-mini",
      temperature: 0,
    });
    const result = JSON.parse(raw.replace(/```json|```/g, "").trim());
    result.campos_ausentes = ausentes;
    return result;
  } catch {
    const score = Math.max(0, 10 - ausentes.length * 1.5);
    return {
      score: Math.round(score),
      issues: ausentes.map(a => `Campo obrigatório ausente: ${a}`),
      recomendacoes: ["Inclua todos os campos previstos no Art. 7º da IN SEGES 67/2021"],
      conforme_in67: ausentes.length === 0,
      campos_ausentes: ausentes,
    };
  }
}
