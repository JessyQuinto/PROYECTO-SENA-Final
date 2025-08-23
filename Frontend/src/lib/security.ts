/**
 * Security utilities for input sanitization, validation, and protection
 */

import DOMPurify from 'dompurify';

interface SecurityConfig {
  enableCSP: boolean;
  enableXSSProtection: boolean;
  enableSanitization: boolean;
  maxInputLength: number;
  allowedImageTypes: string[];
  allowedFileTypes: string[];
}

const DEFAULT_CONFIG: SecurityConfig = {
  enableCSP: true,
  enableXSSProtection: true,
  enableSanitization: true,
  maxInputLength: 10000,
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  allowedFileTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
  ],
};

/**
 * Security manager class for handling various security operations
 */
export class SecurityManager {
  private config: SecurityConfig;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  sanitizeHTML(input: string): string {
    if (!this.config.enableSanitization) return input;

    const cleaned = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a'],
      ALLOWED_ATTR: ['href', 'target'],
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'style', 'link'],
      FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'style'],
      KEEP_CONTENT: false, // Don't keep content of forbidden tags
    });

    // Additional cleanup to ensure no script content remains
    return cleaned.replace(/<script[^>]*>.*?<\/script>/gis, '');
  }

  /**
   * Sanitize plain text input
   */
  sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') return '';

    // Use DOMPurify to remove all HTML tags and get text content only
    let sanitized = DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

    // Additional security: manually strip any remaining HTML-like content
    sanitized = sanitized.replace(/<[^>]*>/gi, '');
    sanitized = sanitized.replace(/&[^;]+;/gi, ''); // Remove HTML entities

    // Trim whitespace
    sanitized = sanitized.trim();

    // Limit length
    if (sanitized.length > this.config.maxInputLength) {
      sanitized = sanitized.substring(0, this.config.maxInputLength);
    }

    return sanitized;
  }

  /**
   * Validate and sanitize email input
   */
  sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') return '';

    // Basic email sanitization
    const sanitized = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) {
      throw new Error('Formato de email inválido');
    }

    return sanitized;
  }

  /**
   * Validate and sanitize URL input
   */
  sanitizeURL(url: string): string {
    if (!url || typeof url !== 'string') return '';

    try {
      const urlObj = new URL(url);

      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Protocolo de URL no permitido');
      }

      return urlObj.toString();
    } catch (error) {
      throw new Error('URL inválida');
    }
  }

  /**
   * Validate file type and size
   */
  validateFile(file: File, maxSizeMB: number = 5): void {
    // Check file type
    if (!this.config.allowedFileTypes.includes(file.type)) {
      throw new Error(`Tipo de archivo no permitido: ${file.type}`);
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new Error(`Archivo demasiado grande. Máximo: ${maxSizeMB}MB`);
    }

    // Check for potentially malicious file names
    if (this.isSuspiciousFileName(file.name)) {
      throw new Error('Nombre de archivo sospechoso');
    }
  }

  /**
   * Check for suspicious file names
   */
  private isSuspiciousFileName(fileName: string): boolean {
    const suspiciousPatterns = [
      /\.(exe|bat|cmd|scr|pif|vbs|js|jar|zip|rar)$/i,
      /\.\./,
      /[<>:"|?*]/,
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(fileName));
  }

  /**
   * Generate secure random string for tokens
   */
  generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join(
      ''
    );
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra mayúscula');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra minúscula');
    }

    if (!/\d/.test(password)) {
      errors.push('La contraseña debe contener al menos un número');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('La contraseña debe contener al menos un carácter especial');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Escape SQL-like strings (though we use Supabase which handles this)
   */
  escapeSQLString(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return input.replace(/['";\\]/g, '\\$&');
  }

  /**
   * Rate limiting check (client-side basic implementation)
   */
  checkRateLimit(
    key: string,
    maxAttempts: number = 5,
    windowMs: number = 15 * 60 * 1000
  ): boolean {
    const now = Date.now();
    const storageKey = `rate_limit_${key}`;

    try {
      const stored = localStorage.getItem(storageKey);
      const attempts = stored ? JSON.parse(stored) : [];

      // Filter attempts within the time window
      const validAttempts = attempts.filter(
        (time: number) => now - time < windowMs
      );

      if (validAttempts.length >= maxAttempts) {
        return false; // Rate limit exceeded
      }

      // Add current attempt
      validAttempts.push(now);
      localStorage.setItem(storageKey, JSON.stringify(validAttempts));

      return true; // Request allowed
    } catch (error) {
      console.warn('Rate limiting failed:', error);
      return true; // Allow request if storage fails
    }
  }

  /**
   * Clear rate limit for a key
   */
  clearRateLimit(key: string): void {
    const storageKey = `rate_limit_${key}`;
    localStorage.removeItem(storageKey);
  }

  /**
   * Validate numeric input
   */
  validateNumber(input: any, min?: number, max?: number): number {
    const num = Number(input);

    if (isNaN(num) || !isFinite(num)) {
      throw new Error('Valor numérico inválido');
    }

    if (min !== undefined && num < min) {
      throw new Error(`El valor debe ser mayor o igual a ${min}`);
    }

    if (max !== undefined && num > max) {
      throw new Error(`El valor debe ser menor o igual a ${max}`);
    }

    return num;
  }

  /**
   * Sanitize object recursively
   */
  sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
      return this.sanitizeText(obj);
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize key as well
        const sanitizedKey = this.sanitizeText(key);
        sanitized[sanitizedKey] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }
}

// Global security manager instance
export const security = new SecurityManager();

// Security constants
export const SECURITY_CONSTANTS = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  PASSWORD_MIN_LENGTH: 8,
  MAX_FILE_SIZE_MB: 5,
  MAX_IMAGE_SIZE_MB: 2,
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  CSRF_TOKEN_LENGTH: 32,
} as const;

// Input validation schemas (using simple validation)
export const ValidationSchemas = {
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error('Email inválido');
    }
    return security.sanitizeEmail(value);
  },

  password: (value: string) => {
    const validation = security.validatePassword(value);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }
    return value;
  },

  productName: (value: string) => {
    if (!value || value.trim().length < 3) {
      throw new Error(
        'El nombre del producto debe tener al menos 3 caracteres'
      );
    }
    if (value.length > 100) {
      throw new Error('El nombre del producto no puede exceder 100 caracteres');
    }
    return security.sanitizeText(value);
  },

  price: (value: any) => {
    return security.validateNumber(value, 0.01, 999999.99);
  },

  stock: (value: any) => {
    return security.validateNumber(value, 0, 999999);
  },

  description: (value: string) => {
    if (value && value.length > 2000) {
      throw new Error('La descripción no puede exceder 2000 caracteres');
    }
    return security.sanitizeHTML(value);
  },
} as const;

export default security;
