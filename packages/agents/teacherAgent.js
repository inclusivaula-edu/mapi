let openai = null;

// só cria se tiver API KEY
if (process.env.OPENAI_API_KEY) {
  const OpenAI = (await import("openai")).default;

  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

export const teacherAgent = {
  async execute(input) {
    try {
      // se não tiver openai → fallback direto
      if (!openai) {
        return `📚 (mock) Aula sobre: ${input}`;
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Você é um professor." },
          { role: "user", content: input }
        ]
      });

      return completion.choices?.[0]?.message?.content;

    } catch (error) {
      console.log("⚠️ Fallback teacher:", error.message);
      return `📚 (mock) Aula sobre: ${input}`;
    }
  }
};