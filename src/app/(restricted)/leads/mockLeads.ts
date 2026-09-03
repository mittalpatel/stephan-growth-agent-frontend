export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'enriched' | 'validated' | 'scored';

export type MockLead = {
  id: string;
  name: string;
  role: string;
  company: string;
  source: string;
  score: number;
  status: LeadStatus;
  lastContact: string;
  owner: string;
};

/** Mirrors `ai-agents-platform`'s `data/leads.ts` mock data. */
export const MOCK_LEADS: readonly MockLead[] = [
  {
    id: 'l1',
    name: 'John Smith',
    role: 'CEO',
    company: 'Brightline Systems',
    source: 'Meta Lead Ad',
    score: 91,
    status: 'qualified',
    lastContact: '12 minutes ago',
    owner: 'David Wilson',
  },
  {
    id: 'l2',
    name: 'Priya Nair',
    role: 'Marketing Director',
    company: 'Vertex Digital',
    source: 'Meta Lead Ad',
    score: 76,
    status: 'contacted',
    lastContact: '1 hour ago',
    owner: 'Sarah Chen',
  },
  {
    id: 'l3',
    name: 'Marcus Bell',
    role: 'Operations Manager',
    company: 'Halcyon Group',
    source: 'Website',
    score: 58,
    status: 'enriched',
    lastContact: '3 hours ago',
    owner: 'David Wilson',
  },
  {
    id: 'l4',
    name: 'Elena Petrova',
    role: 'Head of Growth',
    company: 'Lumen Retail Co.',
    source: 'Referral',
    score: 88,
    status: 'qualified',
    lastContact: 'Yesterday',
    owner: 'Sarah Chen',
  },
  {
    id: 'l5',
    name: 'Tomás García',
    role: 'Founder',
    company: 'Solace Wellness',
    source: 'Meta Lead Ad',
    score: 41,
    status: 'validated',
    lastContact: '2 days ago',
    owner: 'David Wilson',
  },
  {
    id: 'l6',
    name: 'Grace Liu',
    role: 'VP Sales',
    company: 'Cascade Robotics',
    source: 'Organic',
    score: 69,
    status: 'scored',
    lastContact: '2 days ago',
    owner: 'Sarah Chen',
  },
] as const;

export type MockProspect = {
  id: string;
  name: string;
  role: string;
  company: string;
  intent: 'High' | 'Medium' | 'Low';
  score: number;
  source: string;
  lastActivity: string;
  status: string;
};

/** Mirrors `ai-agents-platform`'s `data/conversations.ts` prospects mock data. */
export const MOCK_PROSPECTS: readonly MockProspect[] = [
  {
    id: 'p1',
    name: 'Sarah Miller',
    role: 'VP Marketing',
    company: 'Northstar Labs',
    intent: 'High',
    score: 87,
    source: 'Website chat',
    lastActivity: '2 minutes ago',
    status: 'Qualified',
  },
  {
    id: 'p2',
    name: 'Michael Reed',
    role: 'Head of Ops',
    company: 'Brightline Systems',
    intent: 'Medium',
    score: 64,
    source: 'Website chat',
    lastActivity: '18 minutes ago',
    status: 'Engaged',
  },
  {
    id: 'p3',
    name: 'David Carter',
    role: 'Growth Lead',
    company: 'Vertex Digital',
    intent: 'High',
    score: 79,
    source: 'Website chat',
    lastActivity: '1 hour ago',
    status: 'Follow-up',
  },
  {
    id: 'p4',
    name: 'Emily Watson',
    role: 'Marketing Coordinator',
    company: 'Halcyon Group',
    intent: 'Low',
    score: 38,
    source: 'Website chat',
    lastActivity: '3 hours ago',
    status: 'New',
  },
  {
    id: 'p5',
    name: 'James Okafor',
    role: 'Founder',
    company: 'Lumen Retail Co.',
    intent: 'High',
    score: 91,
    source: 'Website chat',
    lastActivity: 'Yesterday',
    status: 'Converted',
  },
] as const;

export const LEAD_PIPELINE: readonly { stageKey: string; count: number }[] = [
  { stageKey: 'newLeads', count: 64 },
  { stageKey: 'validated', count: 58 },
  { stageKey: 'enriched', count: 51 },
  { stageKey: 'scored', count: 47 },
  { stageKey: 'contacted', count: 44 },
  { stageKey: 'qualified', count: 38 },
  { stageKey: 'nurtureHandoff', count: 21 },
] as const;
