import { describe, it, expect, beforeEach, vi } from 'vitest';
import { security, ValidationSchemas, SECURITY_CONSTANTS } from '../security';

// Mock DOM Purify for testing
vi.mock('dompurify', () => ({
  default: {
    sanitize: (input: string, config?: any) => {
      // More comprehensive mock that strips all HTML tags
      return input.replace(/<[^>]*>/g, '');
    },
  },
}));

// Mock crypto for testing
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
});

// Mock localStorage for testing
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {};
  }),
  get length() {
    return Object.keys(localStorageMock.store).length;
  },
  key: vi.fn((index: number) => {
    const keys = Object.keys(localStorageMock.store);
    return keys[index] || null;
  }),
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('Security System', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    localStorageMock.store = {};
  });

  describe('Input Sanitization', () => {
    it('should sanitize HTML content', () => {
      const maliciousHTML = '<script>alert("xss")</script><p>Safe content</p>';
      const sanitized = security.sanitizeHTML(maliciousHTML);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('<p>Safe content</p>');
    });

    it('should sanitize text input', () => {
      const maliciousText = '<script>alert("xss")</script>Normal text';
      const sanitized = security.sanitizeText(maliciousText);

      expect(sanitized).toBe('Normal text');
      expect(sanitized).not.toContain('<script>');
    });

    it('should enforce maximum input length', () => {
      const longText = 'a'.repeat(20000);
      const sanitized = security.sanitizeText(longText);

      expect(sanitized.length).toBeLessThanOrEqual(10000);
    });

    it('should trim whitespace', () => {
      const textWithWhitespace = '  \t\n  Valid text  \t\n  ';
      const sanitized = security.sanitizeText(textWithWhitespace);

      expect(sanitized).toBe('Valid text');
    });
  });

  describe('Email Validation', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.org',
        'test+tag@example.co.uk',
      ];

      validEmails.forEach(email => {
        expect(() => security.sanitizeEmail(email)).not.toThrow();
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example',
        '',
        'test@.com',
      ];

      invalidEmails.forEach(email => {
        expect(() => security.sanitizeEmail(email)).toThrow();
      });
    });

    it('should normalize email to lowercase', () => {
      const email = 'TEST@EXAMPLE.COM';
      const sanitized = security.sanitizeEmail(email);

      expect(sanitized).toBe('test@example.com');
    });
  });

  describe('URL Validation', () => {
    it('should validate correct URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://localhost:3000',
        'https://subdomain.example.org/path?query=value',
      ];

      validUrls.forEach(url => {
        expect(() => security.sanitizeURL(url)).not.toThrow();
      });
    });

    it('should reject invalid protocols', () => {
      const invalidUrls = [
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'ftp://example.com',
      ];

      invalidUrls.forEach(url => {
        expect(() => security.sanitizeURL(url)).toThrow();
      });
    });

    it('should reject malformed URLs', () => {
      const malformedUrls = ['not-a-url', 'http://', '', 'http://.com'];

      malformedUrls.forEach(url => {
        expect(() => security.sanitizeURL(url)).toThrow();
      });
    });
  });

  describe('File Validation', () => {
    it('should validate allowed file types', () => {
      const allowedFile = new File(['content'], 'image.jpg', {
        type: 'image/jpeg',
      });

      expect(() => security.validateFile(allowedFile)).not.toThrow();
    });

    it('should reject disallowed file types', () => {
      const disallowedFile = new File(['content'], 'script.js', {
        type: 'application/javascript',
      });

      expect(() => security.validateFile(disallowedFile)).toThrow();
    });

    it('should reject oversized files', () => {
      const oversizedFile = new File(
        ['x'.repeat(6 * 1024 * 1024)],
        'large.jpg',
        { type: 'image/jpeg' }
      );

      expect(() => security.validateFile(oversizedFile, 5)).toThrow();
    });

    it('should reject suspicious file names', () => {
      const suspiciousFiles = [
        new File(['content'], 'malware.exe', { type: 'image/jpeg' }),
        new File(['content'], '../../../etc/passwd', { type: 'image/jpeg' }),
        new File(['content'], 'file<script>.jpg', { type: 'image/jpeg' }),
      ];

      suspiciousFiles.forEach(file => {
        expect(() => security.validateFile(file)).toThrow();
      });
    });
  });

  describe('Password Validation', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'MyStr0ng!Password',
        'C0mpl3x@P4ssw0rd!',
        'Secur3#Pass123',
      ];

      strongPasswords.forEach(password => {
        const result = security.validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'short',
        'alllowercase123',
        'ALLUPPERCASE123',
        'NoNumbers!',
        'NoSpecialChars123',
      ];

      weakPasswords.forEach(password => {
        const result = security.validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should provide specific error messages', () => {
      const result = security.validatePassword('weak');

      expect(result.errors).toContain(
        'La contraseña debe tener al menos 8 caracteres'
      );
      expect(result.errors).toContain(
        'La contraseña debe contener al menos una letra mayúscula'
      );
      expect(result.errors).toContain(
        'La contraseña debe contener al menos un número'
      );
      expect(result.errors).toContain(
        'La contraseña debe contener al menos un carácter especial'
      );
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', () => {
      const result = security.checkRateLimit('test-key', 5, 60000);
      expect(result).toBe(true);
    });

    it('should block requests exceeding rate limit', () => {
      const key = 'rate-limit-test';

      // Make maximum allowed requests
      for (let i = 0; i < 5; i++) {
        security.checkRateLimit(key, 5, 60000);
      }

      // Next request should be blocked
      const result = security.checkRateLimit(key, 5, 60000);
      expect(result).toBe(false);
    });

    it('should reset rate limit after time window', () => {
      const key = 'time-window-test';

      // Mock time for testing
      const originalNow = Date.now;
      Date.now = vi.fn(() => 1000000);

      // Exceed rate limit
      for (let i = 0; i < 6; i++) {
        security.checkRateLimit(key, 5, 1000);
      }

      // Advance time past window
      Date.now = vi.fn(() => 1000000 + 2000);

      // Should allow requests again
      const result = security.checkRateLimit(key, 5, 1000);
      expect(result).toBe(true);

      // Restore original Date.now
      Date.now = originalNow;
    });

    it('should clear rate limit manually', () => {
      const key = 'clear-test';

      // Exceed rate limit
      for (let i = 0; i < 6; i++) {
        security.checkRateLimit(key, 5, 60000);
      }

      // Clear rate limit
      security.clearRateLimit(key);

      // Should allow requests again
      const result = security.checkRateLimit(key, 5, 60000);
      expect(result).toBe(true);
    });
  });

  describe('Number Validation', () => {
    it('should validate valid numbers', () => {
      const validNumbers = [123, 0, -456, 3.14, '789'];

      validNumbers.forEach(num => {
        expect(() => security.validateNumber(num)).not.toThrow();
      });
    });

    it('should reject invalid numbers', () => {
      const invalidNumbers = ['not-a-number', NaN, Infinity, 'abc123'];

      invalidNumbers.forEach(num => {
        expect(() => security.validateNumber(num)).toThrow();
      });
    });

    it('should enforce min/max constraints', () => {
      expect(() => security.validateNumber(5, 10, 20)).toThrow(); // Below min
      expect(() => security.validateNumber(25, 10, 20)).toThrow(); // Above max
      expect(() => security.validateNumber(15, 10, 20)).not.toThrow(); // Within range
    });
  });

  describe('Object Sanitization', () => {
    it('should sanitize nested objects', () => {
      const maliciousObject = {
        name: '<script>alert("xss")</script>John',
        email: '  test@example.com  ',
        details: {
          bio: '<p>Safe content</p><script>alert("nested")</script>',
          age: '25',
        },
        tags: ['<script>tag1</script>', 'tag2'],
      };

      const sanitized = security.sanitizeObject(maliciousObject);

      expect(sanitized.name).toBe('John');
      expect(sanitized.email).toBe('test@example.com');
      expect(sanitized.details.bio).not.toContain('<script>');
      expect(sanitized.tags[0]).toBe('tag1');
      expect(sanitized.tags[1]).toBe('tag2');
    });

    it('should handle null and undefined values', () => {
      const objectWithNulls = {
        value1: null,
        value2: undefined,
        value3: 'valid',
      };

      const sanitized = security.sanitizeObject(objectWithNulls);

      expect(sanitized.value1).toBeNull();
      expect(sanitized.value2).toBeUndefined();
      expect(sanitized.value3).toBe('valid');
    });
  });

  describe('Token Generation', () => {
    it('should generate secure random tokens', () => {
      const token1 = security.generateSecureToken(32);
      const token2 = security.generateSecureToken(32);

      expect(token1).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2); // Should be different
      expect(/^[0-9a-f]+$/.test(token1)).toBe(true); // Should be hex
    });

    it('should respect custom length', () => {
      const shortToken = security.generateSecureToken(16);
      const longToken = security.generateSecureToken(64);

      expect(shortToken).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(longToken).toHaveLength(128); // 64 bytes = 128 hex chars
    });
  });
});

