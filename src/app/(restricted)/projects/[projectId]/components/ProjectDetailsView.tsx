'use client';

import Link from 'next/link';
import { AlertTriangle, Info } from 'lucide-react';

import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge, type StatusTone } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/i18n';
import { t } from '@/locales';
import type { ProjectStatus } from '@/types/project';

import { useProjectDetail } from '../../hooks/useProjectDetail';
import { ProjectAccessSection } from './ProjectAccessSection';
import { ProjectDetailSkeleton } from './ProjectDetailSkeleton';
import { ProjectFilesSection } from './ProjectFilesSection';

const STATUS_TONE: Record<ProjectStatus, StatusTone> = {
  draft: 'neutral',
  active: 'success',
  archived: 'warning',
};

/** One label/value row. A `<dl>` is the correct element for a record like this. */
function Field({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b py-3 last:border-0">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export function ProjectDetailsView({ projectId }: Readonly<{ projectId: string }>) {
  const { project, isLoading, isError, isNotFound, refetch } = useProjectDetail(projectId);

  if (isLoading) return <ProjectDetailSkeleton />;

  // A missing record and a failed request are different situations. Offering
  // "try again" for a 404 invites the user to retry something that cannot
  // succeed, so only the genuine error state gets a retry.
  if (isNotFound || (!project && !isError)) {
    return (
      <EmptyState
        title={t.projects.detail.notFoundTitle}
        description={t.projects.detail.notFoundDescription}
        action={
          <Button variant="outline" asChild>
            <Link href="/projects">{t.projects.detail.backToList}</Link>
          </Button>
        }
      />
    );
  }

  if (isError || !project) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title={t.projects.list.errorTitle}
        description={t.projects.list.errorDescription}
        action={
          <Button variant="outline" onClick={() => void refetch()}>
            {t.buttons.tryAgain}
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight break-words">{project.name}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t.projects.detail.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge
            label={t.projects.status[project.status]}
            tone={STATUS_TONE[project.status]}
          />
          <ProjectAccessSection projectId={projectId} ownerEmail={project.owner_email} />
        </div>
      </div>

      {!project.is_editable && (
        <div className="bg-warning text-warning-foreground flex gap-3 rounded-md p-4">
          <Info className="h-5 w-5 shrink-0" aria-hidden />
          <p className="text-sm">{t.projects.detail.archivedNotice}</p>
        </div>
      )}

      <dl className="bg-card rounded-lg border px-6 py-2">
        <Field label={t.projects.columns.category}>{t.projects.category[project.category]}</Field>
        <Field label={t.projects.columns.owner}>
          {project.owner_email || t.common.notAvailable}
        </Field>
        <Field label={t.projects.columns.createdAt}>{formatDateTime(project.created_at)}</Field>
        <Field label={t.projects.columns.updatedAt}>{formatDateTime(project.updated_at)}</Field>
      </dl>

      {project.description && (
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-muted-foreground mb-2 text-sm font-medium">
            {t.projects.form.descriptionLabel}
          </h2>
          <p className="text-sm leading-relaxed whitespace-pre-line">{project.description}</p>
        </div>
      )}

      <ProjectFilesSection projectId={projectId} />
    </div>
  );
}
