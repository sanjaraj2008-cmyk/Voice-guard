import React, { useState } from 'react';

export type ActivePage = 'home' | 'verify' | 'how-it-works' | 'security' | 'insights' | 'settings';

interface NavbarProps {
  currentPage: ActivePage;
  onNavigate: (page: ActivePage) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (page: ActivePage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-[#E2E7EF] px-4 sm:px-6 lg:px-8 py-3.5 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Name */}
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2.5 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#315EFB] rounded-lg p-1"
          aria-label="Voice Guard Home"
        >
          <div className="w-8 h-8 rounded-lg bg-[#315EFB] flex items-center justify-center text-white shrink-0 shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <span className="text-base font-bold text-[#172033] block leading-tight">
              Voice Guard
            </span>
            <span className="text-xs text-[#586579] block font-normal">
              Document Image Checker
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          <button
            onClick={() => handleNavClick('home')}
            className={`text-sm font-medium transition-colors cursor-pointer py-1 px-1.5 rounded focus:outline-none focus:ring-2 focus:ring-[#315EFB] ${
              currentPage === 'home' ? 'text-[#315EFB] font-semibold' : 'text-[#586579] hover:text-[#172033]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => handleNavClick('verify')}
            className={`text-sm font-medium transition-colors cursor-pointer py-1 px-1.5 rounded focus:outline-none focus:ring-2 focus:ring-[#315EFB] ${
              currentPage === 'verify' ? 'text-[#315EFB] font-semibold' : 'text-[#586579] hover:text-[#172033]'
            }`}
          >
            Check a Document
          </button>
          <button
            onClick={() => handleNavClick('how-it-works')}
            className={`text-sm font-medium transition-colors cursor-pointer py-1 px-1.5 rounded focus:outline-none focus:ring-2 focus:ring-[#315EFB] ${
              currentPage === 'how-it-works' ? 'text-[#315EFB] font-semibold' : 'text-[#586579] hover:text-[#172033]'
            }`}
          >
            How It Works
          </button>
          <button
            onClick={() => handleNavClick('insights')}
            className={`text-sm font-medium transition-colors cursor-pointer py-1 px-1.5 rounded focus:outline-none focus:ring-2 focus:ring-[#315EFB] ${
              currentPage === 'insights' ? 'text-[#315EFB] font-semibold' : 'text-[#586579] hover:text-[#172033]'
            }`}
          >
            Testing &amp; Accuracy
          </button>
          <button
            onClick={() => handleNavClick('security')}
            className={`text-sm font-medium transition-colors cursor-pointer py-1 px-1.5 rounded focus:outline-none focus:ring-2 focus:ring-[#315EFB] ${
              currentPage === 'security' ? 'text-[#315EFB] font-semibold' : 'text-[#586579] hover:text-[#172033]'
            }`}
          >
            Privacy
          </button>
          <button
            onClick={() => handleNavClick('settings')}
            className={`text-sm font-medium transition-colors cursor-pointer py-1 px-1.5 rounded focus:outline-none focus:ring-2 focus:ring-[#315EFB] ${
              currentPage === 'settings' ? 'text-[#315EFB] font-semibold' : 'text-[#586579] hover:text-[#172033]'
            }`}
          >
            Settings
          </button>
        </div>

        {/* Primary CTA and Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleNavClick('verify')}
            className="hidden sm:inline-flex vg-btn-primary text-xs sm:text-sm py-2 px-3.5"
          >
            Check a document
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#586579] hover:text-[#172033] hover:bg-[#F7F8FA] focus:outline-none focus:ring-2 focus:ring-[#315EFB]"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Accessible Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-[#E2E7EF] space-y-1.5 pb-2">
          <button
            onClick={() => handleNavClick('home')}
            className={`w-full text-left py-2 px-3 rounded-lg text-sm font-medium ${
              currentPage === 'home' ? 'bg-[#EEF2F6] text-[#315EFB] font-semibold' : 'text-[#172033]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => handleNavClick('verify')}
            className={`w-full text-left py-2 px-3 rounded-lg text-sm font-medium ${
              currentPage === 'verify' ? 'bg-[#EEF2F6] text-[#315EFB] font-semibold' : 'text-[#172033]'
            }`}
          >
            Check a Document
          </button>
          <button
            onClick={() => handleNavClick('how-it-works')}
            className={`w-full text-left py-2 px-3 rounded-lg text-sm font-medium ${
              currentPage === 'how-it-works' ? 'bg-[#EEF2F6] text-[#315EFB] font-semibold' : 'text-[#172033]'
            }`}
          >
            How It Works
          </button>
          <button
            onClick={() => handleNavClick('insights')}
            className={`w-full text-left py-2 px-3 rounded-lg text-sm font-medium ${
              currentPage === 'insights' ? 'bg-[#EEF2F6] text-[#315EFB] font-semibold' : 'text-[#172033]'
            }`}
          >
            Testing &amp; Accuracy
          </button>
          <button
            onClick={() => handleNavClick('security')}
            className={`w-full text-left py-2 px-3 rounded-lg text-sm font-medium ${
              currentPage === 'security' ? 'bg-[#EEF2F6] text-[#315EFB] font-semibold' : 'text-[#172033]'
            }`}
          >
            Privacy
          </button>
          <button
            onClick={() => handleNavClick('settings')}
            className={`w-full text-left py-2 px-3 rounded-lg text-sm font-medium ${
              currentPage === 'settings' ? 'bg-[#EEF2F6] text-[#315EFB] font-semibold' : 'text-[#172033]'
            }`}
          >
            Settings
          </button>
        </div>
      )}
    </nav>
  );
};
