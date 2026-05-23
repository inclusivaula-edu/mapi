import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateResponse(prompt, role = "assistant") {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é um ${role} inteligente dentro do sistema MAPI.`,
        },
        {
          role: "user",
          content: String(prompt), // 🔥 GARANTE STRING
        },
      ],
    });

    return completion.choices[0].message.content;

  } catch (error) {
    console.error("❌ Erro OpenAI:", error);
    return "Erro ao gerar resposta com IA.";
  }
}