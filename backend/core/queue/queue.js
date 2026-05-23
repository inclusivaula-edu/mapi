import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL);

// 🔥 fila de eventos
export const eventQueue = new Queue("events", {
  connection,
});

// 🔥 fila de jobs gerais
export const jobQueue = new Queue("jobs", {
  connection,
});