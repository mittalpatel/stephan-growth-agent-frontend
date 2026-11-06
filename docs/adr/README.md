# Architecture Decision Records

One decision per file, immutable once accepted. If a decision changes, add a new ADR
that supersedes the old one rather than editing it — the value is in the record of
_why_, including reasoning that later turned out to be wrong.

Each ADR states what was decided, what was rejected, and why. An ADR without the
rejected alternative is just documentation; the alternatives are the point, because they
are what someone will propose again in six months.

Numbering is shared across both repos, so ADR-0009 means the same decision on either
side. Each repo carries only the ADRs that constrain it — the gaps in the sequence are
decisions that live in the other one.

| #                                      | Decision                                                      |
| -------------------------------------- | ------------------------------------------------------------- |
| [0001](0001-tanstack-query.md)         | TanStack Query, not SWR                                       |
| [0005](0005-response-envelope.md)      | A response envelope, not raw DRF                              |
| [0006](0006-dynamic-rbac.md)           | DB-backed dynamic RBAC, not a static role enum                |
| [0007](0007-token-storage.md)          | Access token in memory, refresh in an httpOnly chunked cookie |
| [0009](0009-coverage-policy.md)        | 90% backend floor, directory ratchets on the frontend         |
| [0010](0010-namespaced-url-params.md)  | Namespaced URL query keys                                     |
| [0011](0011-two-repos.md)              | Two repositories, not a monorepo                              |
| [0012](0012-in-repo-docs-canonical.md) | In-repo `docs/` and `.claude/` are canonical                  |
| [0013](0013-static-typed-locales.md)   | Static typed catalogs, not runtime translations               |
| [0014](0014-shadcn-stock-theme.md)     | shadcn stock theme, no brand palette (partly superseded)      |
| [0017](0017-yb-inspire-brand-theme.md) | YB Inspire brand theme, dark-first (superseded)               |
| [0018](0018-yb-inspire-accent-only.md) | YB Inspire as accent colours only, on the neutral theme       |
| [0019](0019-per-user-language.md)      | Per-user language through a read-through catalog              |
| [0020](0020-growth-agents-theme.md)    | Growth Agents colours and Inter typography                    |
