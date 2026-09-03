export const conversations = {
  title: 'Conversations',
  description: 'Every visitor conversation across your Website Sales Support agent, in one place.',
  previewNotice:
    'Static preview of the Sprint 1 operator inbox. Transcripts, citations, and escalation resolve land once the backend ships.',
  intent: {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  },
  active: 'Active',
  agentName: 'AI Sales Agent',
  readOnlyPlaceholder: 'Live visitor conversation — read only in this demo',
  prospectPanel: {
    heading: 'Prospect',
    intent: 'Intent',
    interest: 'Interest',
    score: 'Score',
    viewProspect: 'View prospect',
    generateFollowUp: 'Generate follow-up',
  },
} as const;
