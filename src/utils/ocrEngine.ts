/**
 * In-Browser Optical Character Recognition (OCR), PDF Text/Stream Extractor,
 * & Universal Identity Entity Parsing Engine
 * 
 * Provides real on-device text extraction using Tesseract.js (WASM / Web Worker),
 * dual-pass adaptive canvas preprocessing, native + PDF.js document extraction,
 * and structured entity parsing for Aadhaar, PAN, Passports, Driving Licences, and general IDs.
 */

import { OCRFields } from '../types/edge';

export interface ParsedOCRResult {
  fields: OCRFields;
  rawText: string;
  confidence: number;
  detectedType: string;
  lines: string[];
  engineUsed?: string;
  passCount?: number;
  diagnostics?: string[];
}

export type OCRPreprocessMode = 'standard' | 'high-contrast';

/**
 * Preprocesses an image on an HTML5 canvas to optimize OCR character extraction:
 * 1. Paints a solid #ffffff matte first so transparent PNG alpha channels never turn black
 * 2. Rescales to optimal OCR stroke height (1000px–1800px)
 * 3. Supports 'standard' (background tint suppression + gentle luminance boost)
 *    and 'high-contrast' (adaptive local contrast stretch for shadowed/faint scans)
 */
export function preprocessCanvasForOCR(
  source: HTMLImageElement | HTMLCanvasElement,
  mode: OCRPreprocessMode = 'standard'
): HTMLCanvasElement {
  const origWidth = source instanceof HTMLImageElement ? (source.naturalWidth || source.width || 1000) : (source.width || 1000);
  const origHeight = source instanceof HTMLImageElement ? (source.naturalHeight || source.height || 700) : (source.height || 700);

  const safeOrigW = Math.max(1, origWidth);
  const safeOrigH = Math.max(1, origHeight);

  // Scale target dimension so text strokes have sufficient pixel density
  const targetWidth = Math.min(1800, Math.max(1000, safeOrigW));
  const targetHeight = Math.max(1, Math.round(safeOrigH * (targetWidth / safeOrigW)));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  // CRITICAL FIX: Always fill solid white background before drawing source image
  // so transparent PNG regions become white paper (255) instead of black (0).
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

  try {
    const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const data = imgData.data;

    // Compute luminance min/max and mean to adaptively normalize exposure
    let sumLum = 0;
    const pixelCount = data.length / 4;
    const grays = new Uint8Array(pixelCount);

    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const a = data[i + 3] / 255;
      // Blend with white matte if partially transparent
      const r = Math.round(data[i] * a + 255 * (1 - a));
      const g = Math.round(data[i + 1] * a + 255 * (1 - a));
      const b = Math.round(data[i + 2] * a + 255 * (1 - a));
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      grays[p] = gray;
      sumLum += gray;
    }

    const meanLum = sumLum / Math.max(1, pixelCount);

    if (mode === 'standard') {
      // Standard pass: suppress faint colored guilloche security patterns on ID cards
      // while sharpening dark typography strokes
      const whiteClip = Math.max(175, Math.min(220, meanLum + 18));
      const blackClip = Math.max(45, Math.min(115, meanLum - 45));
      const range = Math.max(20, whiteClip - blackClip);

      for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        const g = grays[p];
        let out: number;
        if (g >= whiteClip) {
          out = 255;
        } else if (g <= blackClip) {
          out = Math.max(0, Math.round((g / blackClip) * 35));
        } else {
          const norm = (g - blackClip) / range;
          out = Math.round(35 + norm * 220);
        }
        data[i] = out;
        data[i + 1] = out;
        data[i + 2] = out;
        data[i + 3] = 255;
      }
    } else {
      // High-contrast pass: adaptive thresholding around local mean luminance
      // Ideal for shadowed camera photos, faded prints, or low-contrast scans
      const threshold = Math.max(95, Math.min(190, meanLum * 0.86));
      for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        const g = grays[p];
        const out = g < threshold
          ? Math.max(0, Math.round((g / threshold) * 40))
          : Math.min(255, Math.round(210 + ((g - threshold) / Math.max(1, 255 - threshold)) * 45));
        data[i] = out;
        data[i + 1] = out;
        data[i + 2] = out;
        data[i + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  } catch (e) {
    console.warn('[DocuGuard OCR] Image data manipulation skipped:', e);
  }

  return canvas;
}

