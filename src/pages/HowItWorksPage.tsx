import React from 'react';
import { ActivePage } from '../components/Navbar';

interface HowItWorksPageProps {
  onNavigate: (page: ActivePage) => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onNavigate }) => {
  return (
    <main className="min-h-screen pb-16 bg-[#F8FAFC]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Header */}
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 mb-3">
            <span>Engineering Architecture</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            How Voice Guard Works
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            A transparent overview of the in-browser inspection pipeline, heuristic algorithms, neural architecture, and current operating limitations.
          </p>
        </div>

        {/* Pipeline Architecture Diagram */}
        <div className="surface-card p-6 sm:p-8 rounded-xl border border-slate-200 mb-10">
          <h2 className="text-base font-bold text-slate-900 mb-6">
            Client-Side Execution Flow
          </h2>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2463a6] font-mono text-xs font-bold flex items-center justify-center shrink-0 border border-blue-200">
                01
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  Local Ingestion &amp; Canvas Bitmap Decoding
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The document is loaded directly into browser memory as a Blob via the HTML5 File API. An offscreen <code>HTMLCanvasElement</code> decodes the raster bitmap at natural resolution. No network socket or API payload is initiated.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2463a6] font-mono text-xs font-bold flex items-center justify-center shrink-0 border border-blue-200">
                02
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  Laplacian Edge Variance (Sharpness Filter)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Convolves the grayscale image against a discrete 3x3 Laplacian kernel <code>[0, 1, 0; 1, -4, 1; 0, 1, 0]</code> to calculate edge variance. Documents below threshold (80.0) are flagged for blur, as diffuse edges can obscure secondary manipulation.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2463a6] font-mono text-xs font-bold flex items-center justify-center shrink-0 border border-blue-200">
                03
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  Error Level Analysis (ELA) Compression Discrepancy
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The canvas exports a temporary 75% quality JPEG in memory. The pixel delta between original and recompressed frames is computed across 16x16 macroblocks. Locally altered areas (e.g. spliced text or modified dates) often display higher error variance.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2463a6] font-mono text-xs font-bold flex items-center justify-center shrink-0 border border-blue-200">
                04
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  In-Browser Convolutional Neural Network (TensorFlow.js)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The image is resized to 224x224 and fed to a 1.03M parameter convolutional neural network running on the browser's WebGL / WASM backend. Trained on 2,374 forensic samples from IMD2020 and AIForge datasets to output classification probabilities for Real, Suspicious, or Tampered.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2463a6] font-mono text-xs font-bold flex items-center justify-center shrink-0 border border-blue-200">
                05
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  EXIF &amp; Binary Header Inspection
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The initial 64KB binary segment is scanned for JPEG APP1 markers and TIFF tags to verify whether the image retains standard camera metadata or contains signatures inserted by photo-editing tools like Adobe Photoshop, GIMP, or Canva.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Model Specs & Limitations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="surface-card p-5 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              Neural Network Architecture
            </h3>
            <ul className="space-y-2 text-xs text-slate-600 font-mono">
              <li>• Parameters: 1,032,005 float32 weights (4.13 MB)</li>
              <li>• Input: 224 x 224 x 3 normalized tensors</li>
              <li>• Training Split: 1,912 train / 462 val images</li>
              <li>• Training Epochs: 15 epochs via PyTorch</li>
              <li>• Best Validation Accuracy: 66.45%</li>
              <li>• Runtime Backend: TensorFlow.js LayersModel (WebGL)</li>
            </ul>
          </div>

          <div className="surface-card p-5 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              Recognized Limitations
            </h3>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>• <strong>No PKI Verification:</strong> Does not cryptographically validate digital signatures or QR payloads.</li>
              <li>• <strong>No Registry Lookup:</strong> Does not query government databases or confirm identity existence.</li>
              <li>• <strong>Compression Sensitivities:</strong> High overall recompression (e.g. via messaging apps) can diminish ELA accuracy.</li>
              <li>• <strong>Evaluation Context:</strong> 66.5% validation accuracy reflects academic dataset benchmarks; real-world field performance may vary.</li>
            </ul>
          </div>
        </div>

        {/* Action */}
        <div className="text-center">
          <button 
            onClick={() => onNavigate('verify')}
            className="btn-primary text-sm py-2 px-5"
          >
            Try Document Inspection
          </button>
        </div>
      </div>
    </main>
  );
};
