export const leads = {
  title: 'Leads',
  description:
    'Every prospect and lead your agents have engaged, whether they arrived through your website or Meta Lead Ads.',
  previewNotice:
    'Static preview of the Sprint 1 leads screens. Real captures land once the backend ships.',
  metrics: {
    totalLeads: 'Total leads',
    qualified: 'Qualified',
    websiteProspects: 'Website prospects',
    conversion: 'Conversion',
  },
  tabs: {
    websiteProspects: 'Website prospects',
    outreachLeads: 'Outreach leads',
  },
  prospectTable: {
    name: 'Name',
    company: 'Company',
    intent: 'Intent',
    score: 'Score',
    source: 'Source',
    lastActivity: 'Last activity',
    status: 'Status',
  },
  pipeline: {
    newLeads: 'New leads',
    validated: 'Validated',
    enriched: 'Enriched',
    scored: 'Scored',
    contacted: 'Contacted',
    qualified: 'Qualified',
    nurtureHandoff: 'Nurture / handoff',
  },
  table: {
    lead: 'Lead',
    company: 'Company',
    source: 'Source',
    score: 'Score',
    status: 'Status',
    lastContact: 'Last contact',
    owner: 'Owner',
  },
  status: {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    enriched: 'Enriched',
    validated: 'Validated',
    scored: 'Scored',
  },
} as const;
