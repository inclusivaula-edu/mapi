import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { supabase } from "../services/dbService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrations = [
  "001_init_users.sql",
  "002_init_subscriptions.sql",
  "003_init_usage_logs.sql",
  "004_init_requests.sql",
];

async function runMigration(file) {
  const filePath = path.join(__dirname, file);
  const sql = fs.readFileSync(filePath, "utf8");

  console.log(`🚀 Running migration: ${file}`);

  const { error } = await supabase.rpc("exec_sql", {
    query: sql,
  });

  if (error) {
    console.error(`❌ Error in ${file}:`, error.message);
  } else {
    console.log(`✅ Success: ${file}`);
  }
}

export async function migrate() {
  for (const file of migrations) {
    await runMigration(file);
  }

  console.log("🔥 All migrations executed!");
}