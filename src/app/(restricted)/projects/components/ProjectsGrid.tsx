'use client';

import Link from 'next/link';

import { StatusBadge, type StatusTone } from '@/components/common/StatusBadge';
import { MotionList, MotionListItem } from '@/components/motion/MotionList';
import { formatDate } from '@/lib/i18n';
import { t } from '@/locales';
import type { ProjectListItem, ProjectStatus } from '@/types/project';

const STATUS_TONE: Record<ProjectStatus, StatusTone> = {
  draft: 'neutral',
  active: 'success',
  archived: 'warning',
};

type Props = Readonly<{ projects: ProjectListItem[] }>;

/**
 * The card view.
 *
 * Exists because a table with several columns is unusable below ~640px, and
 * horizontal scrolling is a worse answer than a different layout. Same data,
 * same cache, same URL state — only the presentation differs.
 */
export function ProjectsGrid({ projects }: Props) {
  return (
    <MotionList className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((project) => (
        <MotionListItem as="article" key={project.id}>
          <Link
            href={`/projects/${project.id}`}
            className="bg-card hover:border-ring focus-visible:ring-ring/50 flex h-full flex-col gap-3 rounded-lg border p-4 transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="min-w-0 font-medium break-words">{project.name}</h3>
              <StatusBadge
                label={t.projects.status[project.status]}
                tone={STATUS_TONE[project.status]}
              />
            </div>

            <dl className="text-muted-foreground mt-auto space-y-1 text-sm">
              <div className="flex justify-between gap-2">
                <dt>{t.projects.columns.category}</dt>
                <dd className="text-foreground">{t.projects.category[project.category]}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>{t.projects.columns.createdAt}</dt>
                <dd className="text-foreground">{formatDate(project.created_at)}</dd>
              </div>
            </dl>
          </Link>
        </MotionListItem>
      ))}
    </MotionList>
  );
}
