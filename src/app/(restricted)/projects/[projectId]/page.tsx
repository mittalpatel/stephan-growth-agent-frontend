import type { Metadata } from 'next';
import { Suspense } from 'react';

import { t } from '@/locales';

import { ProjectDetailSkeleton } from './components/ProjectDetailSkeleton';
import { ProjectDetailsView } from './components/ProjectDetailsView';

export function generateMetadata(): Metadata {
  // A function, not a constant: built per request, in the viewer's language.
  return { title: t.projects.detail.title };
}

/**
 * The project detail route.
 *
 * `params` is a Promise in Next 16 and must be awaited — it is no longer a plain
 * object, and destructuring it directly is one of the more common upgrade
 * mistakes. See `node_modules/next/dist/docs/` before changing this signature.
 */
export default async function ProjectDetailPage({
  params,
}: Readonly<{ params: Promise<{ projectId: string }> }>) {
  const { projectId } = await params;

  return (
    <Suspense fallback={<ProjectDetailSkeleton />}>
      <ProjectDetailsView projectId={projectId} />
    </Suspense>
  );
}
