# Legal Pages

**Source:** `src/app/legal/privacy-policy/page.tsx`, `src/app/legal/terms-conditions/page.tsx`

Public, outside both route groups — reachable without a session, linked from the
bottom of the login form.

Both render the shared `LegalDocument` component with a `{ title, subtitle, sections }`
object from `t.legal`. A section is `{ heading?, body: string[] }`, so adding one is a
catalog edit with no component change.

## The content is placeholder text

`src/locales/en/legal.ts` ships an **outline**, not a policy. The pages and layout are
real; the words are stand-ins that say so explicitly.

Replace them before launch, and write them for your own application rather than
adapting someone else's. A privacy notice is a commitment about what your systems
actually do with data — one copied from elsewhere describes a different set of systems,
and the inaccuracy is the liability. Have counsel review the result.

If the product has no such pages, delete `src/app/legal/` and the two links in
`LoginForm.tsx`.
