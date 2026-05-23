import { supabase } from "../src/services/dbService.js";

// =============================
// 🧠 ENGINE DE BILLING (CORE)
// =============================
export async function isAllowed(userId) {
  try {
    // 🔍 busca subscription
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    // 📊 conta uso
    const { count } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const usage = count || 0;

    // 🎯 regras por plano
    const plan = sub?.plan_id || "free";
    const status = sub?.status || "inactive";

    const limits = {
      free: {
        requests: 100,
        tokens: 5000,
      },
      pro: {
        requests: 10000,
        tokens: 100000,
      },
    };

    const limit = limits[plan] || limits.free;

    // =============================
    // 🚨 VALIDAÇÃO
    // =============================
    if (status !== "active") {
      return {
        ok: false,
        reason: "SUBSCRIPTION_INACTIVE",
        billing: {
          plan,
          status,
          usage,
          limit: limit.requests,
          tokensLimit: limit.tokens,
        },
      };
    }

    if (usage >= limit.requests) {
      return {
        ok: false,
        reason: "USAGE_LIMIT_EXCEEDED",
        billing: {
          plan,
          status,
          usage,
          limit: limit.requests,
          tokensLimit: limit.tokens,
        },
      };
    }

    // =============================
    // ✅ LIBERADO
    // =============================
    return {
      ok: true,
      billing: {
        plan,
        status,
        usage,
        limit: limit.requests,
        tokensLimit: limit.tokens,
      },
    };
  } catch (err) {
    console.error("BILLING ENGINE ERROR:", err);

    return {
      ok: false,
      reason: "BILLING_ERROR",
      billing: null,
    };
  }
}