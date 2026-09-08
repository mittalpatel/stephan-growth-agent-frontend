'use client';

import type { HTMLInputTypeAttribute } from 'react';
import type { FieldValues, Path } from 'react-hook-form';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { fieldDescriptionCls, fieldInputCls, fieldLabelCls, getRhfError } from './fieldStyles';

// Generic, form-agnostic text input bound to the surrounding RHF context. Drop it
// inside any <FormProvider> and it wires value, validation error, and the
// submit-disabled state on its own — no per-form prop drilling.
type Props<T extends FieldValues> = Readonly<{
  name: Path<T>;
  label: string;
  /** One line under the label explaining what this field actually changes. */
  description?: string;
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}>;

export function RHFTextField<T extends FieldValues>({
  name,
  label,
  description,
  type = 'text',
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
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled || isSubmitting}
        aria-invalid={error ? true : undefined}
        {...register(name)}
        className={cn(fieldInputCls, error && 'border-error')}
      />
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
