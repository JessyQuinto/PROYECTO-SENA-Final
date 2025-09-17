/**
 * Content Security Policy (CSP) configuration and management
 */

interface CSPDirectives {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'font-src': string[];
  'connect-src': string[];
  'media-src': string[];
  'object-src': string[];
  'child-src': string[];
  'worker-src': string[];
  'frame-src': string[];
  'form-action': string[];
  'base-uri': string[];
  'manifest-src': string[];
}

/**
 * Generate CSP header string from directives
 */
function generateCSPHeader(directives: Partial<CSPDirectives>): string {
  return Object.entries(directives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

/**
 * Development CSP configuration (more permissive)
 */
export const developmentCSP: Partial<CSPDirectives> = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // For development hot reload
    "'unsafe-eval'", // For development tools
    'https://cdn.jsdelivr.net',
    'https://unpkg.com',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // For styled components and CSS-in-JS
    'https://fonts.googleapis.com',
    'https://cdn.jsdelivr.net',
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:',
    'http:', // Allow HTTP images in development
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
    'https://cdn.jsdelivr.net',
    'data:',
  ],
  'connect-src': [
    "'self'",
    'https://*.supabase.co',
    'https://*.supabase.com',
    'https://marketplace-backend-prod.azurewebsites.net',
    'http://localhost:3001',
    'http://localhost:4000',
    'ws:', // WebSocket for development
    'wss:', // Secure WebSocket
  ],
  'media-src': ["'self'", 'https:', 'data:'],
  'object-src': ["'none'"],
  'child-src': ["'self'"],
  'worker-src': ["'self'", 'blob:'],
  'frame-src': ["'self'"],
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'manifest-src': ["'self'"],
};

/**
 * Production CSP configuration (more restrictive)
 */
export const productionCSP: Partial<CSPDirectives> = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    'https://cdn.jsdelivr.net',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Temporary for styled components
    'https://fonts.googleapis.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:', // Allow HTTPS images
    // Add specific domains for trusted image sources
    'https://*.supabase.co',
  ],
  'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
  'connect-src': [
    "'self'",
    'https://*.supabase.co',
    'https://*.supabase.com',
    'https://marketplace-backend-prod.azurewebsites.net',
    'wss:', // For real-time subscriptions
  ],
  'media-src': ["'self'", 'https:'],
  'object-src': ["'none'"],
  'child-src': ["'none'"],
  'worker-src': ["'self'"],
  'frame-src': ["'none'"],
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'manifest-src': ["'self'"],
};

/**
 * CSP Manager class for handling Content Security Policy
 */
export class CSPManager {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment =
      process.env.NODE_ENV === 'development' ||
      (typeof window !== 'undefined' &&
        window.location.hostname === 'localhost');
  }

  /**
   * Get appropriate CSP configuration based on environment
   */
  getCSPConfig(): Partial<CSPDirectives> {
    return this.isDevelopment ? developmentCSP : productionCSP;
  }

  /**
   * Generate CSP header string
   */
  generateCSPHeader(): string {
    const config = this.getCSPConfig();
    return generateCSPHeader(config);
  }

  /**
   * Apply CSP meta tag to document head
   */
  applyCSPMetaTag(): void {
    // Remove existing CSP meta tag
    const existing = document.querySelector(
      'meta[http-equiv="Content-Security-Policy"]'
    );
    if (existing) {
      existing.remove();
    }

    // Create new CSP meta tag
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = this.generateCSPHeader();
    document.head.appendChild(meta);
  }

  /**
   * Check if CSP is supported
   */
  isCSPSupported(): boolean {
    return 'SecurityPolicyViolationEvent' in window;
  }

  /**
   * Set up CSP violation reporting
   */
  setupCSPReporting(): void {
    if (!this.isCSPSupported()) {
      console.warn('CSP violation reporting not supported');
      return;
    }

    document.addEventListener('securitypolicyviolation', event => {
      const violation = {
        documentURI: event.documentURI,
        violatedDirective: event.violatedDirective,
        blockedURI: event.blockedURI,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber,
        sourceFile: event.sourceFile,
        timestamp: new Date().toISOString(),
      };

      // Log to console in development
      if (this.isDevelopment) {
        console.warn('CSP Violation:', violation);
      }

      // Send to logging service in production
      if (!this.isDevelopment) {
        this.reportCSPViolation(violation);
      }
    });
  }

  /**
   * Report CSP violation to logging service
   */
  private async reportCSPViolation(violation: any): Promise<void> {
    try {
      // You can implement sending to your logging service here
      // For now, we'll just log to console
      console.error('CSP Violation (Production):', violation);

      // Example: Send to monitoring service
      // await fetch('/api/csp-violation', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(violation),
      // });
    } catch (error) {
      console.error('Failed to report CSP violation:', error);
    }
  }
}

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  // Prevent clickjacking attacks
  'X-Frame-Options': 'DENY',

  // Prevent content type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',

  // Strict transport security
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'accelerometer=()',
    'gyroscope=()',
  ].join(', '),
} as const;

/**
 * Apply security headers using meta tags (for client-side)
 * Note: Some headers like X-Frame-Options should be set by server
 */
export function applySecurityHeaders(): void {
  const headers = [
    {
      name: 'X-Content-Type-Options',
      content: SECURITY_HEADERS['X-Content-Type-Options'],
    },
    { name: 'X-XSS-Protection', content: SECURITY_HEADERS['X-XSS-Protection'] },
    { name: 'Referrer-Policy', content: SECURITY_HEADERS['Referrer-Policy'] },
  ];

  headers.forEach(({ name, content }) => {
    // Remove existing header
    const existing = document.querySelector(`meta[http-equiv="${name}"]`);
    if (existing) {
      existing.remove();
    }

    // Add new header
    const meta = document.createElement('meta');
    meta.httpEquiv = name;
    meta.content = content;
    document.head.appendChild(meta);
  });
}

/**
 * Initialize security configuration
 */
export function initializeSecurity(): void {
  const cspManager = new CSPManager();

  // Apply CSP
  cspManager.applyCSPMetaTag();

  // Set up CSP violation reporting
  cspManager.setupCSPReporting();

  // Apply other security headers
  applySecurityHeaders();

  console.log('🔒 Security configuration initialized');
}

// Global CSP manager instance
export const cspManager = new CSPManager();

export default CSPManager;
