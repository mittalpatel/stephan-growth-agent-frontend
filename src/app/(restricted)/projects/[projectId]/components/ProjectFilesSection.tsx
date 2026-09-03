'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Download, FileText, Pencil, Trash2, UploadCloud, X } from 'lucide-react';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import {
  DataTable,
  DataTableBody,
  DataTableRow,
  dataTableHeadRow,
  dataTableTd,
  dataTableTh,
} from '@/components/common/DataTable';
import { EmptyState } from '@/components/common/EmptyState';
import { RHFTextField } from '@/components/common/form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { downloadBlob } from '@/lib/downloadBlob';
import { format, formatDate } from '@/lib/i18n';
import {
  projectFileUploadSchema,
  type ProjectFileUploadFormValues,
} from '@/lib/schemas/projectFile';
import { cn } from '@/lib/utils';
import { t } from '@/locales';
import { projectFileDownloadEndpoint } from '@/services/files';
import type { ProjectFile } from '@/types/file';

import { useMyProjectAccess } from '../../hooks/useMyProjectAccess';
import { useProjectFiles } from '../../hooks/useProjectFiles';
import { useFilePreview } from '../hooks/useFilePreview';

// pdf.js touches browser-only APIs (`DOMMatrix`) at import time, so this must
// never be part of the server-rendered bundle for this page.
const PdfPreview = dynamic(() => import('./PdfPreview'), {
  ssr: false,
  loading: () => <Skeleton className="h-[480px] w-full" />,
});

