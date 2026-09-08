/**
 * Bare-hostname shape validation, mirroring the backend's shared
 * `common/net/hostname.py::is_valid_hostname()` (extracted 2026-09-07 from
 * two independently-drifted regexes on the agent allowed-domains and org
 * custom-domains serializers).
 *
 * Checked label by label rather than with a single regex: a hostname regex
 * expressive enough to check this shape nests a quantifier inside a repeated
 * group, which backtracks catastrophically on a long near-match. That's fine
 * server-side against a `max_length=255` field, but this runs in the browser
 * on every keystroke against input of any length, so it stays linear.
 */

const MAX_HOSTNAME_LENGTH = 253;

/** Non-final labels: 1-63 chars, alnum/hyphen, no leading or trailing hyphen. */
const LABEL_CHARS = /^[a-z0-9-]+$/;

/** The final label (the TLD): alphabetic only, 2-63 chars. */
const TLD_CHARS = /^[a-z]+$/;

function isLabel(label: string): boolean {
  return (
    label.length >= 1 &&
    label.length <= 63 &&
    !label.startsWith('-') &&
    !label.endsWith('-') &&
    LABEL_CHARS.test(label)
  );
}

function isTld(label: string): boolean {
  return label.length >= 2 && label.length <= 63 && TLD_CHARS.test(label);
}

/**
 * True for a well-formed bare hostname: at least two labels, an alphabetic
 * TLD, no scheme, port, or path. `allowLocalhost` is the one-off the agent
 * allowed-domains list needs for local widget testing; org custom domains
 * never pass it.
 */
export function isValidHostname(value: string, { allowLocalhost = false } = {}): boolean {
  if (!value || value.length > MAX_HOSTNAME_LENGTH) return false;
  if (allowLocalhost && value === 'localhost') return true;

  const labels = value.split('.');
  if (labels.length < 2) return false;
  const tld = labels[labels.length - 1];
  return isTld(tld) && labels.slice(0, -1).every(isLabel);
}
