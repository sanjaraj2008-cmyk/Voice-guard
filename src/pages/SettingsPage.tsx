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
      console.warn('Cache clearing error:', err);
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
      console.warn('Storage clearing error:', err);
    }
  };

  return (
    <main className="min-h-screen pb-16 bg-[#F8FAFC]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            Storage &amp; Runtime Settings
          </h1>
          <p className="text-sm text-slate-600">
            Manage locally cached neural weights, browser storage, and execution preferences.
          </p>
        </div>

        {/* Runtime Status */}
        <div className="surface-card p-5 rounded-xl border border-slate-200 mb-6 bg-white">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-bold text-slate-900">
              Execution Mode: Strictly Client-Side
            </h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            All document verification operations execute within your browser sandbox. No telemetry, identity document images, or extracted fields are persisted or transmitted across the network.
          </p>
        </div>

        {/* Storage Management Panel */}
        <div className="surface-card p-6 rounded-xl border border-slate-200 space-y-5">
          <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Local Browser Storage Management
          </h2>

          {/* Model Cache */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <span className="text-sm font-semibold text-slate-900 block">
                Cached Neural Weights (TensorFlow.js)
              </span>
              <span className="text-xs text-slate-500">
                Static binary shards (4.13 MB) stored in browser HTTP cache and IndexedDB.
              </span>
            </div>
            <button
              onClick={handleClearModelCache}
              className="btn-secondary text-xs py-1.5 px-3 shrink-0"
            >
              {clearedModels ? '✓ Cache Cleared' : 'Clear Model Cache'}
            </button>
          </div>

          {/* Verification History / Local Storage */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <span className="text-sm font-semibold text-slate-900 block">
                Browser Key-Value Storage
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {storageStatus.localStorageCount} localStorage keys · {storageStatus.sessionStorageCount} sessionStorage keys
              </span>
            </div>
            <button
              onClick={handleClearStorageData}
              className="btn-secondary text-xs py-1.5 px-3 shrink-0"
            >
              {clearedHistory ? '✓ Storage Cleared' : 'Clear Browser Storage'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
