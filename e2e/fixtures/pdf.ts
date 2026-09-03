/**
 * A trivial, dependency-free multi-page PDF builder for e2e fixtures.
 *
 * Hand-rolled rather than pulled from a library: the file just needs to be a
 * structurally valid PDF that pdf.js (react-pdf, used by
 * ProjectFilesSection's PdfPreview) can open and report a page count for -
 * content and formatting are irrelevant to what these tests assert.
 */
export function buildTestPdf(pageCount: number): Buffer {
  const objects: string[] = [];
  // 1: catalog, 2: pages tree
  const pageObjIds: number[] = [];
  const contentObjIds: number[] = [];
  let nextId = 3;
  for (let i = 0; i < pageCount; i += 1) {
    pageObjIds.push(nextId);
    nextId += 1;
    contentObjIds.push(nextId);
    nextId += 1;
  }

  const kids = pageObjIds.map((id) => `${id} 0 R`).join(' ');

  objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);
  objects.push(
    `2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>\nendobj\n`
  );

  pageObjIds.forEach((pageId, index) => {
    const contentId = contentObjIds[index];
    objects.push(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents ${contentId} 0 R >>\nendobj\n`
    );
    const text = `Page ${index + 1}`;
    const stream = `BT /F1 18 Tf 20 100 Td (${text}) Tj ET`;
    objects.push(
      `${contentId} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`
    );
  });

  let body = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(body, 'latin1'));
    body += obj;
  }

  const xrefStart = Buffer.byteLength(body, 'latin1');
  const totalObjects = objects.length + 1;
  let xref = `xref\n0 ${totalObjects}\n0000000000 65535 f \n`;
  for (let i = 1; i < totalObjects; i += 1) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${totalObjects} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(body + xref + trailer, 'latin1');
}
