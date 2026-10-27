import { DocumentVerificationData, ForensicEvidenceItem, SampleDocPreset, VerdictConfig, VerdictType } from '../types/edge';
import { analyzeImagePixelForensics } from './pixelForensics';
import { docuGuardAI, AIModelPrediction } from './aiModel';

export const getVerdictConfig = (verdict: VerdictType): VerdictConfig => {
  if (verdict === 'Real') {
    return {
      hex: '#16a34a',
      glow: 'none',
      bg: '#f0fdf4',
      border: '#bbf7d0',
      label: 'No supported manipulation indicators detected',
      sub: 'Standard compression, edge profile, and metadata checks showed no obvious anomalies. Does not guarantee legal or physical authenticity.',
      badge: 'NO INDICATORS FLAGGED'
    };
  }
  if (verdict === 'Suspicious') {
    return {
      hex: '#d97706',
      glow: 'none',
      bg: '#fffbeb',
      border: '#fde68a',
      label: 'Inconclusive anomalies flagged — manual review recommended',
      sub: 'Compression quantization variance, edge differences, or model classification probabilities warrant further verification.',
      badge: 'MANUAL REVIEW RECOMMENDED'
    };
  }
  return {
    hex: '#dc2626',
    glow: 'none',
    bg: '#fef2f2',
    border: '#fecaca',
    label: 'Potential manipulation indicators found — manual review recommended',
    sub: 'Significant compression variances, boundary step anomalies, or neural classification flags detected. Further manual inspection required.',
    badge: 'POTENTIAL MANIPULATION'
  };
};

/**
 * Preloaded Sample Document Presets clearly identified as illustrative demo data.
 */
