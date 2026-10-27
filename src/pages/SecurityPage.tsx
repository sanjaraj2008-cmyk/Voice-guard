import React from 'react';
import { ActivePage } from '../components/Navbar';

interface SecurityPageProps {
  onNavigate: (page: ActivePage) => void;
}

export const SecurityPage: React.FC<SecurityPageProps> = ({ onNavigate }) => {
  return (
    <main className="min-h-screen pb-16 bg-[#F7F8FA]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Header */}
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[#586579] bg-[#EEF2F6] border border-[#E2E7EF] mb-3">
            <span>PRIVACY &amp; SECURITY</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#172033] mb-3">
            Your Documents Stay Private
          </h1>
          <p className="text-base text-[#586579] leading-relaxed">
            A clear explanation of how DocuGuard handles your data, where analysis occurs, and what happens when you close the page.
          </p>
        </div>

        {/* 3 Core Privacy Commitments */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="vg-card p-6 bg-white border border-[#E2E7EF] shadow-sm">
            <h3 className="text-base font-bold text-[#172033] mb-2">
              Analyzed on your device
            </h3>
            <p className="text-sm text-[#586579] leading-relaxed">
              When you select an image, it is read directly into your web browser's temporary memory. It is not uploaded to any remote server or cloud vision service.
            </p>
          </div>

          <div className="vg-card p-6 bg-white border border-[#E2E7EF] shadow-sm">
            <h3 className="text-base font-bold text-[#172033] mb-2">
              Zero cloud transmission
            </h3>
            <p className="text-sm text-[#586579] leading-relaxed">
              Pixel checks (Error Level Analysis, blur calculation) and neural network classification run locally using your device's graphics processor (WebGL).
            </p>
          </div>

          <div className="vg-card p-6 bg-white border border-[#E2E7EF] shadow-sm">
            <h3 className="text-base font-bold text-[#172033] mb-2">
              Discarded upon exit
            </h3>
            <p className="text-sm text-[#586579] leading-relaxed">
              We do not save your document images or extracted information in permanent databases or tracking cookies. When you refresh or close the tab, the image is cleared.
            </p>
          </div>
        </div>

        {/* Detailed Data Handling Table */}
        <div className="vg-card p-6 sm:p-8 bg-white border border-[#E2E7EF] mb-8 shadow-sm">
          <h2 className="text-lg font-bold text-[#172033] mb-4">
            How Data Moves Through DocuGuard
          </h2>

          <div className="overflow-x-auto text-xs sm:text-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E7EF] text-[#586579]">
                  <th className="py-2.5 pr-4 font-semibold">Stage</th>
                  <th className="py-2.5 pr-4 font-semibold">Data Handled</th>
                  <th className="py-2.5 pr-4 font-semibold">Location</th>
                  <th className="py-2.5 font-semibold">Network Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E7EF] text-xs">
                <tr>
                  <td className="py-3 pr-4 text-[#172033] font-semibold">Selecting a file</td>
                  <td className="py-3 pr-4 text-[#586579]">Image file (JPG/PNG)</td>
                  <td className="py-3 pr-4 text-[#586579]">Browser RAM</td>
                  <td className="py-3 text-[#15803d] font-semibold">0 bytes uploaded</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-[#172033] font-semibold">Loading model weights</td>
                  <td className="py-3 pr-4 text-[#586579]">Static model file (4.13 MB)</td>
                  <td className="py-3 pr-4 text-[#586579]">Browser cache</td>
                  <td className="py-3 text-[#586579]">Standard static file download (once)</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-[#172033] font-semibold">Running image checks</td>
                  <td className="py-3 pr-4 text-[#586579]">Decoded canvas pixels</td>
                  <td className="py-3 pr-4 text-[#586579]">Device memory &amp; WebGL</td>
                  <td className="py-3 text-[#15803d] font-semibold">0 bytes uploaded</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-[#172033] font-semibold">Downloading report</td>
                  <td className="py-3 pr-4 text-[#586579]">PDF document</td>
                  <td className="py-3 pr-4 text-[#586579]">Generated locally</td>
                  <td className="py-3 text-[#15803d] font-semibold">0 bytes uploaded</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Scope and Limitations */}
        <div className="vg-card p-6 sm:p-8 bg-white border border-[#E2E7EF] shadow-sm">
          <h2 className="text-lg font-bold text-[#172033] mb-2">
            Scope &amp; Practical Boundaries
          </h2>
          <p className="text-sm text-[#586579] leading-relaxed mb-4">
            DocuGuard is designed as an accessible first-line screening tool for digital tampering:
          </p>

          <ul className="space-y-2 text-sm text-[#586579] list-disc list-inside">
            <li>It does not connect to government identity systems or verify legal citizenship records.</li>
            <li>It cannot detect physical document forgery when a paper document is physically altered before high-resolution scanning.</li>
            <li>Always treat automated results as supporting observations to guide responsible human review.</li>
          </ul>
        </div>
      </div>
    </main>
  );
};
