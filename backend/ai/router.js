import { chat } from "../services/aiService.js";

/**
 * SKILL_MAP — todas as skills disponíveis no MAPI.
 * Fonte única. Adicionar skill = adicionar chave aqui + criar workflow.
 */
const SKILL_MAP = {
  // ── education (7) ────────────────────────────────────────────
  "gerar-aula":               { moduleName: "education", workflowName: "gerar-aula" },
  "gerar-pei":                { moduleName: "education", workflowName: "gerar-pei" },
  "gerar-relatorio":          { moduleName: "education", workflowName: "gerar-relatorio" },
  "gerar-pdf":                { moduleName: "education", workflowName: "gerar-pdf" },
  "assistente":               { moduleName: "education", workflowName: "assistente" },
  "historico-aluno":          { moduleName: "education", workflowName: "historico-aluno" },
  "relatorio-conformidade":   { moduleName: "education", workflowName: "relatorio-conformidade" },

  // ── juridico (7) ─────────────────────────────────────────────
  "analisar-contrato":        { moduleName: "juridico", workflowName: "analisar-contrato" },
  "gerar-contrato":           { moduleName: "juridico", workflowName: "gerar-contrato" },
  "gerar-parecer":            { moduleName: "juridico", workflowName: "gerar-parecer" },
  "gerar-peticao":            { moduleName: "juridico", workflowName: "gerar-peticao" },
  "resumir-legislacao":       { moduleName: "juridico", workflowName: "resumir-legislacao" },
  "assistente-juridico":      { moduleName: "juridico", workflowName: "assistente-juridico" },
  "gerar-pdf-juridico":       { moduleName: "juridico", workflowName: "gerar-pdf-juridico" },

  // ── licitacoes (12) ──────────────────────────────────────────
  "parse-edital":             { moduleName: "licitacoes", workflowName: "parse-edital" },
  "gerar-proposta":           { moduleName: "licitacoes", workflowName: "gerar-proposta" },
  "gerar-memorial":           { moduleName: "licitacoes", workflowName: "gerar-memorial" },
  "gerar-planilha":           { moduleName: "licitacoes", workflowName: "gerar-planilha" },
  "gerar-declaracao":         { moduleName: "licitacoes", workflowName: "gerar-declaracao" },
  "assistente-licitacao":     { moduleName: "licitacoes", workflowName: "assistente-licitacao" },
  "gerar-pdf-licitacao":      { moduleName: "licitacoes", workflowName: "gerar-pdf-licitacao" },
  "gerar-etp":                { moduleName: "licitacoes", workflowName: "gerar-etp" },
  "gerar-tr":                 { moduleName: "licitacoes", workflowName: "gerar-tr" },
  "checklist-sicaf":          { moduleName: "licitacoes", workflowName: "checklist-sicaf" },
  "gerar-arp":                { moduleName: "licitacoes", workflowName: "gerar-arp" },
  "gerar-minuta-contrato":    { moduleName: "licitacoes", workflowName: "gerar-minuta-contrato" },
  "buscar-editais":           { moduleName: "licitacoes", workflowName: "buscar-editais" },
  "pesquisar-precos":         { moduleName: "licitacoes", workflowName: "pesquisar-precos" },

  // ── lgpd (8) ─────────────────────────────────────────────────
  "diagnostico-lgpd":           { moduleName: "lgpd", workflowName: "diagnostico-lgpd" },
  "gerar-politica-privacidade": { moduleName: "lgpd", workflowName: "gerar-politica-privacidade" },
  "gerar-ropa":                 { moduleName: "lgpd", workflowName: "gerar-ropa" },
  "gerar-dpa":                  { moduleName: "lgpd", workflowName: "gerar-dpa" },
  "gerar-plano-adequacao":      { moduleName: "lgpd", workflowName: "gerar-plano-adequacao" },
  "gerar-ripd":                 { moduleName: "lgpd", workflowName: "gerar-ripd" },
  "assistente-lgpd":            { moduleName: "lgpd", workflowName: "assistente-lgpd" },
  "gerar-pdf-lgpd":             { moduleName: "lgpd", workflowName: "gerar-pdf-lgpd" },
};

const FALLBACK = SKILL_MAP["assistente"];

export async function routeTask(input) {
  if (!input || typeof input !== "string") return FALLBACK;

  try {
    const keys = Object.keys(SKILL_MAP).join("\n- ");

    const raw = await chat({
      system: `Você classifica intenções de usuário no sistema MAPI.
Responda APENAS com uma das chaves abaixo — sem explicação, sem pontuação:
- ${keys}`,
      user: input,
      model: "gpt-4o-mini",
      temperature: 0,
    });

    const key = raw.trim().toLowerCase();
    return SKILL_MAP[key] ?? FALLBACK;

  } catch {
    return keywordRoute(input);
  }
}