/**
 * Executes in-browser Tesseract.js OCR with PNG DataURL serialization
 * and automatic 2-pass adaptive fallback when confidence or character yield is low.
 */
export async function runInBrowserTesseract(
  imageSource: HTMLImageElement | HTMLCanvasElement,
  onProgress?: (percent: number, statusText: string) => void,
  preferredMode: 'auto' | OCRPreprocessMode = 'auto'
): Promise<{ text: string; confidence: number; passCount: number; diagnostics: string[] }> {
  const diagnostics: string[] = [];

  try {
    const TesseractModule: any = await import('tesseract.js');
    const recognizeFn = TesseractModule.recognize || TesseractModule.default?.recognize;

    if (typeof recognizeFn !== 'function') {
      diagnostics.push('Tesseract.recognize function unavailable in module export.');
      return { text: '', confidence: 0, passCount: 0, diagnostics };
    }

    const executeSinglePass = async (
      mode: OCRPreprocessMode,
      progressBase: number,
      progressSpan: number
    ): Promise<{ text: string; confidence: number }> => {
      onProgress?.(progressBase, `Preprocessing document (${mode} luminance)...`);
      const preprocessedCanvas = preprocessCanvasForOCR(imageSource, mode);
      // Serialize canvas to PNG Data URL so Web Worker cloning works reliably across browsers
      const pngDataUrl = preprocessedCanvas.toDataURL('image/png');

      onProgress?.(progressBase + 5, `Running Tesseract OCR (${mode} pass)...`);
      const result = await recognizeFn(pngDataUrl, 'eng', {
        logger: (m: any) => {
          if (m.status === 'recognizing text' && typeof m.progress === 'number') {
            const pct = Math.round(progressBase + 5 + m.progress * (progressSpan - 5));
            onProgress?.(pct, `Scanning Typography (${Math.round(m.progress * 100)}%)...`);
          }
        }
      });

      const text = (result?.data?.text || '').trim();
      const confidence = Math.max(0, Math.min(1, (result?.data?.confidence || 0) / 100));
      return { text, confidence };
    };

    if (preferredMode === 'high-contrast') {
      const pass = await executeSinglePass('high-contrast', 15, 75);
      diagnostics.push(`High-contrast OCR pass completed (${pass.text.length} chars, ${(pass.confidence * 100).toFixed(0)}% conf).`);
      return { ...pass, passCount: 1, diagnostics };
    }

    if (preferredMode === 'standard') {
      const pass = await executeSinglePass('standard', 15, 75);
      diagnostics.push(`Standard OCR pass completed (${pass.text.length} chars, ${(pass.confidence * 100).toFixed(0)}% conf).`);
      return { ...pass, passCount: 1, diagnostics };
    }

    // 'auto' mode: run standard pass first, then trigger high-contrast pass if yield is weak
    const pass1 = await executeSinglePass('standard', 15, 45);
    const alnumCount1 = (pass1.text.match(/[A-Za-z0-9]/g) || []).length;
    diagnostics.push(`Pass 1 (standard): ${alnumCount1} alphanumeric chars, ${(pass1.confidence * 100).toFixed(0)}% confidence.`);

    if (alnumCount1 >= 18 && pass1.confidence >= 0.48) {
      return { text: pass1.text, confidence: pass1.confidence, passCount: 1, diagnostics };
    }

    // Trigger Pass 2 (high-contrast adaptive thresholding)
    const pass2 = await executeSinglePass('high-contrast', 60, 35);
    const alnumCount2 = (pass2.text.match(/[A-Za-z0-9]/g) || []).length;
    diagnostics.push(`Pass 2 (high-contrast fallback): ${alnumCount2} alphanumeric chars, ${(pass2.confidence * 100).toFixed(0)}% confidence.`);

    // Combine or pick the better pass
    if (alnumCount2 > alnumCount1 * 1.15 || (pass2.confidence > pass1.confidence && alnumCount2 >= alnumCount1)) {
      const mergedText = pass1.text && !pass2.text.includes(pass1.text)
        ? `${pass2.text}\n${pass1.text}`
        : pass2.text;
      return {
        text: mergedText,
        confidence: Math.max(pass1.confidence, pass2.confidence),
        passCount: 2,
        diagnostics
      };
    }

    const mergedText = pass2.text && !pass1.text.includes(pass2.text)
      ? `${pass1.text}\n${pass2.text}`
      : pass1.text;

    return {
      text: mergedText,
      confidence: Math.max(pass1.confidence, pass2.confidence),
      passCount: 2,
      diagnostics
    };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.warn('[DocuGuard OCR] In-browser Tesseract worker note:', errMsg);
    diagnostics.push(`Local Tesseract worker notice: ${errMsg}`);
    return { text: '', confidence: 0, passCount: 0, diagnostics };
  }
}

