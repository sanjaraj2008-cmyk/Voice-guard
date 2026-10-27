import React from 'react';
import { ActivePage } from '../components/Navbar';

interface HomePageProps {
  onNavigate: (page: ActivePage) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <main className="flex-1 flex flex-col bg-[#F8FAFC]">
      {/* Hero Section */}
      <section className="pt-16 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 mb-6">
          <span className="w-2 h-2 rounded-full bg-[#2463a6]" />
          <span>In-Browser Document Inspection &amp; Anomaly Screening</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
          Inspect the image. <br className="hidden sm:block" />
          <span className="text-[#2463a6]">Understand the evidence.</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
          Voice Guard examines document images for selected image-quality and manipulation indicators entirely inside your browser. Review the findings, see which checks ran, and decide whether further verification is needed.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
          <button 
            onClick={() => onNavigate('verify')}
            className="btn-primary text-sm sm:text-base py-2.5 px-5 w-full sm:w-auto"
          >
            <span>Inspect a Document</span>
            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
          
          <button 
            onClick={() => onNavigate('how-it-works')}
            className="btn-secondary text-sm sm:text-base py-2.5 px-5 w-full sm:w-auto"
          >
            View Technical Architecture
          </button>
        </div>

        {/* Core Principles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-8 border-t border-slate-200">
          <div className="surface-card p-4 rounded-lg">
            <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider block mb-1">
              Zero Server Exposure
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Files are evaluated locally in memory. No document images or extracted data are sent to any remote server.
            </p>
          </div>

          <div className="surface-card p-4 rounded-lg">
            <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider block mb-1">
              Transparent Evidence
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every finding distinguishes what was checked, what was observed, why it matters, and remaining uncertainties.
            </p>
          </div>

          <div className="surface-card p-4 rounded-lg">
            <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider block mb-1">
              Audited Capabilities
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Checks are grounded in measured heuristics (ELA, Laplacian blur, EXIF) and a local 1.03M parameter CNN.
            </p>
          </div>
        </div>
      </section>

      {/* Inspection Process Section */}
      <section className="py-12 bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Implemented Inspection Pipeline
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl">
              Each document undergoes deterministic mathematical screening and neural feature extraction directly in the browser sandbox.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="surface-card p-5 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  CHECK 01
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  Image Quality &amp; Sharpness
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Computes variance of Laplacian across edge transitions. Ensures the image meets minimum resolution and sharpness criteria before evaluating fine manipulation indicators.
              </p>
            </div>

            <div className="surface-card p-5 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  CHECK 02
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  Error Level Analysis (ELA)
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Measures JPEG quantization error across 16x16 pixel macroblocks against a baseline resave. Spliced or digitally modified text typically shows divergent compression deltas.
              </p>
            </div>

            <div className="surface-card p-5 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  CHECK 03
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  In-Browser Neural Classifier
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Executes a 1.03M parameter convolutional neural network in TensorFlow.js on WebGL/WASM. Trained on IMD2020 and AIForge document tampering datasets (66.5% validation accuracy).
              </p>
            </div>

            <div className="surface-card p-5 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  CHECK 04
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  Metadata &amp; Header Signatures
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Parses binary headers for EXIF / JFIF markers to distinguish original camera hardware profiles from signatures left by Photoshop, GIMP, Canva, or other raster editors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Scope and Limitations */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="surface-card p-6 rounded-lg border border-slate-200">
          <h3 className="text-base font-bold text-slate-900 mb-2">
            Scope &amp; Realistic Limitations
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            An anomaly is an indicator for further human review, not absolute proof of fraud. Voice Guard does not replace official government identity registries or physical document security checks.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-900">
              <span className="font-semibold block mb-1">What Voice Guard Detects:</span>
              <ul className="list-disc list-inside space-y-1 text-emerald-800">
                <li>JPEG recompression discontinuities across edited text</li>
                <li>Moiré frequency peaks from photographing computer screens</li>
                <li>Editing software metadata tags (Photoshop, Canva, GIMP)</li>
                <li>Convolutional texture anomalies learned from tamper datasets</li>
              </ul>
            </div>

            <div className="p-3 rounded bg-slate-100 border border-slate-200 text-slate-800">
              <span className="font-semibold block mb-1">What It Does Not Determine:</span>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                <li>Whether an identity number was legitimately registered</li>
                <li>Physical watermark or UV ink security features</li>
                <li>Flawless vector counterfeits printed on genuine cardstock</li>
                <li>Legal validity of scanned government records</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
