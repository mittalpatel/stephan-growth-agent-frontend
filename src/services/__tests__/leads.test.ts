import { describe, it, expect } from 'vitest';

import {
  LEAD_STATUS_TRANSITIONS,
  LEAD_STATUS_VALUES,
  LEADS_ENDPOINT,
  leadDetailEndpoint,
  leadDetailKey,
  leadStatusEndpoint,
  leadsListUrl,
} from '../leads';

const LEAD_ID = 'b1c2d3e4-3333-4f5a-8b9c-0d1e2f3a4b5c';

describe('lead endpoints', () => {
  it('builds the detail and status endpoints under the leads root', () => {
    expect(leadDetailEndpoint(LEAD_ID)).toBe(`${LEADS_ENDPOINT}${LEAD_ID}/`);
    expect(leadStatusEndpoint(LEAD_ID)).toBe(`${leadDetailEndpoint(LEAD_ID)}status/`);
  });

  it('keys the detail cache by lead id', () => {
    expect(leadDetailKey(LEAD_ID)).toEqual(['lead-detail', LEAD_ID]);
    expect(leadDetailKey(LEAD_ID)).not.toEqual(leadDetailKey('other'));
  });
});

describe('lead status transitions', () => {
  // This map is a hand-maintained mirror of `LEAD_STATUS_TRANSITIONS` in
  // `apps/leads/constants.py`. Nothing else fails if it drifts — the picker
  // would just offer a transition the API then refuses with a 409 — so the
  // whole table is asserted explicitly rather than spot-checked.
  it('mirrors the backend transition table exactly', () => {
    expect(LEAD_STATUS_TRANSITIONS).toEqual({
      new: ['contacted', 'disqualified'],
      contacted: ['qualified', 'disqualified'],
      qualified: [],
      disqualified: [],
    });
  });

  it('covers every status the backend defines, with no extras', () => {
    expect(Object.keys(LEAD_STATUS_TRANSITIONS).sort()).toEqual([...LEAD_STATUS_VALUES].sort());
  });

  it('only ever transitions to a real status', () => {
    for (const targets of Object.values(LEAD_STATUS_TRANSITIONS)) {
      for (const target of targets) {
        expect(LEAD_STATUS_VALUES).toContain(target);
      }
    }
  });

  it('treats qualified and disqualified as terminal', () => {
    expect(LEAD_STATUS_TRANSITIONS.qualified).toHaveLength(0);
    expect(LEAD_STATUS_TRANSITIONS.disqualified).toHaveLength(0);
  });

  it('never offers a self-transition, which the picker renders separately', () => {
    for (const [from, targets] of Object.entries(LEAD_STATUS_TRANSITIONS)) {
      expect(targets).not.toContain(from);
    }
  });
});

describe('leads list URL', () => {
  const baseQuery = {
    page: 1,
    limit: 25,
    search: [] as string[],
    search_by: '',
    sort: '',
    sort_direction: 'desc' as const,
    filter: [] as string[],
    filter_by: [] as string[],
  };

  it('sends only pagination when nothing is filtered', () => {
    expect(leadsListUrl(baseQuery)).toBe(`${LEADS_ENDPOINT}?page=1&page_size=25`);
  });

  it('encodes a status filter in the shared list-param shape', () => {
    const url = leadsListUrl({ ...baseQuery, filter: ['status'], filter_by: ['new'] });
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('filter')).toBe('status');
    expect(params.get('filter_by')).toBe('new');
  });
});
