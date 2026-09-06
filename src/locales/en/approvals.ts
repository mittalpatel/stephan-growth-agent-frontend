export const approvals = {
  title: 'Approvals',
  description: 'Actions your agents want to take that need a human sign-off before they run.',
  status: {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
  },
  risk: {
    low: 'Low risk',
    medium: 'Medium risk',
    high: 'High risk',
  },
  filters: {
    statusLabel: 'Status',
  },
  table: {
    title: 'Action',
    status: 'Status',
    risk: 'Risk',
    created: 'Requested',
  },
  list: {
    errorTitle: "Couldn't load approvals",
    errorDescription: 'Something went wrong fetching pending approvals.',
    emptyTitle: 'No approvals yet',
    emptyDescription: 'Actions that need your sign-off will appear here.',
    emptyFilteredTitle: 'No approvals match your filters',
    emptyFilteredDescription: 'Try clearing filters to see more results.',
  },
  detail: {
    title: 'Approval details',
    aiAction: 'Proposed action',
    reason: 'Reason',
    preview: 'Preview',
    rejectionReason: 'Rejection reason',
  },
  actions: {
    approve: 'Approve',
    reject: 'Reject',
  },
  reject: {
    title: 'Reject this action',
    reasonLabel: 'Reason',
    reasonPlaceholder: 'Explain why this action should not run.',
  },
  toast: {
    approved: 'Approved.',
    rejected: 'Rejected.',
  },
} as const;
