'use client';

import type { FieldValues, Path } from 'react-hook-form';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { fieldDescriptionCls, fieldInputCls, fieldLabelCls, getRhfError } from './fieldStyles';

// Hex-color counterpart to RHFTextField: a text input (so an operator can
// paste/type a hex value, unlike a bare `type="color"` swatch which forces
// the OS picker) paired with a native swatch that reflects and edits the
// same value. Deliberately not a design-system color (per AGENTS.md's
// "colors from globals.css only" rule) — this field edits user-authored
// widget/brand hex values, not the app's own chrome.
type Props<T extends FieldValues> = Readonly<{
  name: Path<T>;
  label: string;
  /** One line explaining where this color is used on the widget. */
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}>;

export function RHFColorField<T extends FieldValues>({
  name,
  label,
  description,
  placeholder,
  disabled,
  required,
  className,
}: Props<T>) {
  const {
    register,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useFormContext<T>();
  const error = getRhfError(errors, name);
  const value = watch(name) as unknown as string;
  const isValidHex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value || '');

  return (
    <div className={className}>
      <label className={fieldLabelCls} htmlFor={name}>
        {label}
        {required ? ' *' : ''}
      </label>
      {description && <p className={fieldDescriptionCls}>{description}</p>}
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-hidden
          tabIndex={-1}
          disabled={disabled || isSubmitting}
          // A neutral starting point for the OS picker when nothing is set
          // yet — not pure black, which would otherwise read as "this field
          // is already set to black" rather than "unset".
          value={isValidHex ? value : '#9CA3AF'}
          onChange={(e) =>
            setValue(name, e.target.value as never, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          className={cn(
            'border-input h-8 w-8 shrink-0 cursor-pointer rounded-md border p-0.5 disabled:cursor-not-allowed disabled:opacity-50',
            !isValidHex && 'opacity-40'
          )}
        />
        <input
          id={name}
          type="text"
          placeholder={placeholder}
          disabled={disabled || isSubmitting}
          aria-invalid={error ? true : undefined}
          {...register(name)}
          className={cn(fieldInputCls, error && 'border-error')}
        />
      </div>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
