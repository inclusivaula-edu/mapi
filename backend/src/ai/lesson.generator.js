import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateLesson({ topic, level, student_profile }) {
  const prompt = `
Você é um especialista em educação inclusiva.

Crie uma aula adaptada com:
- Linguagem simples
- Explicação clara
- Exemplo prático
- 2 atividades

Tema: ${topic}
Nível: ${level}
Perfil do aluno: ${student_profile}

Responda em JSON:
{
  "title": "",
  "explanation": "",
  "example": "",
  "activities": []
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Você cria aulas inclusivas adaptadas" },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
  });

  const text = response.choices[0].message.content;

  try {
    return JSON.parse(text);
  } catch {
    return {
      title: topic,
      explanation: text,
      example: "",
      activities: [],
    };
  }
}