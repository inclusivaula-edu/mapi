export const PLANS = {
  free: {
    name: "free",
    limit_requests: 50,
    limit_tokens: 5000,
    models: ["gpt-3.5"]
  },

  pro: {
    name: "pro",
    limit_requests: 1000,
    limit_tokens: 200000,
    models: ["gpt-4", "gpt-3.5"]
  },

  enterprise: {
    name: "enterprise",
    limit_requests: 10000,
    limit_tokens: 2000000,
    models: ["gpt-5", "gpt-4", "gpt-3.5"]
  }
};

export function getPlan(planName) {
  return PLANS[planName] || PLANS.free;
}