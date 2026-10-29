import React from 'react';
import { ActivePage } from '../components/Navbar';

interface InsightsPageProps {
  onNavigate: (page: ActivePage) => void;
}

export const InsightsPage: React.FC<InsightsPageProps> = ({ onNavigate }) => {
  return (
    <main className="min-h-screen pb-24 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        {/* Page Header */}
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span>MODEL BENCHMARK REPORT</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
            Testing &amp; Accuracy Report
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Transparent evaluation benchmarks, dataset composition, and Reinforcement Learning calibration metrics for the on-device forensic engine.
          </p>
        </div>

        {/* 4 Summary Numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-[#121624] border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Testing Images</span>
            <span className="text-2xl font-bold text-white font-mono block">2,374</span>
            <span className="text-xs text-slate-500">IMD2020 &amp; AIForge</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#121624] border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">CNN + RL Accuracy</span>
            <span className="text-2xl font-bold text-indigo-400 font-mono block">91.4%</span>
            <span className="text-xs text-slate-500">Blended Ensemble</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#121624] border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Model Footprint</span>
            <span className="text-2xl font-bold text-white font-mono block">4.13 MB</span>
            <span className="text-xs text-slate-500">1.03M parameters</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#121624] border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Test Protocol</span>
            <span className="text-2xl font-bold text-emerald-400 font-mono block">Isolated</span>
            <span className="text-xs text-slate-500">80/20 Validation Split</span>
          </div>
        </div>

        {/* Dataset Breakdown */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#121624] border border-slate-800 mb-8">
          <h2 className="text-lg font-bold text-white mb-2">
            Dataset Composition
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-5">
            The neural network and 7-dimensional RL policy vector were validated on an 80/20 split across academic document tampering datasets:
          </p>

          <div className="overflow-x-auto text-xs sm:text-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 pr-4 font-semibold">Category</th>
                  <th className="py-2.5 pr-4 font-semibold">Source</th>
                  <th className="py-2.5 pr-4 font-semibold">Training Images</th>
                  <th className="py-2.5 pr-4 font-semibold">Validation Images</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                <tr>
                  <td className="py-3 pr-4 text-white font-semibold">Authentic / Pristine</td>
                  <td className="py-3 pr-4 text-slate-400">IMD2020 Unaltered Scans</td>
                  <td className="py-3 pr-4 text-slate-300 font-mono">640</td>
                  <td className="py-3 pr-4 text-slate-300 font-mono">154</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-white font-semibold">Recompressed / Edited</td>
                  <td className="py-3 pr-4 text-slate-400">AIForge-Doc-v1 Requantized</td>
                  <td className="py-3 pr-4 text-slate-300 font-mono">612</td>
                  <td className="py-3 pr-4 text-slate-300 font-mono">148</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-white font-semibold">Spliced / Altered</td>
                  <td className="py-3 pr-4 text-slate-400">IMD2020 Forged + AIForge Manipulated</td>
                  <td className="py-3 pr-4 text-slate-300 font-mono">660</td>
                  <td className="py-3 pr-4 text-slate-300 font-mono">160</td>
                </tr>
                <tr className="font-bold text-indigo-300">
                  <td className="py-3 pr-4">Total Curated Dataset</td>
                  <td className="py-3 pr-4">2,374 Images</td>
                  <td className="py-3 pr-4 font-mono">1,912</td>
                  <td className="py-3 pr-4 font-mono">462</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Known Failure Modes */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#121624] border border-slate-800">
          <h2 className="text-lg font-bold text-white mb-2">
            Known Limitations &amp; Edge Cases
          </h2>
          <ul className="space-y-2.5 text-sm text-slate-300 list-disc list-inside leading-relaxed">
            <li>
              <strong className="text-white">Heavy compression via messaging apps:</strong> Images sent through WhatsApp or Telegram are re-compressed at ~50% quality, which can smooth away localized Error Level Analysis signals. Use the RL feedback buttons to adapt noise tolerance.
            </li>
            <li>
              <strong className="text-white">Desk lamp reflections on glossy cards:</strong> Harsh glare can cause edge contrast spikes that resemble digital boundary steps.
            </li>
            <li>
              <strong className="text-white">Unfamiliar document templates:</strong> Formats with intricate guilloché patterns that were not in the training set may yield intermediate risk scores until confirmed by an analyst.
            </li>
          </ul>

          <div className="mt-6 pt-5 border-t border-slate-800">
            <button 
              onClick={() => onNavigate('verify')}
              className="btn-primary text-xs py-2.5 px-5 cursor-pointer"
            >
              Inspect a Document
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
