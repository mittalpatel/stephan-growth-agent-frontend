import { redirect } from 'next/navigation';

/**
 * `/agents/<slug>/knowledge` stopped being a page when Knowledge became a tab of the
 * agent detail view (`?tab=knowledge`), but the URL is still reachable: the
 * breadcrumb links every path segment, so on a nested page such as
 * `knowledge/<id>` the "Knowledge" crumb pointed here and returned a 404 (client
 * test report, 29 Sep 2026). Redirecting keeps old links and the crumb working.
 *
 * `params` is a Promise in Next 16; see `AGENTS.md`.
 */
export default async function AgentKnowledgeRedirect({
  params,
}: Readonly<{ params: Promise<{ agentTypeSlug: string }> }>) {
  const { agentTypeSlug } = await params;
  redirect(`/agents/${agentTypeSlug}?tab=knowledge`);
}
