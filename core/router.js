let openai = null;

if (process.env.OPENAI_API_KEY) {
  const OpenAI = (await import("openai")).default;

  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// ===============================
// 🧠 ROUTER IA LIMPO
// ===============================
export async function routeTask(input) {
  try {
    if (!input || typeof input !== "string") {
      return "assistant";
    }

    const text = input.toLowerCase();

    // fallback sem OpenAI
    if (!openai) {
      return text.includes("aula") ? "teacher" : "assistant";
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Classifique apenas: teacher ou assistant",
        },
        {
          role: "user",
          content: input,
        },
      ],
    });

    const result = completion.choices?.[0]?.message?.content;

    return result?.trim().toLowerCase() || "assistant";
  } catch (error) {
    console.log("⚠️ fallback:", error.message);

    return input?.toLowerCase().includes("aula")
      ? "teacher"
      : "assistant";
  }
}