# Documentation Index

**This is the only file read unconditionally.** Everything else is opened because its
topic is in play. Each entry says when to read it, so relevance is decidable from here.

Reading the whole tree for every request does not scale and wastes the window.

## Topics

| Topic                                        | Read this when                                               |
| -------------------------------------------- | ------------------------------------------------------------ |
| [02-api-contract](topics/02-api-contract.md) | Calling an endpoint, adding a service, handling an API error |
| [03-auth-rbac](topics/03-auth-rbac.md)       | Gating a control or route; tokens, sessions, permissions     |
| [06-forms](topics/06-forms.md)               | Building or touching any form                                |
| [07-routing-rsc](topics/07-routing-rsc.md)   | Adding a route; server vs client components                  |
| [08-state](topics/08-state.md)               | Deciding where a piece of state belongs                      |
| [09-testing](topics/09-testing.md)           | Adding a hook, service, or user-visible behaviour            |
| [10-security](topics/10-security.md)         | Auth, user-supplied content, dependencies, the CSP           |
| [13-i18n](topics/13-i18n.md)                 | Any user-facing string; formatting; adding a language        |
| [14-infra](topics/14-infra.md)               | The build, CI, or the deploy path                            |
| [15-ui-design](topics/15-ui-design.md)       | Building or changing anything visual                         |
| [99-demo-module](topics/99-demo-module.md)   | Starting your first feature, or removing the demo            |

## Checklists

| Checklist                                | Use                            |
| ---------------------------------------- | ------------------------------ |
| [new-feature](checklists/new-feature.md) | Building a new route, in order |
| [pr-review](checklists/pr-review.md)     | Reviewing a change             |
| [pre-release](checklists/pre-release.md) | Before a deploy                |

## Decisions

[adr/](adr/README.md) — one accepted decision per file, with what was rejected and why.

## The other two trees

| Tree                   | Holds                                 | Changes      |
| ---------------------- | ------------------------------------- | ------------ |
| **`docs/`** (here)     | Rules — how this codebase is built    | Rarely       |
| `context/`             | Current state — what exists right now | Every change |
| `context/changelog.md` | History — what changed and when       | Append-only  |

`AGENTS.md` is the always-loaded rule file and takes precedence over everything here.

## Conventions for these docs

- One topic per file, self-contained, no prerequisite chains.
- Every rule cites the file that implements it. A rule with no implementation is an ADR
  or a TODO, not a rule.
- **No doc may reference a path that does not exist.** `scripts/check-doc-paths.mjs`
  enforces this in CI — a doc citing a missing file trains readers, human and otherwise,
  to invent paths.
