import { Queue } from "bullmq";
import IORedis from "ioredis";
import "dotenv/config";

// 🔥 conexão com Redis (cloud ou local via .env)
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

// 🔥 fila principal
export const lessonQueue = new Queue("lessonQueue", {
  connection,
  defaultJobOptions: {
    attempts: 3, // tenta 3x se falhar
    backoff: {
      type: "exponential",
      delay: 3000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});