import { supabase } from "../services/dbService.js";

export async function checkPlan(tenantId) {
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .single();

  return data;
}