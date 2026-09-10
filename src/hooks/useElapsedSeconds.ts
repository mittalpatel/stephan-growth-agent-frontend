'use client';

import { useEffect, useState } from 'react';

/**
 * Seconds elapsed since `startedAt`, re-rendering once a second while
 * `active`. Returns `0` when there is no start time yet.
 *
 * A long-running server job that shows only a spinner is indistinguishable
 * from a hung one, and users reasonably read the silence as "stuck" and
 * retry. A ticking counter is the cheapest honest signal that something is
 * still happening, and it needs no cooperation from the API.
 *
 * The interval is torn down as soon as `active` goes false, so a finished job
 * does not keep a timer alive behind a closed dialog.
 */
export function useElapsedSeconds(startedAt: string | number | Date | null, active: boolean) {
  const startMs = startedAt ? new Date(startedAt).getTime() : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active || startMs === null) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active, startMs]);

  if (startMs === null || Number.isNaN(startMs)) return 0;
  return Math.max(0, Math.floor((now - startMs) / 1000));
}
