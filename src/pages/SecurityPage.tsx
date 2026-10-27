import React from 'react';
import { ActivePage } from '../components/Navbar';

interface SecurityPageProps {
  onNavigate: (page: ActivePage) => void;
}

export const SecurityPage: React.FC<SecurityPageProps> = ({ onNavigate }) => {
  return (
    <main className="min-h-screen pb-16 bg-[#F8FAFC]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Header */}
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 mb-3">
            <span>Privacy &amp; Data Policy</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Client-Side Privacy Architecture
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            A precise disclosure of data handling, network behavior, browser storage, and operational boundaries.
          </p>
        </div>

        {/* 3 Truthful Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="surface-card p-5 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              In-Memory Processing
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              When an image is dropped or selected, it is decoded into browser RAM via the HTML5 File API and Canvas 2D context. It is never uploaded to an external server.
            </p>
          </div>

          <div className="surface-card p-5 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              Zero Cloud Ingestion
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              All pixel calculations (Laplacian blur, JPEG ELA) and neural network inference (TensorFlow.js) execute within your device's browser sandbox.
            </p>
          </div>

          <div className="surface-card p-5 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              Transient Data Lifecycle
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Document data is discarded upon refreshing or navigating away. No images, personal details, or inspection dossiers are stored in permanent browser databases.
            </p>
          </div>
        </div>

        {/* Technical Data Flow Table */}
        <div className="surface-card p-6 rounded-xl border border-slate-200 mb-8">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            Technical Data Flow Specification
          </h2>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-mono">
                  <th className="py-2.5 pr-4 font-semibold">STAGE</th>
                  <th className="py-2.5 pr-4 font-semibold">DATA TYPE</th>
                  <th className="py-2.5 pr-4 font-semibold">LOCATION</th>
                  <th className="py-2.5 font-semibold">NETWORK CALL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                <tr>
                  <td className="py-2.5 pr-4 text-slate-900 font-semibold">Image Ingestion</td>
                  <td className="py-2.5 pr-4 text-slate-600">File Blob (Binary)</td>
                  <td className="py-2.5 pr-4 text-slate-600">Browser Memory (RAM)</td>
                  <td className="py-2.5 text-emerald-600 font-bold">None (0 bytes sent)</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 text-slate-900 font-semibold">Model Weight Load</td>
                  <td className="py-2.5 pr-4 text-slate-600">TF.js model.json + Shard</td>
                  <td className="py-2.5 pr-4 text-slate-600">Static Host / Vercel CDN</td>
                  <td className="py-2.5 text-slate-600">GET /ai-model/*.bin (Once, cached)</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 text-slate-900 font-semibold">Pixel Forensics</td>
                  <td className="py-2.5 pr-4 text-slate-600">ImageData (RGBA)</td>
                  <td className="py-2.5 pr-4 text-slate-600">Canvas 2D Context</td>
                  <td className="py-2.5 text-emerald-600 font-bold">None (0 bytes sent)</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 text-slate-900 font-semibold">Neural Inference</td>
                  <td className="py-2.5 pr-4 text-slate-600">224x224x3 Tensor</td>
                  <td className="py-2.5 pr-4 text-slate-600">WebGL / WASM Texture Buffer</td>
                  <td className="py-2.5 text-emerald-600 font-bold">None (0 bytes sent)</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 text-slate-900 font-semibold">Report Generation</td>
                  <td className="py-2.5 pr-4 text-slate-600">PDF Document</td>
                  <td className="py-2.5 pr-4 text-slate-600">Local Blob Download</td>
                  <td className="py-2.5 text-emerald-600 font-bold">None (0 bytes sent)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Verification Limitations */}
        <div className="surface-card p-6 rounded-xl border border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 mb-2">
            Verification Boundaries &amp; Integrity Disclaimer
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            Because Voice Guard operates entirely on the client side without central database connections, it screens for digital and visual manipulation only.
          </p>
          <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
            <li>Voice Guard cannot verify whether an individual's personal identity records are genuine or counterfeit in government registries.</li>
            <li>Voice Guard cannot detect authentic paper documents that were physically modified prior to high-resolution direct scanning.</li>
            <li>Findings should be treated as diagnostic risk indicators to guide human review, not as autonomous legal proof.</li>
          </ul>
        </div>
      </div>
    </main>
  );
};
