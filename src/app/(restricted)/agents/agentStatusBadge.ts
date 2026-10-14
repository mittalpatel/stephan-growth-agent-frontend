import type { StatusTone } from '@/components/common/StatusBadge';
import { t } from '@/locales';
import type { AgentStatus } from '@/types/agent';

const STATUS_TONE: Record<AgentStatus, StatusTone> = {
  active: 'success',
  paused: 'warning',
  archived: 'neutral',
};

/**
 * The badge an agent shows wherever it is listed. An active agent that was
 * never published reads "Not published": "Active" there suggested visitors
 * could already talk to it (client testing, 14 Oct 2026).
 */
export function agentStatusBadge(
  status: AgentStatus,
  isPublished: boolean
): { label: string; tone: StatusTone } {
  if (status === 'active' && !isPublished) {
    return { label: t.agents.notPublished, tone: 'neutral' };
  }
  return { label: t.agents.status[status], tone: STATUS_TONE[status] };
}
