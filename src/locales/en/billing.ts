export const billing = {
  title: 'Billing',
  description: 'Your plan, usage, and available tiers.',
  subscription: {
    title: 'Subscription',
    noPlan: 'No plan assigned yet.',
    notProvisioned: 'Not provisioned.',
  },
  usage: {
    title: 'Usage this month',
    empty: 'No usage data yet.',
    unlimited: 'Unlimited',
  },
  plans: {
    title: 'Available plans',
    seats: 'Seats: {count}',
    agents: 'Agents: {count}',
    unlimitedTier: 'Unlimited usage.',
  },
} as const;
