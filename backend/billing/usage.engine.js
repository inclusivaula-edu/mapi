import { supabase } from "../services/dbService.js";

// limites simples (pode evoluir depois)
const PLAN_LIMITS = {
  free: 5,
  pro: 200,
  enterprise: 999999,
};

export async function getUsage(userId) {
  const { data } = await supabase
    .from("usage")
    .select("*")
    .eq("user_id", userId)
    .single();

  return data || { count: 0 };
}

export async function incrementUsage(userId) {
  const usage = await getUsage(userId);

  const { error } = await supabase.from("usage").upsert({
    user_id: userId,
    count: usage.count + 1,
  });

  if (error) throw error;
}

export async function isAllowed(userId, plan = "free") {
  const usage = await getUsage(userId);
  const limit = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  return {
    ok: usage.count < limit,
    usage,
    limit,
  };
}