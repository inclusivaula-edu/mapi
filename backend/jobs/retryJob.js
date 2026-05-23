import cron from "node-cron";
import { processRetries } from "../services/billingService.js";
import { supabase } from "../services/dbService.js";

export function startRetryJob() {
  cron.schedule("0 9 * * *", async () => {
    console.log("🔁 Rodando retry automático...");
    await processRetries(supabase);
  });
}