# Setup Guide

**Source:** `src/app/guide/page.tsx`, `src/app/guide/GuideReader.tsx`, `src/app/guide/content.ts`

Public, outside both route groups (like `src/app/legal/`) — reachable at `/guide`
with no session. A single scrollable page with a chapter rail: 12 chapters plus a
closing checklist, each rendered from a typed `GuideBlock` union (`heading` /
`paragraph` / `image` / `list` / `note`) so the page has no knowledge of the source
document's structure.

`GuideReader` is a client component only because of three things that need the DOM: a
scroll-spy that highlights the active chapter in the rail, a scroll-progress bar, and
the mobile chapter drawer. Everything else in it could be server-rendered.

## Content and assets

`content.ts` is generated data, not hand-authored prose — it was extracted once from
`YB-Inspire-Setup-Guide.docx` (the walkthrough doc the founders hand to new customers)
via a LibreOffice `--convert-to html` pass, then parsed into the `GuideChapter[]`
shape. Re-generating it means re-running that extraction, not hand-editing the block
arrays; see the docx if the product flow changes enough to need new screenshots.

Screenshots live in `public/guide/` as `ch01-01.png`, `ch01-02.png`, ... (chapter-numbered,
so a re-export lines up predictably) — 41 files, ~5.3 MB total, rendered through `next/image` inside a fixed
`aspect-16/10` frame with `object-contain`, since the source screenshots aren't all
exactly the same pixel size. `public/guide/setup-guide.pdf` is the same document
exported straight to PDF (no chapter nav, just the original pagination) and is what the
sidebar's "Download as PDF" button links to.

## Copy

Page chrome (nav labels, hero copy, button text) is `t.guide` in
`src/locales/en/guide.ts`, same as every other page. The chapter body text itself is
**not** in the locale catalog — it lives in `content.ts` as data, since it is the
document content, not UI chrome, and translating it would mean re-extracting the docx
per language rather than a `cp -r` + translate pass.

## Plan levels chapter (2026-10-14)

Chapter 12 ("Plan levels") is hand-written, not from the docx: it lists all four
levels with their features (client request, 06 Oct review). Level 1, Level 2 and
Level 4 reuse the app's existing tier copy (`t.agents.levelBasic`, each agent's
`upgrade.bullets`, `t.agents.tiers.banner`). Level 3 has no copy anywhere else yet;
its text is a draft from the meeting ("all features with activations") pending
Stephan's confirmation. Chapter 1.3 no longer mentions the removed Get set up list.
