import { supabase } from "../../services/dbService.js";

export async function getSubscription(userId) {
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  return data;
}

export async function updateSubscription(userId, patch) {
  return supabase
    .from("subscriptions")
    .update(patch)
    .eq("user_id", userId);
}

export async function activateSubscription(userId, planId) {
  return updateSubscription(userId, {
    status: "active",
    plan_id: planId,
    updated_at: new Date().toISOString(),
  });
}

export async function cancelSubscription(userId) {
  return updateSubscription(userId, {
    status: "canceled",
    canceled_at: new Date().toISOString(),
  });
}