import React from 'react';

export type ActivePage = 'home' | 'verify' | 'how-it-works' | 'security' | 'insights' | 'settings';

interface NavbarProps {
  currentPage: ActivePage;
  onNavigate: (page: ActivePage) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 group text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2463a6] rounded-md p-1"
        >
          <div className="w-8 h-8 rounded-lg bg-[#2463a6] flex items-center justify-center text-white">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
              />
            </svg>
          </div>
          <div>
            <span className="text-base font-bold text-slate-900 block leading-tight">
              Voice Guard
            </span>
            <span className="text-[10px] text-slate-500 block font-normal tracking-tight">
              Document Forensics
            </span>
          </div>
        </button>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          <button
            onClick={() => onNavigate('home')}
            className={`text-sm font-medium transition-colors cursor-pointer ${
              currentPage === 'home' ? 'text-[#2463a6] font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onNavigate('verify')}
            className={`text-sm font-medium transition-colors cursor-pointer ${
              currentPage === 'verify' ? 'text-[#2463a6] font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inspect Document
          </button>
          <button
            onClick={() => onNavigate('how-it-works')}
            className={`text-sm font-medium transition-colors cursor-pointer ${
              currentPage === 'how-it-works' ? 'text-[#2463a6] font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Architecture
          </button>
          <button
            onClick={() => onNavigate('insights')}
            className={`text-sm font-medium transition-colors cursor-pointer ${
              currentPage === 'insights' ? 'text-[#2463a6] font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Model Benchmark
          </button>
          <button
            onClick={() => onNavigate('security')}
            className={`text-sm font-medium transition-colors cursor-pointer ${
              currentPage === 'security' ? 'text-[#2463a6] font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Privacy &amp; Security
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className={`text-sm font-medium transition-colors cursor-pointer ${
              currentPage === 'settings' ? 'text-[#2463a6] font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Settings
          </button>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>Local Engine</span>
          </div>

          <button 
            onClick={() => onNavigate('verify')}
            className="btn-primary text-xs sm:text-sm py-1.5 px-3.5"
          >
            Inspect a Document
          </button>
        </div>
      </div>
    </nav>
  );
};
