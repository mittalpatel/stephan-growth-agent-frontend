'use client';

import type { HTMLInputTypeAttribute } from 'react';
import type { FieldValues, Path } from 'react-hook-form';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { fieldInputCls, fieldLabelCls, getRhfError } from './fieldStyles';

// Generic, form-agnostic text input bound to the surrounding RHF context. Drop it
// inside any <FormProvider> and it wires value, validation error, and the
// submit-disabled state on its own — no per-form prop drilling.
type Props<T extends FieldValues> = Readonly<{
  name: Path<T>;
  label: string;
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}>;

export function RHFTextField<T extends FieldValues>({
  name,
  label,
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
