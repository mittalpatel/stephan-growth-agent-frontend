/**
 * One-time PDF.js worker setup for `react-pdf`. `pdf.worker.min.mjs` is
 * copied from `node_modules/pdfjs-dist/build/` into `public/` (kept in sync
 * manually with the installed `pdfjs-dist` version pinned by `react-pdf`) so
 * the worker can be served as a static asset rather than bundled — pdfjs-dist
 * ships its own module workers that Next.js's bundler doesn't handle well.
 *
 * Import this module once, for its side effect, from the component that
 * renders a `react-pdf` `<Document>` — do not duplicate this assignment
 * elsewhere.
 */
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
