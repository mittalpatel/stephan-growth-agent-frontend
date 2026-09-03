export const analytics = {
  title: 'Analytics',
  description: 'A summary of conversation, lead, and escalation activity.',
  previewNotice:
    'Static preview of the Sprint 1 analytics summary. Wired to /agents/{id}/analytics/summary/ once the backend ships.',
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
