'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { t } from '@/locales';

async function handleSignOut() {
  const channel = new BroadcastChannel('auth');
  channel.postMessage('signout');
  channel.close();
  await fetch('/api/auth/logout', { method: 'POST' });
  void signOut({ callbackUrl: '/login' });
}

export default function ProfilePopup() {
  const { data: session } = useSession();
  const user = session?.user;
  // Not `session.user.role`: that is baked into the NextAuth JWT at sign-in and
  // only refreshes when the session itself cycles (SESSION_MAX_AGE_SECONDS — up
  // to 7 days), and nothing calls `update()` on another user's session when an
  // admin changes their role, so the label could sit stale for a week.
  // `PermissionsContext` refetches /auth/me/permissions/ on every page load, so
  // its role is always current. Display only — authorization is re-checked
  // server-side on every request regardless of what either of these says.
  const { role } = usePermissions();

  const initials =
    user?.full_name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 4) ?? '?';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-md px-2 py-1.5 outline-none transition-colors hover:bg-accent"
        >
          {/* Avatar */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-shell-avatar text-[13px] font-bold text-white">
            {initials}
          </div>

          {/* Name + role — pinned to font-sans with normal tracking so they render
              sharp and mixed-case. Without this they inherit Bebas Neue (font-ui)
              from the parent <button>, which is caps-only and condensed. */}
          <div className="hidden flex-col items-start gap-0.5 sm:flex">
            <span className="max-w-[160px] truncate font-sans text-[15px] font-semibold leading-tight text-foreground">
              {user?.full_name ?? '—'}
            </span>
            <span className="font-sans text-[13px] leading-tight text-foreground">
              {role?.name ?? ''}
            </span>
          </div>

          <ChevronDown className="hidden h-4 w-4 text-shell-muted sm:block" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <div className="px-3 py-2">
          <p className="text-base font-bold">{user?.full_name}</p>
          <p className="text-sm text-muted-foreground font-semibold">{user?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/user-profile" className="font-semibold text-sm">
            <User className="mr-2 h-4 w-4" />
            {t.header.profile}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          {t.header.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
