import OpenAI from "openai";
import { buildMemory } from "../../ai/memoryBuilder.js";
import { searchKnowledge } from "../../ai/rag.engine.js";
import { saveMemory } from "../../ai/memory.engine.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function generateLesson({ input, context }) {
  const { student, topic, userId, chatId, tenantId } = context;

  if (!student || !topic) {
    throw new Error("MISSING_CONTEXT: student e topic são obrigatórios");
  }

  // 🧠 1. Monta memória + RAG
  const messages = await buildMemory({
    module: "education",
    input: topic,
    chatId,
    tenantId,
  });

  // 📚 2. Busca conhecimento BNCC relevante
  const knowledge = await searchKnowledge(topic);
  const knowledgeText = knowledge.map((k) => k.content).join("\n");

  // 🎯 3. System prompt inclusivo
  const systemPrompt = `
Você é um especialista em educação inclusiva (AEE) seguindo normas do MEC.

ALUNO:
Nome: ${student.name}
Idade: ${student.age || "Não informado"}
Série: ${student.grade || "Não informado"}
Diagnóstico: ${student.diagnosis || "Não informado"}

CONHECIMENTO BNCC RELEVANTE:
${knowledgeText || "Nenhum encontrado"}

REGRAS:
- linguagem simples e objetiva
- explicação passo a passo
- exemplo do cotidiano real
- 2 atividades práticas adaptadas ao diagnóstico
- respeitar a série/nível do aluno
- incluir código BNCC

RETORNE APENAS JSON PURO, sem markdown:
{
  "title": "string",
  "bncc": "código BNCC",
  "objective": "objetivo pedagógico claro",
  "explanation": "explicação simples e didática",
  "example": "exemplo prático do cotidiano",
  "activities": ["atividade 1 adaptada", "atividade 2 adaptada"],
  "adaptations": "justificativa da adaptação inclusiva para este diagnóstico"
}
`;

  // 🤖 4. Chama OpenAI com histórico + system prompt inclusivo
  const finalMessages = [
    { role: "system", content: systemPrompt },
    ...messages.filter((m) => m.role !== "system"),
    { role: "user", content: `Crie uma aula sobre: ${topic}` },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: finalMessages,
    temperature: 0.6,
  });

  const raw = response.choices?.[0]?.message?.content || "";
  const clean = raw.replace(/```json|```/g, "").trim();

  let lesson;
  try {
    lesson = JSON.parse(clean);
  } catch {
    throw new Error("PARSE_ERROR: resposta da IA não é JSON válido");
  }

  // 💾 5. Salva na memória do usuário
  await saveMemory(userId, {
    type: "lesson",
    topic,
    bncc: lesson.bncc,
    student: student.name,
    createdAt: new Date().toISOString(),
  });

  return lesson;
}
