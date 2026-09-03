#!/usr/bin/env node
/**
 * Gitleaks secret-scanning gate.
 *
 * Two modes:
 *   - `staged`  (pre-commit): scans only staged changes — fast, blocks a secret
 *                from ever being committed. `gitleaks protect --staged`.
 *   - `detect`  (CI / default): scans the full working tree + git history.
 *                `gitleaks detect`.
 *
 * Resolution order: a native `gitleaks` binary, else the
 * `ghcr.io/gitleaks/gitleaks` Docker image. If neither is available the scan
 * fails with install instructions. Set SKIP_GITLEAKS=1 to bypass locally
 * (CI never sets it, so the gate still holds).
 *
 * Allowlist false positives in `.gitleaks.toml`.
 */
import { spawnSync } from 'node:child_process';

if (process.env.SKIP_GITLEAKS === '1') {
  console.log('⏭  SKIP_GITLEAKS=1 — skipping Gitleaks scan (CI still enforces it).');
  process.exit(0);
}

const mode = process.argv[2] === 'staged' ? 'staged' : 'detect';
const gitleaksArgs =
  mode === 'staged'
    ? ['protect', '--staged', '--redact', '--verbose']
    : ['detect', '--redact', '--verbose'];

function has(cmd, args = ['version']) {
  return spawnSync(cmd, args, { stdio: 'ignore' }).status === 0;
}

function run(cmd, args) {
  console.log(`▶ ${cmd} ${args.join(' ')}`);
  return spawnSync(cmd, args, { stdio: 'inherit' }).status ?? 1;
}

let status;
if (has('gitleaks')) {
  status = run('gitleaks', gitleaksArgs);
} else if (has('docker', ['--version'])) {
  // Mount the repo (incl. .git, needed for history/staged scans) at /repo.
  status = run('docker', [
    'run',
    '--rm',
    '-v',
    `${process.cwd()}:/repo`,
    '-w',
    '/repo',
    'ghcr.io/gitleaks/gitleaks:latest',
    ...gitleaksArgs,
    '--source=/repo',
  ]);
} else {
  console.error(
    [
      '✖ Gitleaks not found. Install it to run the secret scan:',
      '    brew install gitleaks            # macOS',
      '    # or download a release binary: https://github.com/gitleaks/gitleaks/releases',
      '  or have Docker available (the script falls back to ghcr.io/gitleaks/gitleaks).',
      '',
      '  To bypass locally for one commit: SKIP_GITLEAKS=1 git commit ...',
    ].join('\n')
  );
  process.exit(1);
}

if (status !== 0) {
  console.error('\n✖ Gitleaks found potential secrets (or failed). See output above.');
}
process.exit(status);
