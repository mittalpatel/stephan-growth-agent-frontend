'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

type OtpInputProps = Readonly<{
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  id?: string;
  autoFocus?: boolean;
  'aria-invalid'?: boolean;
  className?: string;
}>;

/**
 * A segmented numeric code input: `length` single-character boxes standing
 * in for one string value. Pure presenter — no react-hook-form import here;
 * wire it up from a form with `Controller` and `field.value`/`field.onChange`,
 * the standard RHF pattern for a custom controlled input.
 *
 * Only digits are accepted (this is used for TOTP/enrollment codes, never
 * the alphanumeric backup codes).
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled,
  id,
  autoFocus,
  className,
  ...props
}: OtpInputProps) {
  const inputRefs = React.useRef<Array<HTMLInputElement | null>>([]);
  const ariaInvalid = props['aria-invalid'];

  const chars = React.useMemo(() => {
    const digits = value.split('').slice(0, length);
    return Array.from({ length }, (_, i) => digits[i] ?? '');
  }, [value, length]);

  function setValueAt(index: number, char: string) {
    const next = chars.slice();
    next[index] = char;
    onChange(next.join('').replace(/\s+$/, ''));
  }

  function focusIndex(index: number) {
    inputRefs.current[index]?.focus();
  }

  function handleChange(index: number, raw: string) {
    const digitsOnly = raw.replace(/\D/g, '');
    if (!digitsOnly) {
      // A non-digit keystroke (or a cleared box) - just clear this box.
      setValueAt(index, '');
      return;
    }

    if (digitsOnly.length > 1) {
      // Pasted (or otherwise multi-char) input landing in one box: split it
      // across the boxes starting from the current one.
      const next = chars.slice();
      let cursor = index;
      for (const digit of digitsOnly) {
        if (cursor >= length) break;
        next[cursor] = digit;
        cursor += 1;
      }
      onChange(next.join('').slice(0, length));
      focusIndex(Math.min(cursor, length - 1));
      return;
    }

    setValueAt(index, digitsOnly);
    if (index < length - 1) focusIndex(index + 1);
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !chars[index] && index > 0) {
      event.preventDefault();
      setValueAt(index - 1, '');
      focusIndex(index - 1);
      return;
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusIndex(index - 1);
      return;
    }
    if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault();
      focusIndex(index + 1);
    }
  }

  function handlePaste(index: number, event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '');
    if (!pasted) return;
    event.preventDefault();
    const next = chars.slice();
    let cursor = index;
    for (const digit of pasted) {
      if (cursor >= length) break;
      next[cursor] = digit;
      cursor += 1;
    }
    onChange(next.join('').slice(0, length));
    focusIndex(Math.min(cursor, length - 1));
  }

  return (
    // `w-full min-w-0` is load-bearing, not decorative: a grid item (e.g.
    // Radix's `DialogContent`, which lays out as `display: grid`) defaults to
    // `min-width: auto`, so without this the row refuses to shrink to its
    // container's track width and each `flex-1 aspect-square` box instead
    // balloons to its content's preferred size -- confirmed in the wild at
    // ~1200px wide inside a 384px dialog, pushing the boxes and the
    // Confirm/Cancel buttons off-screen entirely.
    <div className={cn('flex w-full min-w-0 gap-2', className)} role="group">
      {chars.map((char, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          id={index === 0 ? id : undefined}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          autoFocus={autoFocus && index === 0}
          // Each box holds exactly one character -- `length` (the whole
          // code's length) here was a real bug: it let a single box accept
          // 2+ native keystrokes before React's controlled re-render clamped
          // it back down, and every extra keystroke into an already-filled
          // box (e.g. a user retyping after a wrong-code error, without
          // clearing first) fell into the multi-char/paste-redistribution
          // branch below and scrambled the whole sequence -- confirmed live:
          // typing "345122" into boxes still holding a previous attempt
          // produced "300451". Paste is unaffected: `onPaste` intercepts the
          // clipboard event and calls `preventDefault()` before the browser
          // ever tries to insert the pasted text, so it never touches this
          // native `maxLength` at all.
          maxLength={1}
          disabled={disabled}
          value={char}
          aria-invalid={ariaInvalid}
          data-slot="otp-input"
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          className={cn(
            'aspect-square min-w-0 flex-1 rounded-lg border border-input bg-transparent text-center text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40'
          )}
        />
      ))}
    </div>
  );
}
