import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './modules/App';
import './lib/errorHandler';
import { initializeSecurity } from './lib/csp';
import './lib/serviceWorker'; // Initialize service worker
import './styles.css';

// Initialize security configuration
initializeSecurity();

// Error handler singleton is initialized on import (constructor sets up global handlers)

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

createRoot(rootElement).render(React.createElement(App, null));
