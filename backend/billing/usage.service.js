import { supabase } from "../services/dbService.js";

export async function logUsage({ userId, tokens = 0, model }) {
  await supabase.from("usage_logs").insert({
    user_id: userId,
    tokens_used: tokens,
    model,
    created_at: new Date()
  });
}

export async function getUsage(userId) {
  const { data } = await supabase
    .from("usage_logs")
    .select("*")
    .eq("user_id", userId);

  const totalTokens = data?.reduce((acc, item) => acc + item.tokens_used, 0) || 0;
  const totalRequests = data?.length || 0;

  return {
    totalTokens,
    totalRequests
  };
}