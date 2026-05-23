import OpenAI from "openai";
import { supabase } from "../services/dbService.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// =============================
// 🔥 GERAR / ATUALIZAR PERFIL
// =============================
export async function updateStudentProfile(userId, memories) {
  const memoryText = memories
    .map((m) => JSON.stringify(m.memory))
    .join("\n");

  const prompt = `
Analise o histórico do aluno e gere um PERFIL EDUCACIONAL.

Retorne um resumo com:
- dificuldades
- preferências de aprendizagem
- necessidades especiais
- estratégias recomendadas

HISTÓRICO:
${memoryText}

Responda em texto simples.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  const profile = response.choices[0].message.content;

  await supabase.from("student_profile").upsert({
    user_id: userId,
    profile,
    updated_at: new Date().toISOString(),
  });

  return profile;
}

// =============================
// 🔥 BUSCAR PERFIL
// =============================
export async function getStudentProfile(userId) {
  const { data } = await supabase
    .from("student_profile")
    .select("*")
    .eq("user_id", userId)
    .single();

  return data?.profile || "";
}