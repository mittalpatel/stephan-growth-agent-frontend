'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Markdown } from '@/components/common/Markdown';
import { StatusBadge } from '@/components/common/StatusBadge';
import { fieldInputCls } from '@/components/common/form/fieldStyles';
import { t } from '@/locales';
import type { Agent } from '@/types/agent';

import { useAgentTestAsk } from '../hooks/useAgentTestAsk';

type Props = Readonly<{ agent: Agent }>;

export function AgentTestTab({ agent }: Props) {
  const [question, setQuestion] = useState('');
  const { ask, result, isPending, errorMessage } = useAgentTestAsk(agent.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.agents.detail.test.title}</CardTitle>
        <p className="text-muted-foreground text-sm">{t.agents.detail.test.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (question.trim()) void ask(question.trim());
          }}
        >
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={t.agents.detail.test.questionPlaceholder}
            aria-label={t.agents.detail.test.questionPlaceholder}
            disabled={isPending}
            className={fieldInputCls}
          />
          <Button type="submit" disabled={isPending || !question.trim()}>
            {t.agents.detail.test.submit}
          </Button>
        </form>

        {errorMessage && <p className="text-destructive text-sm">{errorMessage}</p>}

        {result && (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{t.agents.detail.test.answerLabel}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">
                  {t.agents.detail.test.confidenceLabel}
                </span>
                <StatusBadge
                  label={t.agents.detail.test.confidence[result.confidence_decision]}
                  tone={result.confidence_decision === 'answered' ? 'success' : 'warning'}
                />
              </div>
            </div>
            <Markdown className="text-sm leading-relaxed">{result.answer}</Markdown>

            <div className="border-border border-t pt-3">
              <p className="mb-2 text-xs font-semibold">{t.agents.detail.test.citationsLabel}</p>
              {result.citations.length === 0 ? (
                <p className="text-muted-foreground text-xs">{t.agents.detail.test.noCitations}</p>
              ) : (
                <ul className="space-y-2">
                  {result.citations.map((citation, index) => (
                    <li key={`${citation.source_url}-${index}`} className="text-xs">
                      <p className="font-medium">{citation.source_title}</p>
                      <Markdown className="text-muted-foreground">{citation.excerpt}</Markdown>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
