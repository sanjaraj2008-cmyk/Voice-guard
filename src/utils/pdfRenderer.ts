import * as pdfjsLib from 'pdfjs-dist';
// Use standard bundled worker or cdn fallback
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export interface PdfConversionResult {
  imageBlob: Blob;
  imageUrl: string;
  width: number;
  height: number;
  pageCount: number;
}

/**
 * Converts the first page of an uploaded PDF file into a high-resolution image blob
 * for local client-side forensic inspection.
 */
export async function convertPdfPageToImage(
  pdfFile: File | Blob
): Promise<PdfConversionResult> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
    isEvalSupported: false
  });

  const pdfDocument = await loadingTask.promise;
  const pageCount = pdfDocument.numPages;

  // Retrieve page 1 (1-indexed)
  const page = await pdfDocument.getPage(1);

  // Render at 2x scale for crisp forensic examination (Laplacian & ELA)
  const viewport = page.getViewport({ scale: 2.0 });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Could not initialize 2D canvas context for PDF rendering.');
  }

  // Draw white background before rendering PDF vectors
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport
  };

  await page.render(renderContext).promise;

  const imageBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to encode rendered PDF page into image blob.'));
    }, 'image/png');
  });

  const imageUrl = URL.createObjectURL(imageBlob);

  return {
    imageBlob,
    imageUrl,
    width: canvas.width,
    height: canvas.height,
    pageCount
  };
}
