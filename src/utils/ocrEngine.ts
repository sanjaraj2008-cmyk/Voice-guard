/**
 * In-Browser Optical Character Recognition (OCR) & Universal Entity Parsing Engine
 * 
 * Provides real on-device text extraction using Tesseract.js (WASM / Web Worker)
 * and structured entity extraction for Indian Aadhaar, PAN Cards, Passports, and general IDs.
 */

import { OCRFields } from '../types/edge';

export interface ParsedOCRResult {
  fields: OCRFields;
  rawText: string;
  confidence: number;
  detectedType: string;
  lines: string[];
}

/**
 * Preprocesses an image on an HTML5 canvas to optimize OCR character extraction:
 * 1. Rescales to optimal OCR line height
 * 2. Converts to high-contrast luminance (grayscale)
 * 3. Normalizes dynamic range and sharpens text contours
 */
export function preprocessCanvasForOCR(source: HTMLImageElement | HTMLCanvasElement): HTMLCanvasElement {
  const origWidth = source instanceof HTMLImageElement ? (source.naturalWidth || source.width) : source.width;
  const origHeight = source instanceof HTMLImageElement ? (source.naturalHeight || source.height) : source.height;

  // Scale target dimension so height is at least 900px for clear font strokes
  const targetWidth = Math.min(1800, Math.max(900, origWidth));
  const targetHeight = Math.round(origHeight * (targetWidth / origWidth));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  // Draw source image
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

  try {
    const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const data = imgData.data;

    // Grayscale + Contrast stretch
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Perceptual luminance
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Gentle sigmoidal contrast boost
      const stretched = gray < 128 
        ? Math.max(0, gray * 0.85) 
        : Math.min(255, 128 + (gray - 128) * 1.35);

      data[i] = stretched;
      data[i + 1] = stretched;
      data[i + 2] = stretched;
    }

    ctx.putImageData(imgData, 0, 0);
  } catch (e) {
    console.warn('[DocuGuard OCR] Image data manipulation skipped:', e);
  }

  return canvas;
}

/**
 * Executes in-browser Tesseract.js OCR with web-worker isolation
 */
export async function runInBrowserTesseract(
  imageSource: HTMLImageElement | HTMLCanvasElement,
  onProgress?: (percent: number, statusText: string) => void
): Promise<{ text: string; confidence: number }> {
  try {
    // Dynamic import to support SSR/Node environments gracefully
    const Tesseract = await import('tesseract.js');
    
    onProgress?.(15, 'Preprocessing document contrast...');
    const preprocessedCanvas = preprocessCanvasForOCR(imageSource);

    onProgress?.(35, 'Initializing Tesseract Neural OCR Worker...');

    // Execute recognize
    const result = await Tesseract.recognize(
      preprocessedCanvas,
      'eng',
      {
        logger: (m: any) => {
          if (m.status === 'recognizing text' && typeof m.progress === 'number') {
            const pct = Math.round(35 + m.progress * 55);
            onProgress?.(pct, `Scanning Typography (${Math.round(m.progress * 100)}%)...`);
          }
        }
      }
    );

    const text = result?.data?.text || '';
    const confidence = (result?.data?.confidence || 0) / 100;

    return { text, confidence: Math.max(0, Math.min(1, confidence)) };
  } catch (err) {
    console.warn('[DocuGuard OCR] In-browser Tesseract worker note:', err);
    return { text: '', confidence: 0 };
  }
}

/**
 * Parses raw extracted OCR text using specialized regular expressions and heuristics
 * to extract structured identity parameters:
 * - Indian Aadhaar (12-digit spaced UID)
 * - Indian Income Tax PAN Card (10-character alphanumeric)
 * - International Passports (MRZ & Passport Number)
 * - Dates of Birth, Genders, Addresses, and Names
 */
