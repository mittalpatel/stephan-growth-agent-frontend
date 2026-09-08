'use client';

import { Plus, X } from 'lucide-react';
import type { FieldValues, Path } from 'react-hook-form';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fieldInputCls, fieldLabelCls, getRhfError } from './fieldStyles';

// A repeatable list of plain-text rows (e.g. suggested questions, prohibited
// phrases) bound to a top-level array field via `useFieldArray`. No shared
// primitive like this existed before — every RHF field in this folder is a
// single scalar. `addLabel`/`removeLabel` are props rather than baked-in
// English text so every caller stays on its own locale keys, per AGENTS.md's
// no-hardcoded-strings rule.
//
// `useFieldArray` needs a stable object per row, so the field's actual RHF
// value is `{ value: string }[]`, not `string[]` — callers convert to/from a
// plain string array only at the read/submit boundary (see
// `useAgentDraftForm`'s `toStringList`/`fromStringList`).
type Props<T extends FieldValues> = Readonly<{
  name: Path<T>;
  label: string;
  addLabel: string;
  removeLabel: string;
  itemPlaceholder?: string;
  disabled?: boolean;
  maxItems?: number;
  className?: string;
}>;

export function RHFStringListField<T extends FieldValues>({
  name,
  label,
  addLabel,
  removeLabel,
  itemPlaceholder,
  disabled,
  maxItems,
  className,
}: Props<T>) {
  const {
    control,
    register,
    formState: { errors, isSubmitting },
  } = useFormContext<T>();
  const { fields, append, remove } = useFieldArray({ control, name: name as never });
  const error = getRhfError(errors, name);
  const isDisabled = disabled || isSubmitting;
  const atLimit = maxItems !== undefined && fields.length >= maxItems;

  return (
    <div className={className}>
      <label className={fieldLabelCls}>{label}</label>
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <input
              type="text"
              placeholder={itemPlaceholder}
              disabled={isDisabled}
              {...register(`${name}.${index}.value` as Path<T>)}
              className={cn(fieldInputCls)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={removeLabel}
              disabled={isDisabled}
              onClick={() => remove(index)}
            >
              <X className="size-4" aria-hidden />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        disabled={isDisabled || atLimit}
        onClick={() => append({ value: '' } as never)}
      >
        <Plus className="size-4" aria-hidden />
        {addLabel}
      </Button>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
