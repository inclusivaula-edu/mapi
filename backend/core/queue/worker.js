import { Worker } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: {}
});

console.log("🚀 Worker rodando...");

new Worker(
  "event-queue",
  async (job) => {
    console.log("📦 Evento recebido:", job.data);

    // Aqui você pode salvar no banco depois
  },
  {
    connection,
  }
);