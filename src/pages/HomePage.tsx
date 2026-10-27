import React from 'react';
import { ActivePage } from '../components/Navbar';

interface HomePageProps {
  onNavigate: (page: ActivePage) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <main className="flex-1 flex flex-col bg-[#F7F8FA]">
      {/* Hero Section */}
      <section className="pt-16 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[#586579] bg-[#EEF2F6] border border-[#E2E7EF] mb-5">
          <span className="w-2 h-2 rounded-full bg-[#315EFB]" />
          <span>DOCUMENT IMAGE CHECKER</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#172033] mb-6 leading-tight max-w-3xl mx-auto">
          Check a document image for signs of tampering.
        </h1>

        {/* Supporting Copy */}
        <p className="text-base sm:text-lg text-[#586579] max-w-2xl mx-auto mb-8 leading-relaxed">
          Upload an image to examine visual inconsistencies, image quality, and other available signals that may indicate editing. Review the findings and decide whether the document needs further checking.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <button 
            onClick={() => onNavigate('verify')}
            className="vg-btn-primary text-base py-3 px-6 w-full sm:w-auto"
          >
            <span>Check a document</span>
            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
          
          <button 
            onClick={() => onNavigate('how-it-works')}
            className="vg-btn-secondary text-base py-3 px-6 w-full sm:w-auto"
          >
            See how it works
          </button>
        </div>

        {/* Honest Reassuring Note */}
        <p className="text-xs sm:text-sm text-[#828FA3] max-w-xl mx-auto">
          Automated screening can make mistakes. A clean result does not guarantee that a document is genuine.
        </p>
      </section>

