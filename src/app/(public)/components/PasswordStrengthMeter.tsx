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

/**
 * Four-segment strength bar under a new-password field, with the level in
 * words so colour is never the only signal. Requested in client testing
 * (29 Sep and 06 Oct 2026). `score` comes from `passwordStrength`.
 */
export function PasswordStrengthMeter({ score }: Readonly<{ score: number }>) {
  const label = format(copy.label, { level: copy.levels[score] });
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
    </div>
  );
}
