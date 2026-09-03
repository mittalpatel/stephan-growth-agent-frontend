# ADR-0012: In-repo `docs/` and `.claude/` are canonical

**Status:** Accepted

## Context

`CLAUDE.md` §2 says the best-practices / architecture-docs folder is developer-local,
distributed out-of-band, gitignored, and never assumed to exist.

`docs/` and `.claude/skills/` put a distilled rule set _inside_ the repo and expect it
to be read.

Read carelessly, those contradict each other, and the contradiction matters because one
of them will be ignored — probably whichever the reader saw second.

## Decision

They cover different material.

|          | In-repo `docs/` + `.claude/`         | The gitignored guideline folder                                                 |
| -------- | ------------------------------------ | ------------------------------------------------------------------------------- |
| Contains | Rules for _this_ codebase            | Bulky external material: legacy system specs, prior-art references, vendor docs |
| Size     | Small, curated, one topic per file   | Large, unbounded, often not ours to redistribute                                |
| Lifetime | Versioned with the code it describes | Independent                                                                     |
| Read     | Yes, by topic                        | Only when named, and only the relevant file                                     |

The committed trees are canonical and are read normally. §2's gitignore rule governs
only the external material — which stays out of git because it is bulky, changes on its
own schedule, and frequently belongs to someone else.

## Consequences

- A rule that constrains this codebase belongs in `docs/` or a skill, committed. If it
  is only in someone's local folder, it is not a rule.
- `architecture-docs/`, `*-architecture-docs/`, and `best-practices/` stay in
  `.gitignore` regardless of where a developer puts them.
- Both loading rules are the same discipline: read the file for the topic in play, not
  the whole tree.
