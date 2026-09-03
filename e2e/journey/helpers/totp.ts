/**
 * A minimal RFC 6238 TOTP generator, built on Node's own `crypto` — no new
 * dependency for something this small. Exists because the MFA enrollment
 * dialog shows the raw base32 secret (see `MfaEnrollDialog.tsx`'s manual-entry
 * `<code>` block); a real end-to-end run computes the same 6-digit code an
 * authenticator app would from that secret, rather than skipping the MFA step
 * or hand-waving it with a mocked backend response.
 */
import { createHmac } from 'node:crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP_SECONDS = 30;
const DIGITS = 6;

function base32Decode(input: string): Buffer {
  const clean = input.replace(/=+$/, '').toUpperCase();
  let bits = '';
  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;
    bits += index.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/**
 * The current TOTP code for `base32Secret`.
 *
 * `stepOffset` moves to a different 30-second counter window than "now" —
 * needed because `django_otp`'s replay protection (`TOTPDevice.last_t`)
 * rejects a second verification at the exact same counter even with a
 * numerically correct code. A real user naturally logs in some time after
 * confirming enrollment; a fast-running test doesn't get that for free, so
 * the journey spec asks for `stepOffset: 1` on the post-enrollment login to
 * land in a window the confirm step didn't already consume.
 */
export function currentTotp(base32Secret: string, stepOffset = 0): string {
  const key = base32Decode(base32Secret);
  const counter = Math.floor(Date.now() / 1000 / STEP_SECONDS) + stepOffset;

  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const hmac = createHmac('sha1', key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const truncated =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(truncated % 10 ** DIGITS).padStart(DIGITS, '0');
}
