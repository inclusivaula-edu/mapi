import OpenAI from "openai";

let openai = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const SKILL_MAP = {
  "gerar-aula":     { moduleName: "education", workflowName: "gerar-aula" },
  "gerar-relatorio":{ moduleName: "education", workflowName: "gerar-relatorio" },
  "gerar-pdf":      { moduleName: "education", workflowName: "gerar-pdf" },
  "assistente":     { moduleName: "education", workflowName: "assistente" },
};

const FALLBACK = SKILL_MAP["assistente"];

export async function routeTask(input) {
  try {
    if (!input || typeof input !== "string") return FALLBACK;

    if (!openai) return keywordRoute(input);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Classifique a intenção do usuário em UMA das opções abaixo e responda APENAS com a chave exata:
- gerar-aula
- gerar-relatorio
- gerar-pdf
- assistente`,
        },
        { role: "user", content: input },
      ],
      temperature: 0,
    });

    const raw = completion.choices?.[0]?.message?.content?.trim().toLowerCase();
    return SKILL_MAP[raw] || FALLBACK;

  } catch (err) {
    console.warn("router fallback:", err.message);
    return keywordRoute(input);
  }
}

function keywordRoute(input) {
  const t = input.toLowerCase();
  if (t.includes("aula"))      return SKILL_MAP["gerar-aula"];
  if (t.includes("relatório") || t.includes("relatorio")) return SKILL_MAP["gerar-relatorio"];
  if (t.includes("pdf"))       return SKILL_MAP["gerar-pdf"];
  return FALLBACK;
}
