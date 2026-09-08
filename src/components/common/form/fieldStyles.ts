// Shared styling + error helper for the RHF-bound form primitives. Centralized so
// every field renders identically (and so a design change is one edit, not N).
import type { FieldErrors, FieldValues, Path } from 'react-hook-form';

export const fieldInputCls =
  'border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring/50 disabled:bg-muted disabled:text-muted-foreground w-full rounded-md border px-3 py-2 text-sm transition outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed';

export const fieldLabelCls = 'mb-1.5 block text-sm font-medium';

// A one-line "what this changes" helper under the label, above the input —
// distinct from the error message (which renders below the input, in
// text-error). Optional on every RHF field primitive; most fields still
// don't need one, but a field whose effect isn't obvious from its label
// alone (most of the agent theme/behavior config) should carry one rather
// than making the operator guess or trial-and-error it.
export const fieldDescriptionCls = 'text-muted-foreground mb-1.5 text-xs';

// Reads a flat field's error message off RHF's `formState.errors` without fighting
// the `Path<T>` index type. Returns undefined when the field is valid.
export function getRhfError<T extends FieldValues>(
  errors: FieldErrors<T>,
  name: Path<T>
): string | undefined {
  const entry = (errors as Record<string, { message?: unknown } | undefined>)[name];
  return typeof entry?.message === 'string' ? entry.message : undefined;
}
