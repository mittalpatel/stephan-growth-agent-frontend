export const conversations = {
  title: 'Conversations',
  description: 'Every conversation your agents have had with a visitor.',
  previewNotice:
    'Static preview of the Sprint 1 operator inbox. Transcripts, citations, and escalation resolve land once the backend ships.',
  table: {
    visitor: 'Visitor',
    agent: 'Agent',
    lastMessage: 'Last message',
    status: 'Status',
    updated: 'Updated',
  },
  status: {
    open: 'Open',
    escalated: 'Escalated',
    resolved: 'Resolved',
  },
} as const;
