'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, LogOut, User } from 'lucide-react';
import { isLanguage } from '@/config/language';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/locales';

async function handleSignOut() {
  const channel = new BroadcastChannel('auth');
  channel.postMessage('signout');
  channel.close();
  await fetch('/api/auth/logout', { method: 'POST' });
  void signOut({ callbackUrl: '/login' });
}

/**
 * A compact avatar-only trigger — matching `ai-agents-platform`'s topbar,
 * where the avatar is the only identity chrome up there. Name and role
 * already render at full size in `Sidebar`'s footer card, so repeating them
 * here doubled up on the same information and was most of why the topbar
 * read wider and busier than the prototype's.
 */
export default function ProfilePopup() {
  const { data: session } = useSession();
  const user = session?.user;
  const languageMenu = useLanguage();

  const initials =
    user?.full_name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '?';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t.header.profile}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-primary-foreground outline-none transition-opacity bg-primary hover:opacity-90"
        >
          {initials}
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
        {languageMenu.canSwitch && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="font-semibold text-sm">
              <Globe className="mr-2 h-4 w-4" />
              {t.common.languageLabel}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={languageMenu.language}
                onValueChange={(value) => {
                  if (isLanguage(value)) languageMenu.setLanguage(value);
                }}
              >
                {languageMenu.options.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          {t.header.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
