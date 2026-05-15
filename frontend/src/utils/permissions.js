export const FEATURES = {
  basic: ["dashboard"],
  pro: ["dashboard", "billing", "advanced"],
  enterprise: ["*"],
};

export function hasFeature(plan, feature) {
  const allowed = FEATURES[plan] || [];

  if (allowed.includes("*")) return true;

  return allowed.includes(feature);
}