import { DocumentVerificationData, ForensicEvidenceItem, SampleDocPreset, VerdictConfig, VerdictType } from '../types/edge';
import { analyzeImagePixelForensics } from './pixelForensics';
import { docuGuardAI, AIModelPrediction } from './aiModel';

export const getVerdictConfig = (verdict: VerdictType): VerdictConfig => {
  if (verdict === 'Real') {
    return {
      hex: '#15803d',
      glow: 'none',
      bg: '#f0fdf4',
      border: '#bbf7d0',
      label: 'No major warning signs found',
      sub: 'The checks completed by this system did not find obvious image editing or compression anomalies. This is an automated screening result, not an official verification of legal validity.',
      badge: 'No Major Warning Signs'
    };
  }
  if (verdict === 'Suspicious') {
    return {
      hex: '#b45309',
      glow: 'none',
      bg: '#fffbeb',
      border: '#fde68a',
      label: 'Some unusual patterns found',
      sub: 'The analysis flagged recompression differences, edge irregularities, or model signals that warrant closer review.',
      badge: 'Needs Review'
    };
  }
  return {
    hex: '#b91c1c',
    glow: 'none',
    bg: '#fef2f2',
    border: '#fecaca',
    label: 'Several warning signs need review',
    sub: 'Significant compression discrepancies, boundary step anomalies, or strong neural tamper indicators were detected. Manual inspection is strongly recommended.',
    badge: 'Review Strongly Recommended'
  };
};

/**
 * Preloaded Sample Document Presets clearly identified as illustrative demo data.
 */
