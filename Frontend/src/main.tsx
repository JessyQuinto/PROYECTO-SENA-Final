import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './modules/App';
import { initPerformanceMonitoring } from './lib/performance';
import { errorHandler } from './lib/errorHandler';
import './lib/serviceWorker'; // Initialize service worker
import './styles.css';

// Initialize performance monitoring
initPerformanceMonitoring();

// Initialize error handler
errorHandler;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

createRoot(rootElement).render(React.createElement(App, null));
