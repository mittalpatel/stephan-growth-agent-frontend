'use client';

import { useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, Send, X } from 'lucide-react';
import { useWatch } from 'react-hook-form';

import { checkContrast, isValidHexColor } from '@/lib/contrast';
import { t } from '@/locales';
import type { AgentDraftFormValues } from '@/lib/schemas/agent';

/**
 * The draft's widget, rendered the way a visitor to the operator's own site
 * would meet it: a real floating launcher pinned to the viewport corner that
 * opens a real panel, not a shrunken mock inside a sidebar card. It reads the
 * form through `useWatch`, so every field on this tab takes effect as it is
 * typed, with no save.
 *
 * As of 2026-09-09 the real embeddable bundle exists
 * (`apps/widgetgw/assets/widget.js`, served by `WidgetJsView`), so the panel
 * size and shadow below are no longer configurable at all (`widget_panel_size`/
 * `widget_shadow` were removed from `theme_config`) — they're this preview
 * mirroring the bundle's own literal 340x480/shadow values, not an
 * approximation of a config choice. `position`/`launcher_shape`/`mode`
 * remain real, submitted config the operator can still change here.
 *
 * The hex values flow straight from the operator's own branding fields and the
 * structural constants describe this widget chrome only, so neither is the
 * app's own UI: AGENTS.md's "colors from globals.css only" rule doesn't apply
 * here, the same exception `RHFColorField` already documents.
 */

// Preview-only fallbacks so an in-progress draft with unset colors still
// renders legibly rather than invisible text-on-text. Match the backend's own
// seeded starter palette (`apps/agents/seed_data.py`), which as of 2026-09-09
// is YB Inspire's official brandbook v1.0 system, so a fresh agent's preview
// looks like what it would actually publish with.
const FALLBACK_COLORS = {
  primary: '#5EBCB8', // Teal Inspire
  secondary: '#0D4A4E', // Teal profond
  background: '#0A3D51', // Bleu pétrole
  surface: '#071F2B', // Bleu nuit
  text: '#FFFFFF',
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
};

// `widget_panel_size`/`widget_shadow` were removed from `theme_config` 2026-09-09
// (no longer a config surface at all), and the real embeddable bundle
// (`apps/widgetgw/assets/widget.js`) renders one fixed panel size/shadow —
// these mirror its literal values exactly rather than approximating.
const PANEL_WIDTH = 340;
const PANEL_HEIGHT = 480;
const PANEL_SHADOW = '0 8px 30px rgba(0,0,0,.25)';
const LAUNCHER_SHADOW = '0 4px 14px rgba(0,0,0,.2)';

const LAUNCHER_RADIUS_CSS: Record<string, string> = {
  circle: '9999px',
  rounded_square: '16px',
  pill: '9999px',
};

const EDGE_GAP = 24;
const LAUNCHER_SIZE = 56;

const POSITION_CSS: Record<
  string,
  { top?: number; bottom?: number; left?: number; right?: number }
> = {
  bottom_right: { bottom: EDGE_GAP, right: EDGE_GAP },
  bottom_left: { bottom: EDGE_GAP, left: EDGE_GAP },
  top_right: { top: EDGE_GAP, right: EDGE_GAP },
  top_left: { top: EDGE_GAP, left: EDGE_GAP },
};

// `useSyncExternalStore` with a never-firing subscription is the lint-clean
// way to say "false while server-rendering, true once hydrated" without a
// setState-in-effect; the portal below needs a real `document`.
const NEVER_CHANGES = () => () => {};
const useIsHydrated = () =>
  useSyncExternalStore(
    NEVER_CHANGES,
    () => true,
    () => false
  );

function pick<T>(map: Record<string, T>, key: string, fallback: T): T {
  return map[key] ?? fallback;
}

/** Where the panel sits relative to the launcher, given the launcher's corner. */
function panelAnchor(positionKey: string) {
  const offset = EDGE_GAP + LAUNCHER_SIZE + 12;
  const isTop = positionKey.startsWith('top');
  const isLeft = positionKey.endsWith('left');
  return {
    ...(isTop ? { top: offset } : { bottom: offset }),
    ...(isLeft ? { left: EDGE_GAP } : { right: EDGE_GAP }),
  };
}

