import { MessagesSquare, Share2, SquarePen, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { t } from '@/locales';

/**
 * The four Sprint 1 agents (frontend-plan-v3.md), shared between the
 * dashboard's "Agent performance" section and the agents list so both render
 * the same catalog instead of two independent mock lists drifting apart.
 */
export type AgentCategory = 'sales' | 'growth' | 'marketing' | 'automation';

export type CatalogAgent = {
  id: string;
  icon: LucideIcon;
  name: string;
  category: AgentCategory;
  description: string;
  features: readonly string[];
  metricALabel: string;
  metricAValue: string;
  metricBLabel: string;
  metricBValue: string;
  valueGenerated: string;
};

export const AGENT_CATALOG: readonly CatalogAgent[] = [
  { id: 'website-sales-support', icon: MessagesSquare, ...t.agents.catalog.websiteSalesSupport },
  { id: 'sevo', icon: Target, ...t.agents.catalog.sevo },
  { id: 'content-strategy', icon: SquarePen, ...t.agents.catalog.contentStrategy },
  { id: 'lead-outreach', icon: Share2, ...t.agents.catalog.leadOutreach },
] as const;
