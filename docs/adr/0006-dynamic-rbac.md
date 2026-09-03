# ADR-0006: DB-backed dynamic RBAC, not a static role enum

**Status:** Accepted

## Decision

Permissions are `{resource}:{action}` codes defined in code
(`common/constants/permissions.py`) and _assigned_ through database rows: `Role`,
`RolePermission`, `UserRoleAssignment`, `UserPermissionOverride`.
`PermissionResolver` computes the effective set as **role ∪ grants − denies**, cached
per user. There is no denormalized per-user permission table.

## Why not a static role enum

`if user.role == Role.ADMIN` scatters the authorization model across every view, and
changing what a role may do becomes a deploy. Real requests — "give this one person
export access for the audit" — then get answered by inventing a new role, and the role
list grows until nobody can say what any of them mean.

## Why codes are still defined in code

The alternative — permissions as pure data — means a typo in the admin creates a
permission that gates nothing, silently. Defining the codes in an enum makes them
greppable, type-checked, and reviewable in a diff. Assignment is data; the vocabulary
is code.

Adding a permission is a code change plus a `seed_rbac` run, never a migration.

## The algebra, and the part that surprises people

`manage` subsumes `view`, `create`, `update`, `delete`. It does **not** imply `execute`
or `export`.

That exclusion is deliberate and it is the rule most likely to be "simplified" by
someone assuming manage means everything. Editing a record and bulk-extracting the whole
table are different kinds of authority; so are editing and triggering an operation. The
demo module's four permissions exist specifically so this stays tested rather than
merely documented.

**Deny always wins** over a grant, regardless of role.

## Fail closed

`HasPermission` denies when it cannot determine the answer. A permission check that
errors open turns a bug into a breach.

## Consequences

- Every write to a role or override must invalidate the resolver cache immediately.
  TTL-based expiry is not acceptable for authorization: it means a revoked permission
  keeps working for a while.
- The frontend mirrors this algebra in `src/lib/helper.ts` and asserts it against the
  exported contract in CI.
