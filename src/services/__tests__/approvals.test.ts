import { describe, it, expect } from 'vitest';

import {
  APPROVAL_CATEGORY_VALUES,
  APPROVAL_STATUS_VALUES,
  APPROVALS_ENDPOINT,
  approvalApproveEndpoint,
  approvalDetailEndpoint,
  approvalDetailKey,
  approvalRejectEndpoint,
  approvalsListUrl,
} from '../approvals';

const APPROVAL_ID = 'b1c2d3e4-3333-4f5a-8b9c-0d1e2f3a4b5c';

describe('approval endpoints', () => {
  it('builds the detail endpoint under the approvals root', () => {
    expect(approvalDetailEndpoint(APPROVAL_ID)).toBe(`${APPROVALS_ENDPOINT}${APPROVAL_ID}/`);
  });

  it('builds the approve endpoint from the detail endpoint', () => {
    expect(approvalApproveEndpoint(APPROVAL_ID)).toBe(
      `${approvalDetailEndpoint(APPROVAL_ID)}approve/`
    );
  });

  it('builds the reject endpoint from the detail endpoint', () => {
    expect(approvalRejectEndpoint(APPROVAL_ID)).toBe(
      `${approvalDetailEndpoint(APPROVAL_ID)}reject/`
    );
  });

  it('only offers the enum values the backend actually defines', () => {
    expect([...APPROVAL_STATUS_VALUES]).toEqual(['pending', 'approved', 'rejected']);
    expect([...APPROVAL_CATEGORY_VALUES]).toEqual(['outreach']);
  });
});

describe('approvals list URL', () => {
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
    expect(approvalsListUrl(baseQuery)).toBe(`${APPROVALS_ENDPOINT}?page=1&page_size=25`);
  });

  it('encodes an active filter in the shared list-param shape', () => {
    const url = approvalsListUrl({ ...baseQuery, filter: ['status'], filter_by: ['pending'] });
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('filter')).toBe('status');
    expect(params.get('filter_by')).toBe('pending');
  });
});

describe('approval query keys', () => {
  it('keys the detail cache by approval id', () => {
    expect(approvalDetailKey(APPROVAL_ID)).toEqual(['approval-detail', APPROVAL_ID]);
    expect(approvalDetailKey(APPROVAL_ID)).not.toEqual(approvalDetailKey('other'));
  });
});
