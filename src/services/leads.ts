/**
 * Lead endpoints and query keys. Same shape as `src/services/agents.ts`.
 * List/detail reads are deliberately never cached server-side (see the
 * module docstring on `apps.leads.api.v1.views.leads`).
 */
import { buildListParams, type ListQuery } from './listParams';

export const LEADS_ENDPOINT = '/api/v1/leads/';
export const leadDetailEndpoint = (id: string) => `${LEADS_ENDPOINT}${id}/`;

export const LEADS_LIST_KEY = 'leads-list';
export const leadDetailKey = (id: string) => ['lead-detail', id];

export type LeadListQuery = ListQuery;
export const buildLeadListParams = buildListParams;

export function leadsListUrl(query: LeadListQuery): string {
  const search = new URLSearchParams(
    Object.entries(buildLeadListParams(query)).map(([key, value]) => [key, String(value)])
  );
  return `${LEADS_ENDPOINT}?${search.toString()}`;
}

/**
 * The `status` values `LeadSelector._FILTER_FIELDS` accepts. `LeadListView`
 * never wires up a `?type=parameters` route (same gap as `apps.knowledge`'s
 * source list — see `src/services/knowledge.ts`), so `useLeadsList` builds
 * its `FilterConfig[]` from this value list plus locale labels rather than
 * fetching them. (`LeadSelector` also accepts an `agent` filter — not
 * exposed in this list's toolbar since there is no agent-name lookup
 * endpoint cheap enough to build an option list from here.)
 */
export const LEAD_STATUS_VALUES = ['new', 'contacted', 'qualified', 'disqualified'] as const;