function keywordRoute(input) {
  const t = input.toLowerCase();

  // education
  if (t.includes("pei"))                                                         return SKILL_MAP["gerar-pei"];
  if (t.includes("aula"))                                                        return SKILL_MAP["gerar-aula"];
  if (t.includes("relatório") || t.includes("relatorio"))                        return SKILL_MAP["gerar-relatorio"];
  if (t.includes("histórico") || t.includes("historico") || t.includes("evolução") || t.includes("timeline")) return SKILL_MAP["historico-aluno"];
  if (t.includes("conformidade") || t.includes("lbi") || t.includes("13.146"))   return SKILL_MAP["relatorio-conformidade"];

  // juridico
  if (t.includes("analis") && t.includes("contrato"))                            return SKILL_MAP["analisar-contrato"];
  if (t.includes("contrato") && !t.includes("licitaç"))                          return SKILL_MAP["gerar-contrato"];
  if (t.includes("parecer"))                                                     return SKILL_MAP["gerar-parecer"];
  if (t.includes("petição") || t.includes("peticao"))                            return SKILL_MAP["gerar-peticao"];
  if (t.includes("legislação") || t.includes("legislacao"))                      return SKILL_MAP["resumir-legislacao"];
  if (t.includes("jurídic") || t.includes("juridic"))                            return SKILL_MAP["assistente-juridico"];

  // licitacoes
  if (t.includes("estudo técnico") || t.includes("estudo tecnico") || t.includes(" etp"))           return SKILL_MAP["gerar-etp"];
  if (t.includes("termo de referência") || t.includes("termo de referencia") || (t.includes(" tr ") && t.includes("licitaç"))) return SKILL_MAP["gerar-tr"];
  if (t.includes("sicaf") || t.includes("habilitaç") || t.includes("checklist"))                    return SKILL_MAP["checklist-sicaf"];
  if (t.includes("ata de registro") || t.includes(" arp") || t.includes("registro de preço"))       return SKILL_MAP["gerar-arp"];
  if (t.includes("minuta de contrato") || t.includes("contrato administrativo"))                     return SKILL_MAP["gerar-minuta-contrato"];
  if (t.includes("buscar edital") || t.includes("buscar editais") || t.includes("oportunidade")) return SKILL_MAP["buscar-editais"];
  if (t.includes("preço referência") || t.includes("preco referencia") || t.includes("pesquisa de preço") || t.includes("painel de preço")) return SKILL_MAP["pesquisar-precos"];
  if (t.includes("edital"))                                                      return SKILL_MAP["parse-edital"];
  if (t.includes("proposta técnica") || t.includes("proposta tecnica"))          return SKILL_MAP["gerar-proposta"];
  if (t.includes("memorial"))                                                    return SKILL_MAP["gerar-memorial"];
  if (t.includes("planilha") && t.includes("preço"))                             return SKILL_MAP["gerar-planilha"];
  if (t.includes("declaraç") || t.includes("declarac"))                          return SKILL_MAP["gerar-declaracao"];
  if (t.includes("licitaç") || t.includes("licitac") || t.includes("pregão") || t.includes("pregao") || t.includes("14.133") || t.includes("pncp") || t.includes("comprasnet")) return SKILL_MAP["assistente-licitacao"];

  // lgpd
  if (t.includes("diagnóstico lgpd") || t.includes("diagnostico lgpd") || t.includes("maturidade lgpd")) return SKILL_MAP["diagnostico-lgpd"];
  if (t.includes("política de privacidade") || t.includes("politica de privacidade"))                     return SKILL_MAP["gerar-politica-privacidade"];
  if (t.includes("ropa") || t.includes("registro de atividades"))                return SKILL_MAP["gerar-ropa"];
  if (t.includes("dpa") || t.includes("acordo de processamento"))                return SKILL_MAP["gerar-dpa"];
  if (t.includes("plano de adequação") || t.includes("plano de adequacao"))      return SKILL_MAP["gerar-plano-adequacao"];
  if (t.includes("ripd") || t.includes("relatório de impacto") || t.includes("relatorio de impacto")) return SKILL_MAP["gerar-ripd"];
  if (t.includes("lgpd") || t.includes("proteção de dados") || t.includes("13.709") || t.includes("anpd")) return SKILL_MAP["assistente-lgpd"];

  return FALLBACK;
}