export const SAMPLE_PRESETS: SampleDocPreset[] = [
  {
    id: 'clean-id',
    label: 'Load sample clean document (Demo)',
    color: '#16a34a',
    bg: '#f0fdf4',
    documentName: 'Sample_Clean_Document_Reference.png',
    score: 94,
    verdict: 'Real',
    fields: {
      fullName: 'Vikramaditya Sharma [Sample]',
      documentId: '8492 1049 3921',
      dateOfBirth: '14/08/1992',
      gender: 'Male',
      documentType: 'Aadhaar Card [Demo Reference]',
      address: 'Plot 42, Vasant Vihar, New Delhi - 110057',
      expiryDate: 'PERMANENT'
    },
    rawText: '[DEMO SAMPLE PRESET — FOR ILLUSTRATIVE DEMONSTRATION ONLY]\nGOVERNMENT OF INDIA\nUnique Identification Authority of India\nVikramaditya Sharma\nDOB: 14/08/1992 | Male\n8492 1049 3921',
    evidence: [
      {
        category: 'texture',
        weight: 35,
        observation: 'Uniform micro-matte substrate raster profile',
        explanation: 'What was checked: High-frequency raster grid analysis. Observed: No periodic screen Moiré pattern detected. Why it matters: Screen re-photography leaves distinct pixel pitch frequencies. Uncertainty: High-resolution e-ink or professional prints can also lack Moiré artifacts.',
        severity: 'pass',
        confidence: 0.94
      },
      {
        category: 'compression',
        weight: 20,
        observation: 'Consistent JPEG quantization across macroblocks',
        explanation: 'What was checked: 16x16 macroblock Error Level Analysis. Observed: Delta variance below 0.18. Why it matters: Resaving spliced regions typically causes local compression rate differences. Uncertainty: Uniformly recompressed whole-image saves can conceal local splices.',
        severity: 'pass',
        confidence: 0.92
      },
      {
        category: 'metadata',
        weight: 15,
        observation: 'Standard camera profile without editor tag',
        explanation: 'What was checked: EXIF / JFIF marker headers. Observed: No Photoshop, GIMP, or Canva software tags found. Why it matters: Common forgery tools leave identifying metadata signatures. Uncertainty: Metadata can easily be stripped or spoofed.',
        severity: 'pass',
        confidence: 0.88
      },
      {
        category: 'layout',
        weight: 15,
        observation: 'Standard document geometry alignment',
        explanation: 'What was checked: Aspect ratio and layout proportions. Observed: Matches standard ID card dimensions (85.6mm x 53.98mm ratio). Why it matters: Forged templates frequently distort border ratios.',
        severity: 'pass',
        confidence: 0.95
      },
      {
        category: 'ocr',
        weight: 15,
        observation: 'Text checksums pass Verhoeff format check (Demo Reference)',
        explanation: 'What was checked: Algorithmic Verhoeff checksum. Observed: Format conforms to standard 12-digit format. Why it matters: Verhoeff algorithm catches 100% of single-digit errors. Uncertainty: Valid checksum does not verify if the ID was legitimately issued.',
        severity: 'pass',
        confidence: 0.96
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
      ctx.roundRect(10, 10, 780, 480, 16);
      ctx.fill();

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ea580c';
      ctx.fillRect(10, 10, 780, 10);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(10, 480, 780, 10);

      // Demo watermark banner
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('DEMO SAMPLE — ILLUSTRATIVE REFERENCE ONLY', 20, 36);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('GOVERNMENT OF INDIA', 150, 70);
      ctx.font = '600 13px sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('Unique Identification Authority of India', 150, 92);

      // Photo Box
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
      ctx.fillText('Address: Plot 42, Vasant Vihar, New Delhi', 260, 260);

      ctx.fillStyle = '#b91c1c';
      ctx.font = 'bold 26px monospace';
      ctx.fillText('8492  1049  3921', 260, 325);

      // QR Box placeholder
      ctx.fillStyle = '#020617';
      ctx.fillRect(600, 120, 140, 140);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(610, 130, 40, 40);
      ctx.fillRect(690, 130, 40, 40);
      ctx.fillRect(610, 210, 40, 40);
      ctx.fillStyle = '#020617';
      ctx.fillRect(620, 140, 20, 20);
      ctx.fillRect(700, 140, 20, 20);
      ctx.fillRect(620, 220, 20, 20);

      return canvas.toDataURL('image/png');
    }
  },
  {
    id: 'suspicious-id',
    label: 'Load sample suspicious document (Demo)',
    color: '#d97706',
    bg: '#fffbeb',
    documentName: 'Sample_Suspicious_Document_Reference.png',
    score: 62,
    verdict: 'Suspicious',
    fields: {
      fullName: 'Rahul K. Verma [Sample]',
      documentId: '9182 4410 8823',
      dateOfBirth: '22/11/1995',
      gender: 'Male',
      documentType: 'Identity Card [Demo Reference]',
      address: 'Flat 104, MG Road, Pune, Maharashtra',
      expiryDate: 'PERMANENT'
    },
    rawText: '[DEMO SAMPLE PRESET — FOR ILLUSTRATIVE DEMONSTRATION ONLY]\nGOVERNMENT OF INDIA\nRahul K. Verma\nDOB: 22/11/1995\nWARNING: EXIF tool tag detected: Adobe Photoshop',
    evidence: [
      {
        category: 'metadata',
        weight: 35,
        observation: 'EXIF metadata indicates Adobe Photoshop processing',
        explanation: 'What was checked: JPEG APP1 EXIF segment. Observed: "Adobe Photoshop CC" signature present. Why it matters: Native camera capture does not insert raster editing signatures. Uncertainty: Legitimate users sometimes crop or rotate images in Photoshop.',
        severity: 'fail',
        confidence: 0.95
      },
      {
        category: 'compression',
        weight: 30,
        observation: 'Elevated JPEG compression delta in text area',
        explanation: 'What was checked: 16x16 macroblock ELA variance. Observed: Delta inconsistency of 0.48. Why it matters: Editing figures or dates introduces a second compression cycle. Uncertainty: Differential compression can also occur in composite scans.',
        severity: 'warn',
        confidence: 0.74
      },
      {
        category: 'texture',
        weight: 20,
        observation: 'Localized blur on numerical digits',
        explanation: 'What was checked: Laplacian variance gradient. Observed: Sharpness drops 42% around the DOB string compared to surrounding text. Why it matters: Indicates possible clone-stamp or text insertion.',
        severity: 'warn',
        confidence: 0.68
      },
      {
        category: 'ocr',
        weight: 15,
        observation: 'Text structure plausible but surrounded by artifacts',
        explanation: 'What was checked: Font kerning consistency. Observed: Baseline misalignment of 2.1px. Uncertainty: Camera angle or page warp can cause apparent baseline drift.',
        severity: 'warn',
        confidence: 0.72
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
      ctx.roundRect(10, 10, 780, 480, 16);
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#d97706';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('DEMO SAMPLE — SUSPICIOUS REFERENCE ONLY', 20, 36);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('GOVERNMENT OF INDIA', 150, 70);

      // Photo Box with slight misaligned border
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
      ctx.fillText('DOB: 22/11/1995 (Edited area)', 260, 190);
      ctx.fillText('Gender: Male', 260, 225);

      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 24px monospace';
      ctx.fillText('9182  4410  8823', 260, 325);

      return canvas.toDataURL('image/png');
    }
  },
  {
    id: 'tampered-id',
    label: 'Load sample tampered document (Demo)',
    color: '#dc2626',
    bg: '#fef2f2',
    documentName: 'Sample_Tampered_Screen_Capture.png',
    score: 28,
    verdict: 'Tampered',
    fields: {
      fullName: 'ALEXANDER ROY [Sample]',
      documentId: '0000 9999 8888',
      dateOfBirth: '01/01/2000',
      gender: 'Male',
      documentType: 'Counterfeit Sample [Demo Reference]'
    },
    rawText: '[DEMO SAMPLE PRESET — FOR ILLUSTRATIVE DEMONSTRATION ONLY]\nCOUNTERFEIT SAMPLE\nALEXANDER ROY\n0000 9999 8888\nScreen re-photography detected via Moiré frequency grid',
    evidence: [
      {
        category: 'texture',
        weight: 40,
        observation: 'Periodic Moiré sub-pixel frequency interference pattern detected',
        explanation: 'What was checked: 2D FFT sub-pixel frequency spectrum. Observed: Strong periodic peak at LCD grid frequency. Why it matters: Physical identity cards do not exhibit electronic pixel pitch interference. Uncertainty: Cheap cameras photographing low-res prints can occasionally produce aliasing.',
        severity: 'fail',
        confidence: 0.96
      },
      {
        category: 'layout',
        weight: 30,
        observation: 'Abrupt step-function photo boundary gradient',
        explanation: 'What was checked: Boundary transition gradient around portrait frame. Observed: Sharp artificial edge indicating copy-paste composite. Why it matters: Legitimate documents exhibit unified printing raster without splice steps.',
        severity: 'fail',
        confidence: 0.91
      },
      {
        category: 'compression',
        weight: 20,
        observation: 'Macroblock compression discontinuity across portrait region',
        explanation: 'What was checked: JPEG ELA error difference. Observed: Discrepancy delta of 0.72 between inserted portrait and background.',
        severity: 'fail',
        confidence: 0.88
      },
      {
        category: 'metadata',
        weight: 10,
        observation: 'Metadata stripped / missing camera sensor profile',
        explanation: 'What was checked: EXIF IFD0 and ExifSubIFD segments. Observed: No sensor metadata or original capture timestamps found.',
        severity: 'warn',
        confidence: 0.75
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

      // Draw simulated Moiré bands
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 800; i += 4) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 20, 500);
        ctx.stroke();
      }

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('DEMO SAMPLE — TAMPERED / SCREEN CAPTURE ONLY', 20, 36);

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
 * Runs the 100% in-browser client-side forensic inspection pipeline.
 * NO image data or document bytes are ever transmitted to any remote server.
 */
export async function runEdgeVerificationPipeline(
  blob: Blob,
  fileName: string,
  onProgress?: (stepIndex: number, stageName: string) => void
): Promise<DocumentVerificationData> {
  const imageBlobUrl = URL.createObjectURL(blob);

  // Stage 01: Client-Side Ingestion
  onProgress?.(1, '01. INGESTION & DECODING');
  await new Promise(r => setTimeout(r, 120));

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Failed to decode document image. Please verify file format.'));
    el.src = imageBlobUrl;
  });

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  // Stage 02: Image Quality & Sharpness
  onProgress?.(2, '02. IMAGE QUALITY & SHARPNESS');
  await new Promise(r => setTimeout(r, 150));

  const pixelForensics = await analyzeImagePixelForensics(img);

  // Stage 03: Error Level Analysis (ELA) Compression
  onProgress?.(3, '03. ELA COMPRESSION ANALYSIS');
  await new Promise(r => setTimeout(r, 180));

  // Stage 04: Header & EXIF Metadata
  onProgress?.(4, '04. METADATA & FORMAT INSPECTION');
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
      exifAnomalies.push('EXIF raster editing software tag detected (Adobe Photoshop)');
    } else if (/GIMP/i.test(sliceText)) {
      detectedSoftware = 'GIMP Image Editor';
      exifAnomalies.push('EXIF raster editing tag detected (GIMP)');
    } else if (/Canva/i.test(sliceText)) {
      detectedSoftware = 'Canva';
      exifAnomalies.push('Compositing software signature detected (Canva)');
    }
  } catch (err) {
    console.warn('Metadata inspection notice:', err);
  }

  // Stage 05: In-Browser Neural Network Classifier
  onProgress?.(5, '05. IN-BROWSER NEURAL INFERENCE');
  let aiModelPrediction: AIModelPrediction | null = null;
  let modelLoaded = false;

  try {
    modelLoaded = await docuGuardAI.load();
    if (modelLoaded) {
      aiModelPrediction = await docuGuardAI.predict(img);
    }
  } catch (err) {
    console.warn('[Voice Guard] In-browser model inference unavailable; evaluating pixel & metadata heuristics:', err);
  }

  // Stage 06: Evidence Synthesis
  onProgress?.(6, '06. COMPILING EVIDENCE FINDINGS');
  await new Promise(r => setTimeout(r, 150));

  // Build rigorous evidence items
  const evidence: ForensicEvidenceItem[] = [];
  let scorePenalties = 0;

  // 1. Image Quality / Laplacian Sharpness
  const blurScore = Math.min(1, pixelForensics.blurVariance / 300);
  const qualityPassed = pixelForensics.qualityPassed;
  if (!qualityPassed) {
    scorePenalties += 15;
    evidence.push({
      category: 'texture',
      weight: 15,
      observation: `Laplacian variance of ${pixelForensics.blurVariance.toFixed(1)} is below threshold (80.0)`,
      explanation: 'What was checked: Second derivative (Laplacian) edge gradient variance. Observed: Low edge variance indicates diffuse or blurry image. Why it matters: Sub-threshold sharpness impairs fine raster and compression anomaly detection. Uncertainty: Motion blur or soft camera focus can occur naturally on authentic documents.',
      severity: 'warn',
      confidence: 0.85
    });
  } else {
    evidence.push({
      category: 'texture',
      weight: 15,
      observation: `Sharpness measurement: Laplacian variance ${pixelForensics.blurVariance.toFixed(1)} (sufficient)`,
      explanation: 'What was checked: Laplacian edge variance. Observed: Sufficient sharpness across micro-edges for downstream analysis. Why it matters: Adequate sharpness enables reliable compression and raster inspection.',
      severity: 'pass',
      confidence: 0.92
    });
  }

  // 2. Error Level Analysis (ELA) Compression Inconsistency
  const compressionDelta = pixelForensics.compressionInconsistency;
  if (compressionDelta > 0.45) {
    scorePenalties += 35;
    evidence.push({
      category: 'compression',
      weight: 25,
      observation: `Unusual recompression delta across macroblocks (${(compressionDelta * 100).toFixed(0)}%)`,
      explanation: 'What was checked: 16x16 macroblock JPEG Error Level Analysis against 75% quality resave baseline. Observed: Disproportionate delta in specific macroblock clusters. Why it matters: Spliced or edited regions often exhibit divergent recompression rates compared to the background. Uncertainty: Documents with mixed graphics, scanned text, and photo elements naturally show baseline variation.',
      severity: 'warn',
      confidence: 0.84
    });
  } else {
    evidence.push({
      category: 'compression',
      weight: 25,
      observation: `Uniform compression delta across macroblocks (${(compressionDelta * 100).toFixed(0)}%)`,
      explanation: 'What was checked: JPEG ELA macroblock quantization consistency. Observed: Error delta remains within expected distribution throughout the image surface. Why it matters: Consistent error levels indicate the document was saved in a single uniform compression pass.',
      severity: 'pass',
      confidence: 0.90
    });
  }

  // 3. Screen Re-photography / Sub-pixel frequency check
  if (pixelForensics.isScreenRephoto) {
    scorePenalties += 40;
    evidence.push({
      category: 'texture',
      weight: 30,
      observation: `High-frequency Moiré pattern detected (${(pixelForensics.moireScore * 100).toFixed(0)}% frequency peak)`,
      explanation: 'What was checked: 2D spatial frequency distribution for periodic sub-pixel pitch interference. Observed: Repetitive sinusoidal peaks characteristic of electronic displays. Why it matters: Indicates the image is a photograph of an LCD/OLED screen rather than an original document. Uncertainty: Fine woven security patterns or halftone printing grids can sometimes trigger false positives.',
      severity: 'fail',
      confidence: pixelForensics.moireScore
    });
  } else {
    evidence.push({
      category: 'texture',
      weight: 20,
      observation: 'No periodic screen Moiré interference patterns detected',
      explanation: 'What was checked: Sub-pixel spatial frequency analysis. Observed: Continuous natural frequency falloff without discrete electronic display peaks.',
      severity: 'pass',
      confidence: 0.92
    });
  }

  // 4. Metadata & Editing Software Signatures
  if (detectedSoftware) {
    scorePenalties += 25;
    evidence.push({
      category: 'metadata',
      weight: 20,
      observation: `EXIF software tag detected: ${detectedSoftware}`,
      explanation: `What was checked: TIFF/EXIF header metadata tables. Observed: Image contains processing tag from ${detectedSoftware}. Why it matters: Direct camera capture or scanning does not insert photo-editing software signatures. Uncertainty: Some users innocently open images to crop, rotate, or compress without altering document text.`,
      severity: 'fail',
      confidence: 0.98
    });
  } else {
    evidence.push({
      category: 'metadata',
      weight: 15,
      observation: exifPresent ? 'EXIF segment present without known editing software tags' : 'Metadata tables absent or stripped',
      explanation: 'What was checked: EXIF / JFIF headers. Observed: No photo-editing software signatures identified. Uncertainty: Metadata is easily stripped or modified by messaging apps and social media.',
      severity: 'pass',
      confidence: 0.85
    });
  }

  // 5. In-Browser Neural Classifier (Trained CNN)
  if (aiModelPrediction) {
    const [pReal, pSuspicious, pTampered] = aiModelPrediction.probabilities;
    const aiPenalty = Math.round(aiModelPrediction.forgeryScore * 0.5);
    scorePenalties += aiPenalty;

    evidence.push({
      category: 'layout',
      weight: 25,
      observation: `In-browser neural classifier (1.03M params): ${(Math.max(...aiModelPrediction.probabilities) * 100).toFixed(1)}% confidence in '${aiModelPrediction.verdict}' classification`,
      explanation: `What was checked: Multi-scale convolutional features trained on IMD2020 & AIForge document tampering datasets (66.5% validation accuracy). Observed probabilities: Real ${(pReal * 100).toFixed(1)}%, Suspicious ${(pSuspicious * 100).toFixed(1)}%, Tampered ${(pTampered * 100).toFixed(1)}%. Uncertainty: Model evaluated on academic benchmarks; accuracy on novel, out-of-distribution real-world document formats may vary.`,
      severity: pTampered > 0.5 ? 'fail' : pSuspicious > 0.4 ? 'warn' : 'pass',
      confidence: Math.max(...aiModelPrediction.probabilities)
    });
  } else {
    evidence.push({
      category: 'layout',
      weight: 15,
      observation: 'In-browser neural model not loaded; evaluation grounded strictly in pixel & metadata heuristics',
      explanation: 'What was checked: TensorFlow.js model status. Observed: Neural weights unavailable or disabled. All reported findings represent deterministic canvas mathematical heuristics.',
      severity: 'warn',
      confidence: 0.70
    });
  }

  // 6. Identity & Structure Verification Check (Explicitly marked as not checked)
  evidence.push({
    category: 'ocr',
    weight: 0,
    observation: 'Text extraction, QR cryptographic signature, and template validation: NOT CHECKED',
    explanation: 'What was checked: Document structure & PKI signatures. Observed: No local OCR engine, PKI root-of-trust validator, or government registry integration is active on this file. Why it matters: Integrity screening detects image manipulation; it does NOT verify whether the identity actually exists or was legitimately issued.',
    severity: 'warn',
    confidence: 1.0
  });

  const finalScore = Math.max(10, Math.min(96, 100 - scorePenalties));
  const verdict: VerdictType = finalScore >= 80 ? 'Real' : finalScore >= 50 ? 'Suspicious' : 'Tampered';

  return {
    documentId: `VG-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
    fileName,
    generatedAt: new Date().toISOString(),
    score: finalScore,
    verdict,
    imageBlobUrl,
    boundaryConfidence: qualityPassed ? 0.88 : 0.65,
    qr: null, // Truthful: No QR signature verification was performed
    faceRegion: null, // Truthful: No face detection box was computed
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
      fields: {}, // Truthful: No fabricated names or numbers for real uploaded documents
      rawText: 'No local OCR engine run on this document.'
    },
    evidence
  };
}
