import { NAV_ITEMS } from '@/constants/navItems';
import { t } from '@/locales';

type PageMeta = { title: string; subtitle?: string };

// The header title/subtitle are derived from the sidebar nav so they never drift
// from it: title = the main menu (group or leaf label), subtitle = the submenu
// (child label). Deriving from NAV_ITEMS means every enabled route gets a header
// automatically — new nav entries need no separate registration here.
// Getters, not copies: nav labels are read per render, in the viewer's
// language (ADR-0019), so this table must not snapshot them at load.
const DERIVED: Record<string, PageMeta> = {};
for (const item of NAV_ITEMS) {
  if (item.children?.length) {
    for (const child of item.children) {
      DERIVED[child.href] = {
        get title() {
          return item.label;
        },
        get subtitle() {
          return child.label;
        },
      };
    }
    // Group landing page (when it isn't itself one of the children).
    if (!(item.href in DERIVED)) {
      DERIVED[item.href] = {
        get title() {
          return item.label;
        },
      };
    }
  } else {
    DERIVED[item.href] = {
      get title() {
        return item.label;
      },
    };
  }
}

// Routes that are deliberately NOT sidebar entries. A page reachable only from a
// user menu, an in-page dropdown, or a direct link still needs a header, and
// `DERIVED` cannot know about it — so register it here.
const EXTRA: Record<string, PageMeta> = {
  '/user-profile': {
    get title() {
      return t.userProfile.title;
    },
    get subtitle() {
      return t.userProfile.subtitle;
    },
  },
  '/notifications': {
    get title() {
      return t.notifications.title;
    },
  },
};

const PAGE_META: Record<string, PageMeta> = { ...DERIVED, ...EXTRA };

// Longest-prefix match so detail routes (e.g. /projects/{id}) and in-page tabs
// inherit their parent's meta rather than each needing an entry.
const PREFIX_KEYS = Object.keys(PAGE_META).sort((a, b) => b.length - a.length);

export function getPageMeta(pathname: string): PageMeta {
  if (PAGE_META[pathname]) return PAGE_META[pathname];
  for (const path of PREFIX_KEYS) {
    if (pathname.startsWith(path + '/')) return PAGE_META[path];
  }
  return { title: '' };
}
