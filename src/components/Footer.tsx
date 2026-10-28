import React from 'react';
import { ActivePage } from './Navbar';

interface FooterProps {
  onNavigate: (page: ActivePage) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-slate-800/80 bg-[#0b0e14] pt-14 pb-10 text-slate-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-12">
          {/* Left Brand Summary */}
          <div className="max-w-sm">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-3 mb-3 cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                DocuGuard
              </span>
            </button>

            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Private, on-device document forensics and identity verification. Inspects documents for screen re-photography, digital alterations, and checksum validity.
            </p>

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Offline verification · No server tracking</span>
            </div>
          </div>

          {/* Links columns */}
          <div className="flex flex-wrap gap-12 sm:gap-16">
            <div className="flex flex-col gap-2.5 text-xs">
              <span className="font-semibold text-slate-200 mb-1">Verification</span>
              <button 
                onClick={() => onNavigate('verify')} 
                className="text-left text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Inspect Document
              </button>
              <button 
                onClick={() => onNavigate('how-it-works')} 
                className="text-left text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Verification Methodology
              </button>
              <button 
                onClick={() => onNavigate('insights')} 
                className="text-left text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Common Forgery Patterns
              </button>
            </div>

            <div className="flex flex-col gap-2.5 text-xs">
              <span className="font-semibold text-slate-200 mb-1">Privacy &amp; Trust</span>
              <button 
                onClick={() => onNavigate('security')} 
                className="text-left text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Client-Side Sandbox
              </button>
              <button 
                onClick={() => onNavigate('settings')} 
                className="text-left text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Device Storage &amp; Memory
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            DocuGuard Document Verification System · Runs locally on device
          </div>
          <div>
            Built with respect for user privacy and biometric safety
          </div>
        </div>
      </div>
    </footer>
  );
};
