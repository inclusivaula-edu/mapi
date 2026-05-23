export const PLAN_RULES = {
  basic: {
    requests: 100,
    modules: ["education"],
  },
  pro: {
    requests: 1000,
    modules: ["education", "finance"],
  },
  enterprise: {
    requests: Infinity,
    modules: ["*"],
  },
};