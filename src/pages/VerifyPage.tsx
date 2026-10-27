import React, { useState, useRef } from 'react';
import { 
  DocumentVerificationData, 
  VerdictType 
} from '../types/edge';
import { 
  SAMPLE_PRESETS, 
  runEdgeVerificationPipeline,
  getVerdictConfig
} from '../utils/edgePipeline';
import { generateAndDownloadDossierPdf } from '../utils/pdfDossier';

export const VerifyPage: React.FC = () => {
  const [data, setData] = useState<DocumentVerificationData | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentStepName, setCurrentStepName] = useState<string>('Loading your image');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(1);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [expandedEvidenceIdx, setExpandedEvidenceIdx] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const progressSteps = [
    { index: 1, label: 'Loading your image' },
    { index: 2, label: 'Checking image quality' },
    { index: 3, label: 'Examining possible inconsistencies' },
    { index: 4, label: 'Preparing the results' }
  ];

  const validateAndProcessFile = async (file: File) => {
    setErrorMessage(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage(`This file format (${file.type || 'unknown'}) is not supported. Please choose a JPG, PNG, or WebP image.`);
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      setErrorMessage(`The selected file is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). The maximum allowed file size is 10 MB.`);
      return;
    }

    setIsDemoMode(false);
    setIsProcessing(true);
    setCurrentStepIndex(1);
    setCurrentStepName('Loading your image');

    try {
      const result = await runEdgeVerificationPipeline(file, file.name, (idx, stageName) => {
        setCurrentStepIndex(idx);
        setCurrentStepName(stageName);
      });
      setData(result);
    } catch (err: any) {
      console.error('Inspection error:', err);
      setErrorMessage(err.message || 'We could not analyze this image. Please try another file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleLoadPreset = (presetId: string) => {
    setErrorMessage(null);
    const preset = SAMPLE_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setIsDemoMode(true);
    setIsProcessing(true);
    setCurrentStepIndex(1);
    setCurrentStepName('Loading sample image');

    const dataUrl = preset.generateImage();
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => {
        return runEdgeVerificationPipeline(blob, preset.documentName, (idx, stageName) => {
          setCurrentStepIndex(idx);
          setCurrentStepName(stageName);
        });
      })
      .then(result => {
        setData({
          ...result,
          score: preset.score,
          verdict: preset.verdict,
          ocr: {
            confidence: 0.9,
            fields: preset.fields,
            rawText: preset.rawText
          },
          evidence: preset.evidence
        });
      })
      .catch(() => {
        setErrorMessage('We could not load the sample document. Please try selecting a local image file.');
      })
      .finally(() => {
        setIsProcessing(false);
      });
  };

  const handleDownloadPdf = async () => {
    if (!data) return;
    setIsDownloadingPdf(true);
    try {
      await generateAndDownloadDossierPdf(data);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const verdict = data ? getVerdictConfig(data.verdict) : null;

  return (
    <main className="min-h-screen pb-16 bg-[#F7F8FA]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Workspace Page Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#E2E7EF]">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#172033]">
                Check a document image
              </h1>
              <p className="text-sm text-[#586579] mt-1">
                Examine visual quality, compression differences, and metadata signatures for signs of editing.
              </p>
            </div>
            {data && (
              <button
                onClick={() => {
                  setData(null);
                  setIsDemoMode(false);
                  setErrorMessage(null);
                }}
                className="vg-btn-secondary text-sm self-start sm:self-auto"
              >
                Check another document
              </button>
            )}
          </div>
        </div>

        {/* User-facing error message */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] flex items-start justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#B91C1C] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <span className="text-sm font-semibold block">Notice</span>
                <span className="text-sm">{errorMessage}</span>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-[#B91C1C] hover:underline font-semibold cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Demo Mode Notice Banner */}
        {isDemoMode && data && (
          <div className="mb-6 p-3.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-sm">
            <div>
              <strong>Demonstration Sample:</strong> You are viewing an illustrative synthetic preset. No real identity was processed.
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="underline font-semibold text-[#B45309] cursor-pointer shrink-0"
            >
              Upload real image instead
            </button>
          </div>
        )}

        {/* A. Upload Area (When no document is loaded or being processed) */}
        {!data && !isProcessing && (
          <div className="space-y-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              tabIndex={0}
              role="button"
              aria-label="Upload document image"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) validateAndProcessFile(file);
              }}
              className="vg-card p-8 sm:p-12 text-center border-2 border-dashed border-[#CBD5E1] hover:border-[#315EFB] focus:border-[#315EFB] focus:outline-none focus:ring-4 focus:ring-[#315EFB]/15 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-[#EEF2F6] text-[#315EFB] flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>

              <h2 className="text-lg font-bold text-[#172033] mb-1">
                Choose a document image
              </h2>
              <p className="text-sm text-[#586579] mb-4">
                Upload a clear JPG, PNG, or supported image file. Drag and drop here or click below.
              </p>

              <button
                type="button"
                className="vg-btn-primary text-sm py-2 px-5 mb-5 pointer-events-none"
              >
                Choose image
              </button>

              <div className="max-w-md mx-auto pt-4 border-t border-[#E2E7EF] text-xs text-[#586579] space-y-1">
                <p>
                  <strong>Supported formats:</strong> JPG, PNG, WebP · <strong>Maximum size:</strong> 10 MB
                </p>
                <p className="text-[#828FA3]">
                  <strong>Privacy guarantee:</strong> Your image stays on your computer. It is examined locally in your web browser and is not uploaded to any server.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Test with Sample Documents */}
            <div className="vg-card p-5 border border-[#E2E7EF] bg-white">
              <span className="text-xs font-semibold text-[#586579] uppercase tracking-wider block mb-2">
                Or test with sample documents (Demonstration only):
              </span>
              <div className="flex flex-wrap gap-2.5">
                {SAMPLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleLoadPreset(preset.id)}
                    className="vg-btn-secondary text-xs sm:text-sm py-2 px-3.5"
                  >
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ background: preset.color }}
                    />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* C. Analysis Progress (Human-friendly sequential steps) */}
        {isProcessing && (
          <div className="vg-card p-8 sm:p-10 border border-[#E2E7EF] text-center max-w-lg mx-auto bg-white">
            <div className="w-8 h-8 border-3 border-[#EEF2F6] border-t-[#315EFB] rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-base font-bold text-[#172033] mb-1">
              Checking your document
            </h3>
            <p className="text-sm text-[#315EFB] font-medium mb-6">
              {currentStepName}…
            </p>

            <div className="space-y-2 text-left max-w-xs mx-auto text-xs text-[#586579]">
              {progressSteps.map((step) => {
                const isDone = currentStepIndex > step.index;
                const isCurrent = currentStepIndex === step.index;

                return (
                  <div key={step.index} className="flex items-center gap-2.5 py-1">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      isDone 
                        ? 'bg-[#15803d] text-white' 
                        : isCurrent 
                        ? 'bg-[#315EFB] text-white' 
                        : 'bg-[#EEF2F6] text-[#828FA3]'
                    }`}>
                      {isDone ? '✓' : step.index}
                    </span>
                    <span className={isCurrent ? 'font-semibold text-[#172033]' : ''}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* D. Results State: Summary, Preview, What We Checked, What We Found, What To Do Next */}
        {data && !isProcessing && verdict && (
          <div className="space-y-6">
            {/* Top Result Banner */}
            <div 
              className="p-6 rounded-xl border shadow-sm"
              style={{
                backgroundColor: verdict.bg,
                borderColor: verdict.border
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span 
                    className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded inline-block mb-2 text-white"
                    style={{ backgroundColor: verdict.hex }}
                  >
                    {verdict.badge}
                  </span>
                  <h2 
                    className="text-xl sm:text-2xl font-bold leading-snug"
                    style={{ color: verdict.hex }}
                  >
                    {verdict.label}
                  </h2>
                  <p className="text-sm text-[#586579] mt-1.5 max-w-2xl leading-relaxed">
                    {verdict.sub}
                  </p>
                </div>

                <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-black/5">
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-[#586579] block">
                      Screening Index
                    </span>
                    <span 
                      className="text-3xl font-bold font-mono"
                      style={{ color: verdict.hex }}
                    >
                      {data.score}
                      <span className="text-xs text-[#828FA3] font-normal"> / 100</span>
                    </span>
                  </div>
                  <span className="text-[11px] text-[#828FA3] mt-1 hidden sm:block">
                    Automated heuristic estimate
                  </span>
                </div>
              </div>
            </div>

            {/* B. Image Preview & Action Controls */}
            <div className="vg-card p-5 border border-[#E2E7EF] bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E7EF] mb-4">
                <div>
                  <span className="text-xs text-[#586579] block">Examined image:</span>
                  <span className="text-sm font-bold text-[#172033] truncate block max-w-md">
                    {data.fileName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setData(null);
                      setIsDemoMode(false);
                      setErrorMessage(null);
                    }}
                    className="vg-btn-secondary text-xs py-1.5 px-3"
                  >
                    Remove or replace image
                  </button>

                  <button
                    onClick={handleDownloadPdf}
                    disabled={isDownloadingPdf}
                    className="vg-btn-primary text-xs py-1.5 px-3.5 shrink-0"
                  >
                    {isDownloadingPdf ? 'Generating...' : 'Download analysis report (PDF)'}
                  </button>
                </div>
              </div>

              {/* Centered Image Preview Surface */}
              <div className="p-3 rounded-lg bg-[#0F172A] flex items-center justify-center max-h-[380px] overflow-hidden">
                <img 
                  src={data.imageBlobUrl} 
                  alt="Examined Document Preview"
                  className="max-h-[360px] w-auto object-contain rounded"
                />
              </div>
            </div>

            {/* Structured 3-Part Outcome: What We Checked, What We Found, What To Do Next */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Part 1: What we checked */}
              <div className="vg-card p-5 border border-[#E2E7EF] bg-white">
                <h3 className="text-base font-bold text-[#172033] mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#315EFB]" />
                  <span>What we checked</span>
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-[#586579]">
                  <li className="flex items-start gap-2">
                    <span className="text-[#15803d] font-bold">✓</span>
                    <span>Image sharpness and edge focus</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#15803d] font-bold">✓</span>
                    <span>JPEG compression consistency (16x16 macroblocks)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#15803d] font-bold">✓</span>
                    <span>Electronic screen display patterns (Moiré)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#15803d] font-bold">✓</span>
                    <span>Metadata header tags for known photo-editing software</span>
                  </li>
                  <li className="flex items-start gap-2 text-[#828FA3]">
                    <span>✕</span>
                    <span>Government registry or database lookup (Not checked)</span>
                  </li>
                </ul>
              </div>

              {/* Part 2: What we found */}
              <div className="vg-card p-5 border border-[#E2E7EF] bg-white">
                <h3 className="text-base font-bold text-[#172033] mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#B45309]" />
                  <span>What we found</span>
                </h3>
                <div className="space-y-2.5 text-xs sm:text-sm text-[#586579]">
                  <p>
                    <strong>Sharpness:</strong> {data.qualityCheck.passed ? 'Sufficient for analysis' : 'Blurry or low contrast'}.
                  </p>
                  <p>
                    <strong>Compression:</strong> {data.compressionArtifacts.inconsistencyScore > 0.45 ? 'Unusual regional differences detected' : 'Consistent across the image'}.
                  </p>
                  <p>
                    <strong>Software markers:</strong> {data.metadata.software ? `Tag from ${data.metadata.software} detected` : 'No editing software tags found'}.
                  </p>
                </div>
              </div>

              {/* Part 3: What to do next */}
              <div className="vg-card p-5 border border-[#E2E7EF] bg-white">
                <h3 className="text-base font-bold text-[#172033] mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#15803d]" />
                  <span>What to do next</span>
                </h3>
                <div className="space-y-2 text-xs sm:text-sm text-[#586579] leading-relaxed">
                  <p>
                    {data.verdict === 'Real'
                      ? 'No visual or compression anomalies were detected in the checks that ran. If this document is for critical security purposes, standard verification through the issuing organization is still recommended.'
                      : 'Because potential visual or compression inconsistencies were detected, a manual review by a trained staff member or checking directly with the issuing authority is recommended.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* E. Detailed Evidence Breakdown (Expandable 4-part cards) */}
            <div className="vg-card p-6 border border-[#E2E7EF] bg-white">
              <h3 className="text-base font-bold text-[#172033] mb-1">
                Detailed evidence observations ({data.evidence.length})
              </h3>
              <p className="text-xs text-[#586579] mb-4">
                Click on any finding to expand technical details, how it was checked, and known limitations.
              </p>

              <div className="space-y-3">
                {data.evidence.map((item, idx) => {
                  const isExpanded = expandedEvidenceIdx === idx;
                  const isPass = item.severity === 'pass';
                  const isWarn = item.severity === 'warn';

                  const badgeClass = isPass ? 'vg-status-pass' : isWarn ? 'vg-status-warn' : 'vg-status-fail';
                  const badgeText = isPass ? 'Standard' : isWarn ? 'Notice' : 'Warning';

                  return (
                    <div 
                      key={idx} 
                      className="border border-[#E2E7EF] rounded-lg overflow-hidden transition-colors"
                    >
                      <button
                        onClick={() => setExpandedEvidenceIdx(isExpanded ? null : idx)}
                        className="w-full text-left p-4 bg-white hover:bg-[#F7F8FA] flex items-center justify-between gap-3 cursor-pointer"
                        aria-expanded={isExpanded}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${badgeClass}`}>
                            {badgeText}
                          </span>
                          <span className="text-sm font-semibold text-[#172033]">
                            {item.observation}
                          </span>
                        </div>
                        <span className="text-xs text-[#586579] shrink-0 font-medium">
                          {isExpanded ? 'Hide details ↑' : 'Show details ↓'}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="p-4 bg-[#F7F8FA] border-t border-[#E2E7EF] text-xs sm:text-sm text-[#586579] space-y-3">
                          <div>
                            <span className="font-bold text-[#172033] block mb-0.5">What was observed:</span>
                            <p>{item.explanation}</p>
                          </div>

                          {item.howChecked && (
                            <div>
                              <span className="font-bold text-[#172033] block mb-0.5">How the system checked it:</span>
                              <p>{item.howChecked}</p>
                            </div>
                          )}

                          {item.whyItMatters && (
                            <div>
                              <span className="font-bold text-[#172033] block mb-0.5">Why it might matter:</span>
                              <p>{item.whyItMatters}</p>
                            </div>
                          )}

                          {item.limitations && (
                            <div className="p-2.5 rounded bg-white border border-[#E2E7EF] text-xs text-[#828FA3]">
                              <span className="font-semibold text-[#586579] block mb-0.5">What this check cannot establish:</span>
                              <p>{item.limitations}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Extracted Text Entity Status */}
            <div className="vg-card p-5 border border-[#E2E7EF] bg-white">
              <span className="text-xs font-semibold text-[#586579] uppercase tracking-wider block mb-1">
                TEXT &amp; IDENTITY EXTRACTION STATUS
              </span>
              {Object.keys(data.ocr.fields).length > 0 ? (
                <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm pt-2">
                  {Object.entries(data.ocr.fields).map(([k, v]) => (
                    <div key={k} className="p-2.5 rounded bg-[#F7F8FA] border border-[#E2E7EF]">
                      <span className="text-xs text-[#828FA3] block uppercase">{k}</span>
                      <span className="text-[#172033] font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-[#586579] pt-1">
                  No text extraction or identity field parsing was performed on this document. Voice Guard evaluated image compression, sharpness, and visual characteristics only.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
