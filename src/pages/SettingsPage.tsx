import React, { useState, useEffect } from 'react';

export const SettingsPage: React.FC = () => {
  const [clearedModels, setClearedModels] = useState<boolean>(false);
  const [clearedHistory, setClearedHistory] = useState<boolean>(false);
  const [storageStatus, setStorageStatus] = useState<{ localStorageCount: number; sessionStorageCount: number }>({
    localStorageCount: 0,
    sessionStorageCount: 0
  });

  const updateCounts = () => {
    try {
      setStorageStatus({
        localStorageCount: localStorage.length,
        sessionStorageCount: sessionStorage.length
      });
    } catch (_) {}
  };

  useEffect(() => {
    updateCounts();
  }, []);

  const handleClearModelCache = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      if ('indexedDB' in window && window.indexedDB.databases) {
        const dbs = await window.indexedDB.databases();
        dbs.forEach(db => {
          if (db.name) window.indexedDB.deleteDatabase(db.name);
        });
      }
      setClearedModels(true);
      setTimeout(() => setClearedModels(false), 2500);
    } catch (err) {
      console.warn('Cache clearing notice:', err);
    }
  };

  const handleClearStorageData = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      updateCounts();
      setClearedHistory(true);
      setTimeout(() => setClearedHistory(false), 2500);
    } catch (err) {
      console.warn('Storage clearing notice:', err);
    }
  };

  return (
    <main className="min-h-screen pb-16 bg-[#F7F8FA]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#172033] mb-1">
            Browser Storage &amp; Settings
          </h1>
          <p className="text-sm text-[#586579]">
            Manage downloaded neural weights, temporary memory, and local browser data.
          </p>
        </div>

        {/* Local Processing Status */}
        <div className="vg-card p-5 bg-white border border-[#E2E7EF] mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#15803d]" />
            <h2 className="text-sm font-bold text-[#172033]">
              Running 100% on this computer
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#586579] leading-relaxed">
            All document checks occur in your browser's private memory. No document images or personal details are uploaded across the internet.
          </p>
        </div>

        {/* Data Clearing Options */}
        <div className="vg-card p-6 bg-white border border-[#E2E7EF] space-y-5 shadow-sm">
          <h2 className="text-sm font-bold text-[#172033] pb-2 border-b border-[#E2E7EF]">
            Clear Local Data
          </h2>

          {/* Model Weights */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-[#F7F8FA] border border-[#E2E7EF]">
            <div>
              <span className="text-sm font-semibold text-[#172033] block">
                Cached Model Weights
              </span>
              <span className="text-xs text-[#586579]">
                Downloaded neural network file (4.13 MB) stored in your browser's cache for quick re-use.
              </span>
            </div>
            <button
              onClick={handleClearModelCache}
              className="vg-btn-secondary text-xs sm:text-sm py-2 px-3.5 shrink-0"
            >
              {clearedModels ? '✓ Model cache cleared' : 'Clear model cache'}
            </button>
          </div>

          {/* Session Data */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-[#F7F8FA] border border-[#E2E7EF]">
            <div>
              <span className="text-sm font-semibold text-[#172033] block">
                Temporary Session Storage
              </span>
              <span className="text-xs text-[#586579]">
                {storageStatus.localStorageCount} local storage items · {storageStatus.sessionStorageCount} session items
              </span>
            </div>
            <button
              onClick={handleClearStorageData}
              className="vg-btn-secondary text-xs sm:text-sm py-2 px-3.5 shrink-0"
            >
              {clearedHistory ? '✓ Storage cleared' : 'Clear session data'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