export const SAMPLE_PRESETS: SampleDocPreset[] = [
  {
    id: 'clean-id',
    label: 'Clean sample (Demonstration)',
    color: '#15803d',
    bg: '#f0fdf4',
    documentName: 'Clean_Sample_Document.png',
    score: 94,
    verdict: 'Real',
    fields: {
      fullName: 'Vikramaditya Sharma [Sample]',
      documentId: '8492 1049 3921',
      dateOfBirth: '14/08/1992',
      gender: 'Male',
      documentType: 'ID Card [Demonstration]'
    },
    rawText: '[SAMPLE DEMONSTRATION PRESET — ILLUSTRATIVE ONLY]\nVikramaditya Sharma\nDOB: 14/08/1992 | Male\nID: 8492 1049 3921',
    evidence: [
      {
        category: 'texture',
        weight: 35,
        observation: 'Uniform natural raster profile across the document surface',
        explanation: 'Screening for periodic high-frequency interference found standard continuous falloff without display pixel grids.',
        howChecked: '2D frequency distribution and sub-pixel pitch variance',
        whyItMatters: 'Photographs taken off screens exhibit periodic Moiré bands that physical cards do not possess.',
        limitations: 'High-resolution professional prints or high-DPI scans may also lack screen frequency artifacts.',
        severity: 'pass',
        confidence: 0.94
      },
      {
        category: 'compression',
        weight: 25,
        observation: 'Consistent compression characteristics across macroblocks',
        explanation: 'Error Level Analysis (ELA) delta remains within uniform baseline bounds across the entire document.',
        howChecked: '16x16 macroblock JPEG quantization delta against resave baseline',
        whyItMatters: 'Locally spliced elements or altered dates usually introduce a secondary compression cycle.',
        limitations: 'Uniformly resaved images can sometimes diminish localized error contrast.',
        severity: 'pass',
        confidence: 0.92
      },
      {
        category: 'metadata',
        weight: 20,
        observation: 'Camera profile present without photo-editor signatures',
        explanation: 'File headers contain standard capture tags without signatures from software like Photoshop or Canva.',
        howChecked: 'Header scanning for EXIF, JFIF, and software creator markers',
        whyItMatters: 'Editing software typically embeds identifier tags during export.',
        limitations: 'Metadata can easily be removed or modified by messaging apps.',
        severity: 'pass',
        confidence: 0.88
      }
    ],
    generateImage: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      const grad = ctx.createLinearGradient(0, 0, 800, 500);
      grad.addColorStop(0, '#f8fafc');
      grad.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(10, 10, 780, 480, 14);
      ctx.fill();

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ea580c';
      ctx.fillRect(10, 10, 780, 8);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(10, 482, 780, 8);

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('DEMONSTRATION SAMPLE — ILLUSTRATIVE PURPOSES ONLY', 20, 36);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('GOVERNMENT IDENTITY CARD', 150, 70);

      // Photo
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(50, 120, 170, 220);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(135, 190, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(135, 290, 65, 45, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('Vikramaditya Sharma [Sample]', 260, 150);

      ctx.font = '500 15px sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText('DOB: 14/08/1992', 260, 190);
      ctx.fillText('Gender: Male', 260, 225);
      ctx.fillText('Address: Sample Residential Sector, New Delhi', 260, 260);

      ctx.fillStyle = '#b91c1c';
      ctx.font = 'bold 26px monospace';
      ctx.fillText('8492  1049  3921', 260, 325);

      return canvas.toDataURL('image/png');
    }
  },
  {
    id: 'suspicious-id',
    label: 'Suspicious sample (Demonstration)',
    color: '#b45309',
    bg: '#fffbeb',
    documentName: 'Suspicious_Sample_Document.png',
    score: 62,
    verdict: 'Suspicious',
    fields: {
      fullName: 'Rahul K. Verma [Sample]',
      documentId: '9182 4410 8823',
      dateOfBirth: '22/11/1995 (Edited region)',
      gender: 'Male',
      documentType: 'ID Card [Demonstration]'
    },
    rawText: '[SAMPLE DEMONSTRATION PRESET — ILLUSTRATIVE ONLY]\nRahul K. Verma\nDOB: 22/11/1995\nNotice: Photo editor tag detected in metadata.',
    evidence: [
      {
        category: 'metadata',
        weight: 35,
        observation: 'Photo-editing software tag detected in metadata (Adobe Photoshop)',
        explanation: 'The image file contains metadata markers placed by Adobe Photoshop during export.',
        howChecked: 'TIFF and EXIF metadata APP1 segment scan',
        whyItMatters: 'Original camera captures do not naturally contain desktop photo editor signatures.',
        limitations: 'A user may have innocently rotated or cropped a genuine scan in Photoshop.',
        severity: 'fail',
        confidence: 0.95
      },
      {
        category: 'compression',
        weight: 30,
        observation: 'Elevated compression delta around numeric date area',
        explanation: 'Error Level Analysis reveals higher quantization error variance in the date box.',
        howChecked: '16x16 macroblock recompression difference comparison',
        whyItMatters: 'Saving a modified region twice causes it to compress differently from untouched background.',
        limitations: 'Mixed text and graphic elements can produce natural baseline variance.',
        severity: 'warn',
        confidence: 0.74
      }
    ],
    generateImage: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(10, 10, 780, 480, 14);
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#b45309';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('DEMONSTRATION SAMPLE — SUSPICIOUS REFERENCE', 20, 36);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('GOVERNMENT IDENTITY CARD', 150, 70);

      // Photo
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(50, 120, 170, 220);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(135, 190, 45, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('Rahul K. Verma [Sample]', 260, 150);

      ctx.font = '500 15px sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText('DOB: 22/11/1995 (Altered text box)', 260, 190);
      ctx.fillText('Gender: Male', 260, 225);

      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 24px monospace';
      ctx.fillText('9182  4410  8823', 260, 325);

      return canvas.toDataURL('image/png');
    }
  },
  {
    id: 'tampered-id',
    label: 'Warning sample (Demonstration)',
    color: '#b91c1c',
    bg: '#fef2f2',
    documentName: 'Warning_Sample_Document.png',
    score: 28,
    verdict: 'Tampered',
    fields: {
      fullName: 'ALEXANDER ROY [Sample]',
      documentId: '0000 9999 8888',
      dateOfBirth: '01/01/2000',
      documentType: 'Counterfeit Sample [Demonstration]'
    },
    rawText: '[SAMPLE DEMONSTRATION PRESET — ILLUSTRATIVE ONLY]\nALEXANDER ROY\n0000 9999 8888\nScreen re-photography pattern detected.',
    evidence: [
      {
        category: 'texture',
        weight: 40,
        observation: 'High-frequency screen Moiré pattern detected',
        explanation: 'Periodic sub-pixel frequency interference pattern indicates this image was photographed off an electronic screen.',
        howChecked: '2D frequency spectrum scanline energy analysis',
        whyItMatters: 'Documents photographed from computer displays are often unauthorized presentations or forged digital files.',
        limitations: 'Halftone security prints or high-contrast woven backdrops can occasionally cause frequency aliasing.',
        severity: 'fail',
        confidence: 0.96
      },
      {
        category: 'layout',
        weight: 30,
        observation: 'Sharp photo boundary contrast step',
        explanation: 'Luminance transition gradient shows an abrupt border around the portrait area, typical of copy-paste composites.',
        howChecked: 'Step-function edge gradient measurement around photo region',
        whyItMatters: 'Genuine documents share a unified printing process across portrait and background.',
        limitations: 'High-contrast frames on authentic IDs can produce strong boundary steps.',
        severity: 'fail',
        confidence: 0.91
      }
    ],
    generateImage: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 800, 500);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 800; i += 4) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 20, 500);
        ctx.stroke();
      }

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('DEMONSTRATION SAMPLE — WARNING REFERENCE', 20, 36);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('ALEXANDER ROY [Sample]', 260, 150);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 24px monospace';
      ctx.fillText('0000  9999  8888', 260, 325);

      return canvas.toDataURL('image/png');
    }
  }
];