      {/* Visual Product Demonstration Preview */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="vg-card p-6 sm:p-8 bg-white border border-[#E2E7EF] shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-[#E2E7EF]">
            <div>
              <span className="text-xs font-semibold text-[#586579] uppercase tracking-wider block mb-1">
                SCREENING WORKSPACE PREVIEW
              </span>
              <h2 className="text-xl font-bold text-[#172033]">
                Clear observations. Plain-English findings.
              </h2>
            </div>
            <button 
              onClick={() => onNavigate('verify')}
              className="text-xs text-[#315EFB] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Try it with a sample file</span>
              <span>→</span>
            </button>
          </div>

          {/* Demonstration Layout Mockup */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6 items-center">
            {/* Left simulated document card */}
            <div className="md:col-span-5 rounded-lg border border-[#E2E7EF] p-4 bg-[#F7F8FA]">
              <div className="flex items-center justify-between text-xs text-[#586579] mb-3 pb-2 border-b border-[#E2E7EF]">
                <span className="font-medium truncate">Document_Sample_Scan.png</span>
                <span className="text-[11px] text-[#15803d] font-semibold bg-[#F0FDF4] px-2 py-0.5 rounded">
                  Loaded
                </span>
              </div>
              <div className="aspect-[4/2.6] rounded bg-[#E2E7EF] flex flex-col items-center justify-center text-center p-4">
                <svg className="w-8 h-8 text-[#828FA3] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-xs font-medium text-[#586579]">Identity Document Image</span>
                <span className="text-[11px] text-[#828FA3]">Screened locally in browser RAM</span>
              </div>
            </div>

            {/* Right sample findings */}
            <div className="md:col-span-7 space-y-3">
              <div className="p-3.5 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#15803d]">Image Quality Check</span>
                  <span className="text-[11px] font-semibold text-[#15803d] bg-white px-2 py-0.5 rounded border border-[#BBF7D0]">Sufficient</span>
                </div>
                <p className="text-xs text-[#586579]">
                  Sharpness measurement is above threshold. Edge transitions are clear enough to evaluate compression patterns.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-[#FDE68A] bg-[#FFFBEB]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#B45309]">Compression Differences</span>
                  <span className="text-[11px] font-semibold text-[#B45309] bg-white px-2 py-0.5 rounded border border-[#FDE68A]">Notice</span>
                </div>
                <p className="text-xs text-[#586579]">
                  Localized recompression differences detected across numeric text boxes. May indicate a secondary digital edit.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-[#E2E7EF] bg-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#172033]">Authority Verification</span>
                  <span className="text-[11px] font-semibold text-[#586579] bg-[#F1F5F9] px-2 py-0.5 rounded">Not Checked</span>
                </div>
                <p className="text-xs text-[#586579]">
                  This tool checks image pixels only. It does not contact government databases to verify that the person exists.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works 4-step sequence */}
      <section className="py-16 bg-white border-y border-[#E2E7EF]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold text-[#586579] uppercase tracking-wider block mb-2">
              SIMPLE 4-STEP PROCESS
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#172033]">
              How it works
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="vg-card p-5 border border-[#E2E7EF] bg-[#F7F8FA]">
              <span className="text-xs font-bold font-mono text-[#315EFB] block mb-2">01 — Upload</span>
              <h3 className="text-base font-bold text-[#172033] mb-2">Choose an image</h3>
              <p className="text-sm text-[#586579] leading-relaxed">
                Choose a document image to examine. The file stays in your browser memory and is not sent to a cloud server.
              </p>
            </div>

            <div className="vg-card p-5 border border-[#E2E7EF] bg-[#F7F8FA]">
              <span className="text-xs font-bold font-mono text-[#315EFB] block mb-2">02 — Inspect</span>
              <h3 className="text-base font-bold text-[#172033] mb-2">Run checks</h3>
              <p className="text-sm text-[#586579] leading-relaxed">
                The system runs the checks supported by this version of the application: blur, compression differences, and metadata.
              </p>
            </div>

            <div className="vg-card p-5 border border-[#E2E7EF] bg-[#F7F8FA]">
              <span className="text-xs font-bold font-mono text-[#315EFB] block mb-2">03 — Review</span>
              <h3 className="text-base font-bold text-[#172033] mb-2">Read findings</h3>
              <p className="text-sm text-[#586579] leading-relaxed">
                See the observations, possible warning signs, and limitations clearly separated without technical jargon.
              </p>
            </div>

            <div className="vg-card p-5 border border-[#E2E7EF] bg-[#F7F8FA]">
              <span className="text-xs font-bold font-mono text-[#315EFB] block mb-2">04 — Decide</span>
              <h3 className="text-base font-bold text-[#172033] mb-2">Take next step</h3>
              <p className="text-sm text-[#586579] leading-relaxed">
                Use the findings as guidance for further review, not as a substitute for official verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What this check can and cannot tell you */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#172033] mb-3">
            What this check can—and cannot—tell you
          </h2>
          <p className="text-sm sm:text-base text-[#586579]">
            We believe in honest technology. Understanding what a screening tool cannot do is just as important as knowing what it can.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Can help */}
          <div className="vg-card p-6 border border-[#BBF7D0] bg-[#F0FDF4]">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-[#15803d] text-white flex items-center justify-center text-xs font-bold">✓</span>
              <h3 className="text-base font-bold text-[#15803d]">This tool can help:</h3>
            </div>
            <ul className="space-y-2.5 text-sm text-[#172033]">
              <li className="flex items-start gap-2">
                <span className="text-[#15803d] font-bold mt-0.5">•</span>
                <span>Identify certain image-quality issues, such as blur or low contrast that might obscure edits.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#15803d] font-bold mt-0.5">•</span>
                <span>Flag compression and frequency patterns that may deserve closer inspection by a human reviewer.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#15803d] font-bold mt-0.5">•</span>
                <span>Detect signatures left by common photo-editing programs (like Photoshop or Canva) in file headers.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#15803d] font-bold mt-0.5">•</span>
                <span>Summarize the checks the system actually performed in a downloadable report.</span>
              </li>
            </ul>
          </div>

          {/* Cannot guarantee */}
          <div className="vg-card p-6 border border-[#E2E7EF] bg-white">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-[#586579] text-white flex items-center justify-center text-xs font-bold">✕</span>
              <h3 className="text-base font-bold text-[#172033]">Cannot automatically guarantee:</h3>
            </div>
            <ul className="space-y-2.5 text-sm text-[#586579]">
              <li className="flex items-start gap-2">
                <span className="text-[#828FA3] font-bold mt-0.5">•</span>
                <span>That the document was issued by a legitimate government or institutional authority.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#828FA3] font-bold mt-0.5">•</span>
                <span>That the written personal information is factually correct.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#828FA3] font-bold mt-0.5">•</span>
                <span>That the document has not been manipulated in ways this software cannot detect.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#828FA3] font-bold mt-0.5">•</span>
                <span>That every warning sign has been detected on unusual or low-quality scans.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <button 
            onClick={() => onNavigate('verify')}
            className="vg-btn-primary text-base py-3 px-6"
          >
            Check a document image now
          </button>
        </div>
      </section>
    </main>
  );
};
