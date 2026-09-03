import {
  BarChart3,
  Bot,
  Boxes,
  Building2,
  Mail,
  MessagesSquare,
  UserCog,
  UserPlus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { t } from '@/locales';

export interface NavChild {
  label: string;
  href: string;
  /** Backend resource gating this child, e.g. `'project'`. */
  requiredFunction?: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Starts a new labelled section in the sidebar. */
  section?: string;
  requiredFunction?: string;
  requiredLevel?: 'read' | 'write';
  /**
   * Platform-admin item: shown only to `is_superuser`.
   *
   * Deliberately not a `requiredFunction`. Impersonation sits outside per-org
   * RBAC — if it were a permission code, an organization Owner could put it on a
   * custom role and grant themselves reach into other tenants.
   */
  superuserOnly?: boolean;
  children?: NavChild[];
}

/**
 * The page kill-switch.
 *
 * A nav item appears only if its `href` is listed here (a group appears if at
 * least one child's href is). Ship a page dark, enable it with a one-line
 * change, and turn it off again during an incident without a revert.
 *
 * This is *visibility only*. It hides the link; it does not protect the route.
 * `src/proxy.ts` keeps its own `ENABLED_PREFIXES` list, and the backend enforces
 * permissions regardless — all three exist for different reasons and none
 * substitutes for the others.
 */
export const ENABLED_HREFS: readonly string[] = [
  '/dashboard',
  '/agents',
  '/conversations',
  '/leads',
  '/analytics',
  '/invites',
  '/organization',
  '/organization/members',
  '/organization/roles',
  '/organization/audit',
  '/organization/api-keys',
  '/admin/impersonation',
  // Demo module — removed by `npm run strip-demo`. Deliberately left off the
  // sidebar (this app has no use for it), but still reachable directly: the
  // RBAC/cross-tenant e2e suite exercises it as a fixture and navigates to it
  // by URL rather than through the nav, so `src/proxy.ts`'s ENABLED_PREFIXES
  // and ROUTE_PERMISSIONS are untouched.
  // '/projects',
];

/**
 * Where an authenticated user lands with no explicit destination.
 *
 * Used by the proxy, the post-login redirect, and `safeRedirect`'s fallback.
 * Defined once because it was previously hardcoded as `/orders` in five places,
 * and stripping that route left four of them pointing at a 404.
 *
 * Keep it a route every authenticated user can reach regardless of role —
 * `/dashboard` requires no permission. Pointing it at a gated page sends anyone
 * lacking that permission into a redirect loop.
 */
export const DEFAULT_LANDING = '/dashboard';

/**
 * The sidebar.
 *
 * Labels come from the catalog, never inline. `requiredFunction` is the backend
 * *resource*; `src/lib/helper.ts` composes the `{resource}:{action}` code, so a
 * user without it never sees the link — matching, but not replacing, what the
 * API would refuse.
 */
export const NAV_ITEMS: NavItem[] = [
  // ── MAIN ─────────────────────────────────────────────────────────────
  // Demo module — removed by `npm run strip-demo`. Defined but left out of
  // ENABLED_HREFS above, so it resolves to nothing in the sidebar.
  {
    section: t.navigation.sections.main,
    label: t.navigation.projects,
    href: '/projects',
    icon: Boxes,
    requiredFunction: 'project',
  },
  // Sprint 1 static previews (frontend-plan-v3.md §3.1) — no requiredFunction
  // yet, because the backend hasn't landed the `agent` / `conversation` /
  // `lead` permission codes this app will eventually gate on (§3.3). Add it
  // back once `contracts/permissions.json` is re-vendored with them.
  {
    section: t.navigation.sections.main,
    label: t.navigation.agents,
    href: '/agents',
    icon: Bot,
  },
  {
    section: t.navigation.sections.main,
    label: t.navigation.conversations,
    href: '/conversations',
    icon: MessagesSquare,
  },
  {
    section: t.navigation.sections.main,
    label: t.navigation.leads,
    href: '/leads',
    icon: UserPlus,
  },
  {
    section: t.navigation.sections.main,
    label: t.navigation.analytics,
    href: '/analytics',
    icon: BarChart3,
  },

  // ── WORKSPACE ────────────────────────────────────────────────────────
  {
    section: t.navigation.sections.workspace,
    label: t.navigation.invites,
    href: '/invites',
    icon: Mail,
    // No requiredFunction: this is about invitations addressed to *me*, not an
    // organization resource — visible to any authenticated user regardless of
    // role, including someone with no organization (and so no permissions) at
    // all, since accepting one is how they get their first org.
  },
  {
    section: t.navigation.sections.workspace,
    label: t.navigation.organization,
    href: '/organization',
    icon: Building2,
    requiredFunction: 'organization',
    children: [
      { label: t.navigation.members, href: '/organization/members', requiredFunction: 'member' },
      { label: t.navigation.roles, href: '/organization/roles', requiredFunction: 'rbac' },
      { label: t.navigation.audit, href: '/organization/audit', requiredFunction: 'audit' },
      {
        label: t.navigation.apiKeys,
        href: '/organization/api-keys',
        requiredFunction: 'apikey',
      },
    ],
  },

  // ── PLATFORM ─────────────────────────────────────────────────────────
  // Visible only to superusers, and gated again on the server (the page itself
  // redirects) and on every backend endpoint. Hiding a link is not a control.
  {
    section: t.navigation.sections.platform,
    label: t.navigation.impersonation,
    href: '/admin/impersonation',
    icon: UserCog,
    superuserOnly: true,
  },
];
