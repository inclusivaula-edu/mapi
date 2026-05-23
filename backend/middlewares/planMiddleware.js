import { supabase } from "../services/dbService.js";

const PLAN_LIMITS = {
  basic: ["education"],
  pro: ["education", "finance", "sales"],
  enterprise: ["*"],
};

export async function checkPlanAccess({ tenantId, module }) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) {
    throw new Error("Erro ao verificar plano");
  }

  if (!data || data.status !== "active") {
    throw new Error("Plano inativo");
  }

  const allowedModules = PLAN_LIMITS[data.plan];

  if (!allowedModules) {
    throw new Error("Plano inválido");
  }

  if (
    !allowedModules.includes("*") &&
    !allowedModules.includes(module)
  ) {
    throw new Error("Módulo não permitido no plano");
  }

  return true;
}