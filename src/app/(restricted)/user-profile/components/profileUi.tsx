import { cn } from '@/lib/utils';

// Shared presentational bits for the profile/security cards, extracted so both
// PersonalInfoForm and ChangePasswordForm render with the same look.
export const CARD = 'rounded-2xl border border-border bg-card p-6 shadow-sm';
export const ERR = 'mt-1 text-xs font-medium text-error';

// Give the profile/password form inputs the same prominent red-bordered look
// as the login page (border-primary, rounded-xl, taller) so the page reads as
// part of the same product. Errors are additionally signalled by a soft pink
// fill (error-light) + inline msg.
export const themedInput = 'h-12 rounded-xl border-primary px-4 text-base transition-all';
export const themedButton = 'h-12 rounded-xl px-8 text-base font-bold';
export const themedInputError = 'bg-error-light';

// Central input class: base spacing + red-theme sizing, error fill when the
// field is invalid, plus any per-field extras (e.g. read-only styling).
export function fieldClass(hasError: boolean, extra?: string | false) {
  return cn('mt-1.5', themedInput, hasError && themedInputError, extra);
}

export function SectionHeader({
  icon,
  title,
}: Readonly<{ icon: React.ReactNode; title: string }>) {
  return (
    <div className="mb-5 flex items-center gap-3 border-b border-input pb-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        {icon}
      </span>
      <h2 className="text-lg font-normal text-foreground">{title}</h2>
    </div>
  );
}
