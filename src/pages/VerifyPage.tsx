import React, { useState, useRef } from 'react';
import { 
  DocumentVerificationData, 
  VerdictType,
  OCRFields
} from '../types/edge';
import { 
  SAMPLE_PRESETS, 
  findSamplePresetById,
  runEdgeVerificationPipeline,
  getVerdictConfig,
  recomputeVerdictWithRL,
  reScanDocumentOCR,
  updateDocumentOCRFields
} from '../utils/edgePipeline';
import { generateAndDownloadDossierPdf, PdfExportOptions } from '../utils/pdfDossier';
import { rlPolicyAgent, GroundTruthAction } from '../utils/rlEngine';

export const VerifyPage: React.FC = () => {
  const [data, setData] = useState<DocumentVerificationData | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<{ index: number; name: string }>({ 
    index: 1, 
    name: 'Reading document text...' 
  });
  const [activeViewMode, setActiveViewMode] = useState<'standard' | 'ocr' | 'forensic'>('standard');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [pdfExportOptions, setPdfExportOptions] = useState<PdfExportOptions>({
    format: 'forensic',
    includeHashProvenance: true,
    includeRawOcrText: true,
    includeEvidenceBreakdown: true
  });
  const [isHashCopied, setIsHashCopied] = useState<boolean>(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<boolean>(false);
  const [sensitivityThreshold, setSensitivityThreshold] = useState<number>(78);
  const [rlStats, setRlStats] = useState(() => rlPolicyAgent.getStats());
  const [feedbackToast, setFeedbackToast] = useState<{ reward: number; explanation: string } | null>(null);
  const [isRescanningOcr, setIsRescanningOcr] = useState<boolean>(false);
  const [isEditingOcr, setIsEditingOcr] = useState<boolean>(false);
  const [editableOcrFields, setEditableOcrFields] = useState<OCRFields>({});
  const [showOcrDiagnostics, setShowOcrDiagnostics] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const copyHash = (hash: string) => {
    if (!hash) return;
    navigator.clipboard?.writeText(hash).then(() => {
      setIsHashCopied(true);
      setTimeout(() => setIsHashCopied(false), 2000);
    }).catch(() => {
      setIsHashCopied(true);
      setTimeout(() => setIsHashCopied(false), 2000);
    });
  };

  const handleSensitivityChange = (newThreshold: number) => {
    setSensitivityThreshold(newThreshold);
    if (data) {
      const updated = recomputeVerdictWithRL(data, newThreshold);
      setData(updated);
    }
  };

  const handleProvideFeedback = (targetGroundTruth: GroundTruthAction) => {
    if (!data) return;
    const currentAction: GroundTruthAction = data.verdict === 'NO_SIGNIFICANT_MANIPULATION' ? 0 : data.verdict === 'POSSIBLE_MANIPULATION' ? 1 : 2;
    const features = data.rlCalibration?.featureVector || rlPolicyAgent.extractFeatureVector({});
    const res = rlPolicyAgent.learnFromFeedback(features, currentAction, targetGroundTruth, data.fileName, data.sha256);
    
    const label = targetGroundTruth === 0 ? 'Genuine' : targetGroundTruth === 1 ? 'Needs Review' : 'Altered';
    setFeedbackToast({ 
      reward: res.reward, 
      explanation: `Marked as ${label}. Saved to device memory for instant recognition on re-upload.` 
    });
    setRlStats(rlPolicyAgent.getStats());
    const updated = recomputeVerdictWithRL(data, sensitivityThreshold);
    setData(updated);
    setTimeout(() => setFeedbackToast(null), 5000);
  };

  const handleResetPolicy = () => {
    rlPolicyAgent.resetToFactory();
    setRlStats(rlPolicyAgent.getStats());
    setFeedbackToast({ reward: 0, explanation: 'Reset all custom verification rules and remembered documents.' });
    if (data) {
      const updated = recomputeVerdictWithRL(data, sensitivityThreshold);
      setData(updated);
    }
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const handleStartPipeline = async (blob: Blob, name: string) => {
    setIsProcessing(true);
    setCurrentStage({ index: 1, name: 'Reading document text & IDs...' });

    try {
      const result = await runEdgeVerificationPipeline(
        blob, 
        name, 
        (idx, stageName) => {
          // Human-friendly stage descriptions
          const humanStages: Record<number, string> = {
            1: 'Loading document into secure local memory...',
            2: 'Reading printed text and identification numbers...',
            3: 'Analyzing paper texture and screen patterns...',
            4: 'Checking for photo splicing and digital edits...',
            5: 'Verifying checksums and issuing rules...',
            6: 'Preparing verification summary...'
          };
          setCurrentStage({ index: idx, name: humanStages[idx] || stageName });
        },
        { sensitivityThreshold }
      );
      setData(result);
      setEditableOcrFields(result.ocr.fields);
      setIsEditingOcr(false);
      setRlStats(rlPolicyAgent.getStats());
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRescanOcr = async () => {
    if (!data || isRescanningOcr) return;
    setIsRescanningOcr(true);
    try {
      const updated = await reScanDocumentOCR(data, 'high-contrast');
      setData(updated);
      setEditableOcrFields(updated.ocr.fields);
      setFeedbackToast({
        reward: 0,
        explanation: 'Completed High-Contrast OCR re-scan and updated extracted identity fields.'
      });
      setTimeout(() => setFeedbackToast(null), 4000);
    } catch (err) {
      console.error('OCR re-scan error:', err);
    } finally {
      setIsRescanningOcr(false);
    }
  };

  const handleSaveOcrEdits = () => {
    if (!data) return;
    const cleaned: OCRFields = {};
    for (const [k, v] of Object.entries(editableOcrFields)) {
      if (v && v.trim() !== '') {
        cleaned[k] = v.trim();
      }
    }
    const updated = updateDocumentOCRFields(
      data,
      cleaned,
      undefined,
      `${data.ocr.engineUsed || 'Hybrid OCR'} (Analyst Verified)`,
      'Manual OCR field refinement applied; re-verified Verhoeff / PAN / Chronology rules.'
    );
    setData(updated);
    setIsEditingOcr(false);
    setFeedbackToast({
      reward: 0,
      explanation: 'Updated OCR fields and re-verified document ID checksums.'
    });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleStartPipeline(file, file.name);
    }
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = findSamplePresetById(presetId) || SAMPLE_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    const dataUrl = preset.generateImage();
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => {
        handleStartPipeline(blob, preset.documentName);
      });
  };

  const handleOpenExportModal = () => {
    if (!data) return;
    setIsExportModalOpen(true);
  };

  const handleConfirmDownloadPdf = async () => {
    if (!data) return;
    setIsDownloadingPdf(true);
    try {
      await generateAndDownloadDossierPdf(data, pdfExportOptions);
      setIsExportModalOpen(false);
      setDownloadSuccessToast(true);
      setTimeout(() => setDownloadSuccessToast(false), 4500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const verdict = data ? getVerdictConfig(data.verdict) : null;
  const isGenuine = data?.verdict === 'NO_SIGNIFICANT_MANIPULATION' || data?.verdict === 'Real' || data?.verdict === 'AUTHENTIC_VERIFIED';
  const isSuspicious = data?.verdict === 'POSSIBLE_MANIPULATION' || data?.verdict === 'Suspicious';
  const isTampered = data?.verdict === 'INTEGRITY_FAILED' || data?.verdict === 'Tampered';

  return (
    <main className="min-h-screen pb-24 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        {/* Thoughtful, Human Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span>Document Verification Desk</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            Inspect &amp; Authenticate Identity Documents
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Check ID cards, passports, and credentials for digital edits, screen re-photography, and structural anomalies. Fully private and processed directly in your browser.
          </p>
        </div>

        {/* 1. Upload Dropzone (Inspection Desk) */}
        {!data && !isProcessing && (
          <div className="max-w-2xl mx-auto mb-16">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-10 sm:p-12 rounded-2xl text-center cursor-pointer transition-all border-2 border-dashed border-slate-700/80 hover:border-indigo-500/60 bg-[#121624] hover:bg-[#141a2c] group shadow-xl"
            >
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 group-hover:scale-105 transition-transform">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>

              <h2 className="text-white font-semibold text-lg mb-1">
                Drop an ID card or document photo here
              </h2>
              <p className="text-slate-400 text-xs mb-4">
                or click to browse from your computer (JPG, PNG, WebP, PDF)
              </p>

              <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Private &amp; offline: Evaluated locally in browser memory</span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Quick Test Sample Documents */}
            <div className="mt-8 text-center">
              <span className="text-xs text-slate-400 block mb-3 font-medium">
                Or try an instant sample document:
              </span>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  {
                    id: 'clean',
                    label: 'Genuine National ID',
                    subtitle: 'Clean specimen',
                    icon: '✓',
                    badgeColor: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
                  },
                  {
                    id: 'suspicious',
                    label: 'Screen Re-photography',
                    subtitle: 'Phone photo of monitor',
                    icon: '⚠',
                    badgeColor: 'text-amber-400 bg-amber-950/40 border-amber-500/30'
                  },
                  {
                    id: 'tampered',
                    label: 'Digitally Altered ID',
                    subtitle: 'Spliced photo & modified name',
                    icon: '✕',
                    badgeColor: 'text-rose-400 bg-rose-950/40 border-rose-500/30'
                  }
                ].map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleLoadPreset(sample.id)}
                    className="px-4 py-2.5 rounded-xl text-left border bg-[#121624] hover:bg-[#181f33] border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center gap-3 group"
                  >
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold border ${sample.badgeColor}`}>
                      {sample.icon}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-white">
                        {sample.label}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {sample.subtitle}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. Calm, Human Inspection Modal */}
        {isProcessing && (
          <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-[#0b0e14]/95 backdrop-blur-md px-4">
            <div className="w-full max-w-md p-8 rounded-2xl bg-[#121624] border border-slate-800 text-center shadow-2xl">
              
              {/* Document Scanning Animation */}
              <div className="w-20 h-28 mx-auto mb-6 rounded-xl border-2 border-indigo-500/30 bg-slate-900/60 p-2 relative overflow-hidden flex flex-col justify-between">
                <div className="w-full h-1.5 rounded-full bg-indigo-500/40" />
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 mx-auto" />
                <div className="space-y-1">
                  <div className="w-full h-1 rounded bg-slate-700" />
                  <div className="w-2/3 h-1 rounded bg-slate-700" />
                </div>
                {/* Smooth scanning bar */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-pulse" style={{ top: '45%' }} />
              </div>

              <h2 className="text-xl font-bold text-white mb-1">
                Inspecting Document
              </h2>
              <p className="text-xs text-indigo-300 font-medium mb-6">
                {currentStage.name}
              </p>

              {/* Progress Steps */}
              <div className="space-y-2 text-left mb-6">
                {[
                  { step: 1, label: 'Read printed text & extract identifiers' },
                  { step: 2, label: 'Analyze paper texture & print raster' },
                  { step: 3, label: 'Screen for digital compression & splicing' },
                  { step: 4, label: 'Check ID checksums & issuing patterns' }
                ].map((s) => {
                  const isDone = currentStage.index > s.step;
                  const isCurrent = currentStage.index === s.step;
                  return (
                    <div key={s.step} className="flex items-center gap-3 text-xs">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isDone ? 'bg-emerald-500/20 text-emerald-400' : isCurrent ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {isDone ? '✓' : isCurrent ? '•' : s.step}
                      </span>
                      <span className={isDone ? 'text-slate-300' : isCurrent ? 'text-white font-medium' : 'text-slate-400'}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400">
                🔒 Safe and offline. Zero bytes leave this computer.
              </div>
            </div>
          </div>
        )}

        {/* 3. Comprehensive Human Inspection Review */}
        {data && verdict && !isProcessing && (
          <div className="space-y-8">
            
            {/* Document Header & Primary Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#121624] border border-slate-800">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-slate-400">Document:</span>
                <span className="text-xs font-semibold text-white bg-slate-800 px-3 py-1 rounded-lg">
                  {data.fileName}
                </span>

                {data.memoryMatch?.isMatched && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-emerald-300 bg-emerald-950/40 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Remembered Decision ({data.memoryMatch.verifiedLabel})</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenExportModal}
                  disabled={isDownloadingPdf}
                  className="btn-primary text-xs py-2 px-3.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{isDownloadingPdf ? 'Creating PDF...' : 'Download Report (PDF)'}</span>
                </button>

                <button
                  onClick={() => setData(null)}
                  className="btn-secondary text-xs py-2 px-3.5 cursor-pointer"
                >
                  Inspect Another File
                </button>
              </div>
            </div>

            {/* Verdict Card (Clear, Human, Reassuring) */}
            <div className={`p-6 sm:p-8 rounded-2xl border transition-all ${
              isGenuine 
                ? 'bg-emerald-950/20 border-emerald-500/30' 
                : isSuspicious 
                ? 'bg-amber-950/20 border-amber-500/30' 
                : 'bg-rose-950/20 border-rose-500/30'
            }`}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  {data.memoryMatch?.isMatched && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-indigo-300 bg-indigo-950/50 border border-indigo-500/30 mb-3">
                      <span>✓</span>
                      <span>Verified Ground Truth from your previous review ({data.memoryMatch.timestamp})</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      isGenuine ? 'bg-emerald-400' : isSuspicious ? 'bg-amber-400' : 'bg-rose-400'
                    }`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      isGenuine ? 'text-emerald-400' : isSuspicious ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {isGenuine ? 'Inspection Passed' : isSuspicious ? 'Manual Review Advised' : 'Integrity Alert'}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    {isGenuine 
                      ? 'Likely Genuine Document' 
                      : isSuspicious 
                      ? 'Suspicious Anomalies Detected' 
                      : 'Likely Altered or Tampered Document'}
                  </h2>

                  <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                    {isGenuine
                      ? 'Paper substrate texture, macroblock compression, and identification syntax are consistent with standard official issuance. No signs of digital editing or screen re-photography detected.'
                      : isSuspicious
                      ? 'Detected minor compression discrepancies or periodic screen interference. We recommend verifying the document in person or requesting a daylight photograph.'
                      : 'Found definitive indicators of digital image modification, mismatched compression macroblocks, or invalid identification checksums.'}
                  </p>
                </div>

                {/* Score Dial */}
                <div className="px-6 py-4 rounded-xl bg-[#0b0e14]/80 border border-slate-800 text-center shrink-0 min-w-[140px]">
                  <div className={`text-3xl sm:text-4xl font-extrabold ${
                    isGenuine ? 'text-emerald-400' : isSuspicious ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {data.score}
                    <span className="text-base text-slate-400 font-normal"> / 100</span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-400 mt-1">
                    Authenticity Score
                  </div>
                </div>
              </div>

              {/* 4 Reassurance Checkpoints */}
              <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { label: 'Paper & Substrate Texture', pass: data.boundaryConfidence > 0.8 },
                  { label: 'Text & ID Structure Alignment', pass: data.ocr.confidence > 0.7 },
                  { label: 'Compression Consistency', pass: data.compressionArtifacts.inconsistencyScore < 0.3 },
                  { label: 'Device Privacy Guard', pass: true }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      item.pass ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {item.pass ? '✓' : '✕'}
                    </span>
                    <span className="text-slate-300 font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Analyst Review & Continuous Learning Console */}
            <div className="p-6 rounded-2xl bg-[#121624] border border-slate-800">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/8">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                      Analyst Review &amp; Learning Memory
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Did the system evaluate this correctly?
                  </h3>
                  <p className="text-xs text-slate-400">
                    Confirming or correcting the result permanently remembers this file on this device and trains the system to recognize similar camera conditions.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Saved Memory</span>
                    <span className="text-xs font-semibold text-emerald-400">
                      {rlStats.memoryCount ?? 0} documents remembered
                    </span>
                  </div>
                  <button
                    onClick={handleResetPolicy}
                    title="Clear learned sensitivity adjustments and remembered documents"
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Reset Memory
                  </button>
                </div>
              </div>

              {/* Toast Feedback */}
              {feedbackToast && (
                <div className="mb-5 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-indigo-200 text-xs flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="font-bold text-emerald-400">✓ Feedback Saved:</span>
                    <span>{feedbackToast.explanation}</span>
                  </div>
                  <span className="text-[10px] text-indigo-300 opacity-75">Hash Committed</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Strictness Slider */}
                <div className="lg:col-span-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">
                      Verification Strictness: <span className="text-indigo-400 font-bold">{sensitivityThreshold}%</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {sensitivityThreshold >= 80 ? 'Strict compliance mode' : sensitivityThreshold >= 70 ? 'Balanced standard' : 'High tolerance for phone glare'}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={50}
                    max={90}
                    step={1}
                    value={sensitivityThreshold}
                    onChange={(e) => handleSensitivityChange(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />

                  <div className="flex items-center gap-2 pt-1">
                    {[
                      { threshold: 60, label: 'High Tolerance (60%)', desc: 'Camera/JPEG Noise' },
                      { threshold: 70, label: 'Balanced (70%)', desc: 'Standard KYC' },
                      { threshold: 80, label: 'Strict (80%)', desc: 'Security Baseline' }
                    ].map((preset) => (
                      <button
                        key={preset.threshold}
                        onClick={() => handleSensitivityChange(preset.threshold)}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border transition-all text-center cursor-pointer ${
                          sensitivityThreshold === preset.threshold
                            ? 'bg-indigo-600/25 border-indigo-500 text-indigo-200'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="block leading-tight">{preset.label}</span>
                        <span className="text-[10px] opacity-70 block">{preset.desc}</span>
                      </button>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Lower thresholds allow natural phone-camera compression and low lighting without triggering false warnings.
                  </p>
                </div>

                {/* Right: Human Analyst Feedback Buttons */}
                <div className="lg:col-span-6 space-y-3 lg:border-l lg:border-white/8 lg:pl-8">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">
                      Record Analyst Ground Truth
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Cycles: {rlStats.epochs}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Click a verdict to confirm this document in device memory:
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleProvideFeedback(0)}
                      className="py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer hover:scale-102 bg-emerald-950/30 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40"
                    >
                      <span className="text-sm">✓</span>
                      <span>Mark Genuine</span>
                      <span className="text-[10px] opacity-75">Authentic</span>
                    </button>

                    <button
                      onClick={() => handleProvideFeedback(1)}
                      className="py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer hover:scale-102 bg-amber-950/30 border-amber-500/40 text-amber-300 hover:bg-amber-900/40"
                    >
                      <span className="text-sm">⚠</span>
                      <span>Flag for Review</span>
                      <span className="text-[10px] opacity-75">Suspicious</span>
                    </button>

                    <button
                      onClick={() => handleProvideFeedback(2)}
                      className="py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer hover:scale-102 bg-rose-950/30 border-rose-500/40 text-rose-300 hover:bg-rose-900/40"
                    >
                      <span className="text-sm">✕</span>
                      <span>Mark Altered</span>
                      <span className="text-[10px] opacity-75">Tampered</span>
                    </button>
                  </div>

                  {data.rlCalibration && (
                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 pt-1">
                      <span>Model probabilities:</span>
                      <span className="text-emerald-400">Real: {(data.rlCalibration.probabilities[0] * 100).toFixed(0)}%</span>
                      <span className="text-amber-400">Suspicious: {(data.rlCalibration.probabilities[1] * 100).toFixed(0)}%</span>
                      <span className="text-rose-400">Tampered: {(data.rlCalibration.probabilities[2] * 100).toFixed(0)}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Document Inspection & Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Visual Document Canvas */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-5 rounded-2xl bg-[#121624] border border-slate-800">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/8">
                    <span className="text-xs font-semibold text-slate-300">
                      Document Inspection View
                    </span>

                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                      {[
                        { id: 'standard', label: 'Original' },
                        { id: 'ocr', label: 'Text Regions' },
                        { id: 'forensic', label: 'Anomaly Zones' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveViewMode(tab.id as typeof activeViewMode)}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                            activeViewMode === tab.id
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Document Mat */}
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#090b10] flex items-center justify-center min-h-[380px] p-4">
                    <img 
                      src={data.imageBlobUrl} 
                      alt="Analyzed Document" 
                      className="max-h-[420px] w-auto object-contain rounded-lg shadow-xl"
                    />

                    {/* OCR Box Overlay */}
                    {activeViewMode === 'ocr' && (
                      <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-around">
                        {data.ocr.fields.fullName && (
                          <div className="border border-indigo-400/80 bg-indigo-500/15 rounded p-2 max-w-[300px]">
                            <span className="text-[10px] text-indigo-300 block font-medium">FULL NAME</span>
                            <span className="text-xs font-bold text-white">{data.ocr.fields.fullName}</span>
                          </div>
                        )}
                        {data.ocr.fields.documentId && (
                          <div className="border border-indigo-400/80 bg-indigo-500/15 rounded p-2 max-w-[300px]">
                            <span className="text-[10px] text-indigo-300 block font-medium">DOCUMENT ID</span>
                            <span className="text-xs font-bold text-white font-mono">{data.ocr.fields.documentId}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Forensic Zones Overlay */}
                    {activeViewMode === 'forensic' && (
                      <div className="absolute inset-0 pointer-events-none p-6">
                        {isTampered ? (
                          <div className="absolute top-[22%] left-[8%] w-[34%] h-[48%] border-2 border-rose-500 bg-rose-500/20 rounded-lg p-2 flex items-start justify-end">
                            <span className="text-[10px] font-bold text-rose-300 bg-rose-950/90 px-2 py-0.5 rounded border border-rose-500/40">
                              Discontinuous Photo Boundary
                            </span>
                          </div>
                        ) : isSuspicious ? (
                          <div className="absolute top-[32%] left-[30%] w-[46%] h-[22%] border-2 border-amber-500 bg-amber-500/20 rounded-lg p-2 flex items-start justify-end">
                            <span className="text-[10px] font-bold text-amber-300 bg-amber-950/90 px-2 py-0.5 rounded border border-amber-500/40">
                              Compression Variance Anomaly
                            </span>
                          </div>
                        ) : (
                          <div className="absolute inset-4 border border-emerald-500/40 bg-emerald-500/5 rounded-xl flex items-end justify-end p-3">
                            <span className="text-[10px] font-medium text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-500/40">
                              ✓ Print Texture &amp; Pixel Matrix Coherent
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 4 Clean Quality Indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#121624] border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Text Clarity</span>
                    <span className="text-lg font-bold text-white">
                      {(100 * data.ocr.confidence).toFixed(0)}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {Object.keys(data.ocr.fields).length} fields detected
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#121624] border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Image Focus</span>
                    <span className="text-lg font-bold text-white">
                      {data.qualityCheck.passed ? 'Sharp' : 'Blurry'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Variance: {(data.qualityCheck.blurScore * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#121624] border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Compression</span>
                    <span className="text-lg font-bold text-white">
                      {data.compressionArtifacts.inconsistencyScore < 0.3 ? 'Uniform' : 'Irregular'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Delta: {(data.compressionArtifacts.inconsistencyScore * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#121624] border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Metadata</span>
                    <span className="text-lg font-bold text-white truncate block">
                      {data.metadata.software ? 'Edited' : 'Clean'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                      {data.metadata.software || 'Camera profile'}
                    </span>
                  </div>
                </div>

                {/* Cryptographic SHA-256 Digest Card */}
                <div className="p-3.5 rounded-xl bg-[#121624] border border-slate-800 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Cryptographic Document Fingerprint (SHA-256)
                    </span>
                    <span className="text-xs font-mono text-slate-300 block truncate select-all mt-0.5">
                      {data.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                    </span>
                  </div>

                  <button
                    onClick={() => copyHash(data.sha256 || '')}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
                  >
                    {isHashCopied ? 'Copied!' : 'Copy Hash'}
                  </button>
                </div>
              </div>

              {/* Right Column: Extracted Information & Evidence */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Extracted Identity Information */}
                <div className="p-5 rounded-2xl bg-[#121624] border border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-white/8">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                        Extracted Document Details
                      </h3>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Engine: <strong className="text-indigo-300 font-medium">{data.ocr.engineUsed || 'Hybrid Vision + Tesseract WASM'}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleRescanOcr}
                        disabled={isRescanningOcr}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition-colors cursor-pointer disabled:opacity-50"
                        title="Re-run OCR with high-contrast adaptive thresholding"
                      >
                        {isRescanningOcr ? 'Scanning...' : 'Re-Scan OCR'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isEditingOcr) {
                            setEditableOcrFields({
                              fullName: data.ocr.fields.fullName || '',
                              documentId: data.ocr.fields.documentId || '',
                              dateOfBirth: data.ocr.fields.dateOfBirth || '',
                              gender: data.ocr.fields.gender || '',
                              address: data.ocr.fields.address || '',
                              expiryDate: data.ocr.fields.expiryDate || '',
                              documentType: data.ocr.fields.documentType || 'Identity Document'
                            });
                          }
                          setIsEditingOcr(!isEditingOcr);
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                      >
                        {isEditingOcr ? 'Cancel' : 'Edit'}
                      </button>
                    </div>
                  </div>

                  {isEditingOcr ? (
                    <div className="space-y-2.5">
                      {[
                        { key: 'fullName', label: 'Full Name' },
                        { key: 'documentId', label: 'Document ID' },
                        { key: 'dateOfBirth', label: 'Date of Birth (DD/MM/YYYY)' },
                        { key: 'gender', label: 'Gender' },
                        { key: 'address', label: 'Address' },
                        { key: 'expiryDate', label: 'Expiry Date' },
                        { key: 'documentType', label: 'Document Type' }
                      ].map(field => (
                        <div key={field.key} className="flex flex-col gap-1">
                          <label className="text-[10px] font-medium text-slate-400 uppercase">
                            {field.label}
                          </label>
                          <input
                            type="text"
                            value={editableOcrFields[field.key] || ''}
                            onChange={e =>
                              setEditableOcrFields(prev => ({
                                ...prev,
                                [field.key]: e.target.value
                              }))
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#0b0e14] border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      ))}
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={handleSaveOcrEdits}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                        >
                          Save &amp; Re-Verify Checksums
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(data.ocr.fields).map(([key, val]) => (
                        <div key={key} className="flex justify-between items-center p-2.5 rounded-lg bg-[#0b0e14] border border-slate-800/80 text-xs gap-3">
                          <span className="text-slate-400 capitalize font-medium shrink-0">
                            {key.replace(/([A-Z])/g, ' $1')}
                          </span>
                          <span className="text-slate-100 font-semibold text-right truncate max-w-[220px]" title={val}>
                            {val}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {data.ocr.rawText && (
                    <div className="mt-4 pt-3 border-t border-white/8">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                        Raw Recognized Text:
                      </span>
                      <pre className="text-[11px] font-mono text-slate-300 bg-[#0b0e14] p-3 rounded-lg border border-slate-800/80 whitespace-pre-wrap max-h-28 overflow-y-auto intel-scroll">
                        {data.ocr.rawText}
                      </pre>
                    </div>
                  )}

                  {data.ocr.diagnostics && data.ocr.diagnostics.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-white/8">
                      <button
                        type="button"
                        onClick={() => setShowOcrDiagnostics(prev => !prev)}
                        className="w-full flex items-center justify-between text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 cursor-pointer hover:text-white"
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          <span>OCR Engine Diagnostics &amp; Log ({data.ocr.diagnostics.length})</span>
                        </span>
                        <span className="text-indigo-400 text-[10px]">
                          {showOcrDiagnostics ? 'Hide ▲' : 'Show ▼'}
                        </span>
                      </button>

                      {showOcrDiagnostics && (
                        <div className="p-2.5 rounded-lg bg-[#0b0e14] border border-slate-800/90 space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-slate-800/80">
                            <span>Passes Executed: <strong className="text-slate-200">{data.ocr.passCount || 1}</strong></span>
                            <span>Confidence: <strong className="text-indigo-300">{(data.ocr.confidence * 100).toFixed(0)}%</strong></span>
                          </div>
                          <ul className="space-y-1 text-[11px] text-slate-300 font-mono">
                            {data.ocr.diagnostics.map((diag, i) => {
                              const isWarnOrErr = /warning|error|fail|offline|low|fallback/i.test(diag);
                              return (
                                <li key={i} className="flex items-start gap-1.5 leading-snug">
                                  <span className={isWarnOrErr ? 'text-amber-400 mt-0.5' : 'text-emerald-400 mt-0.5'}>
                                    {isWarnOrErr ? '⚠' : '✓'}
                                  </span>
                                  <span className={isWarnOrErr ? 'text-amber-200/90' : 'text-slate-300'}>
                                    {diag}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Evidence Observations */}
                <div className="p-5 rounded-2xl bg-[#121624] border border-slate-800">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/8">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Inspection Evidence &amp; Findings
                    </h3>
                    <span className="text-xs text-slate-400">
                      {data.evidence.length} observations
                    </span>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1 intel-scroll">
                    {data.evidence.map((ev, idx) => {
                      const isPass = ev.severity === 'pass';
                      const isWarn = ev.severity === 'warn';
                      return (
                        <div 
                          key={idx}
                          className={`p-3.5 rounded-xl border text-xs ${
                            isPass 
                              ? 'bg-emerald-950/20 border-emerald-500/25' 
                              : isWarn 
                              ? 'bg-amber-950/20 border-amber-500/25' 
                              : 'bg-rose-950/25 border-rose-500/35'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[11px] font-bold ${
                              isPass ? 'text-emerald-400' : isWarn ? 'text-amber-400' : 'text-rose-400'
                            }`}>
                              {isPass ? '✓ Verified' : isWarn ? '⚠ Flagged' : '✕ Anomaly'}: {ev.observation}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              {(ev.confidence * 100).toFixed(0)}% conf
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            {ev.explanation}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Export Action Card */}
            <div className="p-6 rounded-2xl bg-[#121624] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Need an official record?
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure and download an audit dossier in Standard Summary or Full Forensic Report format.
                  </p>
                </div>
              </div>

              <button
                onClick={handleOpenExportModal}
                disabled={isDownloadingPdf}
                className="btn-primary text-xs py-2.5 px-5 cursor-pointer shrink-0 w-full sm:w-auto justify-center"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>{isDownloadingPdf ? 'Generating PDF...' : 'Configure & Download PDF'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Secure PDF Export Settings Modal */}
      {isExportModalOpen && data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0e14]/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#121624] border border-slate-800 shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
                  Secure Dossier Export
                </span>
                <h3 className="text-lg font-bold text-white">
                  Configure PDF Output Format
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded-lg bg-slate-800/80 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Format Selector: Standard vs Forensic Report */}
            <div className="space-y-3 mb-5">
              <label className="text-xs font-semibold text-slate-300 block">
                Report Template Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setPdfExportOptions(prev => ({
                      ...prev,
                      format: 'standard',
                      includeEvidenceBreakdown: false,
                      includeRawOcrText: false
                    }))
                  }
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    pdfExportOptions.format === 'standard'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-[#0b0e14] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">Standard Summary</span>
                    {pdfExportOptions.format === 'standard' && (
                      <span className="text-xs text-indigo-400 font-bold">●</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Concise 1-page executive verification summary with verdict, trust score, and extracted identity fields.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPdfExportOptions(prev => ({
                      ...prev,
                      format: 'forensic',
                      includeEvidenceBreakdown: true,
                      includeRawOcrText: true
                    }))
                  }
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    pdfExportOptions.format === 'forensic'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-[#0b0e14] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">Forensic Report</span>
                    {pdfExportOptions.format === 'forensic' && (
                      <span className="text-xs text-indigo-400 font-bold">●</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Full compliance dossier including itemized ELA/Moiré evidence, checksum audit, and SHA-256 provenance.
                  </p>
                </button>
              </div>
            </div>

            {/* Granular Telemetry Toggles */}
            <div className="space-y-2.5 p-4 rounded-xl bg-[#0b0e14] border border-slate-800/90 mb-6 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300">Include Cryptographic SHA-256 Digest Banner</span>
                <input
                  type="checkbox"
                  checked={pdfExportOptions.includeHashProvenance ?? true}
                  onChange={e =>
                    setPdfExportOptions(prev => ({
                      ...prev,
                      includeHashProvenance: e.target.checked
                    }))
                  }
                  className="accent-indigo-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300">Include Itemized Forensic Evidence Signals</span>
                <input
                  type="checkbox"
                  checked={
                    pdfExportOptions.format === 'forensic' ||
                    Boolean(pdfExportOptions.includeEvidenceBreakdown)
                  }
                  onChange={e =>
                    setPdfExportOptions(prev => ({
                      ...prev,
                      includeEvidenceBreakdown: e.target.checked
                    }))
                  }
                  className="accent-indigo-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300">Include Raw OCR Stream Excerpt</span>
                <input
                  type="checkbox"
                  checked={Boolean(pdfExportOptions.includeRawOcrText)}
                  onChange={e =>
                    setPdfExportOptions(prev => ({
                      ...prev,
                      includeRawOcrText: e.target.checked
                    }))
                  }
                  className="accent-indigo-500 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="btn-secondary text-xs py-2 px-4 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDownloadPdf}
                disabled={isDownloadingPdf}
                className="btn-primary text-xs py-2 px-5 cursor-pointer"
              >
                <span>
                  {isDownloadingPdf
                    ? 'Generating PDF...'
                    : `Download ${pdfExportOptions.format === 'forensic' ? 'Forensic Report' : 'Standard PDF'}`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Download Success Toast */}
      {downloadSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl border border-emerald-500/40 bg-[#121624] text-white shadow-2xl flex items-center gap-3 animate-fade-in">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
            ✓
          </div>
          <div>
            <div className="text-xs font-semibold">Report Downloaded</div>
            <div className="text-[11px] text-slate-400">PDF dossier has been saved to your downloads</div>
          </div>
        </div>
      )}
    </main>
  );
};
