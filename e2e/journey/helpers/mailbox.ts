/**
 * Reads OTPs and notification subjects out of the backend's own log file
 * instead of a real inbox.
 *
 * There is no test mailbox in this stack, and the backend's `.env` has real
 * Gmail SMTP credentials configured — running signup/MFA/notification flows
 * against that would either send real email nobody can read back
 * programmatically, or (worse) actually deliver to whatever address a test
 * happens to use. The prerequisite documented in `e2e/journey/README.md`
 * (start the backend with `EMAIL_HOST_USER=` unset) makes Django fall back to
 * its console email backend — see `config/settings/local.py`'s conditional —
 * which prints every message to the process's stdout, captured here into
 * `logs/celery_worker.log` since `send_templated_email` runs as a Celery task,
 * not inline in the request.
 *
 * This is a test-only convenience, not a claim that log-scraping is a good
 * pattern for anything else — it's the pragmatic "read what a person would
 * read in their inbox" for a stack with no mailbox to point at.
 */
import { readFileSync, existsSync } from 'node:fs';

const DEFAULT_LOG_PATH =
  process.env.E2E_BACKEND_LOG_PATH ?? '../enterprise-backend-template/logs/celery_worker.log';

const MESSAGE_SEPARATOR = '-'.repeat(79);
const POLL_INTERVAL_MS = 500;
const DEFAULT_TIMEOUT_MS = 20_000;

function readLogSafely(): string {
  // Path comes from an env var the person running the e2e suite sets
  // (E2E_BACKEND_LOG_PATH) or a fixed relative default — test-operator
  // configuration, not untrusted user input, so the dynamic-path lint rule
  // doesn't apply here the way it would to a request-derived path.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (!existsSync(DEFAULT_LOG_PATH)) {
    throw new Error(
      `E2E backend log not found at ${DEFAULT_LOG_PATH}. Set E2E_BACKEND_LOG_PATH, and see ` +
        `e2e/journey/README.md for the "console email backend" prerequisite.`
    );
  }
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return readFileSync(DEFAULT_LOG_PATH, 'utf-8');
}

/** Current length of the backend log, to mark "everything before this point
 * is old news" before triggering an action that should send mail. */
export function mailboxCheckpoint(): number {
  return readLogSafely().length;
}

type FindOptions = {
  to: string;
  subjectContains: string;
  since: number;
  timeoutMs?: number;
};

/** Poll the log until a message matching `to` + `subjectContains` appears
 * after `since`, and return that message's raw text block. */
async function waitForMessage(options: FindOptions): Promise<string> {
  const { to, subjectContains, since, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const content = readLogSafely();
    const newContent = content.slice(since);
    const messages = newContent.split(MESSAGE_SEPARATOR);

    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const block = messages[i];
      if (block.includes(`To: ${to}`) && block.includes(`Subject: ${subjectContains}`)) {
        return block;
      }
      // Subject can be split across a folded header line — fall back to a
      // looser substring check if the exact "Subject: X" line isn't found.
      if (block.includes(`To: ${to}`) && block.includes(subjectContains)) {
        return block;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(
    `No email to ${to} with subject containing "${subjectContains}" appeared within ` +
      `${timeoutMs}ms. Is the backend running with a console EMAIL_BACKEND? See ` +
      `e2e/journey/README.md.`
  );
}

/** Wait for and extract a 6-digit OTP from the next matching email.
 *
 * Matches only a digit run that is *alone on its own line* (the template
 * renders the code as its own paragraph/line — see
 * `apps/users/templates/email/users/*.html`) rather than the first bare
 * `\d{6}` anywhere in the raw MIME block: a plain `\b\d{6}\b` scan also
 * matches inside the message's own `Message-ID` header (e.g.
 * `<178765619565.128322.13784683081741976457@host>` — `128322` satisfies
 * `\b\d{6}\b` too, and appears before the real code in header order),
 * silently grabbing the wrong number and submitting a garbage OTP. */
export async function waitForOtp(options: FindOptions): Promise<string> {
  const block = await waitForMessage(options);
  const match = block.match(/^\s*(\d{6})\s*$/m);
  if (!match) {
    throw new Error(
      `Found a matching email but no isolated 6-digit code line inside it:\n${block}`
    );
  }
  return match[1];
}

/** Wait for a matching email to exist at all (used for the new-device alert,
 * where only "did it fire" matters, not any code inside it). */
export async function waitForEmail(options: FindOptions): Promise<void> {
  await waitForMessage(options);
}

/** Assert no matching email appears within a short grace window — used to
 * confirm the new-device alert does NOT fire on a familiar device. */
export async function assertNoEmail(options: FindOptions & { graceMs?: number }): Promise<void> {
  const graceMs = options.graceMs ?? 5_000;
  try {
    await waitForMessage({ ...options, timeoutMs: graceMs });
  } catch {
    return; // timing out is the success case here
  }
  throw new Error(
    `Expected no email to ${options.to} with subject containing "${options.subjectContains}", but one arrived.`
  );
}
