# PR Review Checklist

## Separation

- [ ] No `useQuery`/`useMutation`, request body, or error mapping inside a component
- [ ] The hook returns a flat bag; the component renders it
- [ ] No dead code — a control wired to nothing, a fallback contradicting the types, an
      unused branch

## State

- [ ] List state in the URL, namespaced
- [ ] Nothing in `useState` that should survive a refresh or be shareable
- [ ] Nothing in the URL that is merely a personal display preference

## Strings

- [ ] Every user-visible string from `src/locales` — including `aria-label`,
      `placeholder`, `alt`, `title`, and toasts
- [ ] No template literal building visible text; `format()`/`plural()` used
- [ ] No em-dash in visible copy

## Styling

- [ ] Semantic tokens only. No hex, no `bg-white`, no `text-gray-*`
- [ ] **Screenshot or verify in both themes**
- [ ] No direct `radix-ui` import; nothing hand-edited under `components/ui/`

## Accessibility

- [ ] Fields labelled, not placeholder-only
- [ ] Icon-only controls have an `aria-label`
- [ ] Focus visible; dialogs keyboard-navigable
- [ ] No colour-only status signalling

## Types and contract

- [ ] DTO names match the backend serializer exactly
- [ ] Zod names match too, or field errors will not bind inline
- [ ] `contracts.test.ts` still passes; if it fails, the **mirror** was fixed, not the
      JSON

## Tests

- [ ] New logic covered; ratcheted directories not lowered
- [ ] Queries by role, not by class
- [ ] Tests independent of the demo module

## Documentation

- [ ] `context/app/**/page.md` matches the code as left
- [ ] `context/changelog.md` appended
- [ ] No doc cites a path that does not exist

## Scope

- [ ] Does what the ticket asked and not more
