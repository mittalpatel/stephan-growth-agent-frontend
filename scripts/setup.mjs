#!/usr/bin/env node
/**
 * One-command first-time setup.
 *
 * Run by `npm run setup`. Every step is idempotent, so re-running it after a
 * failure is safe and repairs whatever was missed rather than starting over.
 *
 * Deliberately dependency-free — it runs before `npm install` may have
 * completed, so it can only use Node's standard library.
 *
 * Exit code is the number of failures, so CI can use it directly.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const OK = '  ok  ';
const WARN = ' warn ';
const FAIL = ' FAIL ';

let failures = 0;
const ok = (label, detail = '') => console.log(`[${OK}] ${label}${detail ? ` — ${detail}` : ''}`);
const warn = (label, detail) => console.log(`[${WARN}] ${label} — ${detail}`);
const fail = (label, detail) => {
  failures += 1;
  console.log(`[${FAIL}] ${label} — ${detail}`);
};

/** Read the Node major version this project pins. */
function requiredNodeMajor() {
  const nvmrc = path.join(ROOT, '.nvmrc');
  if (!existsSync(nvmrc)) return null;
  const parsed = Number.parseInt(readFileSync(nvmrc, 'utf8').trim().replace(/^v/, ''), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function checkNode() {
  const required = requiredNodeMajor();
  const actual = Number.parseInt(process.versions.node.split('.')[0], 10);
  if (required === null) {
    warn('Node', 'no .nvmrc — cannot verify the expected version');
  } else if (actual < required) {
    // A hard failure, not a warning. Next 16 needs modern Node, and the errors
    // it produces on an old one point at anything but the real cause.
    fail('Node', `need >= ${required}, running ${actual}. Try \`nvm use\`.`);
  } else {
    ok('Node', `v${process.versions.node}`);
  }
}

function run(command, args, label) {
  try {
    execFileSync(command, args, { cwd: ROOT, stdio: 'inherit' });
    return true;
  } catch {
    fail(label, `\`${command} ${args.join(' ')}\` failed`);
    return false;
  }
}

function installDeps() {
  // `npm ci` when there is a lockfile: it installs exactly what is pinned and
  // errors if package.json disagrees, which is what makes a setup reproducible.
  const useCi = existsSync(path.join(ROOT, 'package-lock.json'));
  console.log(`\n→ Installing dependencies (npm ${useCi ? 'ci' : 'install'})…\n`);
  if (run('npm', [useCi ? 'ci' : 'install'], 'dependencies')) {
    ok('dependencies', useCi ? 'npm ci' : 'npm install');
  }
}

/**
 * Copy an example env file and fill in any generated secret it declares empty.
 */
function seedEnvFile(example, target, generated = {}) {
  const examplePath = path.join(ROOT, example);
  const targetPath = path.join(ROOT, target);

  if (!existsSync(examplePath)) {
    warn(target, `${example} is missing`);
    return;
  }
  if (existsSync(targetPath)) {
    ok(target, 'already present, left untouched');
    return;
  }

  copyFileSync(examplePath, targetPath);

  let contents = readFileSync(targetPath, 'utf8');
  for (const [key, value] of Object.entries(generated)) {
    // Only fill a key that is present and empty — never overwrite a real value.
    contents = contents.replace(new RegExp(`^${key}=$`, 'm'), `${key}=${value()}`);
  }
  writeFileSync(targetPath, contents);

  ok(target, `created from ${example}`);
}

function checkBackendReachable() {
  const envPath = path.join(ROOT, '.env.local');
  if (!existsSync(envPath)) return;

  const match = /^NEXT_PUBLIC_BACKEND_API=(.+)$/m.exec(readFileSync(envPath, 'utf8'));
  const backend = match?.[1]?.trim();
  if (!backend) {
    warn('backend', 'NEXT_PUBLIC_BACKEND_API is not set in .env.local');
    return;
  }

  // A warning, never a failure: setting up the frontend before the backend is
  // running is a perfectly normal order to do things in.
  return fetch(new URL('/health/ready/', backend), { signal: AbortSignal.timeout(3000) })
    .then((response) => {
      if (response.ok) ok('backend', `${backend} is up`);
      else warn('backend', `${backend} answered ${response.status}`);
    })
    .catch(() => {
      warn('backend', `${backend} is not reachable — start it with \`make run\``);
    });
}

function installPlaywright() {
  const require = createRequire(import.meta.url);
  try {
    require.resolve('@playwright/test');
  } catch {
    warn('Playwright', 'not installed — skipping browser download');
    return;
  }
  console.log('\n→ Installing Playwright browsers…\n');
  // Chromium only. The suite runs a single browser project, and downloading
  // Firefox and WebKit costs a few hundred megabytes nobody asked for.
  if (run('npx', ['playwright', 'install', '--with-deps', 'chromium'], 'Playwright browsers')) {
    ok('Playwright', 'chromium installed');
  }
}

function checkHooks() {
  // `prepare: husky` runs on install, so by this point the hooks should exist.
  const hook = path.join(ROOT, '.husky', 'pre-commit');
  if (!existsSync(path.join(ROOT, '.git'))) {
    warn('git hooks', 'not a git repository');
  } else if (existsSync(hook)) {
    ok('git hooks', 'pre-commit and pre-push installed');
  } else {
    fail('git hooks', 'missing — run `npx husky`');
  }
}

const secret = () => randomBytes(32).toString('base64');

async function main() {
  console.log('\nFrontend setup\n' + '-'.repeat(60));

  checkNode();
  installDeps();

  console.log('');
  seedEnvFile('.env.example', '.env.local', { NEXTAUTH_SECRET: secret });
  seedEnvFile('.env.e2e.example', '.env.e2e');
  checkHooks();
  await checkBackendReachable();

  installPlaywright();

  console.log('-'.repeat(60));
  if (failures) {
    console.log(`\n${failures} problem(s) found.\n`);
  } else {
    console.log('\nReady. `npm run dev` starts the app on :3000.\n');
  }
  return failures;
}

main().then((code) => process.exit(code));
