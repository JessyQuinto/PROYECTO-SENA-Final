import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  security,
  SecurityManager,
  SECURITY_CONSTANTS,
  ValidationSchemas,
} from '@/lib/security';

interface UseRateLimitReturn {
  isAllowed: boolean;
  remainingAttempts: number;
  resetTime: number | null;
  checkLimit: () => boolean;
  clearLimit: () => void;
}

/**
 * Hook for client-side rate limiting
 */
export function useRateLimit(
  key: string,
  maxAttempts: number = SECURITY_CONSTANTS.MAX_LOGIN_ATTEMPTS,
  windowMs: number = SECURITY_CONSTANTS.LOGIN_LOCKOUT_DURATION
): UseRateLimitReturn {
  const [isAllowed, setIsAllowed] = useState(true);
  const [remainingAttempts, setRemainingAttempts] = useState(maxAttempts);
  const [resetTime, setResetTime] = useState<number | null>(null);

  const checkLimit = useCallback(() => {
    const allowed = security.checkRateLimit(key, maxAttempts, windowMs);
    setIsAllowed(allowed);

    if (!allowed) {
      setResetTime(Date.now() + windowMs);
      setRemainingAttempts(0);
    } else {
      // Calculate remaining attempts
      const storageKey = `rate_limit_${key}`;
      try {
        const stored = localStorage.getItem(storageKey);
        const attempts = stored ? JSON.parse(stored) : [];
        const validAttempts = attempts.filter(
          (time: number) => Date.now() - time < windowMs
        );
        setRemainingAttempts(Math.max(0, maxAttempts - validAttempts.length));
      } catch {
        setRemainingAttempts(maxAttempts);
      }
    }

    return allowed;
  }, [key, maxAttempts, windowMs]);

  const clearLimit = useCallback(() => {
    security.clearRateLimit(key);
    setIsAllowed(true);
    setRemainingAttempts(maxAttempts);
    setResetTime(null);
  }, [key, maxAttempts]);

  useEffect(() => {
    checkLimit();
  }, [checkLimit]);

  // Auto-reset when time expires
  useEffect(() => {
    if (resetTime && resetTime > Date.now()) {
      const timeout = setTimeout(() => {
        clearLimit();
      }, resetTime - Date.now());

      return () => clearTimeout(timeout);
    }
  }, [resetTime, clearLimit]);

  return {
    isAllowed,
    remainingAttempts,
    resetTime,
    checkLimit,
    clearLimit,
  };
}

interface UseSecureInputReturn<T> {
  value: T;
  sanitizedValue: string;
  isValid: boolean;
  error: string | null;
  setValue: (value: T) => void;
  validate: () => boolean;
  clear: () => void;
}

/**
 * Hook for secure input handling with validation and sanitization
 */
export function useSecureInput<T = string>(
  initialValue: T,
  validator?: (value: T) => T,
  sanitizer?: (value: T) => string
): UseSecureInputReturn<T> {
  const [value, setValue] = useState<T>(initialValue);
  const [error, setError] = useState<string | null>(null);

  const sanitizedValue = useMemo(() => {
    if (sanitizer) {
      return sanitizer(value);
    }
    if (typeof value === 'string') {
      return security.sanitizeText(value);
    }
    return String(value);
  }, [value, sanitizer]);

  const isValid = useMemo(() => {
    if (!validator) return true;

    try {
      validator(value);
      return true;
    } catch {
      return false;
    }
  }, [value, validator]);

  const validate = useCallback(() => {
    if (!validator) return true;

    try {
      validator(value);
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Valor inválido');
      return false;
    }
  }, [value, validator]);

  const clear = useCallback(() => {
    setValue(initialValue);
    setError(null);
  }, [initialValue]);

  return {
    value,
    sanitizedValue,
    isValid,
    error,
    setValue,
    validate,
    clear,
  };
}

/**
 * Hook for secure file upload handling
 */
