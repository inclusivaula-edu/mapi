import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function validateEducationalContent(content) {
  const prompt = `
Você é um auditor do MEC.

Avalie o conteúdo abaixo e diga se é correto para ensino escolar.

Responda APENAS JSON:

{
  "approved": true,
  "reason": ""
}

CONTEÚDO:
${content}
`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Você é um avaliador educacional" },
      { role: "user", content: prompt },
    ],
  });

  return JSON.parse(res.choices[0].message.content);
}