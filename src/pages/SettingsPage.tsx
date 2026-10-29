import React, { useState, useEffect } from 'react';
import { rlPolicyAgent } from '../utils/rlEngine';

export const SettingsPage: React.FC = () => {
  const [clearedModels, setClearedModels] = useState<boolean>(false);
  const [clearedHistory, setClearedHistory] = useState<boolean>(false);
  const [storageStatus, setStorageStatus] = useState<{
    localStorageCount: number;
    sessionStorageCount: number;
    rlEpochs: number;
    rlMemoryCount: number;
  }>({
    localStorageCount: 0,
    sessionStorageCount: 0,
    rlEpochs: 0,
    rlMemoryCount: 0
  });

  const updateCounts = () => {
    try {
      const stats = rlPolicyAgent.getStats();
      setStorageStatus({
        localStorageCount: localStorage.length,
        sessionStorageCount: sessionStorage.length,
        rlEpochs: stats.epochs,
        rlMemoryCount: stats.memoryCount
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
      rlPolicyAgent.resetToFactory();
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
    <main className="min-h-screen pb-24 text-slate-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span>RUNTIME &amp; STORAGE CONTROLS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            Browser Storage &amp; RL Policy Settings
          </h1>
          <p className="text-sm text-slate-400">
            Manage downloaded neural weights, Reinforcement Learning policy memory, and local browser storage.
          </p>
        </div>

        {/* Local Processing Status */}
        <div className="p-5 rounded-2xl bg-[#121624] border border-slate-800 mb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <h2 className="text-sm font-bold text-white">
              Running on-device in your browser sandbox
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            All pixel forensics, Tesseract WASM OCR, and Reinforcement Learning policy updates execute in local browser memory.
          </p>
        </div>

        {/* Data Clearing Options */}
        <div className="p-6 rounded-2xl bg-[#121624] border border-slate-800 space-y-5">
          <h2 className="text-sm font-bold text-white pb-2 border-b border-slate-800">
            Clear Local Data &amp; RL Memory
          </h2>

          {/* Model Weights */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0b0e14] border border-slate-800">
            <div>
              <span className="text-sm font-semibold text-white block">
                Cached Neural Model Weights
              </span>
              <span className="text-xs text-slate-400">
                Downloaded TensorFlow.js &amp; Tesseract WASM binaries stored in browser cache for instant offline reuse.
              </span>
            </div>
            <button
              onClick={handleClearModelCache}
              className="btn-secondary text-xs py-2 px-3.5 shrink-0 cursor-pointer"
            >
              {clearedModels ? '✓ Model cache cleared' : 'Clear model cache'}
            </button>
          </div>

          {/* Session Data & RL Policy */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0b0e14] border border-slate-800">
            <div>
              <span className="text-sm font-semibold text-white block">
                RL Policy Memory &amp; Session Storage
              </span>
              <span className="text-xs text-slate-400">
                {storageStatus.rlEpochs} RL training epochs · {storageStatus.rlMemoryCount} remembered SHA-256 hashes · {storageStatus.localStorageCount} local items
              </span>
            </div>
            <button
              onClick={handleClearStorageData}
              className="btn-secondary text-xs py-2 px-3.5 shrink-0 cursor-pointer"
            >
              {clearedHistory ? '✓ Storage & RL reset' : 'Reset RL & Clear Storage'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
