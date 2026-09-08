'use client';

import { useState } from 'react';
import { MessageCircle, Send, Smartphone, Monitor } from 'lucide-react';
import { useWatch } from 'react-hook-form';

import { checkContrast, isValidHexColor } from '@/lib/contrast';
import { format } from '@/lib/i18n';
import { t } from '@/locales';
import type { AgentDraftFormValues } from '@/lib/schemas/agent';

/**
 * A mocked render of the embeddable widget, kept in sync with the draft form
 * via `useWatch` so an operator sees the effect of every field on this tab
 * without saving first. There is no real widget bundle in this repo (the
 * embed script is a separate deliverable — see `context/app/(restricted)/agents/page.md`),
 * so this is a faithful approximation built from the same theme/behavior
 * values, not the actual runtime.
 *
 * The hex values below are user-authored widget branding data flowing
 * straight from the form, and the small structural constants (shadow/size
 * mappings) describe this mock chrome only — neither is the app's own UI,
 * so AGENTS.md's "colors from globals.css only" rule doesn't apply here,
 * same exception `RHFColorField` already documents.
 */

// Preview-only fallbacks so an in-progress draft with unset colors still
// renders a legible mock rather than invisible text-on-text. Match the
// backend's own seeded starter palette (`apps/agents/seed_data.py`) where it
// defines one, so a fresh agent's preview looks like what it will actually
// publish with.
const FALLBACK_COLORS = {
  primary: '#2563EB',
  secondary: '#1E293B',
  accent: '#2563EB',
  background: '#FFFFFF',
  surface: '#F8FAFC',
  text: '#0F172A',
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
};

const SHADOW_CSS: Record<string, string> = {
  none: 'none',
  sm: '0 1px 3px rgba(0,0,0,0.12)',
  md: '0 4px 16px rgba(0,0,0,0.16)',
  lg: '0 12px 32px rgba(0,0,0,0.24)',
};

// Percentages of the frame's own box, not fixed pixels — the frame itself
// is `w-full` (whatever column it's given, e.g. the 320px draft-tab
// sidebar), so a hardcoded pixel panel size previously overflowed that
// column outright rather than scaling to fit it.
const PANEL_SIZE_CSS: Record<string, { width: string; height: string }> = {
  compact: { width: '68%', height: '60%' },
  standard: { width: '80%', height: '70%' },
  large: { width: '92%', height: '80%' },
};

const LAUNCHER_RADIUS_CSS: Record<string, string> = {
  circle: '9999px',
  rounded_square: '16px',
  pill: '9999px',
};

// A small fixed margin reads correctly regardless of the frame's own size
// (a real widget sits a fixed real-world distance from the corner), unlike
// the panel's own width/height above.
const POSITION_CSS: Record<
  string,
  { top?: string; bottom?: string; left?: string; right?: string }
> = {
  bottom_right: { bottom: '8px', right: '8px' },
  bottom_left: { bottom: '8px', left: '8px' },
  top_right: { top: '8px', right: '8px' },
  top_left: { top: '8px', left: '8px' },
};

function pick<T>(map: Record<string, T>, key: string, fallback: T): T {
  return map[key] ?? fallback;
}

