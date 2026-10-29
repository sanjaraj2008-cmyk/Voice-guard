import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Navbar, ActivePage } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';

const VerifyPage = lazy(() => import('./pages/VerifyPage').then(m => ({ default: m.VerifyPage })));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage').then(m => ({ default: m.HowItWorksPage })));
const SecurityPage = lazy(() => import('./pages/SecurityPage').then(m => ({ default: m.SecurityPage })));
const InsightsPage = lazy(() => import('./pages/InsightsPage').then(m => ({ default: m.InsightsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

export default function App() {
  const [currentPage, setCurrentPage] = useState<ActivePage>('home');

  // Handle browser back/forward and hash changes if present
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') as ActivePage;
      if (['home', 'verify', 'how-it-works', 'security', 'insights', 'settings'].includes(hash)) {
        setCurrentPage(hash);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleNavigate = (page: ActivePage) => {
    setCurrentPage(page);
    window.location.hash = page === 'home' ? '' : page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0e14] text-slate-100 antialiased selection:bg-indigo-600 selection:text-white font-sans">
      {/* Navigation Bar */}
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      {/* Main Routed Page Content */}
      <div className="flex-1 flex flex-col">
        {currentPage === 'home' ? (
          <HomePage onNavigate={handleNavigate} />
        ) : (
          <Suspense
            fallback={
              <div className="flex-1 flex items-center justify-center py-24 text-slate-400 text-xs font-medium">
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#121624] border border-slate-800">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  <span>Loading workspace...</span>
                </div>
              </div>
            }
          >
            {currentPage === 'verify' && <VerifyPage />}
            {currentPage === 'how-it-works' && <HowItWorksPage onNavigate={handleNavigate} />}
            {currentPage === 'security' && <SecurityPage onNavigate={handleNavigate} />}
            {currentPage === 'insights' && <InsightsPage onNavigate={handleNavigate} />}
            {currentPage === 'settings' && <SettingsPage />}
          </Suspense>
        )}
      </div>

      {/* Global Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

