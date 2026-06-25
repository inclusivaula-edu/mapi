import { chat } from "../../services/aiService.js";

export async function validateCompliance(documento, tipo) {
  try {
    const raw = await chat({
      system: `Você é um auditor de conformidade LGPD.
Valide se o documento ${tipo} atende os requisitos da Lei 13.709/2018.
Retorne APENAS JSON puro:
{
  "score": 0-10,
  "compliant": true/false,
  "artigos_atendidos": ["Art. 7º", "Art. 46"],
  "artigos_faltantes": ["Art. 37"],
  "issues": ["problema1"],
  "sugestoes": ["sugestão1"]
}`,
      user: `DOCUMENTO (${tipo}):\n${JSON.stringify(documento)}`,
      temperature: 0,
    });
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return { score: 0, compliant: false, issues: ["Erro na validação"], sugestoes: [] };
  }
}
