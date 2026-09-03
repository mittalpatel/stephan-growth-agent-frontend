'use client';

import Link from 'next/link';

import {
  DataTable,
  DataTableBody,
  DataTableRow,
  dataTableHeadRow,
  dataTableTd,
  dataTableTh,
} from '@/components/common/DataTable';
import { StatusBadge, type StatusTone } from '@/components/common/StatusBadge';
import { formatDate } from '@/lib/i18n';
import { t } from '@/locales';
import type { ProjectListItem, ProjectStatus } from '@/types/project';

/**
 * Status → tone, mapped here rather than inside `StatusBadge`.
 *
 * The tone is a property of *this* domain's vocabulary, so it belongs next to
 * the domain. `Record<ProjectStatus, …>` rather than a loose lookup means adding
 * a status to `ProjectStatus` fails the build here until it is given a tone,
 * instead of silently rendering grey.
 */
const STATUS_TONE: Record<ProjectStatus, StatusTone> = {
  draft: 'neutral',
  active: 'success',
  archived: 'warning',
};

type Props = Readonly<{ projects: ProjectListItem[] }>;

export function ProjectsTable({ projects }: Props) {
  return (
    <DataTable minWidth={720}>
      <thead>
        <tr className={dataTableHeadRow}>
          <th className={dataTableTh}>{t.projects.columns.name}</th>
          <th className={dataTableTh}>{t.projects.columns.status}</th>
          <th className={dataTableTh}>{t.projects.columns.category}</th>
          {/* Secondary columns drop out before the primary ones on narrow screens
              rather than the table scrolling from the first breakpoint. */}
          <th className={`${dataTableTh} hidden lg:table-cell`}>{t.projects.columns.owner}</th>
          <th className={`${dataTableTh} hidden md:table-cell`}>{t.projects.columns.createdAt}</th>
        </tr>
      </thead>
      <DataTableBody>
        {projects.map((project) => (
          <DataTableRow key={project.id}>
            <td className={dataTableTd}>
              <Link
                href={`/projects/${project.id}`}
                className="font-medium underline-offset-4 hover:underline"
              >
                {project.name}
              </Link>
            </td>
            <td className={dataTableTd}>
              <StatusBadge
                label={t.projects.status[project.status]}
                tone={STATUS_TONE[project.status]}
              />
            </td>
            <td className={`${dataTableTd} text-muted-foreground text-sm`}>
              {t.projects.category[project.category]}
            </td>
            <td className={`${dataTableTd} text-muted-foreground hidden text-sm lg:table-cell`}>
              {project.owner_email || t.common.notAvailable}
            </td>
            <td className={`${dataTableTd} text-muted-foreground hidden text-sm md:table-cell`}>
              {formatDate(project.created_at)}
            </td>
          </DataTableRow>
        ))}
      </DataTableBody>
    </DataTable>
  );
}
