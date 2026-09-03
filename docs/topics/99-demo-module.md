# The Demo Module

**Read this when:** starting your first real feature, or deciding whether to keep the
demo.

The `projects` slice is a complete list-and-detail feature demonstrating every convention
at once. It exists to be read and then either deleted or copied.

**If a pattern is not demonstrated there, it is not part of the house style.**

## What it shows

| Convention                                    | Where                            | Topic                    |
| --------------------------------------------- | -------------------------------- | ------------------------ |
| Hook owns all state, components present       | `hooks/useWidgetsList.ts`        | [08](08-state.md)        |
| URL as the source of truth, namespaced        | `useQueryParams('projects')`     | [08](08-state.md)        |
| Service owns endpoints and keys               | `src/services/projects.ts`       | [02](02-api-contract.md) |
| Exported query key shared with the breadcrumb | `widgetDetailKey`                | [02](02-api-contract.md) |
| Four designed states                          | `components/WidgetsList.tsx`     | [15](15-ui-design.md)    |
| Skeleton shaped like the result               | `components/WidgetsSkeleton.tsx` | [15](15-ui-design.md)    |
| Domain-owned status tone mapping              | `components/WidgetsTable.tsx`    | [15](15-ui-design.md)    |
| Zod names matching the serializer             | `src/lib/schemas/project.ts`     | [06](06-forms.md)        |
| Awaiting `params` at Next 16                  | `[widgetId]/page.tsx`            | [07](07-routing-rsc.md)  |
| Every string from the catalog                 | `src/locales/en/projects.ts`     | [13](13-i18n.md)         |

## The gotcha worth internalizing

`widgetDetailKey` is imported by both `useWidgetDetail` and the breadcrumb resolver. If
they drift, the breadcrumb misses the cache and refetches a record the page already has —
**no error, no visible symptom**, just a redundant request. `projects.spec.ts` counts the
requests for exactly that reason.

Any time two places must agree on a value, export it from one and import it in the other.

## Removing it

```bash
npm run strip-demo     # frontend
make strip-demo        # backend — run both
```

The script deletes the route, service, types, schema, locale namespace, e2e spec, and
context doc, then edits the nav, route permissions, proxy allowlist, locale index, and
breadcrumb resolver. `npm run validate` should stay green.

It **fails loudly** on a fragment it cannot find. If you reference the demo from shared
code, register the removal in `scripts/strip-demo.mjs` in the same turn — the guard only
protects references that were registered.

Keep shared-code tests independent of the demo: a test asserting on `/projects` fails
after the strip for a reason unrelated to what it tests.
