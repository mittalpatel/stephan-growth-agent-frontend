import { formatDateTime, formatTime } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type Props = Readonly<{
  value: string | Date;
  className?: string;
}>;

/**
 * The send time under a chat bubble. Shows the time of day only, since a
 * transcript is read in order and the full date would repeat on every line;
 * the full date and time is on hover and in `dateTime` for assistive tech.
 * The caller sets the colour, because it depends on the bubble's fill.
 */
export function MessageTime({ value, className }: Props) {
  const iso = value instanceof Date ? value.toISOString() : value;
  return (
    <time
      dateTime={iso}
      title={formatDateTime(value)}
      className={cn('mt-1 block text-right text-[10px] tabular-nums', className)}
    >
      {formatTime(value)}
    </time>
  );
}
