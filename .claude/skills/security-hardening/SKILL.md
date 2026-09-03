---
name: security-hardening
description: Applies security hardening to this project. Use when reviewing for XSS vulnerabilities, setting up CSRF protection, configuring Content Security Policy headers, securing environment variables, hardening API routes, validating file uploads, rate limiting, or asking "is this secure", "how do I prevent XSS", "how do I set security headers", "how do I validate this API route securely".
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Security Hardening — Senior Frontend Guidelines

## Priority Widget

1. 🔴 Rotate any committed secrets immediately
2. 🔴 Remove tokens from localStorage
3. 🔴 Add auth checks to every API Route Handler
4. 🟠 Add Zod validation to every API Route Handler body
5. 🟠 Set security headers in `next.config.ts`
6. 🟠 Sanitize any `dangerouslySetInnerHTML` usage
7. 🟡 Add rate limiting to auth endpoints
8. 🟡 Configure strict CSP

---

## 1. Secrets — Immediate Fixes

```bash
# Check if .env was ever committed
git log --all -- .env

# If yes, rotate all secrets first, then:
git rm --cached .env
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore
git commit -m "remove .env from tracking"

# Remove from git history entirely
git filter-repo --path .env --invert-paths
```

**`.env.example`** (commit this, no real values):

```
NEXTAUTH_URL=http://localhost:3000/
NEXT_PUBLIC_BACKEND_API=http://localhost:8000/
NEXTAUTH_SECRET=<openssl rand -base64 32>
GOOGLE_ID=
GOOGLE_SECRET=
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
```

**Rule:** Secret key names must NOT have `NEXT_PUBLIC_` prefix. Only safe publishable keys get that prefix.

---

## 2. Secure Every API Route Handler

Every Route Handler must follow this template:

```typescript
// app/api/v1/widgets/route.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const createWidgetSchema = z.object({
  customerId: z.string().uuid(),
  items: z.array(z.object({ widgetId: z.string(), qty: z.number().int().positive() })).min(1),
});

export async function POST(request: Request) {
  // 1. Auth check
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Validate body with Zod
  const raw = await request.json().catch(() => null);
  const parsed = createWidgetSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // 3. RBAC (if needed)
  if (!['admin', 'manager'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 4. Resource ownership (for user-scoped resources)
  // const resource = await db.find(parsed.data.id)
  // if (resource.userId !== session.user.id) return 403

  // 5. Business logic
  const widget = await widgetsService.create({ ...parsed.data, userId: session.user.id });
  return NextResponse.json(widget, { status: 201 });
}
```

---

## 3. XSS Prevention

```typescript
// ❌ Raw HTML injection — XSS
<div dangerouslySetInnerHTML={{ __html: comment.html }} />

// ✅ Sanitize with DOMPurify
import DOMPurify from 'dompurify'

function RichComment({ html }: { html: string }) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'li'],
    ALLOWED_ATTR: ['href'],
    FORBID_ATTR: ['style', 'onload', 'onerror'],
  })
  return <div dangerouslySetInnerHTML={{ __html: clean }} />
}
```

React automatically escapes `{expression}` interpolation — only `dangerouslySetInnerHTML` is vulnerable.

---

## 4. Security Headers in next.config.ts

```typescript
// next.config.ts
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // tighten in prod
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data:",
      "font-src 'self'",
      `connect-src 'self' ${process.env.NEXT_PUBLIC_BACKEND_API}`,
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; '),
  },
];

const nextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};
```

---

## 5. File Upload Security

```typescript
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File;

  // Validate MIME type (not just extension)
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!file || !ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  // Validate size
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File exceeds 5MB limit' }, { status: 400 });
  }

  // Generate safe filename — never trust user-provided name
  const hash = crypto
    .createHash('sha256')
    .update(await file.arrayBuffer())
    .digest('hex');
  const ext = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
  }[file.type];
  const safeFilename = `${hash.slice(0, 16)}${ext}`;

  // Store outside public directory
  // await writeFile(`/private/uploads/${safeFilename}`, buffer)
  return NextResponse.json({ filename: safeFilename });
}
```

---

## 6. Rate Limiting (Auth Endpoints)

```typescript
// middleware.ts — add rate limiting to /api/auth/* and /api/v1/auth/*
const authAttempts = new Map<string, { count: number; resetAt: number }>();

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const now = Date.now();
    const entry = authAttempts.get(ip);

    if (entry && now < entry.resetAt) {
      if (entry.count >= 10) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      }
      entry.count++;
    } else {
      authAttempts.set(ip, { count: 1, resetAt: now + 60_000 });
    }
  }
  return NextResponse.next();
}
```

For production, use Upstash Redis-backed rate limiting (`@upstash/ratelimit`).

---

## 7. Security Audit Commands

```bash
# Find exposed secrets in env vars
grep -rn "NEXT_PUBLIC_" src/ --include="*.ts" --include="*.tsx" | grep -i "secret\|key\|password\|token"

# Find localStorage token usage
grep -rn "localStorage" src/ --include="*.ts" --include="*.tsx"

# Find unprotected API routes (missing session check)
grep -rn "export async function" src/app/api --include="*.ts" | \
  xargs -I{} sh -c 'grep -L "getServerSession" {}'

# Find dangerouslySetInnerHTML
grep -rn "dangerouslySetInnerHTML" src/ --include="*.tsx"

# Find hardcoded URLs
grep -rn "http://\|https://" src/ --include="*.ts" --include="*.tsx" | grep -v "process.env\|localhost"
```

---

## Reference files (load when needed)

## Further reading

The canonical rules for this topic live in the repo:

- `docs/topics/10-security.md` — the reference
- `docs/INDEX.md` — every other topic, with a "read this when" line each
- `AGENTS.md` — the always-loaded rules, which take precedence over this skill

The earlier version of this section pointed at an external `frontend-context/`
guideline folder. That folder is developer-local and gitignored (see `AGENTS.md`),
so those links resolved for nobody — which is exactly how a skill teaches a reader
that its paths are approximate. In-repo docs are canonical: ADR-0012.
