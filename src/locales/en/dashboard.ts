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
} as const;
