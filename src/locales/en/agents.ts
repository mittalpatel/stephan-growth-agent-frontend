export const agents = {
  title: 'Agents',
  description: 'The AI agents configured for your organization.',
  newAgent: 'New agent',
  previewNotice:
    'Static preview of the Sprint 1 agent management screens. Create, publish, and configure land once the backend ships.',
  table: {
    name: 'Agent',
    type: 'Type',
    status: 'Status',
    conversations: 'Conversations',
    leads: 'Leads',
    updated: 'Last updated',
  },
  status: {
    published: 'Published',
    draft: 'Draft',
    paused: 'Paused',
  },
  type: {
    sales: 'Sales',
    support: 'Support',
  },
  viewAction: 'View',
  overview: {
    backToList: 'Back to agents',
    setupChecklist: 'Setup checklist',
    checklist: {
      addKnowledge: 'Add a knowledge source',
      setLanguages: 'Set languages and fallback text',
      brand: 'Brand the widget',
      runTest: 'Run a test conversation',
      publish: 'Publish',
    },
    tabs: {
      overview: 'Overview',
      knowledge: 'Knowledge',
      behaviour: 'Behaviour',
      languages: 'Languages',
      branding: 'Branding',
      test: 'Test',
      install: 'Install',
    },
  },
} as const;
