'use client';

import type { FieldValues, Path } from 'react-hook-form';
import { useController, useFormContext } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

import { fieldLabelCls } from './fieldStyles';

export type RadioCardOption = Readonly<{
  value: string;
  label: string;
  description: string;
  /** A short tag after the label, such as "Recommended". */
  badge?: string;
}>;

type Props<T extends FieldValues> = Readonly<{
  name: Path<T>;
  label: string;
  options: readonly RadioCardOption[];
  disabled?: boolean;
}>;

/**
 * A one-of-N choice where each option needs a sentence of explanation, shown
 * as selectable cards. A plain select hides those sentences until it is
 * opened, which is exactly when a newcomer needs them in view.
 */
export function RHFRadioCardField<T extends FieldValues>({
  name,
  label,
  options,
  disabled,
}: Props<T>) {
  const {
    control,
    formState: { isSubmitting },
  } = useFormContext<T>();
  const { field } = useController({ name, control });

  return (
    <fieldset className="space-y-1.5">
      <legend className={fieldLabelCls}>{label}</legend>
      <RadioGroup
        value={field.value}
        onValueChange={field.onChange}
        disabled={disabled || isSubmitting}
        className="gap-2"
      >
        {options.map((option) => (
          <Label
            key={option.value}
            className={cn(
              'border-border flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal',
              field.value === option.value && 'border-primary bg-primary/5'
            )}
          >
            <RadioGroupItem value={option.value} className="mt-0.5" />
            <span className="space-y-0.5">
              <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                {option.label}
                {option.badge && <Badge variant="secondary">{option.badge}</Badge>}
              </span>
              <span className="text-muted-foreground block text-xs">{option.description}</span>
            </span>
          </Label>
        ))}
      </RadioGroup>
    </fieldset>
  );
}