/** Courtesy client-side check only — the backend enforces the real limit. */
const MAX_CLIENT_UPLOAD_BYTES = 25 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unitIndex]}`;
}

/**
 * Drag-and-drop dropzone with a click-to-browse fallback. Nothing like this
 * existed anywhere in the repo, so it's built from scratch here rather than
 * reused from a shared primitive.
 */
function Dropzone({
  file,
  onFileSelected,
}: Readonly<{ file: File | null; onFileSelected: (file: File) => void }>) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        const dropped = event.dataTransfer.files?.[0];
        if (dropped) onFileSelected(dropped);
      }}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors',
        isDragging ? 'border-ring bg-accent' : 'border-border'
      )}
    >
      <UploadCloud className="text-muted-foreground size-6" aria-hidden />
      <p className="text-sm">
        {isDragging ? t.projects.files.form.dropzoneActive : t.projects.files.form.dropzoneHint}
      </p>
      {file && (
        <p className="text-muted-foreground text-xs">
          {t.projects.files.form.selectedFile}: {file.name}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (selected) onFileSelected(selected);
        }}
      />
    </div>
  );
}

function UploadFileDialog({
  upload,
  isUploading,
}: Readonly<{
  upload: (file: File, name: string) => Promise<boolean>;
  isUploading: boolean;
}>) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const form = useForm<ProjectFileUploadFormValues>({
    resolver: zodResolver(projectFileUploadSchema),
    defaultValues: { name: '' },
  });

  const reset = () => {
    form.reset();
    setFile(null);
    setFileError(null);
  };

  const handleFileSelected = (selected: File) => {
    setFile(selected);
    setFileError(null);
    if (!form.getValues('name')) {
      form.setValue('name', selected.name, { shouldValidate: true });
    }
  };

  const onSubmit = async (values: ProjectFileUploadFormValues) => {
    if (!file) {
      setFileError(t.projects.files.validation.fileRequired);
      return;
    }
    if (file.size > MAX_CLIENT_UPLOAD_BYTES) {
      setFileError(
        format(t.projects.files.validation.fileTooLarge, {
          limit: formatFileSize(MAX_CLIENT_UPLOAD_BYTES),
        })
      );
      return;
    }
    const ok = await upload(file, values.name);
    if (ok) {
      reset();
      setOpen(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UploadCloud className="size-4" aria-hidden />
          {t.projects.files.uploadButton}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.projects.files.form.title}</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Dropzone file={file} onFileSelected={handleFileSelected} />
            {fileError && <p className="text-destructive text-sm">{fileError}</p>}
            <RHFTextField<ProjectFileUploadFormValues>
              name="name"
              label={t.projects.files.form.nameLabel}
              placeholder={t.projects.files.form.namePlaceholder}
              required
            />
            <Button type="submit" className="w-full" disabled={isUploading}>
              {t.projects.files.form.submit}
            </Button>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

function RenameFileDialog({
  file,
  rename,
  isPending,
}: Readonly<{
  file: ProjectFile;
  rename: (fileId: string, name: string) => Promise<boolean>;
  isPending: boolean;
}>) {
  const [open, setOpen] = useState(false);

  const form = useForm<ProjectFileUploadFormValues>({
    resolver: zodResolver(projectFileUploadSchema),
    defaultValues: { name: file.name },
  });

  const onSubmit = async (values: ProjectFileUploadFormValues) => {
    const ok = await rename(file.id, values.name);
    if (ok) setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) form.reset({ name: file.name });
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t.projects.files.actions.rename}
        >
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.projects.files.actions.rename}</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <RHFTextField<ProjectFileUploadFormValues>
              name="name"
              label={t.projects.files.form.nameLabel}
              placeholder={t.projects.files.form.namePlaceholder}
              required
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {t.projects.files.actions.rename}
            </Button>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Inline preview for one file. Branches on `content_type`: an image renders
 * directly, a PDF renders via `react-pdf` (PDF.js), and everything else falls
 * back to a generic icon plus the same `downloadBlob` helper the row's
 * Download button uses — the button is shown regardless of whether a preview
 * rendered.
 */
function FilePreview({
  projectId,
  file,
  onClose,
}: Readonly<{ projectId: string; file: ProjectFile; onClose: () => void }>) {
  const { url, isLoading, isError } = useFilePreview(projectId, file.id);
  const isImage = file.content_type.startsWith('image/');
  const isPdf = file.content_type === 'application/pdf';

  return (
    <div className="bg-muted/30 space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t.projects.files.previewClose}
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {!isLoading && isError && (
        <p className="text-destructive text-sm">{t.projects.files.errorDescription}</p>
      )}

      {!isLoading && !isError && url && isImage && (
        // A blob URL can't be optimized by next/image, so a plain <img> is the
        // right element here.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={file.name} className="max-h-[480px] w-full rounded-md object-contain" />
      )}

      {!isLoading && !isError && url && isPdf && <PdfPreview url={url} />}

      {!isLoading && !isError && url && !isImage && !isPdf && (
        <div className="flex flex-col items-center gap-3 py-8">
          <FileText className="text-muted-foreground size-10" aria-hidden />
          <p className="text-muted-foreground text-sm">{t.projects.files.previewUnavailable}</p>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          void downloadBlob(projectFileDownloadEndpoint(projectId, file.id), file.original_filename)
        }
      >
        <Download className="size-4" aria-hidden />
        {t.projects.files.actions.download}
      </Button>
    </div>
  );
}

function FilesSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

/**
 * Files attached to one project — upload, list, preview, download, rename,
 * delete. Nested entirely under the project's detail page; there is no
 * cross-project "all files" view.
 *
 * ## Access gating — a UI convenience, not the enforcement point
 *
 * The backend independently refuses every request the caller isn't entitled
 * to. This only decides what to render:
 *   - org-wide `project:create`/`project:delete` (effectively Owner/Admin,
 *     and Member for create only) → show upload/delete respectively.
 *   - otherwise, `useMyProjectAccess(projectId)` — gated on `project:view`
 *     only, unlike the full roster (`useProjectAccess`, `project:access_manage`)
 *     — reports the caller's own standing: `editor`/`manager`/`owner`/`org_wide`
 *     shows both upload and delete, `viewer` or no grant sees view/download only.
 */
export function ProjectFilesSection({ projectId }: Readonly<{ projectId: string }>) {
  const { can } = usePermissions();
  const { hasEditorGrant } = useMyProjectAccess(projectId);
  const { files, isLoading, isError, pendingId, isUploading, upload, rename, remove, refetch } =
    useProjectFiles(projectId);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);

  const canUploadFiles = can('project', 'create') || hasEditorGrant;
  const canDeleteFiles = can('project', 'delete') || hasEditorGrant;

  const previewFile = previewFileId ? (files.find((f) => f.id === previewFileId) ?? null) : null;

  return (
    <div className="bg-card space-y-4 rounded-lg border p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{t.projects.files.title}</h2>
          <p className="text-muted-foreground mt-1 text-sm">{t.projects.files.description}</p>
        </div>
        {canUploadFiles && <UploadFileDialog upload={upload} isUploading={isUploading} />}
      </div>

      {isLoading ? (
        <FilesSkeleton />
      ) : isError ? (
        <EmptyState
          icon={AlertTriangle}
          title={t.projects.files.errorTitle}
          description={t.projects.files.errorDescription}
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              {t.buttons.tryAgain}
            </Button>
          }
        />
      ) : files.length === 0 ? (
        <EmptyState
          title={t.projects.files.emptyTitle}
          description={t.projects.files.emptyDescription}
        />
      ) : (
        <>
          <DataTable minWidth={640}>
            <thead>
              <tr className={dataTableHeadRow}>
                <th className={dataTableTh}>{t.projects.files.columns.name}</th>
                <th className={`${dataTableTh} hidden sm:table-cell`}>
                  {t.projects.files.columns.size}
                </th>
                <th className={`${dataTableTh} hidden md:table-cell`}>
                  {t.projects.files.columns.contentType}
                </th>
                <th className={`${dataTableTh} hidden lg:table-cell`}>
                  {t.projects.files.columns.owner}
                </th>
                <th className={`${dataTableTh} hidden md:table-cell`}>
                  {t.projects.files.columns.uploadedAt}
                </th>
                <th className={dataTableTh} />
              </tr>
            </thead>
            <DataTableBody>
              {files.map((file) => (
                <DataTableRow key={file.id}>
                  <td className={dataTableTd}>
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewFileId((current) => (current === file.id ? null : file.id))
                      }
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {file.name}
                    </button>
                  </td>
                  <td
                    className={`${dataTableTd} text-muted-foreground hidden text-sm sm:table-cell`}
                  >
                    {formatFileSize(file.size)}
                  </td>
                  <td
                    className={`${dataTableTd} text-muted-foreground hidden text-sm md:table-cell`}
                  >
                    {file.content_type}
                  </td>
                  <td
                    className={`${dataTableTd} text-muted-foreground hidden text-sm lg:table-cell`}
                  >
                    {file.owner_email || t.common.notAvailable}
                  </td>
                  <td
                    className={`${dataTableTd} text-muted-foreground hidden text-sm md:table-cell`}
                  >
                    {formatDate(file.created_at)}
                  </td>
                  <td className={`${dataTableTd} text-right`}>
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t.projects.files.actions.download}
                        onClick={() =>
                          void downloadBlob(
                            projectFileDownloadEndpoint(projectId, file.id),
                            file.original_filename
                          )
                        }
                      >
                        <Download className="size-4" />
                      </Button>
                      {canUploadFiles && (
                        <RenameFileDialog
                          file={file}
                          rename={rename}
                          isPending={pendingId === file.id}
                        />
                      )}
                      {canDeleteFiles && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={pendingId === file.id}
                          aria-label={t.projects.files.actions.delete}
                          onClick={() => void remove(file.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>

          {previewFile && (
            <FilePreview
              projectId={projectId}
              file={previewFile}
              onClose={() => setPreviewFileId(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
