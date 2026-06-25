import { chat } from "../../services/aiService.js";

const DIMENSIONS = [
  { key: "governanca", label: "Governança e Responsabilização", weight: 2 },
  { key: "bases_legais", label: "Bases Legais e Consentimento", weight: 2 },
  { key: "direitos_titular", label: "Direitos do Titular", weight: 1.5 },
  { key: "seguranca", label: "Medidas de Segurança", weight: 2 },
  { key: "transferencia", label: "Transferência Internacional", weight: 1 },
  { key: "incidentes", label: "Gestão de Incidentes", weight: 1.5 },
  { key: "documentacao", label: "Documentação (ROPA, Políticas)", weight: 1.5 },
  { key: "treinamento", label: "Treinamento e Cultura", weight: 1 },
];

export async function diagnoseMaturity(answers) {
  try {
    const raw = await chat({
      system: `Você é um DPO (Data Protection Officer) especialista em LGPD.
Analise as respostas do diagnóstico de maturidade LGPD e avalie cada dimensão de 0 a 10.
Retorne APENAS JSON puro:
{
  "scores": {
    "governanca": 0-10,
    "bases_legais": 0-10,
    "direitos_titular": 0-10,
    "seguranca": 0-10,
    "transferencia": 0-10,
    "incidentes": 0-10,
    "documentacao": 0-10,
    "treinamento": 0-10
  },
  "overall_score": 0-10,
  "maturity_level": "Inicial | Básico | Intermediário | Avançado | Excelente",
  "critical_gaps": ["gap1", "gap2"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "risk_level": "Crítico | Alto | Médio | Baixo"
}`,
      user: `RESPOSTAS DO DIAGNÓSTICO:\n${JSON.stringify(answers, null, 2)}`,
      temperature: 0,
    });
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return {
      scores: {},
      overall_score: 0,
      maturity_level: "Não avaliado",
      critical_gaps: ["Erro ao processar diagnóstico"],
      recommendations: ["Reenvie as respostas do diagnóstico"],
      risk_level: "Não avaliado",
    };
  }
}

export { DIMENSIONS };
