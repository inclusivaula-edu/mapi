let openai = null;

if (process.env.OPENAI_API_KEY) {
  const OpenAI = (await import("openai")).default;

  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

export const assistantAgent = {
  async execute(input) {
    try {
      if (!openai) {
        return `🤖 (mock) Resposta para: ${input}`;
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Você é um assistente útil." },
          { role: "user", content: input }
        ]
      });

      return completion.choices?.[0]?.message?.content;

    } catch (error) {
      console.log("⚠️ Fallback assistant:", error.message);
      return `🤖 (mock) Resposta para: ${input}`;
    }
  }
};