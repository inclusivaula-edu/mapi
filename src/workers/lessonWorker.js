import "dotenv/config";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import OpenAI from "openai";
import { supabase } from "../services/dbService.js";

// 🔥 conexão Redis (OBRIGATÓRIO maxRetriesPerRequest = null)
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

// 🔥 OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔥 Worker
new Worker(
  "lessonQueue",
  async (job) => {
    console.log("🚀 Processando job:", job.id);

    try {
      const { tenantId, data } = job.data;

      // 🧠 Buscar memória (opcional, mas já preparado)
      const { data: memory } = await supabase
        .from("memory")
        .select("*")
        .eq("tenant_id", tenantId)
        .limit(5);

      const context = JSON.stringify(memory || []);

      // 🎯 Prompt inteligente
      const prompt = `
Considere o histórico do professor:
${context}

Crie um plano de aula inclusivo com BNCC.

Tema: ${data.tema}
Disciplina: ${data.disciplina}
Série: ${data.serie}
`;

      // 🤖 IA
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      });

      const lesson = completion.choices[0].message.content;

      // 💾 Salvar no banco
      const { error } = await supabase.from("lessons").insert({
        tenant_id: tenantId,
        tema: data.tema,
        disciplina: data.disciplina,
        serie: data.serie,
        conteudo: lesson,
        status: "done",
      });

      if (error) {
        throw error;
      }

      console.log("✅ Job finalizado:", job.id);

      return true;

    } catch (error) {
      console.error("❌ Erro no job:", job.id, error);

      // 🔥 salvar erro no banco (IMPORTANTE)
      try {
        await supabase.from("lessons").insert({
          tenant_id: job.data.tenantId,
          tema: job.data.data.tema,
          disciplina: job.data.data.disciplina,
          serie: job.data.data.serie,
          conteudo: null,
          status: "error",
        });
      } catch (dbError) {
        console.error("❌ Erro ao salvar falha:", dbError);
      }

      throw error;
    }
  },
  { connection }
);

// 🔥 log geral
console.log("🔥 Worker rodando...");