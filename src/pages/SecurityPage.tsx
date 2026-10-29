import React from 'react';
import { ActivePage } from '../components/Navbar';

interface SecurityPageProps {
  onNavigate: (page: ActivePage) => void;
}

export const SecurityPage: React.FC<SecurityPageProps> = ({ onNavigate }) => {
  return (
    <main className="min-h-screen pb-24 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        {/* Header */}
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>PRIVACY &amp; SECURITY</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
            Your Documents Stay Private
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            A clear explanation of how DocuGuard handles your data, where analysis occurs, and what happens when you close the page.
          </p>
        </div>

        {/* 3 Core Privacy Commitments */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="p-6 rounded-2xl bg-[#121624] border border-slate-800">
            <h3 className="text-base font-bold text-white mb-2">
              Analyzed on your device
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              When you select an image or PDF, it is decoded directly in your web browser&apos;s temporary memory. Core pixel forensics and Tesseract WASM OCR run locally.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#121624] border border-slate-800">
            <h3 className="text-base font-bold text-white mb-2">
              Cryptographic Hash Memory
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              When you record analyst feedback, only the non-reversible 64-character SHA-256 digest and policy weights are stored in local browser storage.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#121624] border border-slate-800">
            <h3 className="text-base font-bold text-white mb-2">
              Discarded upon exit
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              We do not save your document images or extracted PII in permanent databases or tracking cookies. When you refresh or close the tab, the image buffer is cleared.
            </p>
          </div>
        </div>

        {/* Detailed Data Handling Table */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#121624] border border-slate-800 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">
            How Data Moves Through DocuGuard
          </h2>

          <div className="overflow-x-auto text-xs sm:text-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 pr-4 font-semibold">Stage</th>
                  <th className="py-2.5 pr-4 font-semibold">Data Handled</th>
                  <th className="py-2.5 pr-4 font-semibold">Location</th>
                  <th className="py-2.5 font-semibold">Persistence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                <tr>
                  <td className="py-3 pr-4 text-white font-semibold">Selecting a file</td>
                  <td className="py-3 pr-4 text-slate-400">Image or PDF (JPG/PNG/PDF)</td>
                  <td className="py-3 pr-4 text-slate-400">Browser RAM</td>
                  <td className="py-3 text-emerald-400 font-semibold">Ephemeral Blob URL</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-white font-semibold">Loading model weights</td>
                  <td className="py-3 pr-4 text-slate-400">Static CNN weights (4.13 MB)</td>
                  <td className="py-3 pr-4 text-slate-400">Browser cache</td>
                  <td className="py-3 text-slate-300">Cached locally for offline reuse</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-white font-semibold">Running image &amp; RL checks</td>
                  <td className="py-3 pr-4 text-slate-400">Decoded canvas pixels &amp; 7-D features</td>
                  <td className="py-3 pr-4 text-slate-400">Device memory &amp; WebGL</td>
                  <td className="py-3 text-emerald-400 font-semibold">Cleared after session</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-white font-semibold">Downloading report</td>
                  <td className="py-3 pr-4 text-slate-400">PDF dossier</td>
                  <td className="py-3 pr-4 text-slate-400">Generated in browser</td>
                  <td className="py-3 text-emerald-400 font-semibold">Saved directly to device</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Scope and Limitations */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#121624] border border-slate-800">
          <h2 className="text-lg font-bold text-white mb-2">
            Scope &amp; Practical Boundaries
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            DocuGuard is designed as an accessible first-line screening tool for digital tampering:
          </p>

          <ul className="space-y-2 text-sm text-slate-300 list-disc list-inside">
            <li>It does not connect to government identity databases or verify legal citizenship records.</li>
            <li>It cannot detect physical document forgery when a paper document is physically altered before high-resolution scanning.</li>
            <li>Always treat automated results as supporting observations to guide responsible human review.</li>
          </ul>
        </div>
      </div>
    </main>
  );
};