export function useSecureFileUpload(
  maxSizeMB: number = SECURITY_CONSTANTS.MAX_FILE_SIZE_MB,
  allowedTypes?: string[]
) {
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const validateFile = useCallback(
    async (file: File): Promise<boolean> => {
      try {
        // Use custom SecurityManager instance if custom allowed types are provided
        if (allowedTypes) {
          const customSecurity = new SecurityManager({
            allowedFileTypes: allowedTypes,
          });
          customSecurity.validateFile(file, maxSizeMB);
        } else {
          security.validateFile(file, maxSizeMB);
        }
        return true;
      } catch (error) {
        return false;
      }
    },
    [maxSizeMB, allowedTypes]
  );

  const addFiles = useCallback(
    async (newFiles: FileList | File[]) => {
      setIsValidating(true);
      const fileArray = Array.from(newFiles);
      const validFiles: File[] = [];
      const fileErrors: string[] = [];

      for (const file of fileArray) {
        try {
          // Use custom SecurityManager instance if custom allowed types are provided
          if (allowedTypes) {
            const customSecurity = new SecurityManager({
              allowedFileTypes: allowedTypes,
            });
            customSecurity.validateFile(file, maxSizeMB);
          } else {
            security.validateFile(file, maxSizeMB);
          }
          validFiles.push(file);
        } catch (error) {
          fileErrors.push(
            `${file.name}: ${error instanceof Error ? error.message : 'Error desconocido'}`
          );
        }
      }

      setFiles(prev => [...prev, ...validFiles]);
      setErrors(prev => [...prev, ...fileErrors]);
      setIsValidating(false);
    },
    [maxSizeMB]
  );

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setErrors([]);
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return {
    files,
    errors,
    isValidating,
    addFiles,
    removeFile,
    clearFiles,
    clearErrors,
    hasErrors: errors.length > 0,
    hasFiles: files.length > 0,
  };
}

/**
 * Hook for password strength validation
 */
export function usePasswordValidation(password: string) {
  const validation = useMemo(() => {
    if (!password) {
      return { isValid: false, errors: [], score: 0 };
    }

    const result = security.validatePassword(password);

    // Calculate strength score (0-100)
    let score = 0;
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (/[A-Z]/.test(password)) score += 20;
    if (/[a-z]/.test(password)) score += 20;
    if (/\d/.test(password)) score += 15;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15;

    return {
      ...result,
      score: Math.min(100, score),
    };
  }, [password]);

  const strengthLevel = useMemo(() => {
    if (validation.score < 30) return 'weak';
    if (validation.score < 60) return 'medium';
    if (validation.score < 80) return 'good';
    return 'strong';
  }, [validation.score]);

  const strengthColor = useMemo(() => {
    switch (strengthLevel) {
      case 'weak':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'good':
        return '#10b981';
      case 'strong':
        return '#059669';
      default:
        return '#6b7280';
    }
  }, [strengthLevel]);

  return {
    ...validation,
    strengthLevel,
    strengthColor,
  };
}

/**
 * Hook for form validation with security features
 */
export function useSecureForm<T extends Record<string, any>>(
  initialValues: T,
  validationSchema: Partial<Record<keyof T, (value: any) => any>>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = useCallback(
    (field: keyof T, value: any) => {
      setValues(prev => ({ ...prev, [field]: value }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const setFieldTouched = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const validateField = useCallback(
    (field: keyof T): boolean => {
      const validator = validationSchema[field];
      if (!validator) return true;

      try {
        validator(values[field]);
        setErrors(prev => ({ ...prev, [field]: undefined }));
        return true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Valor inválido';
        setErrors(prev => ({ ...prev, [field]: message }));
        return false;
      }
    },
    [values, validationSchema]
  );

  const validateAll = useCallback((): boolean => {
    let isValid = true;
    const newErrors: Partial<Record<keyof T, string>> = {};

    for (const [field, validator] of Object.entries(validationSchema)) {
      if (validator) {
        try {
          validator(values[field as keyof T]);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Valor inválido';
          newErrors[field as keyof T] = message;
          isValid = false;
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [values, validationSchema]);

  const sanitizedValues = useMemo(() => {
    return security.sanitizeObject(values);
  }, [values]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    sanitizedValues,
    errors,
    touched,
    setValue,
    setTouched: setFieldTouched,
    validateField,
    validateAll,
    reset,
    isValid: Object.keys(errors).length === 0,
    hasErrors: Object.keys(errors).length > 0,
  };
}

/**
 * Common validation schemas for forms
 */
export const secureValidationSchemas = {
  email: ValidationSchemas.email,
  password: ValidationSchemas.password,
  productName: ValidationSchemas.productName,
  price: ValidationSchemas.price,
  stock: ValidationSchemas.stock,
  description: ValidationSchemas.description,

  // Additional common validations
  name: (value: string) => {
    if (!value || value.trim().length < 2) {
      throw new Error('El nombre debe tener al menos 2 caracteres');
    }
    if (value.length > 50) {
      throw new Error('El nombre no puede exceder 50 caracteres');
    }
    return security.sanitizeText(value);
  },

  phone: (value: string) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
      throw new Error('Número de teléfono inválido');
    }
    return security.sanitizeText(value);
  },
} as const;