export function WidgetPreview({ defaultLanguage }: Readonly<{ defaultLanguage: string }>) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
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

  const fontFamily = (v.typography_font_family as string) || 'system-ui';
  const shadow = pick(SHADOW_CSS, (v.widget_shadow as string) || '', SHADOW_CSS.md);
  const panelSize = pick(
    PANEL_SIZE_CSS,
    (v.widget_panel_size as string) || '',
    PANEL_SIZE_CSS.standard
  );
  const launcherRadius = pick(
    LAUNCHER_RADIUS_CSS,
    (v.widget_launcher_shape as string) || '',
    LAUNCHER_RADIUS_CSS.circle
  );
  const position = pick(
    POSITION_CSS,
    (v.widget_position as string) || '',
    POSITION_CSS.bottom_right
  );
  const isMobileLayout = (v.widget_mobile_layout as string) === 'fullscreen';

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

  // `w-full` and an aspect ratio, not a fixed pixel size: the frame fills
  // whatever column it's given (the 320px draft-tab sidebar today) instead
  // of assuming a specific viewport width.
  const frameAspect = device === 'mobile' ? '9 / 16' : '4 / 5';
  const panelFillsFrame = device === 'mobile' && isMobileLayout;

  return (
    <div className="border-border bg-muted/30 rounded-lg border p-4" style={{ fontFamily }}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          {t.agents.detail.draft.livePreviewHeading}
        </p>
        <div className="border-border flex items-center gap-0.5 rounded-md border p-0.5">
          <button
            type="button"
            aria-label={t.agents.detail.draft.previewDesktop}
            onClick={() => setDevice('desktop')}
            className={`rounded p-1 ${device === 'desktop' ? 'bg-background' : ''}`}
          >
            <Monitor className="text-muted-foreground size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label={t.agents.detail.draft.previewMobile}
            onClick={() => setDevice('mobile')}
            className={`rounded p-1 ${device === 'mobile' ? 'bg-background' : ''}`}
          >
            <Smartphone className="text-muted-foreground size-3.5" aria-hidden />
          </button>
        </div>
      </div>

      <div className={device === 'mobile' ? 'mx-auto w-full max-w-55' : 'mx-auto w-full'}>
        {/* A browser chrome bar, so this reads as "the widget sitting on a
            real webpage" rather than an abstract box — only for the desktop
            preview, where a URL bar makes sense. */}
        {device === 'desktop' && (
          <div className="flex items-center gap-1.5 rounded-t-md border border-b-0 border-gray-200 bg-gray-50 px-3 py-2">
            <span className="size-2 rounded-full bg-gray-300" />
            <span className="size-2 rounded-full bg-gray-300" />
            <span className="size-2 rounded-full bg-gray-300" />
            <div className="ml-2 flex-1 truncate rounded-full border border-gray-200 bg-white px-2 py-0.5 text-center text-[9px] text-gray-400">
              {t.agents.detail.draft.previewUrlBar}
            </div>
          </div>
        )}

        <div
          className={
            device === 'mobile'
              ? 'relative w-full overflow-hidden rounded-md border border-gray-200 bg-white'
              : 'relative w-full overflow-hidden rounded-b-md border border-gray-200 bg-white'
          }
          style={{ aspectRatio: frameAspect }}
        >
          {/* A stand-in for the host page the widget would sit on top of,
              using the operator's own primary color for the dot grid so it
              reads as their brand's page, not a generic mockup. */}
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(currentColor_1px,transparent_1px)] bg-size-[16px_16px] opacity-[0.08]"
            style={{ color: primary }}
          />
          <div className="absolute inset-0 flex flex-col gap-2 p-4">
            <div className="h-3 w-14 rounded-full bg-gray-200" />
            <div className="mt-3 h-2.5 w-3/4 rounded-full bg-gray-200" />
            <div className="h-2.5 w-1/2 rounded-full bg-gray-200" />
          </div>

          <div
            className="absolute flex flex-col overflow-hidden"
            style={{
              ...(panelFillsFrame ? { inset: 0 } : { ...position, ...panelSize }),
              borderRadius: panelFillsFrame ? 0 : 14,
              boxShadow: shadow,
              background,
            }}
          >
            <div
              className="flex items-center gap-2 px-3 py-2.5"
              style={{ background: primary, color: textOnPrimary }}
            >
              <span
                className="flex size-6 shrink-0 items-center justify-center rounded-full"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                <MessageCircle className="size-3.5" aria-hidden />
              </span>
              <span className="truncate text-sm font-semibold">{t.common.appName}</span>
              <span
                className="ml-auto size-1.5 rounded-full"
                style={{ background: textOnPrimary === '#FFFFFF' ? '#4ADE80' : '#16A34A' }}
                aria-hidden
              />
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
              <div
                className="max-w-[85%] rounded-2xl rounded-tl-sm px-3 py-2 text-xs shadow-sm"
                style={{ background: surface, color: textOnSurface }}
              >
                {greeting}
              </div>
              {questions.slice(0, 3).map((q) => (
                <button
                  key={q}
                  type="button"
                  className="block w-full max-w-[85%] rounded-full border px-3 py-1.5 text-left text-xs transition-opacity hover:opacity-80"
                  style={{ borderColor: primary, color: primary }}
                >
                  {q}
                </button>
              ))}
            </div>

            {disclosureEnabled && (
              <p
                className="text-muted-foreground border-t px-3 py-1.5 text-[10px]"
                style={{ borderColor: surface }}
              >
                {disclosureText}
              </p>
            )}

            <div
              className="flex items-center gap-2 border-t px-2 py-2"
              style={{ borderColor: surface }}
            >
              <div
                className="flex-1 rounded-full border px-3 py-1.5 text-xs"
                style={{ borderColor: surface, color: text }}
              >
                {t.agents.detail.draft.previewInputPlaceholder}
              </div>
              <Send className="size-4 shrink-0" style={{ color: primary }} aria-hidden />
            </div>
          </div>

          {!panelFillsFrame && (
            <div
              className="absolute flex size-11 items-center justify-center"
              style={{
                ...position,
                background: primary,
                borderRadius: launcherRadius,
                color: textOnPrimary,
                boxShadow: shadow,
              }}
            >
              <MessageCircle className="size-5" aria-hidden />
            </div>
          )}
        </div>
      </div>

      <p className="text-muted-foreground mt-2 text-center text-[11px]">
        {format(t.agents.detail.draft.livePreviewNote, { language: defaultLanguage })}
      </p>
    </div>
  );
}