describe('Validation Schemas', () => {
  it('should validate email schema', () => {
    expect(() => ValidationSchemas.email('test@example.com')).not.toThrow();
    expect(() => ValidationSchemas.email('invalid-email')).toThrow();
  });

  it('should validate product name schema', () => {
    expect(() =>
      ValidationSchemas.productName('Valid Product Name')
    ).not.toThrow();
    expect(() => ValidationSchemas.productName('ab')).toThrow(); // Too short
    expect(() => ValidationSchemas.productName('a'.repeat(101))).toThrow(); // Too long
  });

  it('should validate price schema', () => {
    expect(() => ValidationSchemas.price(99.99)).not.toThrow();
    expect(() => ValidationSchemas.price(0)).toThrow(); // Below minimum
    expect(() => ValidationSchemas.price(1000000)).toThrow(); // Above maximum
  });

  it('should validate stock schema', () => {
    expect(() => ValidationSchemas.stock(100)).not.toThrow();
    expect(() => ValidationSchemas.stock(-1)).toThrow(); // Negative
    expect(() => ValidationSchemas.stock(1000000)).toThrow(); // Too large
  });
});

describe('Security Constants', () => {
  it('should have proper security constants', () => {
    expect(SECURITY_CONSTANTS.MAX_LOGIN_ATTEMPTS).toBe(5);
    expect(SECURITY_CONSTANTS.LOGIN_LOCKOUT_DURATION).toBe(15 * 60 * 1000);
    expect(SECURITY_CONSTANTS.PASSWORD_MIN_LENGTH).toBe(8);
    expect(SECURITY_CONSTANTS.MAX_FILE_SIZE_MB).toBe(5);
    expect(SECURITY_CONSTANTS.SESSION_TIMEOUT).toBe(24 * 60 * 60 * 1000);
  });
});
