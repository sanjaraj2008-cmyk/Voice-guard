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
  const [currentStage, setCurrentStage] = useState<{ index: number; name: string }>({ index: 1, name: '01. INGESTION' });
  const [activeViewMode, setActiveViewMode] = useState<'standard' | 'evidence'>('standard');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = async (file: File) => {
    setErrorMessage(null);

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage(`Unsupported format (${file.type || 'unknown'}). Please provide a JPG, PNG, or WebP image.`);
      return;
    }

    // Validate size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMessage(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 10 MB limit.`);
      return;
    }

    setIsDemoMode(false);
    setIsProcessing(true);
    setCurrentStage({ index: 1, name: '01. INGESTION & DECODING' });

    try {
      const result = await runEdgeVerificationPipeline(file, file.name, (idx, stageName) => {
        setCurrentStage({ index: idx, name: stageName });
      });
      setData(result);
    } catch (err: any) {
      console.error('Inspection error:', err);
      setErrorMessage(err.message || 'An error occurred during local image processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
    // reset input so same file can be reselected
    if (e.target) e.target.value = '';
  };

  const handleLoadPreset = (presetId: string) => {
    setErrorMessage(null);
    const preset = SAMPLE_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setIsDemoMode(true);
    setIsProcessing(true);
    setCurrentStage({ index: 1, name: '01. LOADING DEMO PRESET' });

    const dataUrl = preset.generateImage();
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => {
        return runEdgeVerificationPipeline(blob, preset.documentName, (idx, stageName) => {
          setCurrentStage({ index: idx, name: stageName });
        });
      })
      .then(result => {
        // For demo presets, retain the preset illustrative text/fields
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
      .catch(err => {
        setErrorMessage('Failed to load demo document preset.');
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
    <main className="min-h-screen pb-16 bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Document Inspection Workspace
              </h1>
              <p className="text-sm text-slate-600">
                Client-side analysis of image quality, compression anomalies, and neural tamper indicators.
              </p>
            </div>
            {data && (
              <button
                onClick={() => {
                  setData(null);
                  setIsDemoMode(false);
                  setErrorMessage(null);
                }}
                className="btn-secondary text-xs self-start sm:self-auto"
              >
                Inspect Another File
              </button>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <span className="text-sm font-semibold block">Inspection Error</span>
                <span className="text-xs">{errorMessage}</span>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-red-600 hover:text-red-900 font-medium cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Demo Mode Notice */}
        {isDemoMode && data && (
          <div className="mb-6 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
            <span>
              <strong>Demo Sample Document:</strong> You are currently viewing an illustrative synthetic sample preset.
            </span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="underline text-amber-900 font-medium ml-3 cursor-pointer"
            >
              Upload real image instead
            </button>
          </div>
        )}

        {/* Upload Dropzone (When no document is loaded) */}
        {!data && !isProcessing && (
          <div className="space-y-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) validateAndProcessFile(file);
              }}
              className="surface-card p-10 rounded-xl text-center border-2 border-dashed border-slate-300 hover:border-[#2463a6] transition-colors cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-[#2463a6] flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>

              <h2 className="text-base font-semibold text-slate-900 mb-1">
                Drop document image here or click to select
              </h2>
              <p className="text-xs text-slate-500 mb-3">
                Supported formats: JPG, PNG, or WebP (up to 10 MB).
              </p>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                All checks execute 100% locally in your browser memory. No image bytes are transmitted to any server.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Presets Row */}
            <div className="surface-card p-4 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-700 block mb-2">
                Or test with sample documents (Illustrative Presets):
              </span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleLoadPreset(preset.id)}
                    className="btn-secondary text-xs py-1.5 px-3"
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

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="surface-card p-12 rounded-xl text-center border border-slate-200">
            <div className="w-10 h-10 border-3 border-blue-200 border-t-[#2463a6] rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              Analyzing Document Locally
            </h3>
            <p className="text-xs font-mono text-slate-500">
              {currentStage.name}
            </p>
          </div>
        )}

        {/* Inspection Results Grid: Document Centered */}
        {data && !isProcessing && verdict && (
          <div className="space-y-6">
            {/* Top Verdict Banner */}
            <div 
              className="p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4"
              style={{
                backgroundColor: verdict.bg,
                borderColor: verdict.border
              }}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span 
                    className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: verdict.hex,
                      color: '#ffffff'
                    }}
                  >
                    {verdict.badge}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    ID: {data.documentId}
                  </span>
                </div>
                <h2 
                  className="text-lg font-bold"
                  style={{ color: verdict.hex }}
                >
                  {verdict.label}
                </h2>
                <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
                  {verdict.sub}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">
                    Integrity Index
                  </span>
                  <span 
                    className="text-2xl font-bold font-mono"
                    style={{ color: verdict.hex }}
                  >
                    {data.score}
                    <span className="text-xs text-slate-400 font-normal"> / 100</span>
                  </span>
                </div>

                <button
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="btn-secondary text-xs py-2 px-3 shrink-0"
                >
                  {isDownloadingPdf ? 'Generating...' : 'Export Report (PDF)'}
                </button>
              </div>
            </div>

            {/* Document Image & Evidence Side-by-Side */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Document Image Preview (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="surface-card rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <span className="text-xs font-semibold text-slate-700 truncate max-w-[200px]">
                      {data.fileName}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Image Preview
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900 flex items-center justify-center min-h-[300px] max-h-[460px] overflow-hidden">
                    <img 
                      src={data.imageBlobUrl} 
                      alt="Uploaded Document Preview"
                      className="max-h-[440px] w-auto object-contain rounded"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-600 grid grid-cols-2 gap-2 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block">EXIF SOFTWARE</span>
                      <span className="font-medium text-slate-800 truncate block">
                        {data.metadata.software || (data.metadata.exifPresent ? 'Camera Profile' : 'Not detected')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">SHARPNESS</span>
                      <span className="font-medium text-slate-800">
                        {data.qualityCheck.passed ? 'Sufficient' : 'Low / Blurry'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Verified vs Not Verified Summary */}
                <div className="surface-card p-4 rounded-xl border border-slate-200 text-xs">
                  <span className="font-semibold text-slate-900 block mb-2">
                    Scope of this Inspection
                  </span>
                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex items-center gap-1.5 text-emerald-700">
                      <span>✓</span>
                      <span>Evaluated 16x16 macroblock ELA compression deltas</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700">
                      <span>✓</span>
                      <span>Screened for periodic Moiré display frequencies</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700">
                      <span>✓</span>
                      <span>In-browser CNN inference executed on WebGL backend</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span>✕</span>
                      <span>Government registry or database lookup: Not checked</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span>✕</span>
                      <span>QR cryptographic signature: Not verified</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Evidence Findings (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="surface-card rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Document Inspection Findings ({data.evidence.length})
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Individual heuristic and model checks with observed measurements.
                      </p>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {data.evidence.map((item, idx) => {
                      const pillClass = item.severity === 'pass' 
                        ? 'status-pill-pass' 
                        : item.severity === 'warn' 
                        ? 'status-pill-warn' 
                        : 'status-pill-fail';

                      const pillLabel = item.severity === 'pass'
                        ? 'Pass'
                        : item.severity === 'warn'
                        ? 'Notice'
                        : 'Anomaly';

                      return (
                        <div key={idx} className="p-4 hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-start justify-between gap-3 mb-1.5">
                            <h4 className="text-sm font-semibold text-slate-900">
                              {item.observation}
                            </h4>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${pillClass}`}>
                              {pillLabel}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed">
                            {item.explanation}
                          </p>

                          <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-400 font-mono">
                            <span>Category: {item.category}</span>
                            <span>Confidence: {(item.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Extracted Identity Fields Section (Transparently labelled) */}
                <div className="surface-card p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Identity Entity Extraction
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {Object.keys(data.ocr.fields).length > 0 ? 'Extracted Data' : 'Not Active'}
                    </span>
                  </div>

                  {Object.keys(data.ocr.fields).length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      {Object.entries(data.ocr.fields).map(([k, v]) => (
                        <div key={k} className="p-2 rounded bg-slate-50 border border-slate-100">
                          <span className="text-[10px] text-slate-400 block uppercase">{k}</span>
                          <span className="text-slate-800 font-medium truncate block">{v}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded bg-slate-50 border border-slate-100 text-xs text-slate-500">
                      No text extraction or OCR engine was executed on this document. Voice Guard evaluated visual compression and structural characteristics only.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
