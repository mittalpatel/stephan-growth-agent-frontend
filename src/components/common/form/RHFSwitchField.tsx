'use client';

import type { FieldValues, Path } from 'react-hook-form';
import { useController, useFormContext } from 'react-hook-form';
import { Switch } from '@/components/ui/switch';

// Boolean toggle bound to the surrounding RHF context. Uses useController because
// the Radix Switch is a controlled `onCheckedChange` component, not a native input
// that register() can wire up directly.
type Props<T extends FieldValues> = Readonly<{
  name: Path<T>;
  label: string;
  /** One line explaining what this toggle actually changes. */
  description?: string;
  disabled?: boolean;
}>;

export function RHFSwitchField<T extends FieldValues>({
  name,
  label,
  description,
  disabled,
}: Props<T>) {
  const {
    control,
    formState: { isSubmitting },
  } = useFormContext<T>();
  const { field } = useController({ name, control });

  return (
    <div>
      <label className="flex items-center gap-3 text-sm text-foreground">
        <Switch
          checked={Boolean(field.value)}
          onCheckedChange={field.onChange}
          disabled={disabled || isSubmitting}
        />
        {label}
      </label>
      {description && <p className="text-muted-foreground mt-1 ml-11 text-xs">{description}</p>}
    </div>
  );
}
