export interface PixelForensicResults {
  moireScore: number; // 0 to 1 (heuristic indicator of periodic high-frequency patterns)
  isScreenRephoto: boolean;
  blurVariance: number;
  qualityPassed: boolean;
  compressionInconsistency: number; // 0 to 1
  photoRegionSpliceScore: number; // 0 to 1
  flaggedZones: {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    severity: 'pass' | 'warn' | 'fail';
  }[];
}

/**
 * Computes client-side canvas mathematical heuristics:
 * 1. Variance of Laplacian for sharpness / blur threshold
 * 2. Error Level Analysis (ELA) recompression delta across 16x16 macroblocks
 * 3. Spatial frequency variance (scanline / periodic pattern heuristic)
 * 4. Boundary luminance step-delta across candidate portrait frame coordinates
 * 
 * Note: These are mathematical heuristics for anomaly screening, not definitive proof of fraud.
 */
export async function analyzeImagePixelForensics(
  img: HTMLImageElement
): Promise<PixelForensicResults> {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.drawImage(img, 0, 0);
  const originalData = ctx.getImageData(0, 0, width, height);
  const data = originalData.data;

  // 1. Variance of Laplacian for Sharpness / Blur Detection
  let laplacianSum = 0;
  let laplacianSumSq = 0;
  let edgeSampleCount = 0;

  // Downsample sampling for speed on large images
  const step = Math.max(1, Math.floor(width / 400));

  for (let y = 1; y < height - 1; y += step) {
    for (let x = 1; x < width - 1; x += step) {
      const idx = (y * width + x) * 4;
      const up = ((y - 1) * width + x) * 4;
      const down = ((y + 1) * width + x) * 4;
      const left = (y * width + (x - 1)) * 4;
      const right = (y * width + (x + 1)) * 4;

      // Grayscale luminance: 0.299R + 0.587G + 0.114B
      const centerL = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
      const upL = data[up] * 0.299 + data[up + 1] * 0.587 + data[up + 2] * 0.114;
      const downL = data[down] * 0.299 + data[down + 1] * 0.587 + data[down + 2] * 0.114;
      const leftL = data[left] * 0.299 + data[left + 1] * 0.587 + data[left + 2] * 0.114;
      const rightL = data[right] * 0.299 + data[right + 1] * 0.587 + data[right + 2] * 0.114;

      // Laplacian kernel [0, 1, 0; 1, -4, 1; 0, 1, 0]
      const lap = upL + downL + leftL + rightL - 4 * centerL;
      laplacianSum += lap;
      laplacianSumSq += lap * lap;
      edgeSampleCount++;
    }
  }

  const lapMean = laplacianSum / Math.max(1, edgeSampleCount);
  const blurVariance = (laplacianSumSq / Math.max(1, edgeSampleCount)) - (lapMean * lapMean);
  // Calibrated threshold: adequate edge definition for typical scanned/photographed documents
  const qualityPassed = blurVariance > 35;

  // 2. Error Level Analysis (ELA) Recompression Variance
  const recompressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
  const recompressedImg = await new Promise<HTMLImageElement>((resolve, reject) => {
    const rImg = new Image();
    rImg.onload = () => resolve(rImg);
    rImg.onerror = reject;
    rImg.src = recompressedDataUrl;
  });

  const recompressedCanvas = document.createElement('canvas');
  recompressedCanvas.width = width;
  recompressedCanvas.height = height;
  const recompressedCtx = recompressedCanvas.getContext('2d', { willReadFrequently: true });
  if (!recompressedCtx) throw new Error('Recompressed context unavailable');

  recompressedCtx.drawImage(recompressedImg, 0, 0);
  const recompData = recompressedCtx.getImageData(0, 0, width, height).data;

  // Measure delta in 16x16 macroblocks
  const blockSize = 16;
  const cols = Math.floor(width / blockSize);
  const rows = Math.floor(height / blockSize);
  const activeBlockDeltas: number[] = [];
  let maxBlockDelta = 0;
  let maxBlockIdx = 0;

  for (let by = 0; by < rows; by++) {
    for (let bx = 0; bx < cols; bx++) {
      let bDelta = 0;
      for (let py = 0; py < blockSize; py++) {
        for (let px = 0; px < blockSize; px++) {
          const idx = ((by * blockSize + py) * width + (bx * blockSize + px)) * 4;
          const diffR = Math.abs(data[idx] - recompData[idx]);
          const diffG = Math.abs(data[idx + 1] - recompData[idx + 1]);
          const diffB = Math.abs(data[idx + 2] - recompData[idx + 2]);
          bDelta += (diffR + diffG + diffB) / 3;
        }
      }
      const avgBDelta = bDelta / (blockSize * blockSize);
      const bIdx = by * cols + bx;

      // Only evaluate active content blocks (ignore blank white/black margins)
      if (avgBDelta > 2.0) {
        activeBlockDeltas.push(avgBDelta);
      }

      if (avgBDelta > maxBlockDelta) {
        maxBlockDelta = avgBDelta;
        maxBlockIdx = bIdx;
      }
    }
  }

  // Calculate coefficient of variation among active content blocks
  let compressionInconsistency = 0.12; // Baseline nominal variance
  if (activeBlockDeltas.length > 20) {
    const activeMean = activeBlockDeltas.reduce((a, b) => a + b, 0) / activeBlockDeltas.length;
    const activeVariance = activeBlockDeltas.reduce((acc, val) => acc + Math.pow(val - activeMean, 2), 0) / activeBlockDeltas.length;
    const activeStdDev = Math.sqrt(activeVariance);
    const coeffOfVar = activeMean > 0 ? activeStdDev / activeMean : 0;
    
    // Normal documents with uniform compression have coeffOfVar between 0.20 and 0.55
    // Spliced or digitally inserted regions produce distinct outliers (coeffOfVar > 0.85)
    compressionInconsistency = Math.min(1.0, Math.max(0.05, (coeffOfVar - 0.40) / 0.80));
  }

  // 3. High-Frequency Periodic Pattern Detection (True Screen Re-Photography / Moiré)
  // Genuine Moiré ripples produce rapid alternating sign gradients (+ - + -) of subtle amplitude (3 to 35)
  // Normal document text has isolated stark contrast steps (amplitude > 80) without alternating periodicity
  let periodicSampleRows = 0;
  let testRows = 0;

  for (let y = 16; y < height - 16; y += Math.max(4, Math.floor(height / 60))) {
    let altSignCount = 0;
    let prevDiff = 0;
    let rowSamples = 0;

    for (let x = 16; x < width - 16; x += 3) {
      const idx = (y * width + x) * 4;
      const prevIdx = (y * width + (x - 3)) * 4;
      const l1 = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
      const l0 = data[prevIdx] * 0.299 + data[prevIdx + 1] * 0.587 + data[prevIdx + 2] * 0.114;
      const diff = l1 - l0;

      // Subpixel electronic display grids oscillate with subtle amplitude
      if (Math.abs(diff) >= 3.5 && Math.abs(diff) <= 38) {
        if (prevDiff !== 0 && ((diff > 0 && prevDiff < 0) || (diff < 0 && prevDiff > 0))) {
          altSignCount++;
        }
      }
      prevDiff = diff;
      rowSamples++;
    }

    if (rowSamples > 20 && (altSignCount / rowSamples) > 0.35) {
      periodicSampleRows++;
    }
    testRows++;
  }

  const moireDensity = testRows > 0 ? periodicSampleRows / testRows : 0;
  const moireScore = Math.min(0.99, Math.max(0.02, moireDensity * 1.5));
  const isScreenRephoto = moireScore > 0.55;

  // 4. Boundary Step Luminance Delta Check
  const photoX = Math.round(width * 0.08);
  const photoY = Math.round(height * 0.22);
  const photoW = Math.round(width * 0.24);
  const photoH = Math.round(height * 0.46);

  let photoBorderDelta = 0;
  let borderPixelCount = 0;

  for (let px = photoX; px < photoX + photoW; px += 2) {
    const idxIn = (photoY * width + px) * 4;
    const idxOut = (Math.max(0, photoY - 4) * width + px) * 4;
    const lumIn = data[idxIn] * 0.299 + data[idxIn + 1] * 0.587 + data[idxIn + 2] * 0.114;
    const lumOut = data[idxOut] * 0.299 + data[idxOut + 1] * 0.587 + data[idxOut + 2] * 0.114;
    photoBorderDelta += Math.abs(lumIn - lumOut);
    borderPixelCount++;
  }

  const avgBorderStep = borderPixelCount > 0 ? photoBorderDelta / borderPixelCount : 0;
  const photoRegionSpliceScore = Math.min(1, Math.max(0, (avgBorderStep - 38) / 50));

  // Build flagged anomaly zones with objective, non-exaggerated descriptions
  const flaggedZones: PixelForensicResults['flaggedZones'] = [];

  if (photoRegionSpliceScore > 0.55) {
    flaggedZones.push({
      x: photoX,
      y: photoY,
      width: photoW,
      height: photoH,
      label: 'Edge contrast step anomaly around boundary zone',
      severity: photoRegionSpliceScore > 0.8 ? 'fail' : 'warn'
    });
  }

  if (compressionInconsistency > 0.60) {
    const maxBx = (maxBlockIdx % cols) * blockSize;
    const maxBy = Math.floor(maxBlockIdx / cols) * blockSize;
    flaggedZones.push({
      x: Math.max(0, maxBx - 20),
      y: Math.max(0, maxBy - 20),
      width: blockSize * 3,
      height: blockSize * 3,
      label: 'Unusual recompression delta across macroblocks (ELA)',
      severity: compressionInconsistency > 0.8 ? 'fail' : 'warn'
    });
  }

  if (isScreenRephoto) {
    flaggedZones.push({
      x: Math.round(width * 0.2),
      y: Math.round(height * 0.15),
      width: Math.round(width * 0.6),
      height: Math.round(height * 0.6),
      label: 'High-frequency periodic pattern (Screen re-photography indicator)',
      severity: 'fail'
    });
  }

  return {
    moireScore,
    isScreenRephoto,
    blurVariance,
    qualityPassed,
    compressionInconsistency,
    photoRegionSpliceScore,
    flaggedZones
  };
}
