import React, { useState, useEffect } from 'react';
import { Navbar, ActivePage } from './components/Navbar';
import { Footer } from './components/Footer';
import { LoadingScreen } from './components/LoadingScreen';
import { HomePage } from './pages/HomePage';
import { VerifyPage } from './pages/VerifyPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { SecurityPage } from './pages/SecurityPage';
import { InsightsPage } from './pages/InsightsPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<ActivePage>('home');
  const [isLoading, setIsLoading] = useState(true);

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
    <div className="min-h-screen flex flex-col bg-[#020412] text-slate-100 antialiased selection:bg-purple-600 selection:text-white">
      {/* High-Tech Security Splash & Pre-warming Screen */}
      {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}

      {/* Navigation Bar */}
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      {/* Floating Connected Test Indicator */}
      <div className="fixed bottom-8 right-8 z-[9999] flex items-center gap-3 px-5 py-3 rounded-full bg-emerald-950/90 border-2 border-emerald-400 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.7)] backdrop-blur-xl font-mono text-base font-extrabold tracking-wider animate-bounce select-none pointer-events-auto">
        <span className="relative flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
        </span>
        <span className="drop-shadow-[0_0_8px_#34d399]">CONNECTED</span>
      </div>

      {/* Main Routed Page Content */}
      <div className="flex-1 flex flex-col">
        {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
        {currentPage === 'verify' && <VerifyPage />}
        {currentPage === 'how-it-works' && <HowItWorksPage onNavigate={handleNavigate} />}
        {currentPage === 'security' && <SecurityPage onNavigate={handleNavigate} />}
        {currentPage === 'insights' && <InsightsPage onNavigate={handleNavigate} />}
        {currentPage === 'settings' && <SettingsPage />}
      </div>

      {/* Global Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
