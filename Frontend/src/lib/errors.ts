// Error types and interfaces
export enum ErrorType {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NETWORK = 'network',
  DATABASE = 'database',
  BUSINESS_LOGIC = 'business_logic',
  UNKNOWN = 'unknown',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface AppError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  context?: {
    url: string;
    userAgent: string;
    component?: string;
    action?: string;
  };
  stack?: string;
  originalError?: Error;
}

export interface ErrorLogEntry extends AppError {
  handled: boolean;
  reportedToService: boolean;
}

// Custom error classes
export class BaseAppError extends Error {
  public readonly id: string;
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly code?: string;
  public readonly details?: Record<string, any>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    code?: string,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.id = this.generateErrorId();
    this.type = type;
    this.severity = severity;
    this.code = code;
    this.details = details;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON(): AppError {
    return {
      id: this.id,
      type: this.type,
      severity: this.severity,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
    };
  }
}

// Specific error classes
export class ValidationError extends BaseAppError {
  constructor(message: string, code?: string, details?: Record<string, any>) {
    super(message, ErrorType.VALIDATION, ErrorSeverity.LOW, code, details);
  }
}

export class AuthenticationError extends BaseAppError {
  constructor(message: string, code?: string, details?: Record<string, any>) {
    super(message, ErrorType.AUTHENTICATION, ErrorSeverity.HIGH, code, details);
  }
}

export class AuthorizationError extends BaseAppError {
  constructor(message: string, code?: string, details?: Record<string, any>) {
    super(message, ErrorType.AUTHORIZATION, ErrorSeverity.HIGH, code, details);
  }
}

export class NetworkError extends BaseAppError {
  constructor(message: string, code?: string, details?: Record<string, any>) {
    super(message, ErrorType.NETWORK, ErrorSeverity.MEDIUM, code, details);
  }
}

export class DatabaseError extends BaseAppError {
  constructor(message: string, code?: string, details?: Record<string, any>) {
    super(message, ErrorType.DATABASE, ErrorSeverity.HIGH, code, details);
  }
}

export class BusinessLogicError extends BaseAppError {
  constructor(message: string, code?: string, details?: Record<string, any>) {
    super(message, ErrorType.BUSINESS_LOGIC, ErrorSeverity.MEDIUM, code, details);
  }
}

// Error handler configuration
export interface ErrorHandlerConfig {
  enableLogging: boolean;
  enableReporting: boolean;
  reportingEndpoint?: string;
  maxLogEntries: number;
  enableUserFeedback: boolean;
  enableRetry: boolean;
  retryAttempts: number;
  retryDelay: number;
}

// Default configuration
export const DEFAULT_ERROR_CONFIG: ErrorHandlerConfig = {
  enableLogging: true,
  enableReporting: false, // Disabled by default, enable when you have an endpoint
  maxLogEntries: 100,
  enableUserFeedback: true,
  enableRetry: true,
  retryAttempts: 3,
  retryDelay: 1000,
};

// Error utility functions
export const ErrorUtils = {
  isAppError: (error: any): error is BaseAppError => {
    return error instanceof BaseAppError;
  },

  isNetworkError: (error: any): boolean => {
    return (
      error instanceof NetworkError ||
      (error?.name === 'NetworkError') ||
      (error?.code === 'NETWORK_ERROR') ||
      (error?.message?.includes('fetch') && error?.message?.includes('failed'))
    );
  },

  isValidationError: (error: any): boolean => {
    return (
      error instanceof ValidationError ||
      (error?.name === 'ValidationError') ||
      (error?.code === 'VALIDATION_ERROR')
    );
  },

  isAuthError: (error: any): boolean => {
    return (
      error instanceof AuthenticationError ||
      error instanceof AuthorizationError ||
      (error?.message?.includes('auth')) ||
      (error?.status === 401 || error?.status === 403)
    );
  },

  getUserFriendlyMessage: (error: any): string => {
    if (ErrorUtils.isAppError(error)) {
      return error.message;
    }

    if (ErrorUtils.isNetworkError(error)) {
      return 'Problema de conexión. Por favor, verifica tu conexión a internet.';
    }

    if (ErrorUtils.isValidationError(error)) {
      return 'Los datos ingresados no son válidos. Por favor, revisa la información.';
    }

    if (ErrorUtils.isAuthError(error)) {
      return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
    }

    // Generic message for unknown errors
    return 'Ha ocurrido un error inesperado. Por favor, intenta de nuevo.';
  },

  extractErrorInfo: (error: any): Partial<AppError> => {
    const baseInfo = {
      timestamp: new Date(),
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
    };

    if (ErrorUtils.isAppError(error)) {
      return { ...error.toJSON(), ...baseInfo };
    }

    // Extract info from native errors
    if (error instanceof Error) {
      return {
        ...baseInfo,
        id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: ErrorType.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
        message: error.message,
        stack: error.stack,
        originalError: error,
      };
    }

    // Handle non-Error objects
    return {
      ...baseInfo,
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      message: typeof error === 'string' ? error : 'Unknown error occurred',
      details: typeof error === 'object' ? error : undefined,
    };
  },

  shouldRetry: (error: any, attempt: number, maxAttempts: number): boolean => {
    if (attempt >= maxAttempts) return false;

    // Don't retry validation or auth errors
    if (ErrorUtils.isValidationError(error) || ErrorUtils.isAuthError(error)) {
      return false;
    }

    // Retry network errors and server errors
    return (
      ErrorUtils.isNetworkError(error) ||
      (error?.status >= 500 && error?.status < 600)
    );
  },
};