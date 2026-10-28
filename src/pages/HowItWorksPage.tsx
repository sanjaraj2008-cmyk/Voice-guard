import React from 'react';
import { ActivePage } from '../components/Navbar';

interface HowItWorksPageProps {
  onNavigate: (page: ActivePage) => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onNavigate }) => {
  return (
    <main className="min-h-screen pb-24 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 block mb-2">
            Verification Methodology
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
            How DocuGuard Evaluates Documents
          </h1>
          <p className="text-base text-slate-400 font-normal leading-relaxed">
            Every analysis runs locally in your browser sandbox. Here is the step-by-step process that turns an image into an actionable verification finding.
          </p>
        </div>

        {/* 3 Human-Crafted Stages */}
        <div className="space-y-10">
          
          {/* Stage 1 */}
          <div className="p-8 rounded-2xl bg-[#121624] border border-slate-800">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-2.5 py-0.5 rounded">
                Step 01
              </span>
              <span className="text-xs font-medium text-slate-400">
                Text Extraction &amp; Government Checksums
              </span>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              Optical Character Recognition &amp; Syntax Verification
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-6 font-normal">
              When a document is selected, the browser decodes it in client memory. Local Tesseract.js neural OCR extracts names, dates of birth, and identity numbers. The system verifies these values against standard algorithmic rules — including the Verhoeff Dihedral checksum for Indian Aadhaar and PAN entity syntax.
            </p>

            <div className="p-4 rounded-xl bg-[#0b0e14] border border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Parsed Identity Fields:
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  'Full Name & Title',
                  'Document Identification Number',
                  'Date of Birth & Age Plausibility',
                  'Issuing Authority Format',
                  'Algorithmic Checksum (Verhoeff / PAN)'
                ].map((item) => (
                  <span key={item} className="px-2.5 py-1 rounded-md bg-indigo-950/40 text-indigo-200 border border-indigo-500/30">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Stage 2 */}
          <div className="p-8 rounded-2xl bg-[#121624] border border-slate-800">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-2.5 py-0.5 rounded">
                Step 02
              </span>
              <span className="text-xs font-medium text-slate-400">
                Physical Print &amp; Compression Forensics
              </span>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              Substrate Texture &amp; Image Splice Detection
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-6 font-normal">
              Forgers often photograph computer screens or edit digital photos. The inspection engine checks physical image characteristics to detect unnatural interference.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-[#0b0e14] border border-slate-800/80">
                <span className="text-indigo-300 font-semibold block mb-1">Moiré &amp; Screen Analysis</span>
                <span className="text-slate-400 leading-relaxed">
                  Identifies sub-pixel interference grids caused when a camera takes a photo of an electronic LCD or OLED monitor.
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[#0b0e14] border border-slate-800/80">
                <span className="text-indigo-300 font-semibold block mb-1">JPEG Quantization Continuity</span>
                <span className="text-slate-400 leading-relaxed">
                  Error Level Analysis looks for localized differences in compression tables where names, dates, or portraits were pasted.
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[#0b0e14] border border-slate-800/80">
                <span className="text-indigo-300 font-semibold block mb-1">EXIF &amp; Binary Tags</span>
                <span className="text-slate-400 leading-relaxed">
                  Scans image segments for digital editing signatures from desktop photo editing suites like Adobe Photoshop or GIMP.
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[#0b0e14] border border-slate-800/80">
                <span className="text-indigo-300 font-semibold block mb-1">Boundary Step Gradient</span>
                <span className="text-slate-400 leading-relaxed">
                  Measures edge sharpness around the portrait photo frame to verify smooth optical focus instead of harsh digital cutouts.
                </span>
              </div>
            </div>
          </div>

          {/* Stage 3 */}
          <div className="p-8 rounded-2xl bg-[#121624] border border-slate-800">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded">
                Step 03
              </span>
              <span className="text-xs font-medium text-slate-400">
                Analyst Learning &amp; Document Memory
              </span>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              Continuous Learning &amp; Instant Document Memory
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-6 font-normal">
              When an analyst confirms a document as genuine or altered, the system registers its SHA-256 fingerprint into local memory. If the exact same document is ever uploaded again, the verified analyst decision is recognized immediately with full confidence.
            </p>

            <div className="p-5 rounded-xl bg-[#0b0e14] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-white text-sm font-semibold block">
                  Experience Document Verification
                </span>
                <span className="text-xs text-slate-400">
                  Try inspecting a sample document or upload your own file.
                </span>
              </div>

              <button
                onClick={() => onNavigate('verify')}
                className="btn-primary text-xs py-2 px-4 cursor-pointer shrink-0"
              >
                Inspect a Document
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
