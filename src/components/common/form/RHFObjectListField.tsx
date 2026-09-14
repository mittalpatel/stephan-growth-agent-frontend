'use client';

import { Plus, X } from 'lucide-react';
import type { FieldValues, Path } from 'react-hook-form';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fieldDescriptionCls, fieldInputCls, fieldLabelCls, getRhfError } from './fieldStyles';
import type { SelectFieldOption } from './RHFSelectField';

/**
 * One editable cell in a row. Deliberately only the two input kinds the
 * first caller needs (a constrained choice and a bounded integer) rather
 * than a general column framework: a `type` union is cheap to extend when a
 * real third case turns up, and an abstraction built for cases nobody has
 * yet is the one that ends up bent out of shape by the first one that does.
 */
export type ObjectListColumn = Readonly<{
  /** Key on each row object. Must match the backend's own key. */
  key: string;
  /** Visible column heading. */
  label: string;
  type: 'select' | 'number';
  /** `select` only. */
  options?: readonly SelectFieldOption[];
  /** `number` only, forwarded to the input for native stepper bounds. */
  min?: number;
  max?: number;
  /** Relative width inside the row, as a flex basis class. */
  className?: string;
}>;

type Props<T extends FieldValues> = Readonly<{
  name: Path<T>;
  label: string;
  /** One line under the label explaining what this list actually changes. */
  description?: string;
  columns: readonly ObjectListColumn[];
  /** Values for a newly appended row. */
  emptyRow: Record<string, unknown>;
  addLabel: string;
  removeLabel: string;
  disabled?: boolean;
  maxItems?: number;
  /** Shown in place of the rows when the list is empty. */
  emptyLabel?: string;
  className?: string;
}>;

/**
 * A repeatable list of **objects** bound to an array field via
 * `useFieldArray`, the object counterpart to `RHFStringListField`.
 *
 * Unlike that one, rows are stored in their real wire shape (`{field,
 * weight}`) rather than wrapped in `{ value }` — the wrapper exists there
 * only because `useFieldArray` needs each row to be an object, which a
 * string is not and an object already is. So there is no conversion at the
 * read/submit boundary for this field.
 *
 * Per-row errors are read from RHF's nested error shape, so a Zod issue on
 * one cell renders under that cell instead of collapsing to a single message
 * for the whole list. A list-level issue (too many rows, a duplicate across
 * rows) still renders once at the bottom.
 *
 * `addLabel`/`removeLabel`/`emptyLabel` are props rather than baked-in
 * English, same rule as every other primitive here.
 */
export function RHFObjectListField<T extends FieldValues>({
  name,
  label,
  description,
  columns,
  emptyRow,
  addLabel,
  removeLabel,
  disabled,
  maxItems,
  emptyLabel,
  className,
}: Props<T>) {
  const {
    control,
    register,
    formState: { errors, isSubmitting },
  } = useFormContext<T>();
  const { fields, append, remove } = useFieldArray({ control, name: name as never });
  const listError = getRhfError(errors, name);
  const isDisabled = disabled || isSubmitting;
  const atLimit = maxItems !== undefined && fields.length >= maxItems;

  /** Digs `errors[name][index][key].message` out without fighting `Path<T>`. */
  function cellError(index: number, key: string): string | undefined {
    const rows = (errors as Record<string, unknown>)[name] as
      | Record<number, Record<string, { message?: unknown } | undefined>>
      | undefined;
    const message = rows?.[index]?.[key]?.message;
    return typeof message === 'string' ? message : undefined;
  }

  return (
    <div className={className}>
      <label className={fieldLabelCls}>{label}</label>
      {description && <p className={fieldDescriptionCls}>{description}</p>}

      {fields.length === 0 && emptyLabel ? (
        <p className="text-muted-foreground text-sm">{emptyLabel}</p>
      ) : (
        <div className="space-y-2">
          {/* Column headings render once, above the rows, so each cell isn't
              repeating a label. Hidden from assistive tech, which reads the
              per-cell aria-label instead. */}
          <div className="flex items-center gap-2" aria-hidden>
            {columns.map((column) => (
              <span
                key={column.key}
                className={cn('text-muted-foreground text-xs font-medium', column.className)}
              >
                {column.label}
              </span>
            ))}
            {/* Spacer matching the remove button, so headings stay aligned. */}
            <span className="size-9 shrink-0" />
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="space-y-1">
              <div className="flex items-center gap-2">
                {columns.map((column) => {
                  const error = cellError(index, column.key);
                  const path = `${name}.${index}.${column.key}` as Path<T>;
                  return column.type === 'select' ? (
                    <select
                      key={column.key}
                      aria-label={column.label}
                      aria-invalid={error ? true : undefined}
                      disabled={isDisabled}
                      {...register(path)}
                      className={cn(fieldInputCls, column.className, error && 'border-error')}
                    >
                      {(column.options ?? []).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      key={column.key}
                      type="number"
                      inputMode="numeric"
                      min={column.min}
                      max={column.max}
                      aria-label={column.label}
                      aria-invalid={error ? true : undefined}
                      disabled={isDisabled}
                      {...register(path, { valueAsNumber: true })}
                      className={cn(fieldInputCls, column.className, error && 'border-error')}
                    />
                  );
                })}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  aria-label={removeLabel}
                  disabled={isDisabled}
                  onClick={() => remove(index)}
                >
                  <X className="size-4" aria-hidden />
                </Button>
              </div>
              {columns.map((column) => {
                const error = cellError(index, column.key);
                return error ? (
                  <p key={column.key} className="text-xs text-error">
                    {error}
                  </p>
                ) : null;
              })}
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        disabled={isDisabled || atLimit}
        onClick={() => append(emptyRow as never)}
      >
        <Plus className="size-4" aria-hidden />
        {addLabel}
      </Button>
      {listError && <p className="mt-1 text-xs text-error">{listError}</p>}
    </div>
  );
}
