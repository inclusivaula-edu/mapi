export function computeBillingState(subscription, usage) {
  if (!subscription || subscription.status !== "active") {
    return "inactive";
  }

  if (usage > subscription.limit) {
    return "over_limit";
  }

  return "active";
}