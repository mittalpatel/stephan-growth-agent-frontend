'use client';

import { useState } from 'react';
import { AlertTriangle, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { t } from '@/locales';

import { useAgentEmbedCode } from '../hooks/useAgentEmbedCode';

const copy = t.agents.settings.embed;

type Props = Readonly<{ agentId: string }>;

/**
 * The single place a deployment key gets created (2026-09-09). Mints a fresh
 * key via `POST /agents/{id}/embed-code/` (backend 2026-09-07) and shows the
 * real install snippet it returns, with a copy affordance and a one-time
 * warning since the secret embedded in it is never shown again.
 */
export function EmbedSnippetSection({ agentId }: Props) {
  const { canManage, embedCode, generate, isGenerating } = useAgentEmbedCode(agentId);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!embedCode) return;
    try {
      await navigator.clipboard.writeText(embedCode.embed_snippet);
      setCopied(true);
      toast.success(copy.copied);
    } catch {
      toast.error(copy.copyFailed);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold">{copy.title}</h2>
            <p className="text-muted-foreground mt-1 text-sm">{copy.description}</p>
          </div>
          {canManage && (
            <Button
              onClick={() => {
                setCopied(false);
                void generate();
              }}
              disabled={isGenerating}
            >
              {copy.generate}
            </Button>
          )}
        </div>

        {embedCode && (
          <div className="space-y-3">
            <div className="bg-warning border-warning-foreground/20 flex gap-3 rounded-md border p-3">
              <AlertTriangle className="text-warning-foreground size-5 shrink-0" aria-hidden />
              <p className="text-warning-foreground text-sm">{copy.warning}</p>
            </div>

            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-medium">{copy.snippetLabel}</p>
              <div className="flex items-start gap-2">
                <pre className="bg-muted flex-1 overflow-x-auto rounded-md p-4 text-xs">
                  <code>{embedCode.embed_snippet}</code>
                </pre>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={copy.copyLabel}
                  onClick={() => void handleCopy()}
                >
                  {copied ? (
                    <Check className="size-4" aria-hidden />
                  ) : (
                    <Copy className="size-4" aria-hidden />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
