import OpenAI from "openai";
import { buildMECHeader } from "./mec.layout.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export function buildReportStructure(type) {
  const base = {
    metadata: {
      createdAt: new Date(),
      type,
    },
  };

  const structures = {
    ANAMNESE: {
      ...base,
      sections: [
        { name: "Identificação", content: "" },
        { name: "Histórico Gestacional", content: "" },
        { name: "Nascimento", content: "" },
        { name: "Saúde", content: "" },
        { name: "Desenvolvimento", content: "" },
        { name: "Comportamento", content: "" },
        { name: "Aprendizagem", content: "" },
        { name: "Autonomia", content: "" },
        { name: "Observações", content: "" },
      ],
    },

    PEI: {
      ...base,
      sections: [
        { name: "Diagnóstico", content: "" },
        { name: "Objetivos", content: "" },
        { name: "Estratégias Pedagógicas", content: "" },
        { name: "Adaptações Curriculares", content: "" },
        { name: "Avaliação e Monitoramento", content: "" },
      ],
    },

    PAEE: {
      ...base,
      sections: [
        { name: "Perfil do Estudante", content: "" },
        { name: "Plano de Atendimento Educacional", content: "" },
        { name: "Recursos e Apoios", content: "" },
        { name: "Evolução do Atendimento", content: "" },
      ],
    },
  };

  return structures[type] || base;
}

// 🔥 LIMPA RESPOSTA DO GPT
function cleanJSON(text) {
  if (!text) return "";

  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

// 🔥 GERADOR MEC REAL
export async function generateReport({
  type,
  student,
  lessons = [],
  bncc,
  memory,
}) {
  try {
    const baseStructure = buildReportStructure(type);
    const header = buildMECHeader(student);

    const lessonTopics = Array.isArray(lessons)
      ? lessons.map((l) => l.topic).join(", ")
      : "";

    const prompt = `
Você é um especialista em educação inclusiva (AEE) seguindo normas do MEC.

Gere um RELATÓRIO OFICIAL COMPLETO.

TIPO: ${type}

DADOS DO ALUNO:
Nome: ${student.name}
Idade: ${student.age}
Série: ${student.grade}
Diagnóstico: ${student.diagnosis || "Não informado"}

BNCC:
${bncc || "Não informado"}

HISTÓRICO DE AULAS:
${lessonTopics}

MEMÓRIA:
${memory}

SEÇÕES:
${JSON.stringify(baseStructure.sections)}

REGRAS:
- linguagem técnica pedagógica formal
- coerente com BNCC
- adequado à série
- detalhado e profissional
- padrão MEC

RETORNAR JSON PURO:
{
  "sections": [
    { "name": "", "content": "" }
  ]
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    });

    let text = response?.choices?.[0]?.message?.content || "";

    // 🔥 LIMPA JSON
    text = cleanJSON(text);

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.error("❌ JSON PARSE ERROR:", err);

      parsed = {
        sections: baseStructure.sections.map((s) => ({
          ...s,
          content: text,
        })),
      };
    }

    return {
      header,
      metadata: baseStructure.metadata,
      sections: parsed.sections || [],
    };
  } catch (err) {
    console.error("REPORT ERROR:", err);
    return null;
  }
}