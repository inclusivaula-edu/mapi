let openai = null;

// só cria OpenAI se tiver API KEY
if (process.env.OPENAI_API_KEY) {
  const OpenAI = (await import("openai")).default;

  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

export async function routeTask(input) {
  try {
    // proteção contra input inválido
    if (!input || typeof input !== "string") {
      return "assistant";
    }

    // se não tiver OpenAI → fallback direto
    if (!openai) {
      if (input.toLowerCase().includes("aula")) return "teacher";
      return "assistant";
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Escolha apenas: teacher ou assistant"
        },
        {
          role: "user",
          content: input
        }
      ]
    });

    const content = completion.choices?.[0]?.message?.content;

    return content?.trim().toLowerCase() || "assistant";

  } catch (error) {
    console.log("⚠️ OpenAI falhou, usando fallback:", error.message);

    // fallback seguro
    if (input && input.toLowerCase().includes("aula")) return "teacher";
    return "assistant";
  }
}