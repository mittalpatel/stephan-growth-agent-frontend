# Forms

**Read this when:** building or touching any form.

## Always React Hook Form + Zod

No `useState`-per-field, no ad-hoc `validate()`. Schema in `src/lib/schemas/*`, typed
via `z.infer`, resolved with `@hookform/resolvers/zod`.

## Field names are load-bearing

Every key must match the backend serializer's field name **exactly**. `applyApiError`
calls `setError(field, …)` with the backend's own key, so a matching name lands the
message under the right input and a mismatched one falls through to a toast.

This is the single most important rule on this page, and the failure is silent: the form
still works, the validation just stops being inline.

## `.trim()` belongs in the schema

```ts
name: z.string().trim().min(1, t.widgets.validation.nameRequired);
```

Not in the submit handler. The schema's transform is what gets validated _and_ what gets
sent; trimming on submit means `'   '` passes `min(1)` and then posts an empty value.

## Build from the shared primitives

`src/components/common/form/` — `RHFTextField`, `RHFSelectField`, `RHFSwitchField` —
inside a `<FormProvider>`. When a field type is missing, add a primitive there rather
than inlining a one-off. Inlining is how forms drift apart visually.

## Cross-field rules

`.refine()` with an explicit `path`, so the message attaches to a field rather than the
form:

```ts
.refine((v) => !(v.status === 'active' && v.quantity <= 0), {
  message: t.widgets.validation.activeNeedsStock,
  path: ['quantity'],
})
```

Mirror the backend's own cross-field `validate()` so the user sees it before submitting.
The server still rejects it independently.

## Client validation is a courtesy

The backend enforces all of it again, plus the rules a client cannot know — uniqueness,
whether the record is frozen, whether this user may act. **A green form is never
authorization.**

## Logic in the hook

The component renders. `use<Feature>Form.ts` holds the schema wiring, the mutation, the
error mapping, and the success handling. A component calling `useMutation` or building a
request body is wrong.

## Accessibility

Label every field — a `placeholder` disappears on focus and is not reliably announced, so
a placeholder-only field is unlabelled for a screen reader. Set `aria-invalid` when a
field has an error, and put the message adjacent to the input.

`noValidate` on the `<form>` so Zod reports the problem rather than the browser's own
tooltip, which is unstyled, untranslated, and inconsistent across browsers.

## Reference

`src/lib/schemas/widget.ts`, `src/app/(public)/components/LoginForm.tsx`.
