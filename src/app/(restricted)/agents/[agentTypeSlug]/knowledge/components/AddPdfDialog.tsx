'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

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
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading, duplicateSourceId } = useAddPdfSource(onCreated);
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
    setFileError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const submit = async () => {
    if (!file) {
      setFileError(t.knowledge.validation.fileRequired);
      return;
    }
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
        <div className="space-y-2">
          <label htmlFor="knowledge-pdf-file" className="mb-1.5 block text-sm font-medium">
            {t.knowledge.addPdf.fileLabel}
          </label>
          <input
            id="knowledge-pdf-file"
            ref={inputRef}
            type="file"
            accept="application/pdf"
            onChange={(event) => {
              const selected = event.target.files?.[0] ?? null;
              setFile(selected);
              setFileError(null);
            }}
            className="border-input bg-background block w-full rounded-md border px-3 py-2 text-sm"
          />
          {fileError && <p className="text-destructive text-sm">{fileError}</p>}
        </div>
        {duplicateSourceName && (
          <p className="text-muted-foreground text-sm">
            {format(t.knowledge.addPdf.duplicateSource, { name: duplicateSourceName })}
          </p>
        )}
        <Button onClick={submit} disabled={isUploading} className="w-full">
          {isUploading ? t.knowledge.addPdf.uploading : t.knowledge.addPdf.submit}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
