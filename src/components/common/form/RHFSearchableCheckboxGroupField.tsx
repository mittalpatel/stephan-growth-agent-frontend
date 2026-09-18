'use client';

import { useMemo, useState } from 'react';
import { Controller, useFormContext, type FieldValues, type Path } from 'react-hook-form';
import { Search } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { format } from '@/lib/i18n';
import { fieldDescriptionCls, fieldLabelCls, getRhfError } from './fieldStyles';
import type { SelectFieldOption } from './RHFSelectField';

type Props<T extends FieldValues> = Readonly<{
  name: Path<T>;
  label: string;
  /** One line under the label explaining what this field actually changes. */
  description?: string;
  options: readonly SelectFieldOption[];
  disabled?: boolean;
  required?: boolean;
  className?: string;
  /** Copy. Passed in rather than read from a locale namespace here so the
   * primitive stays usable by any feature, the same way `RHFSelectField` takes
   * its `placeholder`. */
  copy: Readonly<{
    searchPlaceholder: string;
    selectAll: string;
    deselectAll: string;
    /** Template carrying `{selected}` and `{total}`. It arrives unformatted
     * because both counts are derived inside this component, so the caller has
     * nothing to substitute at the call site. */
    selectedCount: string;
    noMatches: string;
  }>;
}>;

/**
 * A searchable set of checkboxes bound to one **array** field, for picking a
 * subset of a large known list.
 *
 * The sibling `RHFCheckboxGroupField` is the right choice for three or four
 * options, where showing every row at once is the whole point. Past roughly a
 * dozen, that becomes a wall that buries the rest of the form, so this adds the
 * three affordances that make a long list workable: a filter, select/deselect
 * over whatever the filter currently shows, and a bounded scroll area. Same
 * shape as the knowledge scope panel's source picker
 * (`KnowledgeTargetsPanel`), which is where the pattern was proven first.
 *
 * Select-all and deselect-all deliberately act on the **filtered** subset, not
 * the whole list: with a search box present, a control that silently reaches
 * past what is on screen is a footgun.
 *
 * Goes through `Controller` rather than `register` because the value is an
 * array assembled from several inputs, and Radix's checkbox is not a native
 * input `register` could bind to anyway.
 */
export function RHFSearchableCheckboxGroupField<T extends FieldValues>({
  name,
  label,
  description,
  options,
  disabled,
  required,
  className,
  copy,
}: Props<T>) {
  const {
    control,
    formState: { errors, isSubmitting },
  } = useFormContext<T>();
  const [search, setSearch] = useState('');
  const error = getRhfError(errors, name);
  const isDisabled = disabled || isSubmitting;

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => option.label.toLowerCase().includes(query));
  }, [options, search]);

  return (
    <div className={className}>
      <span className={fieldLabelCls}>
        {label}
        {required ? ' *' : ''}
      </span>
      {description && <p className={fieldDescriptionCls}>{description}</p>}

      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const selected: string[] = Array.isArray(field.value) ? field.value : [];
          const allVisibleSelected = visible.every((option) => selected.includes(option.value));
          const someVisibleSelected = visible.some((option) => selected.includes(option.value));

          // Filter-then-append rather than toggling in place, so the stored
          // order follows the option list instead of the order the operator
          // happened to click. Matches `RHFCheckboxGroupField`.
          const inOptionOrder = (next: ReadonlySet<string>) =>
            options.map((option) => option.value).filter((value) => next.has(value));

          return (
            <div className="space-y-2">
              <div className="relative">
                <Search
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
                  aria-hidden
                />
                <Input
                  type="search"
                  value={search}
                  disabled={isDisabled}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={copy.searchPlaceholder}
                  aria-label={copy.searchPlaceholder}
                  className="pl-8"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-muted-foreground text-xs">
                  {format(copy.selectedCount, {
                    selected: selected.length,
                    total: options.length,
                  })}
                </p>
                {!isDisabled && visible.length > 0 && (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="text-primary text-xs font-medium hover:underline disabled:pointer-events-none disabled:opacity-50"
                      disabled={allVisibleSelected}
                      onClick={() =>
                        field.onChange(
                          inOptionOrder(
                            new Set([...selected, ...visible.map((option) => option.value)])
                          )
                        )
                      }
                    >
                      {copy.selectAll}
                    </button>
                    <button
                      type="button"
                      className="text-primary text-xs font-medium hover:underline disabled:pointer-events-none disabled:opacity-50"
                      disabled={!someVisibleSelected}
                      onClick={() => {
                        const visibleValues = new Set(visible.map((option) => option.value));
                        field.onChange(selected.filter((value) => !visibleValues.has(value)));
                      }}
                    >
                      {copy.deselectAll}
                    </button>
                  </div>
                )}
              </div>

              <div className="border-border max-h-64 space-y-1 overflow-y-auto rounded-md border p-2">
                {visible.length === 0 ? (
                  <p className="text-muted-foreground px-1 py-2 text-sm">{copy.noMatches}</p>
                ) : (
                  visible.map((option) => {
                    const checked = selected.includes(option.value);
                    return (
                      <label
                        key={option.value}
                        className="hover:bg-accent flex w-full cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm"
                      >
                        <Checkbox
                          checked={checked}
                          disabled={isDisabled}
                          onCheckedChange={(next) =>
                            field.onChange(
                              next === true
                                ? inOptionOrder(new Set([...selected, option.value]))
                                : selected.filter((value) => value !== option.value)
                            )
                          }
                        />
                        {option.label}
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          );
        }}
      />
      {error && <p className="text-error mt-1 text-xs">{error}</p>}
    </div>
  );
}
