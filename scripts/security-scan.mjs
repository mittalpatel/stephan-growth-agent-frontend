#!/usr/bin/env node
/**
 * Semgrep SAST gate (the bandit-equivalent for this frontend).
 *
 * Runs curated JS/React/Next.js/OWASP rulesets over src/. Used by the pre-push
 * hook and CI. The lightweight ESLint layer (eslint-plugin-security) runs
 * separately on every commit; this catches the deeper data-flow/taint issues
 * ESLint can't.
 *
 * Resolution order for the scanner:
 *   1. a `semgrep` binary on PATH (pip/brew install)
 *   2. Docker (semgrep/semgrep image)
 * If neither is available the scan fails with install instructions. Set
 * SKIP_SEMGREP=1 to bypass locally (CI never sets it, so the gate still holds).
 */
import { spawnSync } from 'node:child_process';

if (process.env.SKIP_SEMGREP === '1') {
  console.log('⏭  SKIP_SEMGREP=1 — skipping Semgrep scan (CI still enforces it).');
  process.exit(0);
}

const RULESETS = ['p/javascript', 'p/react', 'p/nextjs', 'p/owasp-top-ten', 'p/secrets'];
const configArgs = RULESETS.flatMap((r) => ['--config', r]);
// --error: non-zero exit on findings. --quiet/--no-rewrite: tidy CI output.
const scanArgs = ['scan', ...configArgs, '--error', '--quiet', '--metrics=off', 'src'];

function has(cmd) {
  return spawnSync(cmd, ['--version'], { stdio: 'ignore' }).status === 0;
}

function run(cmd, args) {
  console.log(`▶ ${cmd} ${args.join(' ')}`);
  return spawnSync(cmd, args, { stdio: 'inherit' }).status ?? 1;
}

let status;
if (has('semgrep')) {
  status = run('semgrep', scanArgs);
} else if (has('docker')) {
  status = run('docker', [
    'run',
    '--rm',
    '-v',
    `${process.cwd()}:/src`,
    '-w',
    '/src',
    'semgrep/semgrep',
    'semgrep',
    ...scanArgs,
  ]);
} else {
  console.error(
    [
      '✖ Semgrep not found. Install it to run the security scan:',
      '    pipx install semgrep    # or: pip install semgrep / brew install semgrep',
      '  or have Docker available (the script falls back to semgrep/semgrep).',
      '',
      '  To bypass locally for one push: SKIP_SEMGREP=1 git push',
    ].join('\n')
  );
  process.exit(1);
}

if (status !== 0) {
  console.error('\n✖ Semgrep found potential security issues (or failed). See output above.');
}
process.exit(status);
