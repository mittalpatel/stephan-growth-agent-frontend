/**
 * Cross-repo contract assertions.
 *
 * The backend generates `contracts/*.json` (`make contracts`); this file checks
 * that the constants in this repo still match them. It is the only thing
 * standing between "both repos compile" and "both repos agree".
 *
 * Two real drifts motivated it, both of which type-checked cleanly on each side:
 * a `limit` → `page_size` rename that silently reverted every list to the
 * default page size, and a `display_name` vs `label` mismatch that rendered
 * blank filter headings.
 *
 * When one of these fails, fix the mirror — do not edit the JSON. The JSON is
 * generated output, and hand-editing it just moves the bug somewhere quieter.
 */
import { describe, it, expect } from 'vitest';

import envelope from '../../contracts/envelope.json';
import listParamsContract from '../../contracts/list_params.json';
import permissionsContract from '../../contracts/permissions.json';
import { LIST_PARAM } from '../services/listParams';
import { can, type PermissionAction } from '../lib/helper';

describe('list params contract', () => {
  it('uses the backend param name for every key it sends', () => {
    expect(LIST_PARAM.page).toBe(listParamsContract.page);
    expect(LIST_PARAM.pageSize).toBe(listParamsContract.page_size);
    expect(LIST_PARAM.search).toBe(listParamsContract.search);
    expect(LIST_PARAM.searchValue).toBe(listParamsContract.search_by);
    expect(LIST_PARAM.filter).toBe(listParamsContract.filter);
    expect(LIST_PARAM.filterValue).toBe(listParamsContract.filter_by);
    expect(LIST_PARAM.sort).toBe(listParamsContract.sort);
    expect(LIST_PARAM.sortDirection).toBe(listParamsContract.sort_direction);
  });

  it('declares the separators every list builder must join on', () => {
    // Columns and value-groups use *different* separators. Swapping them
    // produces a request the backend parses without error and interprets as
    // entirely different filters, which is why they are asserted rather than
    // remembered. `buildProjectListParams` has its own test for applying them.
    expect(listParamsContract.separators.columns).toBe(',');
    expect(listParamsContract.separators.values).toBe(',');
    expect(listParamsContract.separators.value_groups).toBe('|');
  });
});

describe('envelope contract', () => {
  it('reads the field-error key the backend writes', () => {
    expect(envelope.field_errors_key).toBe('errors');
  });

  it('expects Retry-After to be CORS-exposed', () => {
    // A 429 countdown is impossible to render if the header is not exposed —
    // the browser hides it from JS and the message degrades to a generic toast.
    expect(envelope.exposed_headers).toContain('Retry-After');
  });

  it('knows every key the envelope carries', () => {
    expect(envelope.keys).toEqual(['success', 'message', 'data', 'meta', 'errors']);
  });
});

describe('permission contract', () => {
  const { algebra, actions, codes } = permissionsContract;

  it('composes codes with the backend separator', () => {
    expect(algebra.separator).toBe(':');
    for (const code of codes) {
      expect(code).toContain(algebra.separator);
    }
  });

  it('implements manage-subsumes exactly as the backend declares it', () => {
    const held = ['anyresource:manage'];
    for (const action of algebra.manage_subsumes) {
      expect(can(held, 'anyresource', action as PermissionAction)).toBe(true);
    }
  });

  it('does not let manage imply the actions the backend excludes', () => {
    // `execute` and `export` are granted independently — a user who may edit a
    // record is not thereby entitled to run it or bulk-extract it. This is the
    // rule most likely to be "simplified" by someone assuming manage means all.
    const held = ['anyresource:manage'];
    for (const action of algebra.manage_excludes) {
      expect(can(held, 'anyresource', action as PermissionAction)).toBe(false);
    }
  });

  it('covers every action the backend can gate on', () => {
    // If the backend adds an action, `PermissionAction` must grow to match or
    // `can()` silently returns false for it — a control that never appears.
    const supported: PermissionAction[] = [
      'view',
      'manage',
      'create',
      'update',
      'delete',
      'execute',
      'export',
      'billing',
      'transfer',
      'access_manage',
    ];
    expect([...supported].sort()).toEqual([...actions].sort());
  });

  it('gates every route on a permission the backend actually defines', async () => {
    // Catches a route mapped to a resource that was renamed or never existed —
    // the page would then be unreachable for everyone, with no error anywhere.
    const { ROUTE_PERMISSIONS } = await import('../constants/roles');
    const declared = new Set(codes.map((code) => code.split(':')[0]));
    for (const rule of ROUTE_PERMISSIONS) {
      for (const resource of rule.resources) {
        expect(declared).toContain(resource);
      }
    }
  });
});
