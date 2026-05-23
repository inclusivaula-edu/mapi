import { supabase } from "../services/dbService.js";

const PLAN_RULES = {
  basic: {
    requests: 100,
  },
  pro: {
    requests: 1000,
  },
  enterprise: {
    requests: Infinity,
  },
};

export async function checkUsageLimit(tenantId) {
  // 🔥 pega uso total
  const { data } = await supabase
    .from("usage_logs")
    .select("requests")
    .eq("tenant_id", tenantId);

  const total =
    data?.reduce((acc, item) => acc + item.requests, 0) || 0;

  // 🔥 pega plano
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("tenant_id", tenantId)
    .single();

  if (!sub) {
    throw new Error("Sem assinatura ativa");
  }

  const limit = PLAN_RULES[sub.plan]?.requests;

  if (limit !== Infinity && total >= limit) {
    throw new Error("Limite do plano atingido");
  }

  return true;
}