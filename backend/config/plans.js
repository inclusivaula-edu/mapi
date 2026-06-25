/**
 * PLANOS B2B — por organização
 * Fonte única da verdade. Nunca duplique aqui.
 */
export const PLANS = {
  trial: {
    name:        "trial",
    label:       "Trial",
    price:       0,
    maxRequests: 100,
    maxMembers:  3,
    maxTokens:   10_000,
    modules:     ["education"],
    models:      ["gpt-4o-mini"],
    trialDays:   14,
  },

  starter: {
    name:        "starter",
    label:       "Starter",
    price:       199.9,
    maxRequests: 2_000,
    maxMembers:  10,
    maxTokens:   500_000,
    modules:     ["education", "juridico", "lgpd"],
    models:      ["gpt-4o-mini"],
  },

  professional: {
    name:        "professional",
    label:       "Professional",
    price:       499.9,
    maxRequests: 10_000,
    maxMembers:  50,
    maxTokens:   2_000_000,
    modules:     ["education", "juridico", "lgpd", "licitacoes"],
    models:      ["gpt-4o-mini", "gpt-4o"],
  },

  enterprise: {
    name:        "enterprise",
    label:       "Enterprise",
    price:       0,
    maxRequests: Infinity,
    maxMembers:  Infinity,
    maxTokens:   Infinity,
    modules:     ["*"],
    models:      ["gpt-4o-mini", "gpt-4o"],
  },

  // ── Planos standalone (fora do mercado educacional) ──────────
  lgpd_solo: {
    name:        "lgpd_solo",
    label:       "LGPD Compliance",
    price:       299.9,
    maxRequests: 3_000,
    maxMembers:  10,
    maxTokens:   1_000_000,
    modules:     ["lgpd"],
    models:      ["gpt-4o-mini", "gpt-4o"],
  },

  licitacoes_solo: {
    name:        "licitacoes_solo",
    label:       "Licitações Pro",
    price:       699.9,
    maxRequests: 5_000,
    maxMembers:  20,
    maxTokens:   3_000_000,
    modules:     ["licitacoes"],
    models:      ["gpt-4o-mini", "gpt-4o"],
  },
};

export function getPlan(planName) {
  return PLANS[planName] ?? PLANS.trial;
}

export function isModuleAllowed(planName, moduleName) {
  const plan = getPlan(planName);
  return plan.modules.includes("*") || plan.modules.includes(moduleName);
}
