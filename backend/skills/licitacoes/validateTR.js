import { chat } from "../../services/aiService.js";

/**
 * validateTR — valida Termo de Referência contra IN SEGES 65/2021
 */
export async function validateTR(tr) {
  if (!tr || typeof tr !== "object") return { score: 0, issues: ["TR não fornecido"], valid: false };

  const CAMPOS_OBRIGATORIOS = [
    { key: "objeto",              label: "Objeto da contratação" },
    { key: "fundamentacao",       label: "Fundamentação e descrição da necessidade" },
    { key: "requisitos",          label: "Descrição dos requisitos da contratação" },
    { key: "modelo_execucao",     label: "Modelo de execução do objeto" },
    { key: "modelo_gestao",       label: "Modelo de gestão do contrato" },
    { key: "criterios_medicao",   label: "Critérios de medição e pagamento" },
    { key: "forma_selecao",       label: "Forma e critérios de seleção do fornecedor" },
    { key: "estimativa_valor",    label: "Estimativa do valor da contratação" },
    { key: "adequacao_orcamentaria", label: "Adequação orçamentária" },
  ];

  const secoes = tr.secoes ?? [];
  const ausentes = CAMPOS_OBRIGATORIOS.filter(c =>
    !tr[c.key] && !secoes.some(s => s.titulo?.toLowerCase().includes(c.label.split(" ")[0].toLowerCase()))
  ).map(c => c.label);

  try {
    const raw = await chat({
      system: `Você é auditor de conformidade de licitações públicas federais.
Analise o Termo de Referência segundo a IN SEGES/ME nº 65/2021 e a Lei 14.133/2021.
Responda APENAS JSON: { "score": 0-10, "issues": ["..."], "recomendacoes": ["..."], "conforme_in65": true/false }`,
      user: `TR para análise:\n${JSON.stringify(tr, null, 2)}\n\nCampos ausentes: ${ausentes.join(", ") || "nenhum"}`,
      model: "gpt-4o-mini",
      temperature: 0,
    });
    const result = JSON.parse(raw.replace(/```json|```/g, "").trim());
    result.campos_ausentes = ausentes;
    return result;
  } catch {
    const score = Math.max(0, 10 - ausentes.length * 1.1);
    return {
      score: Math.round(score),
      issues: ausentes.map(a => `Seção obrigatória ausente: ${a}`),
      recomendacoes: ["Inclua todas as seções previstas no Art. 6º da IN SEGES 65/2021"],
      conforme_in65: ausentes.length === 0,
      campos_ausentes: ausentes,
    };
  }
}
