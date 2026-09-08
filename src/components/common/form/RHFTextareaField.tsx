'use client';

import type { FieldValues, Path } from 'react-hook-form';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { fieldDescriptionCls, fieldInputCls, fieldLabelCls, getRhfError } from './fieldStyles';

// Textarea counterpart to RHFTextField, for multi-line fields (e.g. a rejection
// reason). Same wiring: drop inside a <FormProvider>, no prop drilling.
type Props<T extends FieldValues> = Readonly<{
  name: Path<T>;
  label: string;
  /** One line under the label explaining what this field actually changes. */
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  className?: string;
}>;

export function RHFTextareaField<T extends FieldValues>({
  name,
  label,
  description,
  placeholder,
  disabled,
  required,
  rows = 3,
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
      <textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled || isSubmitting}
        aria-invalid={error ? true : undefined}
        {...register(name)}
        className={cn(fieldInputCls, 'h-auto resize-y', error && 'border-error')}
      />
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
