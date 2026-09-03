export const dashboard = {
  title: 'Dashboard',
  greeting: 'Good morning, {name}',
  welcome: "Here's what's happening across your AI workspace.",
  previewNotice:
    'Static preview built from the Sprint 1 plan. Real numbers arrive once the backend ships.',
  actions: {
    viewAnalytics: 'View analytics',
    exploreAgents: 'Explore agents',
  },
  metrics: {
    activeAgents: 'Active agents',
    conversations: 'Conversations',
    leadsCaptured: 'Leads captured',
    escalations: 'Open escalations',
    unresolvedTopics: 'Unresolved topics',
  },
  agentPerformance: {
    title: 'Agent performance',
    viewAll: 'View all agents',
  },
  activity: {
    title: 'Recent activity',
  },
} as const;
