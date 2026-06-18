/**
 * Constantes de eventos do sistema de billing.
 * Usadas no ledger e em futuros event listeners.
 */
export const EVENTS = {
  USER_CREATED:           "user.created",
  SUBSCRIPTION_CREATED:   "subscription.created",
  SUBSCRIPTION_CANCELED:  "subscription.canceled",
  SUBSCRIPTION_SUSPENDED: "subscription.suspended",
  USAGE_REGISTERED:       "usage.registered",
  LIMIT_REACHED:          "usage.limit_reached",
  PAYMENT_SUCCESS:        "payment.success",
  PAYMENT_FAILED:         "payment.failed",
};
