import { supabase } from "../services/dbService.js";

export async function getMetrics() {
  // 💰 MRR (assinaturas ativas)
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("status", "active");

  const mrr = (subs || []).reduce((acc, s) => {
    if (s.plan_id === "pro") return acc + 59.9;
    if (s.plan_id === "enterprise") return acc + 199;
    return acc;
  }, 0);

  const arr = mrr * 12;

  // 👥 usuários ativos
  const { count: activeUsers } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  // 📊 planos
  const { data: plans } = await supabase
    .from("subscriptions")
    .select("plan_id");

  const breakdown = {
    free: 0,
    pro: 0,
    enterprise: 0,
  };

  (plans || []).forEach((p) => {
    breakdown[p.plan_id || "free"]++;
  });

  // 📉 churn (simples inicial)
  const { count: canceled } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "canceled");

  const churnRate =
    activeUsers > 0 ? ((canceled || 0) / activeUsers) * 100 : 0;

  return {
    mrr: Number(mrr.toFixed(2)),
    arr: Number(arr.toFixed(2)),
    activeUsers: activeUsers || 0,
    churnRate: Number(churnRate.toFixed(2)),
    plans: breakdown,
  };
}