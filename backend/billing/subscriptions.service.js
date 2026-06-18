import { logger } from "../observability/logger.js";
import { supabase } from "../services/dbService.js";
import { getPlan } from "../config/plans.js";

export async function getSubscription(userId) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    logger.error("getSubscription error:", error.message);
  }

  return data ?? null;
}

export async function activateSubscription(userId, planName = "pro") {
  const plan = getPlan(planName);

  const { error } = await supabase.from("subscriptions").upsert({
    user_id: userId,
    plan_id: plan.name,
    status: "active",
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(`activateSubscription: ${error.message}`);
}

export async function suspendSubscription(userId) {
  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "suspended", updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (error) throw new Error(`suspendSubscription: ${error.message}`);
}

export async function cancelSubscription(userId) {
  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (error) throw new Error(`cancelSubscription: ${error.message}`);
}
