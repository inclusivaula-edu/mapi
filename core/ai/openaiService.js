import { getCache, setCache } from "../cache/cacheService.js";

export async function generateAIResponse(messages) {

  const key = JSON.stringify(messages);

  const cached = getCache(key);
  if (cached) {
    console.log("⚡ CACHE HIT");
    return cached;
  }

  console.log("🧠 CACHE MISS");

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages
  });

  const text = res.choices[0].message.content;

  setCache(key, text);

  return text;
}