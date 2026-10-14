'use client';

import { useState } from 'react';
import { AlertTriangle, Check, Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { plural } from '@/lib/i18n';
import { t } from '@/locales';
import type { Agent } from '@/types/agent';

import { WidgetPreviewView } from '../../components/WidgetPreview';
import { useAgentDeploymentKeys } from '../hooks/useAgentDeploymentKeys';
import { useAgentEmbedCode } from '../hooks/useAgentEmbedCode';
import { usePublishedWidgetPreview } from '../hooks/usePublishedWidgetPreview';

const copy = t.agents.settings.embed;

type Props = Readonly<{ agent: Agent }>;

/**
 * The single place a deployment key gets created (2026-09-09). Mints a fresh
 * key via `POST /agents/{id}/embed-code/` (backend 2026-09-07) and shows the
 * real install snippet it returns, with a copy affordance and a one-time
 * warning since the secret embedded in it is never shown again.
 */
export function EmbedSnippetSection({ agent }: Props) {
  const { canManage, embedCode, generate, isGenerating } = useAgentEmbedCode(agent.id);
  const { keys } = useAgentDeploymentKeys(agent.id);
  const activeKeyCount = keys.filter((key) => !key.revoked_at).length;
  const [confirmingNew, setConfirmingNew] = useState(false);

  const startGenerate = () => {
    setCopied(false);
    void generate();
  };
  const preview = usePublishedWidgetPreview(agent);
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
            <p className="text-foreground mt-1 text-sm font-semibold">{copy.description}</p>
            <ol className="text-foreground mt-2 list-decimal space-y-1 pl-4 text-sm font-semibold">
              {copy.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            {preview.canPreview && (
              <Button variant="outline" onClick={preview.toggle} aria-pressed={preview.isOpen}>
                {preview.isOpen ? (
                  <EyeOff className="size-4" aria-hidden />
                ) : (
                  <Eye className="size-4" aria-hidden />
                )}
                {preview.isOpen ? copy.previewHide : copy.previewShow}
              </Button>
            )}
            {canManage && (
              <Button
                // Each click mints a new key. With one already active, say so
                // first: a second key is rarely what was meant.
                onClick={() => (activeKeyCount > 0 ? setConfirmingNew(true) : startGenerate())}
                disabled={isGenerating}
              >
                {copy.generate}
              </Button>
            )}
          </div>
        </div>

        {preview.isOpen && (
          <p className="text-muted-foreground text-sm">
            {preview.isLoading ? copy.previewLoading : copy.previewHint}
          </p>
        )}
        {preview.isOpen && preview.values && (
          <WidgetPreviewView
            values={preview.values}
            defaultLanguage={agent.default_language}
            agentName={agent.name}
          />
        )}

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
      <ConfirmDialog
        open={confirmingNew}
        title={copy.generateAgainTitle}
        message={plural(activeKeyCount, copy.generateAgainMessage)}
        confirmLabel={copy.generateAgainAction}
        onConfirm={() => {
          setConfirmingNew(false);
          startGenerate();
        }}
        onOpenChange={setConfirmingNew}
      />
    </Card>
  );
}
