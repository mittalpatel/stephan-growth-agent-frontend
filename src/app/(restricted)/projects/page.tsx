import type { Metadata } from 'next';
import { Suspense } from 'react';

import { t } from '@/locales';

import { ProjectsList } from './components/ProjectsList';
import { ProjectsTableSkeleton } from './components/ProjectsSkeleton';

export const metadata: Metadata = {
  title: t.projects.title,
  description: t.projects.description,
};

/**
 * The projects list route — a server component that renders metadata and hands
 * off to a client island.
 *
 * The `Suspense` boundary is required, not decorative: `ProjectsList` reads the
 * URL through `useSearchParams`, and Next opts any route doing that out of
 * static rendering unless the read happens inside a boundary. Without it the
 * whole page becomes dynamic and the build warns.
 */
export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectsTableSkeleton />}>
      <ProjectsList />
    </Suspense>
  );
}