/**
 * Extracts raw text streams and embedded JPEG/PNG images directly from a PDF binary buffer.
 * Serves both as a fast native PDF text extractor and as a zero-dependency fallback
 * when PDF.js Web Workers are blocked by browser CSP.
 */
export function extractRawPdfTextFromBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const latin1 = new TextDecoder('latin1').decode(bytes);
  const extractedChunks: string[] = [];

  // 1. Extract literal strings inside PDF text operators: (text) Tj or [(text) -10 (more)] TJ
  const btEtRegex = /BT[\s\S]*?ET/g;
  let btMatch: RegExpExecArray | null;
  while ((btMatch = btEtRegex.exec(latin1)) !== null) {
    const block = btMatch[0];
    const lineParts: string[] = [];
    const literalRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)/g;
    let lit: RegExpExecArray | null;
    while ((lit = literalRegex.exec(block)) !== null) {
      const decoded = lit[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, ' ')
        .replace(/\\t/g, ' ')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\\/g, '\\');
      if (/[\x20-\x7E]/.test(decoded)) {
        lineParts.push(decoded);
      }
    }
    if (lineParts.length > 0) {
      extractedChunks.push(lineParts.join('\n'));
    }
  }

  // 2. Fallback: scan for parenthesized printable strings anywhere in uncompressed streams
  if (extractedChunks.join(' ').trim().length < 15) {
    const globalLitRegex = /\(([\x20-\x7E]{3,120})\)/g;
    let gMatch: RegExpExecArray | null;
    while ((gMatch = globalLitRegex.exec(latin1)) !== null) {
      const val = gMatch[1].trim();
      // Filter out standard PDF metadata boilerplate
      if (!/^(?:Adobe|PDF|Identity-H|WinAnsiEncoding|MacRomanEncoding|Type1|TrueType|DeviceRGB|DeviceCMYK)/i.test(val)) {
        extractedChunks.push(val);
      }
    }
  }

  return extractedChunks
    .map(s => s.replace(/[ \t]+/g, ' ').trim())
    .filter(s => s.length >= 2)
    .join('\n');
}

/**
 * Extracts text and renders a visual page canvas from an uploaded PDF Blob.
 * Uses pdfjs-dist when available and falls back to native PDF binary stream extraction.
 */
