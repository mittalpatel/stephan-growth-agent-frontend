export const dashboard = {
  title: 'Dashboard',
  greeting: 'Good morning, {name}',
  welcome: "Here's what's happening across your AI workspace.",
  actions: {
    viewAnalytics: 'Improve your ROI',
    exploreAgents: 'Explore agents',
  },
  range: {
    '7d': '7D',
    '30d': '30D',
    '90d': '90D',
  },
  metrics: {
    activeAgents: 'Active agents',
    conversations: 'Conversations',
    escalations: 'Escalations',
    leadsCaptured: 'Leads captured',
    unresolvedTopics: 'Unresolved topics',
  },
  agentPerformance: {
    title: 'Agent performance',
    viewAll: 'View all agents',
    empty: 'Create an agent to see its performance here.',
    conversations: 'Conversations',
    leads: 'Leads',
    viewAgent: 'View agent',
  },
  activity: {
    title: 'Recent leads',
    empty: 'No recent leads yet.',
  },
  securityTip: {
    title: 'Protect your account',
    description:
      'Turn on two-step verification so a stolen password alone cannot open your workspace.',
    action: 'Set it up',
    dismiss: 'Not now',
  },
  metricsEmpty: 'Your numbers will appear here after visitors start talking to a published agent.',
} as const;
