import { redirect } from 'next/navigation';

/**
 * `/agents/<slug>/settings` stopped being a page when Settings became a tab
 * of the agent detail view (`?tab=settings`). The Knowledge route 404'd the
 * same way in client testing (29 Sep 2026), so this one redirects too rather
 * than waiting for a bookmark or an old link to hit it.
 *
 * `params` is a Promise in Next 16; see `AGENTS.md`.
 */
export default async function AgentSettingsRedirect({
  params,
}: Readonly<{ params: Promise<{ agentTypeSlug: string }> }>) {
  const { agentTypeSlug } = await params;
  redirect(`/agents/${agentTypeSlug}?tab=settings`);
}
