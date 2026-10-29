import React, { useState, useEffect } from 'react';
import { ActivePage } from '../components/Navbar';

interface HomePageProps {
  onNavigate: (page: ActivePage) => void;
}

const ROTATING_HEADLINE_PHRASES = [
  'with confidence and privacy.',
  'with zero cloud exposure.',
  'with instant pixel forensics.',
  'with neural OCR precision.'
];

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [phraseIndex, setPhraseIndex] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % ROTATING_HEADLINE_PHRASES.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="relative overflow-hidden flex-1 flex flex-col text-slate-100">
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center w-full">
        {/* Clean Kicker */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>On-device identity forensics · Zero cloud exposure</span>
        </div>

        {/* Hero Title with Smooth Vertical Scroll-Up Carousel */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-[1.15]">
          <span className="block">Verify identity documents</span>
          <span className="relative inline-flex justify-center overflow-hidden h-[1.22em] w-full align-bottom mt-1">
            <span
              className="flex flex-col transition-transform duration-700 ease-in-out w-full"
              style={{ transform: `translateY(-${phraseIndex * 25}%)` }}
            >
              {ROTATING_HEADLINE_PHRASES.map((phrase) => (
                <span
                  key={phrase}
                  className="h-[1.22em] flex items-center justify-center text-indigo-400 font-extrabold whitespace-nowrap"
                >
                  {phrase}
                </span>
              ))}
            </span>
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg max-w-2xl mx-auto mb-10 text-slate-400 leading-relaxed font-normal">
          DocuGuard inspects ID cards and passports for digital tampering, photo splicing, and screen captures. Every check runs locally in your browser — no files are ever sent to an external server.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button 
            onClick={() => onNavigate('verify')}
            className="btn-primary text-sm py-3 px-6 cursor-pointer"
          >
            <span>Verify a Document</span>
            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
          
          <button 
            onClick={() => onNavigate('how-it-works')}
            className="btn-secondary text-sm py-3 px-6 cursor-pointer"
          >
            Learn How It Works
          </button>
        </div>

        {/* Trust Metrics */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-slate-800/80 max-w-2xl mx-auto text-center">
          <div>
            <div className="text-2xl font-bold text-white">0 Bytes</div>
            <div className="text-xs text-slate-400 mt-1">Uploaded to any server</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-400">&lt; 1 Second</div>
            <div className="text-xs text-slate-400 mt-1">Local edge verification</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">100% Private</div>
            <div className="text-xs text-slate-400 mt-1">Evaluated on your hardware</div>
          </div>
        </div>
      </section>

      {/* Human-Centered Workflow Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 block mb-2">
            Verification Process
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
            How Document Inspection Works
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            A transparent, explainable pipeline designed to give compliance officers and analysts clear findings, not black-box guesswork.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              num: '1',
              title: 'Local Ingestion',
              desc: 'Select any ID card, passport scan, or photo. The image is loaded directly into browser memory.'
            },
            {
              num: '2',
              title: 'Text & Checksum Validation',
              desc: 'On-device OCR extracts identity numbers, names, and dates, verifying official government checksums.'
            },
            {
              num: '3',
              title: 'Print & Screen Inspection',
              desc: 'Mathematical texture analysis detects LCD/OLED screen pixels and screen re-photography moiré.'
            },
            {
              num: '4',
              title: 'Compression & Splicing',
              desc: 'Macroblock analysis catches copy-pasted photo boundaries and localized JPEG compression differences.'
            },
            {
              num: '5',
              title: 'Analyst Feedback & Memory',
              desc: 'Your ground-truth decisions are remembered via SHA-256 hashes, recognizing repeated documents instantly.'
            },
            {
              num: '6',
              title: 'Certified Audit Dossier',
              desc: 'Download a clean, verifiable PDF report with complete evidence breakdowns for compliance records.'
            }
          ].map((item) => (
            <div 
              key={item.num}
              className="p-6 rounded-2xl bg-[#121624] border border-slate-800 hover:border-slate-700 transition-all text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 font-bold text-xs flex items-center justify-center mb-4">
                {item.num}
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Core Verification Capabilities */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 block mb-2">
            Forensic Signals
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
            Multiple Independent Checks
          </h2>
          <p className="text-slate-400 text-sm">
            Forgers can fake a single detail, but they cannot fake physical coherence across every layer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-7 rounded-2xl bg-[#121624] border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white mb-2">Document Structure &amp; OCR</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Validates 12-digit Aadhaar Verhoeff checksums, 10-character PAN syntax, and international passport MRZ formats against official layout standards.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-[#121624] border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white mb-2">Texture &amp; Print Raster</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Differentiates physical matte and laminated card surfaces from digital screens. Catches periodic sub-pixel moiré grids instantly.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-[#121624] border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white mb-2">Adaptive Analyst Memory</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              When an analyst confirms a document as genuine or altered, the file hash is stored locally. Re-uploaded documents are recognized immediately.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center w-full">
        <div className="p-10 sm:p-12 rounded-3xl bg-[#121624] border border-slate-800 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Inspect your first document
          </h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-8 font-normal leading-relaxed">
            No signup or API keys required. Everything evaluates privately on your device.
          </p>
          <button 
            onClick={() => onNavigate('verify')}
            className="btn-primary text-sm py-3 px-6 cursor-pointer"
          >
            <span>Open Verification Desk</span>
            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </section>
    </main>
  );
};
