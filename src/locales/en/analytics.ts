export const analytics = {
  title: 'Analytics',
  description: 'A summary of conversation, lead, and escalation activity.',
  range: {
    label: 'Range',
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
  },
  empty:
    'No activity in this period yet. Numbers appear here once visitors talk to a published agent.',
  error: 'Some figures could not be loaded, so the totals may be incomplete.',
  byAgent: {
    title: 'By agent',
    agent: 'Agent',
    conversations: 'Conversations',
    leads: 'Leads',
    escalations: 'Escalations',
  },
  locked: {
    title: 'Detailed reports',
    description:
      'See every conversation trend, top questions and unanswered topics, and export your data for analysis.',
    cta: 'Subscribe to a plan to see more',
    export: 'Export',
    exportLocked: 'Exporting data is available on paid plans.',
  },
  metrics: {
    conversations: 'Conversations',
    messages: 'Messages',
    escalations: 'Escalations',
    leads: 'Leads',
    unresolvedTopics: 'Unresolved topics',
  },
} as const;