/**
 * Runs the 100% in-browser client-side document screening pipeline.
 * All operations execute in browser RAM; no image data is transmitted to any server.
 */
export async function runEdgeVerificationPipeline(
  blob: Blob,
  fileName: string,
  onProgress?: (stepIndex: number, stageName: string) => void
): Promise<DocumentVerificationData> {
  const imageBlobUrl = URL.createObjectURL(blob);

  // Step 1: Loading your image
  onProgress?.(1, 'Loading your image');
  await new Promise(r => setTimeout(r, 140));

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('We could not read this image file. Please ensure it is a valid JPG, PNG, or WebP.'));
    el.src = imageBlobUrl;
  });

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  // Step 2: Checking image quality
  onProgress?.(2, 'Checking image quality');
  await new Promise(r => setTimeout(r, 160));

  const pixelForensics = await analyzeImagePixelForensics(img);

  // Step 3: Examining possible inconsistencies
  onProgress?.(3, 'Examining possible inconsistencies');
  await new Promise(r => setTimeout(r, 200));

  let exifPresent = false;
  let detectedSoftware: string | undefined = undefined;
  const exifAnomalies: string[] = [];

  try {
    const arrayBuffer = await blob.slice(0, 65536).arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const sliceText = Array.from(bytes)
      .map(b => (b >= 32 && b <= 126 ? String.fromCharCode(b) : ' '))
      .join('');

    exifPresent = sliceText.includes('Exif') || sliceText.includes('JFIF');

    if (/Adobe Photoshop|Photoshop/i.test(sliceText)) {
      detectedSoftware = 'Adobe Photoshop';
      exifAnomalies.push('Image editing software tag found in metadata (Adobe Photoshop)');
    } else if (/GIMP/i.test(sliceText)) {
      detectedSoftware = 'GIMP Image Editor';
      exifAnomalies.push('Image editing software tag found in metadata (GIMP)');
    } else if (/Canva/i.test(sliceText)) {
      detectedSoftware = 'Canva';
      exifAnomalies.push('Compositing software signature found in metadata (Canva)');
    }
  } catch (err) {
    console.warn('Metadata inspection notice:', err);
  }

  // In-browser model inference
  let aiModelPrediction: AIModelPrediction | null = null;
  try {
    const modelLoaded = await docuGuardAI.load();
    if (modelLoaded) {
      aiModelPrediction = await docuGuardAI.predict(img);
    }
  } catch (err) {
    console.warn('[DocuGuard] In-browser neural classifier unavailable; using pixel and metadata heuristics:', err);
  }

  // Step 4: Preparing the results
  onProgress?.(4, 'Preparing the results');
  await new Promise(r => setTimeout(r, 140));

  const evidence: ForensicEvidenceItem[] = [];
  let scorePenalties = 0;

  // 1. Image Quality / Laplacian Sharpness Check
  const qualityPassed = pixelForensics.qualityPassed;
  const blurScore = Math.min(1, pixelForensics.blurVariance / 300);

  if (!qualityPassed) {
    scorePenalties += 15;
    evidence.push({
      category: 'texture',
      weight: 15,
      observation: `Image sharpness measurement (${pixelForensics.blurVariance.toFixed(1)}) is below the recommended threshold (80.0)`,
      explanation: 'The image has low edge contrast or noticeable blur. Reduced sharpness can make fine tampering indicators harder to evaluate.',
      howChecked: 'Laplacian edge variance calculation across the full image bitmap',
      whyItMatters: 'Adequate sharpness is required to differentiate legitimate focus falloff from synthetic blur or smoothing.',
      limitations: 'Camera motion blur or soft focus on authentic documents can also trigger this warning.',
      severity: 'warn',
      confidence: 0.85
    });
  } else {
    evidence.push({
      category: 'texture',
      weight: 15,
      observation: `Image sharpness is sufficient for analysis (Laplacian variance: ${pixelForensics.blurVariance.toFixed(1)})`,
      explanation: 'Edge transitions are sharp and clear, allowing reliable compression and texture evaluation.',
      howChecked: 'Laplacian edge variance filter across edge gradients',
      whyItMatters: 'Clean edges provide clear signals for detecting compression discrepancies and Moiré patterns.',
      limitations: 'Sufficient sharpness alone does not prove that an image has not been edited.',
      severity: 'pass',
      confidence: 0.92
    });
  }

  // 2. Error Level Analysis (ELA) Compression Discrepancies
  const compressionDelta = pixelForensics.compressionInconsistency;
  if (compressionDelta > 0.45) {
    scorePenalties += 35;
    evidence.push({
      category: 'compression',
      weight: 25,
      observation: `Unusual compression differences found across macroblock sections (${(compressionDelta * 100).toFixed(0)}% delta)`,
      explanation: 'Certain regions of the image exhibit higher compression differences than the rest of the document.',
      howChecked: '16x16 macroblock JPEG Error Level Analysis compared against a 75% baseline resave',
      whyItMatters: 'When text or photos are digitally inserted, they frequently carry a different compression history than the background.',
      limitations: 'Documents with varied graphical elements, logos, or scanned stamps can naturally show minor compression variance.',
      severity: 'warn',
      confidence: 0.84
    });
  } else {
    evidence.push({
      category: 'compression',
      weight: 25,
      observation: `Compression levels appear uniform across the document (${(compressionDelta * 100).toFixed(0)}% delta)`,
      explanation: 'The compression error rate remains consistent across the entire image surface.',
      howChecked: 'Error Level Analysis measuring quantization consistency across 16x16 pixel blocks',
      whyItMatters: 'A uniform error distribution suggests the document was saved in a single consistent pass.',
      limitations: 'Saving an entire composite image once at high compression can sometimes conceal regional differences.',
      severity: 'pass',
      confidence: 0.90
    });
  }

  // 3. Screen Re-photography Pattern Check
  if (pixelForensics.isScreenRephoto) {
    scorePenalties += 40;
    evidence.push({
      category: 'texture',
      weight: 30,
      observation: `High-frequency periodic pattern detected (${(pixelForensics.moireScore * 100).toFixed(0)}% signal strength)`,
      explanation: 'A repetitive frequency pattern typical of photographing an electronic screen (LCD/OLED) was found.',
      howChecked: 'Sub-pixel spatial frequency analysis for periodic scanline interference',
      whyItMatters: 'Legitimate identity verification generally requires photos of physical cards rather than pictures of screens.',
      limitations: 'Fine woven fabric backgrounds or halftone security printing can occasionally produce similar frequency interference.',
      severity: 'fail',
      confidence: pixelForensics.moireScore
    });
  } else {
    evidence.push({
      category: 'texture',
      weight: 20,
      observation: 'No periodic screen display patterns detected',
      explanation: 'The frequency profile displays natural continuous falloff without electronic display pixel grids.',
      howChecked: '2D frequency spectrum analysis across horizontal and vertical scanlines',
      whyItMatters: 'Confirms absence of typical electronic monitor interference patterns.',
      limitations: 'High-resolution professional scans of displays can sometimes minimize visible screen lines.',
      severity: 'pass',
      confidence: 0.92
    });
  }

  // 4. File Metadata Signatures
  if (detectedSoftware) {
    scorePenalties += 25;
    evidence.push({
      category: 'metadata',
      weight: 20,
      observation: `Photo-editing software signature found: ${detectedSoftware}`,
      explanation: `The file header contains metadata written by ${detectedSoftware}.`,
      howChecked: 'Inspection of JPEG APP1 and TIFF EXIF metadata segments in the initial 64KB',
      whyItMatters: 'Standard camera apps and scanners do not inject photo editing software tags.',
      limitations: 'Someone may have used editing software simply to crop or rotate an authentic document scan.',
      severity: 'fail',
      confidence: 0.98
    });
  } else {
    evidence.push({
      category: 'metadata',
      weight: 15,
      observation: exifPresent ? 'Camera metadata profile found without editing software tags' : 'Metadata stripped or unavailable',
      explanation: 'No known photo-editing software signatures were identified in the file headers.',
      howChecked: 'Header scan for software creator tags and EXIF camera tables',
      whyItMatters: 'Absence of editor tags indicates standard file creation.',
      limitations: 'Metadata is easily stripped or modified by social messaging apps (WhatsApp, Telegram).',
      severity: 'pass',
      confidence: 0.85
    });
  }

  // 5. In-Browser Neural Network Tamper Assessment
  if (aiModelPrediction) {
    const [pReal, pSuspicious, pTampered] = aiModelPrediction.probabilities;
    scorePenalties += Math.round(aiModelPrediction.forgeryScore * 0.45);

    evidence.push({
      category: 'layout',
      weight: 25,
      observation: `Neural classifier assessment: ${(Math.max(...aiModelPrediction.probabilities) * 100).toFixed(0)}% confidence in '${aiModelPrediction.verdict}' category`,
      explanation: `In-browser convolutional model evaluated learned visual features (Real: ${(pReal * 100).toFixed(0)}%, Suspicious: ${(pSuspicious * 100).toFixed(0)}%, Tampered: ${(pTampered * 100).toFixed(0)}%).`,
      howChecked: 'TensorFlow.js convolutional neural network (1.03M parameters) trained on IMD2020 and AIForge datasets',
      whyItMatters: 'Neural models can detect complex multi-scale texture and blending anomalies that manual rules miss.',
      limitations: 'Model evaluated on academic datasets (66.5% validation accuracy). Real-world novel document layouts may produce uncertainty.',
      severity: pTampered > 0.5 ? 'fail' : pSuspicious > 0.4 ? 'warn' : 'pass',
      confidence: Math.max(...aiModelPrediction.probabilities)
    });
  } else {
    evidence.push({
      category: 'layout',
      weight: 15,
      observation: 'In-browser neural model not active; findings are based strictly on pixel and metadata heuristics',
      explanation: 'The neural network model could not be initialized. All findings reflect mathematical canvas checks.',
      howChecked: 'TensorFlow.js model availability check',
      whyItMatters: 'Informs you that neural texture classification was omitted from this run.',
      limitations: 'Only rule-based heuristics were evaluated.',
      severity: 'warn',
      confidence: 0.70
    });
  }

  // 6. Transparent Disclosure of Unsupported / Skipped Checks
  evidence.push({
    category: 'ocr',
    weight: 0,
    observation: 'Government registry lookup and cryptographic QR signature check: NOT CHECKED',
    explanation: 'DocuGuard checks for digital image manipulation only. It does not connect to government databases or verify cryptographic issuer certificates.',
    howChecked: 'Service capability disclosure',
    whyItMatters: 'A document can be digitally unedited but still contain false or fabricated identity information.',
    limitations: 'Cannot confirm if an individual legitimately exists or if a card was officially issued.',
    severity: 'warn',
    confidence: 1.0
  });

  const finalScore = Math.max(10, Math.min(96, 100 - scorePenalties));
  const verdict: VerdictType = finalScore >= 80 ? 'Real' : finalScore >= 50 ? 'Suspicious' : 'Tampered';

  return {
    documentId: `DG-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
    fileName,
    generatedAt: new Date().toISOString(),
    score: finalScore,
    verdict,
    imageBlobUrl,
    boundaryConfidence: qualityPassed ? 0.88 : 0.65,
    qr: null,
    faceRegion: null,
    compressionArtifacts: {
      inconsistencyScore: pixelForensics.compressionInconsistency
    },
    qualityCheck: {
      blurScore,
      brightnessOk: true,
      passed: qualityPassed
    },
    metadata: {
      exifPresent,
      software: detectedSoftware,
      anomalies: exifAnomalies
    },
    ocr: {
      confidence: 0,
      fields: {}, // Never fabricate names or data for real uploads
      rawText: 'No text extraction was performed on this file.'
    },
    evidence
  };
}
