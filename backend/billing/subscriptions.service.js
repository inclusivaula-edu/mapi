import { supabase } from "../src/services/dbService.js";
import { getPlan } from "./plans.service.js";

export async function getSubscription(userId) {
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  return data;
}

export async function activateSubscription(userId, plan = "pro") {
  const planData = getPlan(plan);

  await supabase.from("subscriptions").upsert({
    user_id: userId,
    plan_id: plan,
    status: "active",
    updated_at: new Date()
  });

  await supabase
    .from("users")
    .update({ plan_id: planData.name, status: "active" })
    .eq("id", userId);
}

export async function suspendUser(userId) {
  await supabase
    .from("users")
    .update({ status: "suspended" })
    .eq("id", userId);
}

export async function cancelSubscription(userId) {
  await supabase
    .from("subscriptions")
    .update({ status: "canceled" })
    .eq("user_id", userId);
}