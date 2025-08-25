import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './modules/App';
import './styles.css';
import { cacheUtils } from './lib/cache';
import { serviceWorkerManager } from './lib/serviceWorker';

// Expose emergency functions globally for debugging
if (typeof window !== 'undefined') {
  (window as any).__EMERGENCY_CLEANUP__ = {
    clearAllCache: () => {
      console.log('🚨 Emergency cache cleanup initiated');
      cacheUtils.forceInvalidate();
      serviceWorkerManager.clearAllCaches();
      window.location.reload();
    },
    clearSupabaseAuth: () => {
      console.log('🚨 Emergency Supabase auth cleanup initiated');
      const { clearSupabaseAuth } = require('./lib/supabaseClient');
      clearSupabaseAuth();
      window.location.reload();
    },
    forceReload: () => {
      console.log('🚨 Force reload initiated');
      cacheUtils.forceInvalidate();
      serviceWorkerManager.emergencyReload();
    },
    debugStorage: () => {
      console.log('🔍 Current localStorage keys:', Object.keys(localStorage));
      console.log('🔍 Current sessionStorage keys:', Object.keys(sessionStorage));
      console.log('🔍 Cache manager stats:', cacheUtils.getStats());
    }
  };

  // Add keyboard shortcut for emergency cleanup (Ctrl+Shift+R)
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
      e.preventDefault();
      console.log('🚨 Emergency cleanup triggered by keyboard shortcut');
      (window as any).__EMERGENCY_CLEANUP__.clearAllCache();
    }
  });
}

// Error boundary for the entire app
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App crashed:', error, errorInfo);
    
    // Try to recover by clearing cache
    try {
      cacheUtils.forceInvalidate();
      serviceWorkerManager.clearAllCaches();
    } catch (cleanupError) {
      console.error('Failed to cleanup after crash:', cleanupError);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h1>😵 Algo salió mal</h1>
          <p>La aplicación encontró un error inesperado.</p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            style={{
              padding: '0.5rem 1rem',
              margin: '1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Recargar página
          </button>
          <button
            onClick={() => {
              (window as any).__EMERGENCY_CLEANUP__.clearAllCache();
            }}
            style={{
              padding: '0.5rem 1rem',
              margin: '1rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Limpiar caché y recargar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
);
