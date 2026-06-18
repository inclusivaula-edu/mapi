import { chat } from "../services/aiService.js";

/**
 * SKILL_MAP — todas as skills disponíveis no MAPI.
 * Fonte única. Adicionar skill = adicionar chave aqui + criar workflow.
 */
const SKILL_MAP = {
  // ── education ─────────────────────────────────────────────
  "gerar-aula":       { moduleName: "education", workflowName: "gerar-aula" },
  "gerar-pei":        { moduleName: "education", workflowName: "gerar-pei" },
  "gerar-relatorio":  { moduleName: "education", workflowName: "gerar-relatorio" },
  "gerar-pdf":        { moduleName: "education", workflowName: "gerar-pdf" },
  "assistente":       { moduleName: "education", workflowName: "assistente" },

  // ── juridico ──────────────────────────────────────────────
  "analisar-contrato":   { moduleName: "juridico", workflowName: "analisar-contrato" },
  "gerar-contrato":      { moduleName: "juridico", workflowName: "gerar-contrato" },
  "gerar-parecer":       { moduleName: "juridico", workflowName: "gerar-parecer" },
  "gerar-peticao":       { moduleName: "juridico", workflowName: "gerar-peticao" },
  "resumir-legislacao":  { moduleName: "juridico", workflowName: "resumir-legislacao" },
  "assistente-juridico": { moduleName: "juridico", workflowName: "assistente-juridico" },
  "gerar-pdf-juridico":  { moduleName: "juridico", workflowName: "gerar-pdf-juridico" },
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
  if (t.includes("pei"))                                   return SKILL_MAP["gerar-pei"];
  if (t.includes("aula"))                                  return SKILL_MAP["gerar-aula"];
  if (t.includes("relatório") || t.includes("relatorio"))  return SKILL_MAP["gerar-relatorio"];
  // juridico
  if (t.includes("analis") && t.includes("contrato"))      return SKILL_MAP["analisar-contrato"];
  if (t.includes("contrato"))                              return SKILL_MAP["gerar-contrato"];
  if (t.includes("parecer"))                               return SKILL_MAP["gerar-parecer"];
  if (t.includes("petição") || t.includes("peticao"))      return SKILL_MAP["gerar-peticao"];
  if (t.includes("legislação") || t.includes("legislacao")) return SKILL_MAP["resumir-legislacao"];
  if (t.includes("jurídic") || t.includes("juridic"))      return SKILL_MAP["assistente-juridico"];
  return FALLBACK;
}
