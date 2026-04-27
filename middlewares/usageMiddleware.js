import { supabase } from "../services/dbService.js";

const PLAN_RULES = {
  basic: { requests: 100 },
  pro: { requests: 1000 },
  enterprise: { requests: Infinity },
};

export async function checkUsageLimit(tenantId) {
  // 🔥 pega uso do tenant
  const { data, error } = await supabase
    .from("usage_logs")
    .select("requests")
    .eq("tenant_id", tenantId);

  if (error) throw new Error("Erro ao buscar uso");

  const total =
    data?.reduce((acc, item) => acc + item.requests, 0) || 0;

  // 🔥 pega assinatura
  const { data: sub, error: subError } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (subError || !sub) {
    throw new Error("Sem assinatura");
  }

  if (sub.status !== "active") {
    throw new Error("Plano inativo");
  }

  // 🔥 valida expiração
  if (sub.current_period_end && new Date(sub.current_period_end) < new Date()) {
    throw new Error("Plano expirado");
  }

  const limit = PLAN_RULES[sub.plan]?.requests;

  if (limit === undefined) {
    throw new Error("Plano inválido");
  }

  if (limit !== Infinity && total >= limit) {
    throw new Error("Limite do plano atingido");
  }

  return true;
}