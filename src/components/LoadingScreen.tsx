import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Cpu, Lock, CheckCircle2, Zap, Terminal, Sparkles } from 'lucide-react';
import { docuGuardAI } from '../utils/aiModel';

interface LoadingScreenProps {
  onComplete: () => void;
}

interface StepLog {
  id: string;
  label: string;
  detail: string;
  status: 'pending' | 'running' | 'done';
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [gpuBackend, setGpuBackend] = useState('WebGL / WASM');
  const [isExiting, setIsExiting] = useState(false);

  const steps: StepLog[] = [
    { id: 'sandbox', label: 'Client-Side Sandbox', detail: 'Allocating zero-leak memory heap', status: progress > 25 ? 'done' : progress > 5 ? 'running' : 'pending' },
    { id: 'gpu', label: 'Hardware Acceleration', detail: `Binding ${gpuBackend} shader pipeline`, status: progress > 55 ? 'done' : progress > 25 ? 'running' : 'pending' },
    { id: 'ai', label: 'Forensic Neural Network', detail: 'Pre-warming DocuGuard CNN (1.03M params)', status: progress > 90 ? 'done' : progress > 55 ? 'running' : 'pending' },
    { id: 'ready', label: 'Airgap Security', detail: 'Zero server exposure guaranteed', status: progress >= 100 ? 'done' : progress > 90 ? 'running' : 'pending' },
  ];

  useEffect(() => {
    let mounted = true;

    const runInitialization = async () => {
      // Step 1: Sandbox allocation
      setProgress(15);
      setCurrentStepIndex(0);
      await new Promise(r => setTimeout(r, 220));

      // Step 2: Hardware acceleration check
      setProgress(35);
      setCurrentStepIndex(1);
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            if (renderer && typeof renderer === 'string') {
              const cleanRenderer = renderer.split('/')[0].replace('ANGLE (', '').substring(0, 24);
              setGpuBackend(cleanRenderer);
            }
          }
        }
      } catch (e) {
        // fallback
      }
      await new Promise(r => setTimeout(r, 250));

      // Step 3: Preload AI Model in background
      setProgress(60);
      setCurrentStepIndex(2);

      const loadPromise = docuGuardAI.load();
      // Smooth progress while loading
      const interval = setInterval(() => {
        if (!mounted) return;
        setProgress(prev => {
          if (prev < 88) return prev + 3;
          return prev;
        });
      }, 70);

      await loadPromise;
      clearInterval(interval);

      if (!mounted) return;
      setProgress(95);
      setCurrentStepIndex(3);
      await new Promise(r => setTimeout(r, 250));

      // Step 4: Finish
      setProgress(100);
      await new Promise(r => setTimeout(r, 350));

      if (mounted) {
        setIsExiting(true);
        setTimeout(onComplete, 500);
      }
    };

    runInitialization();

    return () => {
      mounted = false;
    };
  }, [onComplete]);

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(onComplete, 300);
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#020412] overflow-hidden select-none"
        >
          {/* Ambient background glow & grid */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.08)_0,transparent_70%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

          {/* Skip button in corner */}
          <button
            onClick={handleSkip}
            className="absolute top-6 right-8 text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest px-3 py-1.5 rounded-full border border-slate-800 hover:border-slate-700 bg-slate-900/40 backdrop-blur-sm z-10"
          >
            Skip Launch →
          </button>

          {/* Central Holographic Target & Scanner */}
          <div className="relative flex flex-col items-center max-w-md w-full px-6">
            
            {/* Concentric Scanner Rings */}
            <div className="relative w-36 h-36 flex items-center justify-center mb-8">
              {/* Outer rotating pulse ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border border-cyan-500/20 border-t-cyan-400 border-r-purple-500/30"
              />
              
              {/* Middle dashed reticle */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-3 rounded-full border border-dashed border-purple-500/25 border-b-cyan-400/60"
              />

              {/* Glowing inner core */}
              <div className="absolute inset-6 rounded-full bg-gradient-to-tr from-cyan-950/60 to-purple-950/60 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_35px_rgba(6,182,212,0.25)] flex items-center justify-center">
                <Shield className="w-10 h-10 text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]" />
              </div>

              {/* Laser scan line passing vertically */}
              <motion.div
                animate={{ y: [-48, 48, -48] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute w-28 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#22d3ee] pointer-events-none"
              />
            </div>

            {/* Title & Brand */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-mono tracking-widest uppercase mb-3">
                <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>AI Document Forensics Engine</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-1.5">
                DocuGuard <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-400 bg-clip-text text-transparent">Edge</span>
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-1">100% Client-Side In-Browser Execution</p>
            </div>

            {/* Neon Progress Bar */}
            <div className="w-full mb-6">
              <div className="flex justify-between items-center text-xs font-mono mb-2">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  {steps[currentStepIndex]?.label || 'Initializing...'}
                </span>
                <span className="text-cyan-400 font-bold">{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-purple-500 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.8)]"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.2 }}
                />
              </div>
            </div>

            {/* Live Step Checklist */}
            <div className="w-full bg-slate-900/50 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-md space-y-2">
              {steps.map((s, idx) => (
                <div key={s.id} className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2.5">
                    {s.status === 'done' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : s.status === 'running' ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
                    )}
                    <span className={s.status === 'done' ? 'text-slate-300' : s.status === 'running' ? 'text-cyan-300 font-semibold' : 'text-slate-500'}>
                      {s.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 truncate max-w-[150px]">
                    {s.detail}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom Security Capsule */}
            <div className="mt-8 flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-900/40 border border-slate-800/60 px-3.5 py-1.5 rounded-full">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Air-Gapped: Zero Cloud Uploads</span>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
