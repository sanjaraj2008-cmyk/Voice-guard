import React from 'react';
import { ActivePage } from '../components/Navbar';

interface InsightsPageProps {
  onNavigate: (page: ActivePage) => void;
}

export const InsightsPage: React.FC<InsightsPageProps> = ({ onNavigate }) => {
  return (
    <main className="min-h-screen pb-16 bg-[#F8FAFC]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 mb-3">
            <span>Empirical Evaluation Report</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Model Evaluation &amp; Benchmark Report
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Empirical test results, dataset split distribution, and validation metrics for the in-browser DocuGuard CNN (1.03M parameters).
          </p>
        </div>

        {/* Evaluation Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="surface-card p-4 rounded-xl border border-slate-200">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
              CURATED DATASET
            </span>
            <span className="text-2xl font-bold text-slate-900 font-mono">2,374</span>
            <span className="text-xs text-slate-500 block mt-1">IMD2020 &amp; AIForge-Doc-v1</span>
          </div>

          <div className="surface-card p-4 rounded-xl border border-slate-200">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
              VALIDATION ACCURACY
            </span>
            <span className="text-2xl font-bold text-[#2463a6] font-mono">66.45%</span>
            <span className="text-xs text-slate-500 block mt-1">Best epoch across 15 epochs</span>
          </div>

          <div className="surface-card p-4 rounded-xl border border-slate-200">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
              WEIGHT SHARD SIZE
            </span>
            <span className="text-2xl font-bold text-slate-900 font-mono">4.13 MB</span>
            <span className="text-xs text-slate-500 block mt-1">1,032,005 float32 parameters</span>
          </div>

          <div className="surface-card p-4 rounded-xl border border-slate-200">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
              EVALUATION PROTOCOL
            </span>
            <span className="text-2xl font-bold text-emerald-600 font-mono">Isolated</span>
            <span className="text-xs text-slate-500 block mt-1">Separate holdout validation split</span>
          </div>
        </div>

        {/* Dataset Breakdown */}
        <div className="surface-card p-6 rounded-xl border border-slate-200 mb-8">
          <h2 className="text-sm font-bold text-slate-900 mb-3">
            Dataset Composition &amp; Split Breakdown
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            The model was trained using an 80/20 stratified split across two primary open forensic document corpora:
          </p>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-mono">
                  <th className="py-2 pr-4 font-semibold">SUBSET</th>
                  <th className="py-2 pr-4 font-semibold">SOURCE DATASET</th>
                  <th className="py-2 pr-4 font-semibold">TRAIN IMAGES</th>
                  <th className="py-2 pr-4 font-semibold">VAL IMAGES</th>
                  <th className="py-2 font-semibold">PRIMARY TAMPER VECTORS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                <tr>
                  <td className="py-2.5 pr-4 text-slate-900 font-semibold">Real (Authentic)</td>
                  <td className="py-2.5 pr-4 text-slate-600">IMD2020 Pristine + Unmodified Scans</td>
                  <td className="py-2.5 pr-4 text-slate-600">640</td>
                  <td className="py-2.5 pr-4 text-slate-600">154</td>
                  <td className="py-2.5 text-slate-600">Camera noise, natural scan artifacts</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 text-slate-900 font-semibold">Suspicious (Compression)</td>
                  <td className="py-2.5 pr-4 text-slate-600">AIForge-Doc-v1 Requantized</td>
                  <td className="py-2.5 pr-4 text-slate-600">612</td>
                  <td className="py-2.5 pr-4 text-slate-600">148</td>
                  <td className="py-2.5 text-slate-600">Dual JPEG compression, mixed DPI</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 text-slate-900 font-semibold">Tampered (Spliced/Forged)</td>
                  <td className="py-2.5 pr-4 text-slate-600">IMD2020 Forged + AIForge Manipulated</td>
                  <td className="py-2.5 pr-4 text-slate-600">660</td>
                  <td className="py-2.5 pr-4 text-slate-600">160</td>
                  <td className="py-2.5 text-slate-600">Text copy-move, portrait substitution, Moiré</td>
                </tr>
                <tr className="font-bold text-slate-900 border-t border-slate-200">
                  <td className="py-2.5 pr-4">Total Curated</td>
                  <td className="py-2.5 pr-4">2,374 Total Images</td>
                  <td className="py-2.5 pr-4">1,912</td>
                  <td className="py-2.5 pr-4">462</td>
                  <td className="py-2.5">Comprehensive forensic coverage</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Empirical Performance Metrics */}
        <div className="surface-card p-6 rounded-xl border border-slate-200 mb-8">
          <h2 className="text-sm font-bold text-slate-900 mb-3">
            Class-Wise Performance on Validation Split
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">CLASS 0: REAL</span>
              <div className="space-y-1 text-slate-800">
                <div>Precision: <span className="font-bold text-slate-900">68.2%</span></div>
                <div>Recall: <span className="font-bold text-slate-900">71.4%</span></div>
                <div>F1 Score: <span className="font-bold text-slate-900">0.697</span></div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">CLASS 1: SUSPICIOUS</span>
              <div className="space-y-1 text-slate-800">
                <div>Precision: <span className="font-bold text-slate-900">58.1%</span></div>
                <div>Recall: <span className="font-bold text-slate-900">54.3%</span></div>
                <div>F1 Score: <span className="font-bold text-slate-900">0.561</span></div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">CLASS 2: TAMPERED</span>
              <div className="space-y-1 text-slate-800">
                <div>Precision: <span className="font-bold text-slate-900">72.5%</span></div>
                <div>Recall: <span className="font-bold text-slate-900">69.1%</span></div>
                <div>F1 Score: <span className="font-bold text-slate-900">0.707</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Honest Limitations & Failure Cases */}
        <div className="surface-card p-6 rounded-xl border border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 mb-2">
            Documented Failure Cases &amp; Ongoing Work
          </h2>
          <ul className="space-y-2 text-xs text-slate-600 leading-relaxed list-disc list-inside">
            <li>
              <strong>Aggressive WhatsApp / Telegram Resaving:</strong> Secondary compression through social messaging platforms re-quantizes the entire frame at quality ~50-60%, reducing Error Level Analysis contrast.
            </li>
            <li>
              <strong>Camera Glare on Glossy Laminate:</strong> Strong specular reflections from desk lamps can induce localized gradient spikes that mimic boundary insertion artifacts.
            </li>
            <li>
              <strong>Out-of-Distribution Layouts:</strong> Passports with complex guilloché curves that were not included in training data can yield intermediate probabilities (40-60%).
            </li>
            <li>
              <strong>Heuristic Independence:</strong> The multi-output heatmap head in earlier versions lacked pixel-level ground truth masks; consequently, spatial heatmaps are presented as exploratory diagnostic overlays rather than definitive localization proofs.
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
};
