export const leads = {
  title: 'Leads',
  description: 'Everyone your agents have qualified and captured.',
  previewNotice:
    'Static preview of the Sprint 1 leads screens. Real captures land once the backend ships.',
  table: {
    name: 'Name',
    email: 'Email',
    agent: 'Agent',
    status: 'Status',
    captured: 'Captured',
  },
  status: {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
  },
} as const;
