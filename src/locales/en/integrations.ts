export const integrations = {
  title: 'Integrations',
  description: 'Connect your CRM, lead ads, messaging, and email tools.',
  errorTitle: "Couldn't load integrations",
  errorDescription: 'Something went wrong fetching the integration catalog.',
  emptyTitle: 'No integrations available yet',
  category: {
    crm: 'CRM',
    lead_ads: 'Lead ads',
    messaging: 'Messaging',
    email: 'Email',
  },
  status: {
    connected: 'Connected',
    notConnected: 'Not connected',
  },
  actions: {
    connect: 'Connect',
    disconnect: 'Disconnect',
  },
  toast: {
    connected: 'Integration connected.',
    disconnected: 'Integration disconnected.',
  },
} as const;