export async function extractPdfTextAndCanvas(
  pdfBlob: Blob
): Promise<{ img: HTMLImageElement; blobUrl: string; pdfText: string; diagnostics: string[] }> {
  const diagnostics: string[] = [];
  const buffer = await pdfBlob.arrayBuffer();
  let pdfText = '';

  // 1. Always run fast native binary PDF text extraction first
  try {
    pdfText = extractRawPdfTextFromBuffer(buffer);
    if (pdfText.length > 0) {
      diagnostics.push(`Extracted ${pdfText.length} chars from native PDF text operators.`);
    }
  } catch (e: any) {
    diagnostics.push(`Native PDF stream parse note: ${e?.message || e}`);
  }

  // 2. Attempt full PDF.js page rendering + text content extraction
  try {
    const pdfjsLib: any = await import('pdfjs-dist');
    const getDocument = pdfjsLib.getDocument || pdfjsLib.default?.getDocument;
    const GlobalWorkerOptions = pdfjsLib.GlobalWorkerOptions || pdfjsLib.default?.GlobalWorkerOptions;

    if (GlobalWorkerOptions && !GlobalWorkerOptions.workerSrc) {
      GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
    }

    if (typeof getDocument === 'function') {
      const loadingTask = getDocument({ data: new Uint8Array(buffer.slice(0)), disableFontFace: true });
      const pdfDoc = await loadingTask.promise;
      const page = await pdfDoc.getPage(1);

      // Extract structured text items
      try {
        const textContent = await page.getTextContent();
        const itemsText = (textContent?.items || [])
          .map((item: any) => item.str || '')
          .filter(Boolean)
          .join(' ');
        if (itemsText.trim().length > pdfText.trim().length) {
          pdfText = itemsText.trim();
          diagnostics.push(`PDF.js getTextContent extracted ${pdfText.length} chars.`);
        }
      } catch (tcErr: any) {
        diagnostics.push(`PDF.js textContent note: ${tcErr?.message || tcErr}`);
      }

      // Render Page 1 onto high-res canvas
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(800, Math.round(viewport.width));
      canvas.height = Math.max(1000, Math.round(viewport.height));
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport }).promise;
        const dataUrl = canvas.toDataURL('image/png');
        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = dataUrl;
        });
        diagnostics.push('Rendered PDF Page 1 via PDF.js rasterizer.');
        return { img, blobUrl: dataUrl, pdfText, diagnostics };
      }
    }
  } catch (pdfJsErr: any) {
    diagnostics.push(`PDF.js worker fallback activated (${pdfJsErr?.message || 'CSP/offline mode'}).`);
  }

  // 3. Check if PDF contains an embedded JPEG stream (0xFF 0xD8 ... 0xFF 0xD9)
  const bytes = new Uint8Array(buffer);
  let jpegStart = -1;
  let jpegEnd = -1;
  for (let i = 0; i < bytes.length - 1; i++) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xd8 && bytes[i + 2] === 0xff) {
      jpegStart = i;
      break;
    }
  }
  if (jpegStart !== -1) {
    for (let i = bytes.length - 2; i > jpegStart; i--) {
      if (bytes[i] === 0xff && bytes[i + 1] === 0xd9) {
        jpegEnd = i + 2;
        break;
      }
    }
  }

  if (jpegStart !== -1 && jpegEnd > jpegStart + 256) {
    try {
      const jpegBlob = new Blob([bytes.slice(jpegStart, jpegEnd)], { type: 'image/jpeg' });
      const blobUrl = URL.createObjectURL(jpegBlob);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = blobUrl;
      });
      diagnostics.push('Extracted embedded JPEG image stream directly from PDF container.');
      return { img, blobUrl, pdfText, diagnostics };
    } catch {
      // Fall through to canvas typography rendering
    }
  }

  // 4. Render extracted PDF text onto a high-resolution document canvas so both
  // visual inspection and downstream OCR operate on the real PDF text content
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1600;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1200, 1600);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.strokeRect(48, 48, 1104, 1504);

    const linesToDraw = pdfText
      ? pdfText.split('\n').map(l => l.trim()).filter(Boolean)
      : ['PDF Document Loaded (No uncompressed text layer detected)'];

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px sans-serif';
    let y = 120;
    for (const line of linesToDraw.slice(0, 32)) {
      ctx.fillText(line.slice(0, 68), 80, y);
      y += 42;
      ctx.font = '24px sans-serif';
    }
  }

  const dataUrl = canvas.toDataURL('image/png');
  const img = new Image();
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.src = dataUrl;
  });

  return { img, blobUrl: dataUrl, pdfText, diagnostics };
}

/**
 * Normalizes common optical character recognition digit/letter confusions
 * inside numeric tokens (e.g., 'O'/'o' -> '0', 'I'/'l' -> '1', 'S' -> '5', 'B' -> '8').
 */
export function normalizeNumericOcrToken(token: string): string {
  return token
    .replace(/[OoQD]/g, '0')
    .replace(/[Iil|!]/g, '1')
    .replace(/[Zz]/g, '2')
    .replace(/[Ss$]/g, '5')
    .replace(/[Bb]/g, '8');
}

/**
 * Parses raw extracted OCR text using specialized regular expressions,
 * character-confusion recovery, and layout heuristics to extract structured identity parameters:
 * - Indian Aadhaar (12-digit spaced or continuous UID)
 * - Indian Income Tax PAN Card (10-character alphanumeric)
 * - International Passports (MRZ & Passport Number)
 * - Driving Licences & Voter ID (EPIC) Cards
 * - Dates of Birth, Expiry Dates, Genders, Addresses, and Full Names
 */
