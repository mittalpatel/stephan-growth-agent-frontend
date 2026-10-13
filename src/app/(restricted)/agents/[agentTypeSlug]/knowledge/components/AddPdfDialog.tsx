'use client';

import { useState } from 'react';
import { AlertCircle, Upload } from 'lucide-react';

import { Dropzone } from '@/components/common/Dropzone';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format } from '@/lib/i18n';
import { t } from '@/locales';

import { useAddPdfSource } from '../hooks/useAddPdfSource';
import { useAllKnowledgeSources } from '../hooks/useAllKnowledgeSources';

type Props = Readonly<{ onCreated?: (sourceId: string) => void }>;

export function AddPdfDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [rejection, setRejection] = useState<string | null>(null);
  const { upload, isUploading, duplicateSourceId, limitsHint, fileError } =
    useAddPdfSource(onCreated);
  // A PDF source has no detail route to link to (no `website_source_id`, no
  // pages view), so the duplicate is named rather than linked. The org-wide
  // list is already loaded for the sources table, so this is a lookup, not a
  // new request.
  const { sources } = useAllKnowledgeSources();
  const duplicateSourceName = duplicateSourceId
    ? (sources.find((source) => source.id === duplicateSourceId)?.display_name ?? null)
    : null;

  const reset = () => {
    setFile(null);
    setRejection(null);
  };

  // An oversized file is refused on pick, so nothing is sent just to be
  // turned away.
  const selectFile = (candidate: File) => {
    const error = fileError(candidate);
    setRejection(error);
    setFile(error ? null : candidate);
  };

  // The submit button is disabled without a file, so there is no
  // "you forgot to choose one" state to report here.
  const submit = async () => {
    if (!file) return;
    const ok = await upload(file);
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
        <Button variant="outline">
          <Upload className="size-4" aria-hidden />
          {t.knowledge.actions.addPdf}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.knowledge.addPdf.title}</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">{t.knowledge.addPdf.description}</p>

        <Dropzone
          file={file}
          accept="application/pdf,.pdf"
          hint={t.knowledge.addPdf.dropzoneHint}
          activeHint={t.knowledge.addPdf.dropzoneActive}
          rejectedMessage={t.knowledge.addPdf.dropzoneWrongType}
          disabled={isUploading}
          onFileSelected={selectFile}
          onClear={reset}
        />

        {limitsHint && !rejection && <p className="text-muted-foreground text-xs">{limitsHint}</p>}
        {rejection && (
          <p role="alert" className="text-destructive text-sm">
            {rejection}
          </p>
        )}

        {duplicateSourceName && (
          <div className="border-border bg-muted/40 flex items-start gap-2.5 rounded-lg border p-3">
            <AlertCircle className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
            <p className="text-muted-foreground text-sm">
              {format(t.knowledge.addPdf.duplicateSource, { name: duplicateSourceName })}
            </p>
          </div>
        )}

        <Button onClick={submit} disabled={isUploading || !file} className="w-full">
          {isUploading ? t.knowledge.addPdf.uploading : t.knowledge.addPdf.submit}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
