let openai = null;

// só ativa se tiver API KEY
if (process.env.OPENAI_API_KEY) {
  const OpenAI = (await import("openai")).default;

  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

export async function routeTask(input) {
  try {
    if (!input || typeof input !== "string") {
      return "assistant";
    }

    // fallback sem OpenAI
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
    console.log("⚠️ fallback ativado:", error.message);

    if (input.toLowerCase().includes("aula")) return "teacher";
    return "assistant";
  }
}