import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : String(error)
    };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    console.error('[DocuGuard RootBoundary] Caught runtime error:', error, errorInfo);
  }

  handleResetAndReload = () => {
    try {
      localStorage.removeItem('docuguard_rl_policy_v1');
      localStorage.removeItem('docuguard_feedback_memory_v1');
      sessionStorage.clear();
    } catch {
      // ignore storage errors
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0e14] text-slate-100 p-6 font-sans">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#121624] border border-slate-800 text-center shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4 font-bold">
              !
            </div>
            <h1 className="text-lg font-bold text-white mb-2">Workspace Recovery Mode</h1>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              DocuGuard encountered a browser state conflict ({this.state.errorMessage || 'Render error'}). Resetting local cache will restore the verification desk.
            </p>
            <button
              onClick={this.handleResetAndReload}
              className="btn-primary text-xs py-2.5 px-5 cursor-pointer"
            >
              Reset Local State &amp; Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  );
}