export function parseUniversalIdentityEntities(
  rawText: string,
  fileName: string = ''
): ParsedOCRResult {
  const cleanText = rawText
    .replace(/\r/g, '')
    .replace(/[|¦]/g, 'I')
    .trim();
  const rawLines = cleanText
    .split('\n')
    .map(l => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const fields: OCRFields = {
    fullName: '',
    documentId: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    documentType: 'Identity Document'
  };

  if (!cleanText || cleanText.length < 3) {
    return {
      fields: {
        fullName: 'No legible text detected',
        documentId: 'UNREADABLE',
        dateOfBirth: '',
        gender: '',
        address: '',
        documentType: 'Unidentified Document'
      },
      rawText: cleanText || 'No text discovered by optical character recognition.',
      confidence: 0,
      detectedType: 'Unidentified',
      lines: []
    };
  }

  const upperText = cleanText.toUpperCase();

  // ─── 1. Determine Document Type ──────────────────────────────────────────
  let detectedType = 'National Identity Document';
  const isAadhaarKeyword = upperText.includes('AADHAAR') ||
    upperText.includes('AADHAR') ||
    upperText.includes('UIDAI') ||
    upperText.includes('UNIQUE IDENTIFICATION') ||
    (upperText.includes('GOVERNMENT OF INDIA') && (upperText.includes('MERA') || upperText.includes('ENROLMENT') || upperText.includes('VID')));

  const isPanKeyword = upperText.includes('INCOME TAX') ||
    upperText.includes('PERMANENT ACCOUNT') ||
    upperText.includes('PAN CARD') ||
    upperText.includes('GOVT. OF INDIA') && upperText.includes('TAX');

  const isPassportKeyword = upperText.includes('PASSPORT') ||
    (upperText.includes('REPUBLIC OF INDIA') && upperText.includes('PASS')) ||
    upperText.includes('P<IND') ||
    upperText.includes('P<');

  const isDrivingLicense = upperText.includes('DRIVING') ||
    upperText.includes('LICENCE') ||
    upperText.includes('LICENSE') ||
    upperText.includes('MOTOR VEHICLE') ||
    upperText.includes('TRANSPORT');

  const isVoterId = upperText.includes('ELECTION COMMISSION') ||
    upperText.includes('ELECTOR') ||
    upperText.includes('IDENTITY CARD') && upperText.includes('ELECTION');

  if (isAadhaarKeyword) detectedType = 'Aadhaar Card';
  else if (isPanKeyword) detectedType = 'Permanent Account Number (PAN)';
  else if (isPassportKeyword) detectedType = 'Passport';
  else if (isDrivingLicense) detectedType = 'Driving Licence';
  else if (isVoterId) detectedType = 'Voter Identity Card (EPIC)';

  fields.documentType = detectedType;

  // ─── 2. Extract Document ID (with OCR character confusion recovery) ──────
  // A. Strict or OCR-confused Aadhaar 12-digit format (e.g. 8492 1049 3921 or 8492 1O49 392I)
  let aadhaarDigits = '';
  const strictAadhaarMatch = cleanText.match(/\b([2-9]\d{3}[\s-]?[0-9]{4}[\s-]?[0-9]{4})\b/);
  if (strictAadhaarMatch) {
    aadhaarDigits = strictAadhaarMatch[1].replace(/[\s-]/g, '');
  } else {
    // Check for 4-4-4 token groups where 1 or 2 digits were misread as O/I/S/B
    const nearAadhaarRegex = /\b([2-9OISB][0-9OIlSB]{3})[\s-]+([0-9OIlSB]{4})[\s-]+([0-9OIlSB]{4})\b/g;
    let m: RegExpExecArray | null;
    while ((m = nearAadhaarRegex.exec(cleanText)) !== null) {
      const combined = m[1] + m[2] + m[3];
      const digitCount = (combined.match(/\d/g) || []).length;
      if (digitCount >= 9) {
        const normalized = normalizeNumericOcrToken(combined);
        if (/^[2-9]\d{11}$/.test(normalized)) {
          aadhaarDigits = normalized;
          break;
        }
      }
    }
  }

  // B. PAN format: 5 letters, 4 digits, 1 letter (with recovery if a digit in pos 6-9 was read as O/I/S)
  let panId = '';
  const strictPanMatch = upperText.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/);
  if (strictPanMatch) {
    panId = strictPanMatch[1];
  } else {
    const nearPanMatch = upperText.match(/\b([A-Z]{5})([0-9OISB]{4})([A-Z])\b/);
    if (nearPanMatch && /\d/.test(nearPanMatch[2])) {
      const fixedMid = normalizeNumericOcrToken(nearPanMatch[2]);
      if (/^\d{4}$/.test(fixedMid)) {
        panId = `${nearPanMatch[1]}${fixedMid}${nearPanMatch[3]}`;
      }
    }
  }

  // C. Passport MRZ or Passport Number (1 letter + 7-8 digits)
  const passportMatch = upperText.match(/\b([A-Z][0-9]{7,8})\b/);
  const mrzMatch = upperText.match(/P<[A-Z]{3}([A-Z<]+)\s*\n?\s*([A-Z0-9<]{10,})/);

  // D. Driving Licence (Indian DL format: e.g. DL-0420110149646 or MH12 20150012345)
  const dlMatch = upperText.match(/\b([A-Z]{2}[-\s]?[0-9]{2}[-\s]?(?:19|20)[0-9]{2}\s?[0-9]{6,7})\b/);

  // E. Voter ID (EPIC format: 3 letters + 7 digits)
  const epicMatch = upperText.match(/\b([A-Z]{3}[0-9]{7})\b/);

  if (isPanKeyword && panId) {
    fields.documentId = panId;
    fields.documentType = 'Permanent Account Number (PAN)';
  } else if (aadhaarDigits.length === 12) {
    fields.documentId = `${aadhaarDigits.slice(0, 4)} ${aadhaarDigits.slice(4, 8)} ${aadhaarDigits.slice(8, 12)}`;
    if (detectedType === 'National Identity Document') {
      fields.documentType = 'Aadhaar Card';
      detectedType = 'Aadhaar Card';
    }
  } else if (panId) {
    fields.documentId = panId;
    fields.documentType = 'Permanent Account Number (PAN)';
    detectedType = 'Permanent Account Number (PAN)';
  } else if (dlMatch) {
    fields.documentId = dlMatch[1].replace(/\s+/g, ' ').trim();
    fields.documentType = 'Driving Licence';
    detectedType = 'Driving Licence';
  } else if (passportMatch) {
    fields.documentId = passportMatch[1].toUpperCase();
    fields.documentType = 'Passport';
    detectedType = 'Passport';
  } else if (epicMatch) {
    fields.documentId = epicMatch[1];
    fields.documentType = 'Voter Identity Card (EPIC)';
    detectedType = 'Voter Identity Card (EPIC)';
  } else {
    // General ID extraction fallback: look for labeled identifier lines
    const generalIdMatch = cleanText.match(/(?:ID\s*No|Document\s*ID|Identification|Card\s*No|Licence\s*No|DL\s*No|Passport\s*No|No\.?|Number)[\s.:#-]+([A-Z0-9][A-Z0-9\s-]{4,18})/i);
    if (generalIdMatch) {
      fields.documentId = generalIdMatch[1].trim();
    } else {
      const candidate = rawLines.find(l => /^[A-Z0-9\s-]{8,18}$/i.test(l) && (l.match(/\d/g) || []).length >= 4);
      if (candidate) {
        fields.documentId = candidate.trim();
      }
    }
  }

  // ─── 3. Extract Date of Birth & Expiry Date ─────────────────────────────
  // Support DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, YYYY-MM-DD, and OCR-confused dates (e.g. 14/O8/1992)
  const normalizeDateStr = (rawDate: string): string => {
    const parts = rawDate.split(/[/.-]/).map(p => normalizeNumericOcrToken(p.trim()));
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD -> DD/MM/YYYY
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
      return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
    }
    return rawDate;
  };

  const labeledDobMatch = cleanText.match(/(?:DOB|D\.O\.B|Date\s*of\s*Birth|Birth\s*Date|जन्म\s*तिथि)[\s:./-]*([0-3OIl]?\d[/.-][0-1OIl]?\d[/.-][12]\d{3})/i);
  const genericDateMatch = cleanText.match(/\b([0-3OIl]\d[/.-][0-1OIl]\d[/.-][12]\d{3})\b/)
    || cleanText.match(/\b([12]\d{3}[/.-][0-1]\d[/.-][0-3]\d)\b/);

  if (labeledDobMatch) {
    fields.dateOfBirth = normalizeDateStr(labeledDobMatch[1]);
  } else if (genericDateMatch) {
    fields.dateOfBirth = normalizeDateStr(genericDateMatch[1]);
  } else {
    const yobMatch = cleanText.match(/(?:Year\s*of\s*Birth|YOB)\s*[:.-]?\s*([12]\d{3})/i);
    if (yobMatch) {
      fields.dateOfBirth = `01/01/${yobMatch[1]}`;
    }
  }

  // Expiry Date
  const expiryMatch = cleanText.match(/(?:Valid\s*Till|Expiry|Date\s*of\s*Expiry|DOE)[\s:./-]*([0-3]?\d[/.-][0-1]?\d[/.-][2]\d{3}|PERMANENT)/i);
  if (expiryMatch) {
    fields.expiryDate = expiryMatch[1].toUpperCase() === 'PERMANENT'
      ? 'PERMANENT'
      : normalizeDateStr(expiryMatch[1]);
  } else if (detectedType === 'Aadhaar Card' || detectedType === 'Permanent Account Number (PAN)') {
    fields.expiryDate = 'PERMANENT';
  }

  // ─── 4. Extract Gender ──────────────────────────────────────────────────
  if (/\b(?:FEMALE|WOMAN|महिला|स्त्री)\b/i.test(cleanText) || /(?:Sex|Gender|लिंग)\s*[:/-]?\s*F\b/i.test(cleanText) || /\/\s*FEMALE\b/i.test(cleanText)) {
    fields.gender = 'Female';
  } else if (/\b(?:TRANSGENDER)\b/i.test(cleanText)) {
    fields.gender = 'Transgender';
  } else if (/\b(?:MALE|MAN|पुरुष)\b/i.test(cleanText) || /(?:Sex|Gender|लिंग)\s*[:/-]?\s*M\b/i.test(cleanText) || /\/\s*MALE\b/i.test(cleanText)) {
    fields.gender = 'Male';
  }

  // ─── 5. Extract Full Name ───────────────────────────────────────────────
  const noiseHeaderRegex = /GOVERNMENT|GOVT|INDIA|UNIQUE|IDENTIFICATION|AUTHORITY|INCOME|TAX|DEPARTMENT|PERMANENT|ACCOUNT|NUMBER|CARD|PASSPORT|REPUBLIC|DRIVING|LICENCE|LICENSE|ELECTION|COMMISSION|SIGNATURE|ADDRESS|DOB|DATE OF BIRTH|MALE|FEMALE|AADHAAR|MERA|PEHCHAN|ENROLMENT|DOWNLOAD|ISSUED|VALID|SPECIMEN|PDF DOCUMENT INSPECTION/i;

  // A. Check for explicit name labels
  const labeledNameMatch = cleanText.match(/(?:Full\s*Name|Holder's\s*Name|Name)\s*[:.-]\s*([A-Za-z][A-Za-z\s.]{2,38})/i);
  if (labeledNameMatch) {
    const candidate = labeledNameMatch[1].split('\n')[0].trim();
    if (!noiseHeaderRegex.test(candidate)) {
      fields.fullName = candidate;
    }
  }

  // B. Layout heuristics based on document type
  if (!fields.fullName) {
    if (isPanKeyword) {
      // On PAN cards, the cardholder's name is the first prominent uppercase line before Father's Name and DOB
      const filteredLines = rawLines.filter(l =>
        l.length >= 3 &&
        l.length <= 42 &&
        /^[A-Z\s.]+$/i.test(l) &&
        !noiseHeaderRegex.test(l)
      );
      if (filteredLines.length > 0) {
        fields.fullName = filteredLines[0].trim();
      }
    } else if (mrzMatch) {
      const namePortion = mrzMatch[1];
      const parts = namePortion.split('<<').filter(Boolean).map(p => p.replace(/</g, ' ').trim());
      if (parts.length > 0) {
        fields.fullName = parts.reverse().join(' ');
      }
    }

    if (!fields.fullName) {
      // Find the line immediately preceding DOB if it looks like a person's name
      const dobLineIdx = rawLines.findIndex(l => /DOB|Date\s*of\s*Birth|Year\s*of\s*Birth|[0-3]\d[/.-][0-1]\d[/.-][12]\d{3}/i.test(l));
      if (dobLineIdx > 0) {
        for (let idx = dobLineIdx - 1; idx >= Math.max(0, dobLineIdx - 3); idx--) {
          const line = rawLines[idx].replace(/^[^A-Za-z]+/, '').trim();
          if (
            line.length >= 3 &&
            line.length <= 42 &&
            /^[A-Za-z][A-Za-z\s.]+$/.test(line) &&
            !noiseHeaderRegex.test(line)
          ) {
            fields.fullName = line;
            break;
          }
        }
      }
    }

    // Generic fallback: first clean human name line with 2+ words or title/uppercase letters
    if (!fields.fullName) {
      const candidateName = rawLines
        .map(l => l.replace(/^[^A-Za-z]+/, '').trim())
        .find(l =>
          l.length >= 3 &&
          l.length <= 40 &&
          /^[A-Z][a-zA-Z\s.]+$/.test(l) &&
          !noiseHeaderRegex.test(l)
        );
      if (candidateName) {
        fields.fullName = candidateName.trim();
      }
    }
  }

  // ─── 6. Extract Address & PIN Code ──────────────────────────────────────
  const pinMatch = cleanText.match(/\b([1-9][0-9]{5})\b/);
  const addressLineIndex = rawLines.findIndex(l => /(?:^|\b)(?:Address|Add|S\/O|D\/O|W\/O|C\/O)\s*[:.-]/i.test(l));

  if (addressLineIndex !== -1) {
    const addressLines = rawLines.slice(addressLineIndex, addressLineIndex + 3);
    fields.address = addressLines
      .join(', ')
      .replace(/^(?:Address|Add)\s*[:.-]?\s*/i, '')
      .trim();
  } else if (pinMatch) {
    const pinLineIdx = rawLines.findIndex(l => l.includes(pinMatch[1]));
    if (pinLineIdx !== -1) {
      const startIdx = Math.max(0, pinLineIdx - 1);
      fields.address = rawLines.slice(startIdx, pinLineIdx + 1).join(', ').trim();
    }
  }

  // Clean up any empty fields so Object.keys(fields) reflects genuinely detected fields
  const cleanedFields: OCRFields = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v && v.trim() !== '') {
      cleanedFields[k] = v.trim();
    }
  }

  // Calculate OCR completeness confidence
  let filledCount = 0;
  if (cleanedFields.fullName) filledCount++;
  if (cleanedFields.documentId) filledCount++;
  if (cleanedFields.dateOfBirth) filledCount++;
  if (cleanedFields.gender) filledCount++;
  if (cleanedFields.address) filledCount++;

  const confidence = Math.min(0.98, Math.max(0.45, filledCount / 5));

  return {
    fields: cleanedFields,
    rawText: cleanText,
    confidence,
    detectedType,
    lines: rawLines
  };
}

/**
 * High-level helper: Runs in-browser OCR on an image element or canvas
 * (plus optional pre-extracted PDF text) and returns parsed identity fields.
 */
export async function extractDocumentIdentityOCR(
  source: HTMLImageElement | HTMLCanvasElement,
  fileName: string = '',
  onProgress?: (percent: number, statusText: string) => void,
  preferredMode: 'auto' | OCRPreprocessMode = 'auto',
  preExtractedText: string = ''
): Promise<ParsedOCRResult> {
  const ocrResult = await runInBrowserTesseract(source, onProgress, preferredMode);
  const combinedRawText = [preExtractedText, ocrResult.text]
    .map(t => t.trim())
    .filter(Boolean)
    .join('\n');

  const parsed = parseUniversalIdentityEntities(combinedRawText, fileName);

  // Blend Tesseract optical confidence with semantic parsing completeness
  const combinedConf = ocrResult.confidence > 0
    ? (ocrResult.confidence * 0.55 + parsed.confidence * 0.45)
    : parsed.confidence;

  return {
    ...parsed,
    confidence: Math.round(combinedConf * 100) / 100,
    engineUsed: preExtractedText
      ? `PDF Stream + Local Tesseract WASM (${ocrResult.passCount || 1}-pass)`
      : `Local Tesseract WASM (${ocrResult.passCount || 1}-pass)`,
    passCount: ocrResult.passCount || 1,
    diagnostics: ocrResult.diagnostics
  };
}
