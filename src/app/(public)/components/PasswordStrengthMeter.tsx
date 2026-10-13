import { Check, Circle } from 'lucide-react';

import { format } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

const copy = t.auth.publicSignupFlow.strength;

/** Fill colour per score, from the status token pairs only. */
const SEGMENT_TONE = [
  'bg-destructive',
  'bg-destructive',
  'bg-warning-foreground',
  'bg-success-foreground',
  'bg-success-foreground',
] as const;

/** The same four rules the schema enforces, so the list can never disagree with submit. */
const RULES = [
  { key: 'length', test: (v: string) => v.length >= 8 },
  { key: 'lower', test: (v: string) => /[a-z]/.test(v) },
  { key: 'upper', test: (v: string) => /[A-Z]/.test(v) },
  { key: 'number', test: (v: string) => /\d/.test(v) },
] as const;

/**
 * Four-segment strength bar under a new-password field, with the level in
 * words so colour is never the only signal. Requested in client testing
 * (29 Sep and 06 Oct 2026). `score` comes from `passwordStrength`.
 */
export function PasswordStrengthMeter({
  score,
  password,
}: Readonly<{ score: number; password: string }>) {
  const label = format(copy.label, { level: copy.levels[score] });
  // Once every rule is met the checklist has done its job: hide it so the
  // field settles down instead of showing a wall of ticks.
  const allMet = RULES.every((rule) => rule.test(password));
  return (
    <div className="space-y-1" aria-live="polite">
      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3, 4].map((segment) => (
          <span
            key={segment}
            className={cn(
              'h-1 flex-1 rounded-full',
              segment <= score ? SEGMENT_TONE[score] : 'bg-muted'
            )}
          />
        ))}
      </div>
      <p className="text-muted-foreground text-xs">{label}</p>
      {!allMet && (
        <>
          <p className="text-muted-foreground pt-1 text-xs font-medium">{copy.rulesTitle}</p>
          <ul className="space-y-0.5">
            {RULES.map((rule) => {
              const met = rule.test(password);
              return (
                <li
                  key={rule.key}
                  className={cn(
                    'flex items-center gap-1.5 text-xs',
                    met ? 'text-success-foreground' : 'text-muted-foreground'
                  )}
                >
                  {met ? (
                    <Check className="size-3" aria-hidden />
                  ) : (
                    <Circle className="size-3" aria-hidden />
                  )}
                  {copy.rules[rule.key]}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
