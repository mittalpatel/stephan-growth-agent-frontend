import { cn } from '@/lib/utils';

// Shared presentational bits for the profile/security cards, extracted so both
// PersonalInfoForm and ChangePasswordForm render with the same look.
export const CARD = 'elevated p-6';
export const ERR = 'mt-1 text-xs font-medium text-error';

// Sizing only. These inputs used to carry `border-primary` and an oversized
// `h-12 rounded-xl` shape, inherited from an earlier red login theme; that is the
// brand "wash" ADR-0018 rejects, and it made this the only page in the app whose
// fields did not look like `fieldInputCls`. The border now comes from `Input`'s own
// `border-input`, so the field reacts to focus and invalid states like every other.
export const themedInput = 'h-10 rounded-lg px-3 text-sm transition-colors';
export const themedButton = 'h-10 rounded-lg px-6 text-sm font-semibold';
export const themedInputError = 'bg-error-light';

// Central input class: base spacing + red-theme sizing, error fill when the
// field is invalid, plus any per-field extras (e.g. read-only styling).
export function fieldClass(hasError: boolean, extra?: string | false) {
  return cn('mt-1.5', themedInput, hasError && themedInputError, extra);
}

export function SectionHeader({ icon, title }: Readonly<{ icon: React.ReactNode; title: string }>) {
  return (
    <div className="mb-5 flex items-center gap-3 border-b border-input pb-4">
      <span className="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-lg">
        {icon}
      </span>
      <h2 className="text-lg font-normal text-foreground">{title}</h2>
    </div>
  );
}
