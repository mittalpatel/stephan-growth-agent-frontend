export const analytics = {
  title: 'Analytics',
  description: 'A summary of conversation, lead, and escalation activity.',
  previewNotice:
    'Sample figures, shown so you can see the layout. Your own numbers appear here once analytics reporting is switched on.',
  range: {
    label: 'Range',
    last7Days: 'Last 7 days',
    last30Days: 'Last 30 days',
  },
  metrics: {
    conversations: 'Conversations',
    messages: 'Messages',
    escalations: 'Escalations',
    leads: 'Leads',
    unresolvedTopics: 'Unresolved topics',
  },
} as const;
