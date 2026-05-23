import { supabase } from "../services/dbService.js";

export async function runBillingJob() {
  console.log("🔁 Rodando cobrança automática...");

  const now = new Date();

  const { data: users } = await supabase
    .from("subscriptions")
    .select("*")
    .lt("current_period_end", now);

  for (const user of users || []) {
    console.log("⚠️ Assinatura expirada:", user.tenant_id);

    // 🔴 opção simples: desativa plano
    await supabase
      .from("subscriptions")
      .update({ status: "expired" })
      .eq("tenant_id", user.tenant_id);

    // 🟢 opcional: gerar novo pagamento aqui
  }
}