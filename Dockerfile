# syntax=docker/dockerfile:1

# Multi-stage build for the Next.js frontend.
#
# Three stages so the runtime image carries neither the toolchain nor the source:
# `deps` installs, `builder` compiles, `runner` ships. A single-stage build of the
# same app is roughly an order of magnitude larger and includes every dev
# dependency — more to pull on each deploy, and more to audit.

# ── deps ─────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Only the manifests, so this layer is cached until a dependency actually
# changes. Copying the whole source first would invalidate it on every edit and
# make each build reinstall from scratch.
COPY package.json package-lock.json* ./
RUN npm ci

# ── builder ──────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined into the client bundle at build time, not read
# at runtime. The backend URL therefore has to be supplied here, and an image
# built for one environment cannot be promoted to another — build once per
# environment, or move the value to a runtime-fetched config endpoint.
ARG NEXT_PUBLIC_BACKEND_API
ENV NEXT_PUBLIC_BACKEND_API=$NEXT_PUBLIC_BACKEND_API

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── runner ───────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Run as an unprivileged user. The default is root, and a container process that
# does not need root should not have it — it is the difference between a
# contained RCE and a host compromise.
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# `output: 'standalone'` (next.config.ts) produced a minimal server bundle with
# its own trimmed node_modules. Static assets are copied separately because the
# standalone output deliberately excludes them.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Hits the app's own route rather than shelling out to curl, which alpine does
# not ship — an unhealthy container is worth detecting without adding a package.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
