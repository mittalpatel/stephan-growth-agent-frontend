# Deployment

Two supported shapes. Pick one; they are not meant to be combined.

## Container

`Dockerfile` is a three-stage build — `deps` installs, `builder` compiles, `runner`
ships. The runtime image carries neither the toolchain nor the source, runs as an
unprivileged user, and health-checks `/api/health`.

```bash
docker build --build-arg NEXT_PUBLIC_BACKEND_API=https://api.example.com -t app-frontend .
docker run -p 3000:3000 --env-file .env.production app-frontend
```

**`NEXT_PUBLIC_*` values are inlined into the client bundle at build time, not read at
runtime.** The backend URL must therefore be a build arg, and an image built for
staging cannot be promoted to production. Build once per environment, or move the
value to a runtime-fetched config endpoint. This surprises people; it is the single
most important line on this page.

`output: 'standalone'` in `next.config.ts` is what makes the runtime stage possible —
without it the image needs the full `node_modules` tree.

## SSH + systemd

`deploy.sh` on the server: pull → `npm ci` → build → restart → poll health → **roll
back to the previous commit if the health check fails**. Everything is env-overridable
so the same script runs in a local rehearsal:

```bash
APP_DIR=~/deploy-test/frontend \
RESTART_CMD="echo simulated-restart" \
bash deploy.sh
```

Rehearse it before trusting it. The rollback path is the part worth having already
seen work.

`.github/workflows/deploy.yml` runs it over SSH on push to `staging`. Required
secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_PATH`.

Reaching the host over a private tunnel rather than a public SSH port is strongly
preferable; the workflow carries a commented Tailscale step for that, left disabled
because a template cannot assume a tailnet.

## CI gates

`.github/workflows/ci.yml`, on push and PR to `main`/`develop`:

| Job             | Gate                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `validate`      | tsc, ESLint `--max-warnings 0`, Prettier, Vitest + coverage ratchets, `npm audit`, production build, bundle budget, SBOM |
| `contracts`     | Backend's generated `contracts/*.json` versus the vendored copy                                                          |
| `secret-scan`   | Gitleaks over full history                                                                                               |
| `security-scan` | Semgrep (`p/javascript`, `p/react`, `p/nextjs`, `p/owasp-top-ten`, `p/secrets`)                                          |

The pre-commit and pre-push hooks run the same checks for fast feedback, but
`git push --no-verify` skips them and nothing skips CI. **Hooks are convenience; CI is
the gate.**

`contracts` needs the `BACKEND_REPO` variable. Without it the job warns and passes
rather than failing — an unconfigured template should not be red out of the box.

## Server layout (SSH deployment)

| Thing         | Path                                                                               |
| ------------- | ---------------------------------------------------------------------------------- |
| App code      | `$DEPLOY_PATH`                                                                     |
| Systemd unit  | `/etc/systemd/system/app-frontend.service` (`ExecStart: npm run start`, port 3000) |
| Reverse proxy | Nginx, `:443` → `127.0.0.1:3000`                                                   |

The deploy user needs passwordless sudo for exactly the restart and status commands,
nothing broader:

```
deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart app-frontend, /usr/bin/systemctl status app-frontend
```
