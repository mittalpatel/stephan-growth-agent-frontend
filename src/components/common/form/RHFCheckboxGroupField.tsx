'use client';

import { Controller, type FieldValues, type Path } from 'react-hook-form';
import { useFormContext } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { fieldDescriptionCls, fieldLabelCls, getRhfError } from './fieldStyles';
import type { SelectFieldOption } from './RHFSelectField';

type Props<T extends FieldValues> = Readonly<{
  name: Path<T>;
  label: string;
  /** One line under the label explaining what this field actually changes. */
  description?: string;
  options: readonly SelectFieldOption[];
  disabled?: boolean;
  className?: string;
}>;

/**
 * A fixed set of checkboxes bound to one **array** field, for picking any
 * subset of a small known list.
 *
 * Distinct from a multi-select: with three or four options a group of
 * checkboxes shows every choice and its current state at a glance, where a
 * select hides them behind a click. Use `RHFSelectField` when exactly one
 * value is allowed, and this when several are.
 *
 * Goes through `Controller` rather than `register` because the value is an
 * array assembled from several inputs, not one input's own value, and Radix's
 * checkbox is not a native input `register` could bind to anyway.
 */
export function RHFCheckboxGroupField<T extends FieldValues>({
  name,
  label,
  description,
  options,
  disabled,
  className,
}: Props<T>) {
  const {
    control,
    formState: { errors, isSubmitting },
  } = useFormContext<T>();
  const error = getRhfError(errors, name);
  const isDisabled = disabled || isSubmitting;

  return (
    <div className={className}>
      <span className={fieldLabelCls}>{label}</span>
      {description && <p className={fieldDescriptionCls}>{description}</p>}
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const selected: string[] = Array.isArray(field.value) ? field.value : [];
          return (
            <div className="flex flex-col gap-2">
              {options.map((option) => {
                const checked = selected.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className="flex w-fit cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      disabled={isDisabled}
                      onCheckedChange={(next) =>
                        // Filter-then-append rather than toggling in place, so
                        // the stored order follows the option list instead of
                        // the order the operator happened to click.
                        field.onChange(
                          next === true
                            ? options
                                .map((o) => o.value)
                                .filter((v) => v === option.value || selected.includes(v))
                            : selected.filter((v) => v !== option.value)
                        )
                      }
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
          );
        }}
      />
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
