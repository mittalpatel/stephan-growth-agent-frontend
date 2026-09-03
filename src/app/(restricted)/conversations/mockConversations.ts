export type ConversationIntent = 'High' | 'Medium' | 'Low';

export type ConversationMessage = {
  from: 'visitor' | 'agent';
  text: string;
  time: string;
};

export type MockConversation = {
  id: string;
  visitorName: string;
  company: string;
  topic: string;
  timeAgo: string;
  intent: ConversationIntent;
  unread?: boolean;
  score: number;
  messages: readonly ConversationMessage[];
};

/** Mirrors `ai-agents-platform`'s `data/conversations.ts` mock data. */
export const MOCK_CONVERSATIONS: readonly MockConversation[] = [
  {
    id: 'c1',
    visitorName: 'Sarah Miller',
    company: 'Northstar Labs',
    topic: 'Pricing question',
    timeAgo: '2m ago',
    intent: 'High',
    unread: true,
    score: 87,
    messages: [
      {
        from: 'visitor',
        text: 'Can you explain how your enterprise plan works?',
        time: '10:41 AM',
      },
      {
        from: 'agent',
        text: "Absolutely. Our Enterprise plan includes dedicated onboarding, custom workflow automation, and priority support. It's built for teams running multiple agents across departments.",
        time: '10:41 AM',
      },
      { from: 'visitor', text: 'Does it integrate with our CRM?', time: '10:42 AM' },
      {
        from: 'agent',
        text: "Yes — we support HubSpot and Salesforce natively, with a general CRM connector for other platforms. Enriched prospect data syncs automatically once you're on Level 2.",
        time: '10:42 AM',
      },
    ],
  },
  {
    id: 'c2',
    visitorName: 'Michael Reed',
    company: 'Brightline Systems',
    topic: 'Implementation question',
    timeAgo: '18m ago',
    intent: 'Medium',
    score: 64,
    messages: [
      { from: 'visitor', text: 'How long does onboarding usually take?', time: '10:25 AM' },
      {
        from: 'agent',
        text: "Most teams are live within a week. We start by connecting your website and any PDFs you'd like the agent to learn from, then activate the agents you need.",
        time: '10:26 AM',
      },
    ],
  },
  {
    id: 'c3',
    visitorName: 'David Carter',
    company: 'Vertex Digital',
    topic: 'Product inquiry',
    timeAgo: '1h ago',
    intent: 'High',
    score: 79,
    messages: [
      {
        from: 'visitor',
        text: "What's the difference between the Content agent and Lead Outreach agent?",
        time: '9:38 AM',
      },
      {
        from: 'agent',
        text: 'Content Strategy plans and drafts your marketing posts, while Lead Outreach focuses on qualifying and following up with incoming leads via WhatsApp and your CRM.',
        time: '9:39 AM',
      },
    ],
  },
  {
    id: 'c4',
    visitorName: 'Emily Watson',
    company: 'Halcyon Group',
    topic: 'General question',
    timeAgo: '3h ago',
    intent: 'Low',
    score: 38,
    messages: [
      { from: 'visitor', text: 'Do you offer a free trial?', time: '7:52 AM' },
      {
        from: 'agent',
        text: 'Yes, every plan starts with a 30-day free trial across all four agents — no card required to get started.',
        time: '7:52 AM',
      },
    ],
  },
] as const;
