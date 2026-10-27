import React from 'react';
import { ActivePage } from './Navbar';

interface FooterProps {
  onNavigate: (page: ActivePage) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-white border-t border-slate-200 pt-12 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Column */}
          <div className="md:col-span-2 max-w-md">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#2463a6] flex items-center justify-center text-white">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-base font-bold text-slate-900">Voice Guard</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Document inspection and manipulation-risk screening. Runs locally in your browser using client-side canvas heuristics and in-browser neural networks.
            </p>
            <p className="text-xs text-slate-500">
              Disclaimer: Voice Guard evaluates digital image anomalies and compression characteristics. It does not certify legal identity validity or replace physical forensic laboratory examination.
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider block mb-3">
              Inspection Tools
            </span>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <button onClick={() => onNavigate('verify')} className="hover:text-[#2463a6] transition-colors cursor-pointer">
                  Inspect a Document
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('how-it-works')} className="hover:text-[#2463a6] transition-colors cursor-pointer">
                  Technical Architecture
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('insights')} className="hover:text-[#2463a6] transition-colors cursor-pointer">
                  Benchmark Evaluation
                </button>
              </li>
            </ul>
          </div>

          {/* Privacy & Project */}
          <div>
            <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider block mb-3">
              Integrity &amp; Privacy
            </span>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <button onClick={() => onNavigate('security')} className="hover:text-[#2463a6] transition-colors cursor-pointer">
                  Privacy Statement
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('settings')} className="hover:text-[#2463a6] transition-colors cursor-pointer">
                  Local Storage Settings
                </button>
              </li>
              <li>
                <a 
                  href="https://github.com/sanjaraj2008-cmyk/Voice-guard" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:text-[#2463a6] transition-colors inline-flex items-center gap-1"
                >
                  <span>GitHub Repository</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Voice Guard — Open Document Forensics Project</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              100% Client-Side Evaluation
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
