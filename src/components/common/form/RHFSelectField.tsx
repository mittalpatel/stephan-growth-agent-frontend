'use client';

import type { FieldValues, Path } from 'react-hook-form';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { fieldDescriptionCls, fieldInputCls, fieldLabelCls, getRhfError } from './fieldStyles';

export type SelectFieldOption = Readonly<{ value: string; label: string }>;

// Generic native <select> bound to the surrounding RHF context. Pass `placeholder`
// to render a leading empty-value option (e.g. an optional field's "—").
type Props<T extends FieldValues> = Readonly<{
  name: Path<T>;
  label: string;
  /** One line under the label explaining what this field actually changes. */
  description?: string;
  options: readonly SelectFieldOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}>;

export function RHFSelectField<T extends FieldValues>({
  name,
  label,
  description,
  options,
  placeholder,
  disabled,
  required,
  className,
}: Props<T>) {
  const {
    register,
    formState: { errors, isSubmitting },
  } = useFormContext<T>();
  const error = getRhfError(errors, name);

  return (
    <div className={className}>
      <label className={fieldLabelCls} htmlFor={name}>
        {label}
        {required ? ' *' : ''}
      </label>
      {description && <p className={fieldDescriptionCls}>{description}</p>}
      <select
        id={name}
        disabled={disabled || isSubmitting}
        aria-invalid={error ? true : undefined}
        {...register(name)}
        className={cn(fieldInputCls, error && 'border-error')}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
