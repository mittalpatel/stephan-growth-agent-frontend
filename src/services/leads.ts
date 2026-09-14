/**
 * Lead endpoints and query keys. Same shape as `src/services/agents.ts`.
 * List/detail reads are deliberately never cached server-side (see the
 * module docstring on `apps.leads.api.v1.views.leads`).
 */
import { buildListParams, type ListQuery } from './listParams';

export const LEADS_ENDPOINT = '/api/v1/leads/';
export const leadDetailEndpoint = (id: string) => `${LEADS_ENDPOINT}${id}/`;
export const leadStatusEndpoint = (id: string) => `${LEADS_ENDPOINT}${id}/status/`;

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

/**
 * The `qualification_outcome` values `LeadSelector._FILTER_FIELDS` accepts,
 * declared client-side for the same reason as `LEAD_STATUS_VALUES` above.
 *
 * Filterable but **not** sortable: `LeadSelector._SORT_FIELDS` is still
 * `{created_at, status, email}`, so this must not be offered as a sort
 * option.
 */
export const LEAD_QUALIFICATION_OUTCOME_VALUES = ['qualified', 'partial', 'unqualified'] as const;

/**
 * `LeadStatus._TRANSITIONS` (`apps/leads/constants.py`) mirrored so the
 * status control only ever offers a legal next state. `new`/`contacted`
 * branch two ways; `qualified`/`disqualified` are terminal (empty list).
 */
export const LEAD_STATUS_TRANSITIONS: Record<
  (typeof LEAD_STATUS_VALUES)[number],
  readonly (typeof LEAD_STATUS_VALUES)[number][]
> = {
  new: ['contacted', 'disqualified'],
  contacted: ['qualified', 'disqualified'],
  qualified: [],
  disqualified: [],
};
