import "dotenv/config";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import OpenAI from "openai";
import { supabase } from "../../../backend/services/dbService.js";

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log("📊 Analytics Worker rodando...");

const worker = new Worker(
  "event-queue",
  async (job) => {
    try {
      const { tenantId } = job.data;

      // 🔎 busca últimos eventos do usuário
      const { data: events } = await supabase
        .from("events")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!events || events.length === 0) return;

      // 📊 resumo simples
      const types = {};
      events.forEach((e) => {
        types[e.type] = (types[e.type] || 0) + 1;
      });

      const summary = `
Usuário com os seguintes comportamentos:
${Object.entries(types)
  .map(([k, v]) => `- ${k}: ${v} vezes`)
  .join("\n")}
`;

      // 🧠 gera insight com IA
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Você é um analista de dados que gera insights objetivos e estratégicos.",
          },
          {
            role: "user",
            content: `Analise esses dados e gere insights úteis:\n${summary}`,
          },
        ],
      });

      const insight = response.choices[0].message.content;

      console.log("🧠 Insight gerado:", insight);

      // 💾 salva insight
      await supabase.from("insights").insert({
        tenant_id: tenantId,
        content: insight,
      });

    } catch (error) {
      console.error("Erro no analytics worker:", error);
    }
  },
  { connection }
);