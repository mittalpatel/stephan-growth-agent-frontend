export const leads = {
  title: 'Leads',
  description: 'Every lead your agents have captured, across every agent in your organization.',
  status: {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    disqualified: 'Disqualified',
  },
  qualificationOutcome: {
    qualified: 'Qualified',
    partial: 'Partial',
    unqualified: 'Unqualified',
  },
  filters: {
    statusLabel: 'Status',
    qualificationOutcomeLabel: 'Qualification',
  },
  table: {
    lead: 'Lead',
    status: 'Status',
    qualification: 'Qualification',
    consent: 'Consent',
    lastContact: 'Captured',
  },
  list: {
    errorTitle: "Couldn't load leads",
    errorDescription: 'Something went wrong fetching your leads.',
    emptyTitle: 'No leads yet',
    emptyDescription: 'Leads appear here once a visitor completes a capture flow with an agent.',
    emptyFilteredTitle: 'No leads match your filters',
    emptyFilteredDescription: 'Try clearing filters to see more results.',
  },
  detail: {
    title: 'Lead details',
    statusLabel: 'Status',
    changeStatus: 'Change lead status',
    interestNote: 'Interest',
    consentNotice: 'Consent notice version',
    fieldsHeading: 'Collected fields',
    fieldsEmpty: 'No additional fields were collected.',
    qualificationLabel: 'Qualification',
    qualificationHelp:
      "Scored automatically from this agent's qualification rules, separately from the status you set above.",
    qualificationHeading: 'Evaluation history',
    qualificationEmpty:
      'This lead has not been scored yet. Scoring runs when an agent with qualification rules captures a lead.',
    scoreLabel: 'Score {score}',
    missingFieldsLabel: 'Missing: {fields}',
    conversationHeading: 'Conversation',
    noConversation: 'No linked conversation.',
  },
  consent: {
    given: 'Given',
    notGiven: 'Not given',
  },
  toast: {
    statusChanged: 'Lead status updated.',
  },
} as const;
