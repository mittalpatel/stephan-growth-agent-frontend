'use client';

import { useState, useEffect, useRef, startTransition } from 'react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { CalendarDays } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { MotionPopover } from '@/components/motion/MotionPopover';
import { t } from '@/locales';

type DateRangePickerProps = Readonly<{
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  align?: 'left' | 'right';
}>;

export function DateRangePicker({
  value,
  onChange,
  disabled = false,
  minDate,
  maxDate,
  align = 'right',
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange | undefined>(value);
  const containerRef = useRef<HTMLDivElement>(null);
  // date-fns needs its own locale object; swap this when a locale is added.
  const locale = enUS;

  // sync when parent resets value
  useEffect(() => {
    startTransition(() => setTempRange(value));
  }, [value]);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setTempRange(value);
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, value]);

  function formatDate(d: Date) {
    return format(d, 'dd/MM/yyyy', { locale });
  }

  function displayText() {
    if (!value?.from) return t.common.selectRange;
    if (value.from && value.to) return `${formatDate(value.from)} – ${formatDate(value.to)}`;
    return formatDate(value.from);
  }

  function handleOpen() {
    if (disabled) return;
    setTempRange(value);
    setOpen(true);
  }

  function handleSelect(range: DateRange | undefined) {
    setTempRange(range);
  }

  function handleApply() {
    onChange(tempRange);
    setOpen(false);
  }

  function handleCancel() {
    setTempRange(value);
    setOpen(false);
  }

  const isPlaceholder = !value?.from;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button — icon-only on mobile, full label on sm+ */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className="flex items-center justify-between rounded-md border border-input bg-background py-1.5 text-left transition hover:border-input disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[270px] sm:px-4"
      >
        {/* Text label — hidden on mobile */}
        <span
          className={`hidden flex-1 truncate pr-3 font-sans text-sm font-semibold  sm:block ${isPlaceholder ? 'text-muted-foreground' : 'text-foreground'}`}
        >
          {displayText()}
        </span>
        <span className="flex items-center px-1.5 sm:gap-2 sm:pl-3 sm:px-0">
          <span className="hidden h-6 w-px bg-border sm:block" aria-hidden />
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] border-2 border-foreground bg-secondary text-secondary-foreground shadow-[0_1px_0_rgba(0,0,0,0.4)] sm:h-7 sm:w-7">
            <CalendarDays className="h-4 w-4 shrink-0 sm:h-3.5 sm:w-3.5" strokeWidth={2} />
          </span>
        </span>
      </button>

      {/* Dropdown panel */}
      <MotionPopover
        open={open}
        align={align}
        className={`absolute top-full z-50 mt-2 max-w-[calc(100vw-2rem)] overflow-x-auto rounded-2xl bg-popover text-popover-foreground border p-4 shadow-md ${align === 'left' ? 'left-0' : 'right-0'}`}
      >
        {/* Header */}
        <div className="mb-3 flex items-center justify-between px-1">
          <div className="text-sm text-muted-foreground">
            <span>{t.dateRangePicker.startDate}</span>
            <span className="mx-2 text-muted-foreground">→</span>
            <span>{t.dateRangePicker.endDate}</span>
          </div>
          <div className="text-xs text-muted-foreground">{t.dateRangePicker.selectedDays}</div>
        </div>

        <Calendar
          mode="range"
          selected={tempRange}
          onSelect={handleSelect}
          numberOfMonths={2}
          locale={locale}
          weekStartsOn={0}
          showOutsideDays
          disabled={[
            ...(minDate ? [{ before: minDate }] : []),
            ...(maxDate ? [{ after: maxDate }] : []),
          ]}
          startMonth={minDate}
          endMonth={maxDate}
        />

        {/* Footer */}
        <div className="mt-3 flex items-center justify-end gap-2 border-t border-border pt-3">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md border border-input bg-background px-4 py-1.5 text-sm font-semibold text-foreground transition hover:bg-accent"
          >
            {t.buttons.cancel}
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            {t.buttons.apply}
          </button>
        </div>
      </MotionPopover>
    </div>
  );
}
