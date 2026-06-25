import { chat } from "../../services/aiService.js";

export async function validateProposta(proposta, requisitosEdital) {
  try {
    const raw = await chat({
      system: `Você é um analista de licitações especializado em validação de propostas técnicas.
Analise se a proposta atende todos os requisitos do edital.
Retorne APENAS JSON puro:
{
  "score": 0-10,
  "atende_requisitos": true/false,
  "requisitos_atendidos": ["req1", "req2"],
  "requisitos_faltantes": ["req3"],
  "issues": ["problema1", "problema2"],
  "sugestoes": ["sugestão1"]
}`,
      user: `PROPOSTA:\n${JSON.stringify(proposta)}\n\nREQUISITOS DO EDITAL:\n${JSON.stringify(requisitosEdital)}`,
      temperature: 0,
    });
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return { score: 0, atende_requisitos: false, issues: ["Erro na validação"], sugestoes: [] };
  }
}
