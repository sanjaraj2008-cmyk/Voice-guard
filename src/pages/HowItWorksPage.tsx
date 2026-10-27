import React from 'react';
import { ActivePage } from '../components/Navbar';

interface HowItWorksPageProps {
  onNavigate: (page: ActivePage) => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onNavigate }) => {
  return (
    <main className="min-h-screen pb-16 bg-[#F7F8FA]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Page Header */}
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[#586579] bg-[#EEF2F6] border border-[#E2E7EF] mb-3">
            <span>TECHNICAL OVERVIEW</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#172033] mb-3">
            How Voice Guard Works
          </h1>
          <p className="text-base text-[#586579] leading-relaxed">
            An open explanation of what runs on your computer, what checks are performed, and what the system cannot determine.
          </p>
        </div>

        {/* 4-Step Plain Language Flow */}
        <div className="vg-card p-6 sm:p-8 bg-white border border-[#E2E7EF] mb-8 shadow-sm">
          <h2 className="text-lg font-bold text-[#172033] mb-6">
            The Inspection Steps
          </h2>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#EEF2F6] text-[#315EFB] text-xs font-bold font-mono flex items-center justify-center shrink-0">
                01
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172033] mb-1">
                  Local image loading
                </h3>
                <p className="text-sm text-[#586579] leading-relaxed">
                  When you select an image, your browser decodes the file into temporary memory. No image data or personal details are uploaded to a remote server.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#EEF2F6] text-[#315EFB] text-xs font-bold font-mono flex items-center justify-center shrink-0">
                02
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172033] mb-1">
                  Image quality and blur check
                </h3>
                <p className="text-sm text-[#586579] leading-relaxed">
                  The software measures edge contrast (Laplacian variance) across the image. An image with low contrast or heavy blur is flagged because blur makes visual editing harder to identify.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#EEF2F6] text-[#315EFB] text-xs font-bold font-mono flex items-center justify-center shrink-0">
                03
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172033] mb-1">
                  Compression difference screening (Error Level Analysis)
                </h3>
                <p className="text-sm text-[#586579] leading-relaxed">
                  When someone edits a JPEG image (such as modifying numbers or pasting a new portrait), the modified area often recompresses at a different rate than the background. The software divides the image into 16x16 blocks to detect these differences.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#EEF2F6] text-[#315EFB] text-xs font-bold font-mono flex items-center justify-center shrink-0">
                04
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172033] mb-1">
                  Metadata and editing signatures
                </h3>
                <p className="text-sm text-[#586579] leading-relaxed">
                  The image file header is scanned to see if it carries signatures from digital image editors like Photoshop, GIMP, or Canva, rather than standard camera hardware tags.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Neural Network Model Information */}
        <div className="vg-card p-6 sm:p-8 bg-white border border-[#E2E7EF] mb-8 shadow-sm">
          <h2 className="text-lg font-bold text-[#172033] mb-2">
            The In-Browser Neural Network
          </h2>
          <p className="text-sm text-[#586579] leading-relaxed mb-4">
            Voice Guard includes a compact convolutional neural network running directly in your browser via TensorFlow.js.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-[#586579]">
            <div className="p-3.5 rounded-lg bg-[#F7F8FA] border border-[#E2E7EF]">
              <span className="font-semibold text-[#172033] block mb-1">Model Size &amp; Training:</span>
              <p>1,032,005 parameters (4.13 MB). Trained on 2,374 forensic document images from the IMD2020 and AIForge datasets.</p>
            </div>
            <div className="p-3.5 rounded-lg bg-[#F7F8FA] border border-[#E2E7EF]">
              <span className="font-semibold text-[#172033] block mb-1">Tested Accuracy:</span>
              <p>Achieved 66.45% validation accuracy on test splits. Real-world performance on novel layouts may vary.</p>
            </div>
          </div>
        </div>

        {/* Clear Limitations Disclosure */}
        <div className="vg-card p-6 sm:p-8 bg-white border border-[#E2E7EF] shadow-sm">
          <h2 className="text-lg font-bold text-[#172033] mb-2">
            Important Limitations
          </h2>
          <ul className="space-y-2 text-sm text-[#586579] list-disc list-inside">
            <li>Voice Guard cannot verify whether a name or identification number is authentic in government records.</li>
            <li>Repeatedly sharing an image through messaging apps (WhatsApp, Telegram) can reduce compression signals.</li>
            <li>This software is a screening aid for human reviewers, not an official certificate of authenticity.</li>
          </ul>

          <div className="mt-6 pt-4 border-t border-[#E2E7EF]">
            <button 
              onClick={() => onNavigate('verify')}
              className="vg-btn-primary text-sm py-2 px-5"
            >
              Check a document image
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
