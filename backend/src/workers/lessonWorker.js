import "dotenv/config";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import OpenAI from "openai";
import { supabase } from "../services/dbService.js";

// 🔥 Redis connection
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

// 🔥 OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔥 Worker BullMQ (PADRÃO CORRETO v5)
const worker = new Worker(
  "lessonQueue",
  async (job) => {
    console.log("🚀 Processando job:", job.id);

    const { tenantId, data } = job.data;

    try {
      // 🔥 memória (opcional)
      const { data: memory } = await supabase
        .from("memory")
        .select("*")
        .eq("tenant_id", tenantId)
        .limit(5);

      const context = JSON.stringify(memory || []);

      // 🔥 prompt
      const prompt = `
Considere o histórico do professor:
${context}

Crie um plano de aula inclusivo com BNCC.

Tema: ${data.tema}
Disciplina: ${data.disciplina}
Série: ${data.serie}
`;

      // 🔥 OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      });

      const conteudo = completion.choices?.[0]?.message?.content || "";

      if (!conteudo) {
        throw new Error("IA não retornou conteúdo");
      }

      // 🔥 salvar aula
      const { data: lesson, error } = await supabase
        .from("lessons")
        .insert({
          tenant_id: tenantId,
          tema: data.tema,
          disciplina: data.disciplina,
          serie: data.serie,
          conteudo,
          status: "done",
        })
        .select()
        .single();

      if (error) throw error;

      // 🔥 WEBHOOK → Base44
      try {
        await fetch(process.env.BASE44_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lessonId: lesson.id,
            status: "concluido",
            conteudo,
          }),
        });
      } catch (webhookError) {
        console.error("⚠️ Falha webhook:", webhookError.message);
      }

      console.log("✅ Job finalizado:", job.id);

      return { success: true };

    } catch (error) {
      console.error("❌ Erro no job:", job.id, error.message);

      // 🔥 salvar erro
      try {
        await supabase.from("lessons").insert({
          tenant_id: tenantId,
          tema: data.tema,
          disciplina: data.disciplina,
          serie: data.serie,
          conteudo: null,
          status: "error",
        });
      } catch (dbError) {
        console.error("❌ Erro ao salvar erro:", dbError.message);
      }

      throw error;
    }
  },
  { connection }
);

// 🔥 eventos úteis
worker.on("completed", (job) => {
  console.log(`🎯 Job ${job.id} concluído`);
});

worker.on("failed", (job, err) => {
  console.error(`💥 Job ${job?.id} falhou:`, err.message);
});

console.log("🔥 Worker rodando...");