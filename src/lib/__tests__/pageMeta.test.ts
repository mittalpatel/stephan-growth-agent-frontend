import { describe, it, expect } from 'vitest';

import { getPageMeta } from '../pageMeta';

describe('getPageMeta', () => {
  // Uses `/organization/members`, not the demo module's route: these tests must
  // keep passing after `npm run strip-demo`, and one that asserted on
  // `/projects` would fail for a reason that has nothing to do with `getPageMeta`.
  it('derives meta for a route that is a sidebar entry', () => {
    expect(getPageMeta('/organization/members').title).toBeTruthy();
  });

  it('falls back to the parent for a detail route (longest-prefix match)', () => {
    const parent = getPageMeta('/organization/members');
    const detail = getPageMeta('/organization/members/2f1c9a3e-0000-4000-8000-000000000000');
    expect(detail.title).toBe(parent.title);
  });

  it('serves routes registered in EXTRA that are not sidebar entries', () => {
    const meta = getPageMeta('/user-profile');
    expect(meta.title).toBeTruthy();
    expect(meta.subtitle).toBeTruthy();
  });

  it('returns an empty title for unknown paths rather than throwing', () => {
    expect(getPageMeta('/unknown-route-xyz').title).toBe('');
  });

  it('does not prefix-match a partial segment', () => {
    // `/projectsomething` shares a string prefix with `/projects` but is a
    // different route. The match is segment-aware (`path + '/'`), so unrelated
    // pages cannot inherit each other's header.
    expect(getPageMeta('/projectsomething').title).toBe('');
  });
});
