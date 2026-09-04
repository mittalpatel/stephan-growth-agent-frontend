export const conversations = {
  title: 'Conversations',
  description: 'Every visitor conversation for the selected agent, in one place.',
  agentPicker: {
    label: 'Agent',
    placeholder: 'Select an agent',
    empty: 'No agents yet — create one to see its conversations here.',
  },
  status: {
    open: 'Open',
    handoff_requested: 'Handoff requested',
    handoff_active: 'Handoff active',
    resolved: 'Resolved',
    abandoned: 'Abandoned',
  },
  columns: {
    createdAt: 'Started',
    updatedAt: 'Updated',
    status: 'Status',
  },
  filters: {
    statusLabel: 'Status',
  },
  list: {
    errorTitle: "Couldn't load conversations",
    errorDescription: 'Something went wrong fetching this agent’s conversations.',
    emptyTitle: 'No conversations yet',
    emptyDescription: 'Conversations appear here once visitors start chatting with this agent.',
    emptyFilteredTitle: 'No conversations match your filters',
    emptyFilteredDescription: 'Try clearing filters to see more results.',
    selectPrompt: 'Select a conversation to view its transcript.',
  },
  detail: {
    summaryHeading: 'Summary',
    transcriptHeading: 'Transcript',
    noSummary: 'No summary yet.',
    unassigned: 'Unassigned',
    assignOperator: 'Assign operator',
    assignPlaceholder: 'Choose a team member',
    assign: 'Assign',
    citationsLabel: 'Sources',
    confidence: {
      answered: 'Answered',
      clarify: 'Clarify',
      fallback: 'Fallback',
      handoff: 'Handoff',
    },
  },
  toast: {
    assigned: 'Conversation assigned.',
  },
} as const;