export function WidgetPreview({
  defaultLanguage,
  agentName,
}: Readonly<{ defaultLanguage: string; agentName: string }>) {
  const [open, setOpen] = useState(false);
  // The launcher renders through a portal so the draft card's own overflow and
  // sticky context can't clip it; that portal needs a client-side `document`.
  const mounted = useIsHydrated();
  const values = useWatch<AgentDraftFormValues>();
  const v = values as Record<string, unknown>;

  const color = (key: keyof typeof FALLBACK_COLORS) => {
    const raw = v[`color_${key}`] as string | undefined;
    return isValidHexColor(raw) ? raw : FALLBACK_COLORS[key];
  };
  const primary = color('primary');
  const background = color('background');
  const surface = color('surface');
  const text = color('text');

  const fontFamily = (v.typography_font_family as string) || 'Work Sans';
  const launcherRadius = pick(
    LAUNCHER_RADIUS_CSS,
    (v.widget_launcher_shape as string) || '',
    LAUNCHER_RADIUS_CSS.pill
  );
  const positionKey =
    (v.widget_position as string) in POSITION_CSS ? (v.widget_position as string) : 'bottom_right';
  const position = POSITION_CSS[positionKey];

  const displayName = (v.display_name as string) || agentName;

  const localizedText = (v.localized_text as Record<string, { greeting?: string }> | undefined)?.[
    defaultLanguage
  ];
  const greeting = localizedText?.greeting || t.agents.detail.draft.greetingPlaceholder;
  const disclosureEnabled = Boolean(v.disclosure_enabled);
  const disclosureText =
    (v.localized_text as Record<string, { disclosure_text?: string }> | undefined)?.[
      defaultLanguage
    ]?.disclosure_text || t.agents.detail.draft.disclosureTextPlaceholder;

  const questions = ((v.suggested_questions as { value: string }[] | undefined) ?? [])
    .map((row) => row.value.trim())
    .filter(Boolean);

  const textOnPrimary = checkContrast('#FFFFFF', primary).passesAaNormalText ? '#FFFFFF' : text;
  const textOnSurface = checkContrast(text, surface).passesAaNormalText ? text : '#0F172A';

  if (!mounted) return null;

  const panel = (
    <div
      className="fixed z-50 flex flex-col overflow-hidden"
      style={{
        ...panelAnchor(positionKey),
        width: `min(${PANEL_WIDTH}px, calc(100vw - ${EDGE_GAP * 2}px))`,
        height: `min(${PANEL_HEIGHT}px, calc(100vh - ${EDGE_GAP * 3 + LAUNCHER_SIZE}px))`,
        borderRadius: 12,
        boxShadow: PANEL_SHADOW,
        background,
        fontFamily,
      }}
    >
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ background: primary, color: textOnPrimary }}
      >
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-full"
          style={{ background: 'rgba(255,255,255,0.2)' }}
        >
          <MessageCircle className="size-4" aria-hidden />
        </span>
        <span className="truncate text-sm font-semibold">{displayName}</span>
        <span
          className="ml-auto size-2 rounded-full"
          style={{ background: textOnPrimary === '#FFFFFF' ? '#4ADE80' : '#16A34A' }}
          aria-hidden
        />
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        <div
          className="max-w-[85%] rounded-2xl rounded-tl-sm px-3 py-2 text-sm shadow-sm"
          style={{ background: surface, color: textOnSurface }}
        >
          {greeting}
        </div>
        {questions.map((q) => (
          <button
            key={q}
            type="button"
            className="block max-w-[85%] rounded-full border px-3 py-1.5 text-left text-sm transition-opacity hover:opacity-80"
            style={{ borderColor: primary, color: primary }}
          >
            {q}
          </button>
        ))}
      </div>

      {disclosureEnabled && (
        <p
          className="border-t px-4 py-2 text-[11px] opacity-70"
          style={{ borderColor: surface, color: text }}
        >
          {disclosureText}
        </p>
      )}

      <div className="flex items-center gap-2 border-t px-3 py-3" style={{ borderColor: surface }}>
        <div
          className="flex-1 rounded-full border px-3 py-2 text-sm opacity-60"
          style={{ borderColor: surface, color: text }}
        >
          {t.agents.detail.draft.previewInputPlaceholder}
        </div>
        <Send className="size-4 shrink-0" style={{ color: primary }} aria-hidden />
      </div>
    </div>
  );

  return createPortal(
    <>
      {open && panel}
      <button
        type="button"
        aria-label={open ? t.agents.detail.draft.previewClose : t.agents.detail.draft.previewOpen}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="fixed z-50 flex items-center justify-center transition-transform hover:scale-105"
        style={{
          ...position,
          width: LAUNCHER_SIZE,
          height: LAUNCHER_SIZE,
          background: primary,
          borderRadius: launcherRadius,
          color: textOnPrimary,
          boxShadow: LAUNCHER_SHADOW,
        }}
      >
        {open ? (
          <X className="size-6" aria-hidden />
        ) : (
          <MessageCircle className="size-6" aria-hidden />
        )}
      </button>
    </>,
    document.body
  );
}
