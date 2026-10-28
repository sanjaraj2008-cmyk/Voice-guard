import React from 'react';

export type ActivePage = 'home' | 'verify' | 'how-it-works' | 'security' | 'insights' | 'settings';

interface NavbarProps {
  currentPage: ActivePage;
  onNavigate: (page: ActivePage) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5 border-b border-white/8 bg-[#0b0e14]/90 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 group text-left cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 transition-transform group-hover:scale-105">
            <svg 
              className="w-5 h-5 text-indigo-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.8} 
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
              />
            </svg>
          </div>
          <div>
            <div className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
              DocuGuard
              <span className="text-[10px] font-semibold text-indigo-300/80 bg-indigo-500/15 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                Verified
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-normal -mt-0.5">
              Private ID Forensics
            </div>
          </div>
        </button>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          {[
            { id: 'home', label: 'Overview' },
            { id: 'verify', label: 'Verify Document' },
            { id: 'how-it-works', label: 'How It Works' },
            { id: 'security', label: 'Security & Trust' },
            { id: 'insights', label: 'Risk Patterns' },
            { id: 'settings', label: 'Device Privacy' }
          ].map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as ActivePage)}
                className={`text-xs font-medium transition-colors cursor-pointer relative py-1 ${
                  isActive ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Reassurance Indicator & CTA */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-medium text-slate-400">
              Zero data leaves device
            </span>
          </div>

          <button
            onClick={() => onNavigate('verify')}
            className="btn-primary text-xs py-2 px-4 cursor-pointer"
          >
            Verify Document
          </button>
        </div>
      </div>
    </nav>
  );
};
