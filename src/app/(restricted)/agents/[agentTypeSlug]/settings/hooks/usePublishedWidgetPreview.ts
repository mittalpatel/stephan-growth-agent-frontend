'use client';

import { useState } from 'react';

import type { Agent } from '@/types/agent';

import { useAgentVersion } from '../../hooks/useAgentVersion';
import { versionToFormValues } from '../../hooks/useAgentDraftForm';

/**
 * The published widget as the embed step's preview sees it. Client review
 * (06 Oct 2026): there was no way to see what the widget would look like
 * before pasting the snippet on a live site. The version is only fetched
 * once the preview is opened.
 */
export function usePublishedWidgetPreview(agent: Agent) {
  const [isOpen, setIsOpen] = useState(false);
  const publishedId = agent.published_version?.id;
  const { version, isLoading } = useAgentVersion(agent.id, isOpen ? publishedId : undefined);

  return {
    canPreview: Boolean(publishedId),
    isOpen,
    toggle: () => setIsOpen((open) => !open),
    isLoading,
    values: version ? versionToFormValues(version, agent.enabled_languages) : undefined,
  };
}
