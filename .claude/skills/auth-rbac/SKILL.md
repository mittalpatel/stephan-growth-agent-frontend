---
name: auth-rbac
description: Guides authentication and role-based access control for this project. Use when working with NextAuth, middleware route protection, session shape, JWT token refresh, RBAC guard components, login/logout flow, or asking "how do I protect a route", "how do I check user role", "how do I access the session", "how do I handle token expiry".
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Auth & RBAC — Senior Frontend Guidelines

## Stack

- **NextAuth.js v4** — session management, OAuth providers, JWT
- **httpOnly cookies** — token storage (never localStorage)
- **`middleware.ts`** — route-level protection at the edge
- **`useSession()` / `getServerSession()`** — access session in Client/Server

---

## 1. Session Shape

```typescript
// types/next-auth.d.ts — extend the default session
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'admin' | 'manager' | 'agent' | 'viewer';
    };
    accessToken: string;
    refreshToken: string;
    accessTokenExpiry: number;
  }
}
```

---

## 2. Middleware Protection (middleware.ts)

```typescript
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role as string;

    // RBAC: admin-only routes
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // must be logged in
    },
  }
);

// Apply middleware to protected routes only
export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/campaigns/:path*'],
};
```

---

## 3. Token Refresh in NextAuth JWT Callback

```typescript
// app/api/auth/[...nextauth]/route.ts
callbacks: {
  async jwt({ token, account, user }) {
    // Initial sign in
    if (account && user) {
      return {
        ...token,
        accessToken: account.access_token,
        refreshToken: account.refresh_token,
        accessTokenExpiry: Date.now() + 15 * 60 * 1000, // 15 min
      }
    }

    // Token still valid
    if (Date.now() < (token.accessTokenExpiry as number)) {
      return token
    }

    // Token expired — refresh
    return refreshAccessToken(token)
  },
  async session({ session, token }) {
    session.accessToken = token.accessToken as string
    session.user.role = token.role as string
    return session
  },
}
```

---

## 4. Accessing Session

```typescript
// ✅ Server Component / Route Handler
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export default async function Page() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  return <Dashboard user={session.user} />
}

// ✅ Client Component
'use client'
import { useSession } from 'next-auth/react'

export function UserMenu() {
  const { data: session, status } = useSession()
  if (status === 'loading') return <Skeleton />
  if (!session) return <LoginButton />
  return <Avatar user={session.user} />
}
```

---

## 5. RBAC Guard Component

```typescript
// components/auth/RoleGuard.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'

interface RoleGuardProps {
  allowedRoles: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export async function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const session = await getServerSession(authOptions)

  if (!session) redirect('/login')

  if (!allowedRoles.includes(session.user.role)) {
    return fallback ?? <AccessDenied />
  }

  return <>{children}</>
}

// Usage in a Server Component layout
export default async function AdminLayout({ children }) {
  return (
    <RoleGuard allowedRoles={['admin']}>
      {children}
    </RoleGuard>
  )
}
```

---

## 6. useAuth Hook (Client)

```typescript
// lib/hooks/use-auth.ts
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const logout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh(); // clear server cache
  };

  const hasRole = (role: string | string[]) => {
    if (!session?.user.role) return false;
    return Array.isArray(role) ? role.includes(session.user.role) : session.user.role === role;
  };

  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    hasRole,
    logout,
  };
}
```

---

## 7. Token Storage Rules (non-negotiable)

```typescript
// ❌ CRITICAL — never store tokens in localStorage
localStorage.setItem('token', accessToken);

// ✅ httpOnly cookies via NextAuth (automatic)
// NextAuth stores tokens in a server-side signed cookie
// Tokens are never accessible to JavaScript
response.cookies.set('next-auth.session-token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
});
```

---

## 8. Anti-patterns

```typescript
// ❌ Client-only route protection (middleware is the source of truth)
// ❌ Tokens in localStorage or sessionStorage
// ❌ NEXT_PUBLIC_ env vars containing secrets / client IDs
// ❌ Checking roles only on the client — always verify server-side too
// ❌ Committing .env with real OAuth credentials (rotate immediately if this happened)
```

---

## Reference files (load only when needed)

## Further reading

The canonical rules for this topic live in the repo:

- `docs/topics/03-auth-rbac.md` — the reference
- `docs/INDEX.md` — every other topic, with a "read this when" line each
- `AGENTS.md` — the always-loaded rules, which take precedence over this skill

The earlier version of this section pointed at an external `frontend-context/`
guideline folder. That folder is developer-local and gitignored (see `AGENTS.md`),
so those links resolved for nobody — which is exactly how a skill teaches a reader
that its paths are approximate. In-repo docs are canonical: ADR-0012.
