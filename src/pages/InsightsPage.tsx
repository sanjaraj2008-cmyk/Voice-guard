import React from 'react';
import { ActivePage } from '../components/Navbar';

interface InsightsPageProps {
  onNavigate: (page: ActivePage) => void;
}

export const InsightsPage: React.FC<InsightsPageProps> = ({ onNavigate }) => {
  return (
    <main className="min-h-screen pb-16 bg-[#F7F8FA]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Page Header */}
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[#586579] bg-[#EEF2F6] border border-[#E2E7EF] mb-3">
            <span>MODEL BENCHMARK REPORT</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#172033] mb-3">
            Testing &amp; Accuracy Report
          </h1>
          <p className="text-base text-[#586579] leading-relaxed">
            Honest test results, dataset details, and evaluation metrics for the in-browser neural network.
          </p>
        </div>

        {/* 4 Summary Numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="vg-card p-4 sm:p-5 bg-white border border-[#E2E7EF] shadow-sm">
            <span className="text-xs text-[#586579] block mb-1">Testing Images</span>
            <span className="text-2xl font-bold text-[#172033] font-mono block">2,374</span>
            <span className="text-xs text-[#828FA3]">IMD2020 &amp; AIForge</span>
          </div>

          <div className="vg-card p-4 sm:p-5 bg-white border border-[#E2E7EF] shadow-sm">
            <span className="text-xs text-[#586579] block mb-1">Validation Accuracy</span>
            <span className="text-2xl font-bold text-[#315EFB] font-mono block">66.45%</span>
            <span className="text-xs text-[#828FA3]">Best of 15 epochs</span>
          </div>

          <div className="vg-card p-4 sm:p-5 bg-white border border-[#E2E7EF] shadow-sm">
            <span className="text-xs text-[#586579] block mb-1">Model Size</span>
            <span className="text-2xl font-bold text-[#172033] font-mono block">4.13 MB</span>
            <span className="text-xs text-[#828FA3]">1.03M parameters</span>
          </div>

          <div className="vg-card p-4 sm:p-5 bg-white border border-[#E2E7EF] shadow-sm">
            <span className="text-xs text-[#586579] block mb-1">Test Protocol</span>
            <span className="text-2xl font-bold text-[#15803d] font-mono block">Isolated</span>
            <span className="text-xs text-[#828FA3]">Separate validation set</span>
          </div>
        </div>

        {/* Dataset Breakdown */}
        <div className="vg-card p-6 sm:p-8 bg-white border border-[#E2E7EF] mb-8 shadow-sm">
          <h2 className="text-lg font-bold text-[#172033] mb-2">
            Dataset Composition
          </h2>
          <p className="text-sm text-[#586579] leading-relaxed mb-4">
            The neural network was trained on an 80/20 train/validation split across academic document tampering datasets:
          </p>

          <div className="overflow-x-auto text-xs sm:text-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E7EF] text-[#586579]">
                  <th className="py-2.5 pr-4 font-semibold">Category</th>
                  <th className="py-2.5 pr-4 font-semibold">Source</th>
                  <th className="py-2.5 pr-4 font-semibold">Training Images</th>
                  <th className="py-2.5 pr-4 font-semibold">Validation Images</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E7EF] text-xs">
                <tr>
                  <td className="py-2.5 pr-4 text-[#172033] font-semibold">Authentic / Pristine</td>
                  <td className="py-2.5 pr-4 text-[#586579]">IMD2020 Unaltered Scans</td>
                  <td className="py-2.5 pr-4 text-[#586579]">640</td>
                  <td className="py-2.5 pr-4 text-[#586579]">154</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 text-[#172033] font-semibold">Recompressed / Edited</td>
                  <td className="py-2.5 pr-4 text-[#586579]">AIForge-Doc-v1 Requantized</td>
                  <td className="py-2.5 pr-4 text-[#586579]">612</td>
                  <td className="py-2.5 pr-4 text-[#586579]">148</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 text-[#172033] font-semibold">Spliced / Altered</td>
                  <td className="py-2.5 pr-4 text-[#586579]">IMD2020 Forged + AIForge Manipulated</td>
                  <td className="py-2.5 pr-4 text-[#586579]">660</td>
                  <td className="py-2.5 pr-4 text-[#586579]">160</td>
                </tr>
                <tr className="font-bold text-[#172033]">
                  <td className="py-2.5 pr-4">Total Curated Dataset</td>
                  <td className="py-2.5 pr-4">2,374 Images</td>
                  <td className="py-2.5 pr-4">1,912</td>
                  <td className="py-2.5 pr-4">462</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Known Failure Modes */}
        <div className="vg-card p-6 sm:p-8 bg-white border border-[#E2E7EF] shadow-sm">
          <h2 className="text-lg font-bold text-[#172033] mb-2">
            Known Limitations &amp; Edge Cases
          </h2>
          <ul className="space-y-2.5 text-sm text-[#586579] list-disc list-inside leading-relaxed">
            <li>
              <strong>Heavy compression via messaging apps:</strong> Images sent through WhatsApp or Telegram are re-compressed at ~50% quality, which can smooth away localized Error Level Analysis signals.
            </li>
            <li>
              <strong>Desk lamp reflections on glossy cards:</strong> Harsh glare can cause edge contrast spikes that resemble digital boundary steps.
            </li>
            <li>
              <strong>Unfamiliar document templates:</strong> Formats with intricate guilloché patterns that were not in the training set may yield inconclusive risk scores (40–60%).
            </li>
          </ul>

          <div className="mt-6 pt-4 border-t border-[#E2E7EF]">
            <button 
              onClick={() => onNavigate('verify')}
              className="vg-btn-primary text-sm py-2 px-5"
            >
              Check an image
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
