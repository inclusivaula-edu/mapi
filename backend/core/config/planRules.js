export const PLAN_RULES = {
  basic: {
    maxRequests: 100,
    modules: ["education"],
  },
  pro: {
    maxRequests: 1000,
    modules: ["education", "sales"],
  },
  enterprise: {
    maxRequests: Infinity,
    modules: ["*"],
  },
};