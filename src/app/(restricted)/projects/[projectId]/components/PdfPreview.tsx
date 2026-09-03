'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from '@/lib/i18n';
import '@/lib/pdfWorker';
import { t } from '@/locales';

const PDF_ZOOM_MIN = 0.5;
const PDF_ZOOM_MAX = 2.5;
const PDF_ZOOM_STEP = 0.25;

/**
 * PDF.js-based preview for one PDF file, via `react-pdf`. Kept in its own
 * module and always loaded through `next/dynamic` with `ssr: false` — pdf.js
 * touches browser-only APIs (`DOMMatrix`) at import time, which crashes if
 * evaluated during server rendering.
 */
export default function PdfPreview({ url }: Readonly<{ url: string }>) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [loadError, setLoadError] = useState(false);

  return (
    <div className="space-y-3">
      <div className="bg-background flex h-[480px] w-full items-start justify-center overflow-auto rounded-md border">
        <Document
          file={url}
          onLoadSuccess={({ numPages: loadedPages }) => {
            setLoadError(false);
            setNumPages(loadedPages);
            setPageNumber(1);
          }}
          onLoadError={() => setLoadError(true)}
          loading={<Skeleton className="h-64 w-full" />}
          error={
            <p className="text-destructive p-4 text-sm">{t.projects.files.previewLoadError}</p>
          }
        >
          {!loadError && <Page pageNumber={pageNumber} scale={scale} />}
        </Document>
      </div>

      {!loadError && numPages && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t.projects.files.pdf.previousPage}
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <p className="text-muted-foreground text-sm">
              {format(t.projects.files.pdf.pageOf, { current: pageNumber, total: numPages })}
            </p>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t.projects.files.pdf.nextPage}
              disabled={pageNumber >= numPages}
              onClick={() => setPageNumber((page) => Math.min(numPages, page + 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t.projects.files.pdf.zoomOut}
              disabled={scale <= PDF_ZOOM_MIN}
              onClick={() =>
                setScale((s) => Math.max(PDF_ZOOM_MIN, +(s - PDF_ZOOM_STEP).toFixed(2)))
              }
            >
              <ZoomOut className="size-4" />
            </Button>
            <p className="text-muted-foreground w-12 text-center text-sm">
              {Math.round(scale * 100)}%
            </p>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t.projects.files.pdf.zoomIn}
              disabled={scale >= PDF_ZOOM_MAX}
              onClick={() =>
                setScale((s) => Math.min(PDF_ZOOM_MAX, +(s + PDF_ZOOM_STEP).toFixed(2)))
              }
            >
              <ZoomIn className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