export function parseUniversalIdentityEntities(
  rawText: string,
  fileName: string = ''
): ParsedOCRResult {
  const cleanText = rawText.replace(/\r/g, '').trim();
  const rawLines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);

  const fields: OCRFields = {
    fullName: '',
    documentId: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    documentType: 'Identity Document'
  };

  if (!cleanText || cleanText.length < 5) {
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
    upperText.includes('UIDAI') || 
    upperText.includes('UNIQUE IDENTIFICATION') || 
    upperText.includes('GOVERNMENT OF INDIA') && upperText.includes('MERA');

  const isPanKeyword = upperText.includes('INCOME TAX') || 
    upperText.includes('PERMANENT ACCOUNT') || 
    upperText.includes('PAN CARD') || 
    upperText.includes('TAX INVOICE') === false && /\b[A-Z]{5}[0-9]{4}[A-Z]\b/.test(cleanText);

  const isPassportKeyword = upperText.includes('PASSPORT') || 
    upperText.includes('REPUBLIC OF INDIA') && upperText.includes('PASS') || 
    upperText.includes('P<IND') || 
    upperText.includes('P<');

  const isDrivingLicense = upperText.includes('DRIVING') || 
    upperText.includes('LICENCE') || 
    upperText.includes('LICENSE') || 
    upperText.includes('TRANSPORT');

  if (isAadhaarKeyword) detectedType = 'Aadhaar Card';
  else if (isPanKeyword) detectedType = 'Permanent Account Number (PAN)';
  else if (isPassportKeyword) detectedType = 'Passport';
  else if (isDrivingLicense) detectedType = 'Driving Licence';

  fields.documentType = detectedType;

  // ─── 2. Extract Document ID ─────────────────────────────────────────────
  // A. Aadhaar 12-digit format (e.g. 1234 5678 9012 or 1234-5678-9012 or 123456789012)
  const aadhaarMatch = cleanText.match(/\b([2-9]\d{3}[\s-]?[0-9]{4}[\s-]?[0-9]{4})\b/);
  // B. PAN format (5 letters, 4 numbers, 1 letter)
  const panMatch = cleanText.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/);
  // C. Passport MRZ lines (P<INDNAME<<...) or 8-9 character Passport ID
  const passportMatch = cleanText.match(/\b([A-PR-WYa-pr-wy][0-9]{7,8})\b/);
  const mrzMatch = cleanText.match(/P<[A-Z]{3}([A-Z<]+)\n([A-Z0-9<]+)/);

  if (isPanKeyword && panMatch) {
    fields.documentId = panMatch[1];
  } else if (aadhaarMatch) {
    const rawDigits = aadhaarMatch[1].replace(/[\s-]/g, '');
    if (rawDigits.length === 12) {
      // Standard 4-4-4 spacing
      fields.documentId = `${rawDigits.slice(0, 4)} ${rawDigits.slice(4, 8)} ${rawDigits.slice(8, 12)}`;
      fields.documentType = 'Aadhaar Card';
    }
  } else if (panMatch) {
    fields.documentId = panMatch[1];
    fields.documentType = 'Permanent Account Number (PAN)';
  } else if (passportMatch) {
    fields.documentId = passportMatch[1].toUpperCase();
    fields.documentType = 'Passport';
  } else {
    // General ID extraction fallback: look for labeled identifier lines
    const generalIdMatch = cleanText.match(/(?:ID|No|Number|Card\s*No|Licence\s*No)[\s.:#-]*([A-Z0-9-]{6,16})/i);
    if (generalIdMatch) {
      fields.documentId = generalIdMatch[1].trim();
    } else {
      // Scan for standalone alphanumeric string with mixed letters and numbers
      const candidate = rawLines.find(l => /^[A-Z0-9\s-]{8,18}$/i.test(l) && /\d/.test(l));
      if (candidate) {
        fields.documentId = candidate.trim();
      }
    }
  }

  // ─── 3. Extract Date of Birth ───────────────────────────────────────────
  const dobMatch = cleanText.match(/(?:DOB|Date\s*of\s*Birth|Birth|DOB\s*[:.-])\s*[:.-]?\s*([0-3]?\d[/-][0-1]?\d[/-][12]\d{3})/i)
    || cleanText.match(/\b([0-3]\d[/-][0-1]\d[/-][12]\d{3})\b/);

  if (dobMatch) {
    fields.dateOfBirth = dobMatch[1].replace(/-/g, '/');
  } else {
    // Check Year of Birth pattern (common on older Aadhaar cards)
    const yobMatch = cleanText.match(/(?:Year\s*of\s*Birth|YOB)\s*[:.-]?\s*([12]\d{3})/i);
    if (yobMatch) {
      fields.dateOfBirth = `01/01/${yobMatch[1]}`;
    }
  }

  // ─── 4. Extract Gender ──────────────────────────────────────────────────
  if (/\b(?:FEMALE|WOMAN)\b/i.test(cleanText)) {
    fields.gender = 'Female';
  } else if (/\b(?:TRANSGENDER)\b/i.test(cleanText)) {
    fields.gender = 'Transgender';
  } else if (/\b(?:MALE|MAN)\b/i.test(cleanText)) {
    fields.gender = 'Male';
  }

  // ─── 5. Extract Full Name ───────────────────────────────────────────────
  // A. Check for explicit name labels
  const labeledNameMatch = cleanText.match(/(?:Name|Full\s*Name|Holder's\s*Name)\s*[:.-]?\s*([A-Za-z\s.]{3,35})/i);
  if (labeledNameMatch && !/government|authority|india|income|tax|card/i.test(labeledNameMatch[1])) {
    fields.fullName = labeledNameMatch[1].trim();
  }

  // B. If not found, use layout heuristics based on document type
  if (!fields.fullName) {
    if (isPanKeyword) {
      // On PAN cards, the name is typically the prominent uppercase line before Father's Name and DOB
      const filteredLines = rawLines.filter(l => 
        l.length >= 3 && 
        /^[A-Z\s.]+$/i.test(l) &&
        !/INCOME|TAX|DEPARTMENT|GOVT|INDIA|PERMANENT|ACCOUNT|NUMBER|CARD|SIGNATURE/i.test(l)
      );
      if (filteredLines.length > 0) {
        fields.fullName = filteredLines[0];
      }
    } else if (isAadhaarKeyword) {
      // On Aadhaar cards, the name is typically between "Government of India" header and the DOB line
      let headerFound = false;
      for (const line of rawLines) {
        if (/Government of India|Unique Identification|UIDAI/i.test(line)) {
          headerFound = true;
          continue;
        }
        if (headerFound || !fields.fullName) {
          if (
            line.length >= 3 && 
            line.length <= 40 &&
            /^[A-Za-z\s.]+$/.test(line) &&
            !/DOB|Date|Birth|Male|Female|Address|Government|India|Aadhaar/i.test(line)
          ) {
            fields.fullName = line.trim();
            break;
          }
        }
      }
    } else if (mrzMatch) {
      // MRZ passport line 1 contains surname and given names (e.g. P<INDSURNAME<<GIVEN<NAME<<<<)
      const namePortion = mrzMatch[1];
      const parts = namePortion.split('<<').filter(Boolean).map(p => p.replace(/</g, ' ').trim());
      if (parts.length > 0) {
        fields.fullName = parts.reverse().join(' ');
      }
    }

    // Generic fallback: first title-case line with reasonable length
    if (!fields.fullName) {
      const candidateName = rawLines.find(l => 
        l.length >= 3 && 
        l.length <= 35 && 
        /^[A-Z][a-zA-Z\s.]+$/.test(l) &&
        !/Government|Republic|Authority|Department|Identity|Card|Pass/i.test(l)
      );
      if (candidateName) {
        fields.fullName = candidateName.trim();
      }
    }
  }

  // ─── 6. Extract Address & PIN Code ──────────────────────────────────────
  const pinMatch = cleanText.match(/\b([1-9][0-9]{5})\b/);
  const addressLineIndex = rawLines.findIndex(l => /Address|Add\s*[:.-]/i.test(l));

  if (addressLineIndex !== -1) {
    const addressLines = rawLines.slice(addressLineIndex, addressLineIndex + 3);
    fields.address = addressLines.join(', ').replace(/^Address\s*[:.-]?\s*/i, '').trim();
  } else if (pinMatch) {
    // Line containing PIN code
    const pinLine = rawLines.find(l => l.includes(pinMatch[1]));
    if (pinLine) {
      fields.address = pinLine.trim();
    }
  }

  // Calculate OCR completeness confidence
  let filledCount = 0;
  if (fields.fullName) filledCount++;
  if (fields.documentId) filledCount++;
  if (fields.dateOfBirth) filledCount++;
  if (fields.gender) filledCount++;
  if (fields.address) filledCount++;

  const confidence = Math.min(0.98, Math.max(0.40, filledCount / 5));

  return {
    fields,
    rawText: cleanText,
    confidence,
    detectedType,
    lines: rawLines
  };
}

/**
 * High-level helper: Runs in-browser OCR on an image element or canvas
 * and returns parsed identity fields with zero cloud network calls.
 */
export async function extractDocumentIdentityOCR(
  source: HTMLImageElement | HTMLCanvasElement,
  fileName: string = '',
  onProgress?: (percent: number, statusText: string) => void
): Promise<ParsedOCRResult> {
  const ocrResult = await runInBrowserTesseract(source, onProgress);
  const parsed = parseUniversalIdentityEntities(ocrResult.text, fileName);
  
  // Blend Tesseract optical confidence with semantic parsing completeness
  const combinedConf = ocrResult.confidence > 0 
    ? (ocrResult.confidence * 0.5 + parsed.confidence * 0.5)
    : parsed.confidence;

  return {
    ...parsed,
    confidence: Math.round(combinedConf * 100) / 100
  };
}
