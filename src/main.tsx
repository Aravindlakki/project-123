import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[PLACEMEIN ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('cra_token');
      sessionStorage.clear();
      window.location.hash = '';
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-950 via-gray-950 to-amber-950 flex items-center justify-center p-6 text-white font-sans">
          <div className="max-w-md w-full bg-gray-900/90 border border-purple-800/60 rounded-3xl p-8 space-y-6 shadow-2xl text-center">
            <div className="bg-white p-3 rounded-2xl w-fit mx-auto shadow-xl border border-purple-200">
              <img src="/placemein-logo.png" alt="PLACEMEIN" className="h-12 w-12 object-contain" />
            </div>
            <h1 className="text-xl font-bold">PLACEMEIN CRA Outreach</h1>
            <p className="text-sm text-gray-300">
              A temporary runtime issue occurred while loading this workspace view.
            </p>
            <div className="bg-gray-950/80 p-3 rounded-xl border border-gray-800 text-left text-xs font-mono text-amber-300 overflow-x-auto max-h-32">
              {this.state.error?.message || 'Unknown runtime error'}
            </div>
            <button
              onClick={this.handleReset}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition shadow-lg shadow-purple-600/30"
            >
              Reset Session & Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
