'use client';

import { useRef, useState } from 'react';
import { FileText, UploadCloud, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

type Props = Readonly<{
  file: File | null;
  onFileSelected: (file: File) => void;
  /**
   * A native `accept` string. Also enforced on **drop**, which the picker
   * cannot do for us: a drag bypasses the file dialog's own filtering
   * entirely, so without this a dropped file of the wrong type is accepted
   * client-side and only rejected once the upload has already left.
   */
  accept?: string;
  /** Overrides for a feature with more specific copy than the generic hint. */
  hint?: string;
  activeHint?: string;
  /** Shown when a dropped file fails the `accept` check. */
  rejectedMessage?: string;
  /** Omit to make the chosen file non-clearable. */
  onClear?: () => void;
  disabled?: boolean;
}>;

/**
 * Drag-and-drop file input with a click-to-browse fallback.
 *
 * Extracted from `ProjectFilesSection` once the PDF knowledge-source upload
 * needed the same control: that copy lives inside the `projects` demo slice,
 * which `npm run strip-demo` deletes, so importing it from a real feature
 * would have made the strip take working code with it.
 */
export function Dropzone({
  file,
  onFileSelected,
  accept,
  hint,
  activeHint,
  rejectedMessage,
  onClear,
  disabled,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [rejected, setRejected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function matchesAccept(candidate: File): boolean {
    if (!accept) return true;
    return accept.split(',').some((pattern) => {
      const rule = pattern.trim().toLowerCase();
      if (!rule) return false;
      if (rule.startsWith('.')) return candidate.name.toLowerCase().endsWith(rule);
      if (rule.endsWith('/*')) return candidate.type.startsWith(rule.slice(0, -1));
      return candidate.type.toLowerCase() === rule;
    });
  }

  function selectIfAllowed(candidate: File) {
    if (!matchesAccept(candidate)) {
      setRejected(true);
      return;
    }
    setRejected(false);
    onFileSelected(candidate);
  }

  const open = () => inputRef.current?.click();

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && open()}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            open();
          }
        }}
        onDragOver={(event) => {
          if (disabled) return;
          event.preventDefault();
          setIsDragging(true);
        }}
        // `dragleave` bubbles up from every child, so dragging across the icon
        // or the label would otherwise flip this off and on and make the
        // highlight flicker. Only a leave that exits the zone itself counts.
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsDragging(false);
          }
        }}
        onDrop={(event) => {
          if (disabled) return;
          event.preventDefault();
          setIsDragging(false);
          const dropped = event.dataTransfer.files?.[0];
          if (dropped) selectIfAllowed(dropped);
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
          isDragging
            ? 'border-ring bg-accent'
            : 'border-border hover:border-ring hover:bg-accent/40'
        )}
      >
        <div
          className={cn(
            'flex size-11 items-center justify-center rounded-full transition-colors',
            isDragging ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}
        >
          <UploadCloud className="size-5" aria-hidden />
        </div>
        <p className="text-sm font-medium">
          {isDragging ? (activeHint ?? t.common.dropzone.active) : (hint ?? t.common.dropzone.hint)}
        </p>
        {!isDragging && <p className="text-muted-foreground text-xs">{t.common.dropzone.browse}</p>}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          disabled={disabled}
          className="hidden"
          onChange={(event) => {
            const selected = event.target.files?.[0];
            if (selected) selectIfAllowed(selected);
            // Reset so re-picking the same file after clearing still fires a
            // change event.
            event.target.value = '';
          }}
        />
      </div>

      {rejected && (
        <p className="text-destructive text-sm">{rejectedMessage ?? t.common.dropzone.wrongType}</p>
      )}

      {file && (
        <div className="border-border bg-muted/40 flex items-center gap-3 rounded-lg border px-3 py-2.5">
          <FileText className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-muted-foreground text-xs">{formatFileSize(file.size)}</p>
          </div>
          {onClear && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              disabled={disabled}
              aria-label={t.common.dropzone.clear}
              title={t.common.dropzone.clear}
              onClick={() => {
                setRejected(false);
                onClear();
              }}
            >
              <X className="size-4" aria-hidden />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
