export const PLANS = {
  basic: {
    price: 29.9,
    limits: {
      requests: 100,
      tokens: 50000,
    },
  },
  pro: {
    price: 99.9,
    limits: {
      requests: 1000,
      tokens: 500000,
    },
  },
  enterprise: {
    price: 299.9,
    limits: {
      requests: Infinity,
      tokens: Infinity,
    },
  },
};