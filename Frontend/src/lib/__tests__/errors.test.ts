import { describe, it, expect } from 'vitest';
import {
  ErrorType,
  ErrorSeverity,
  BaseAppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NetworkError,
  DatabaseError,
  BusinessLogicError,
  ErrorUtils,
  DEFAULT_ERROR_CONFIG
} from '../errors';

describe('Error Types', () => {
  it('should have correct error types', () => {
    expect(ErrorType.VALIDATION).toBe('validation');
    expect(ErrorType.AUTHENTICATION).toBe('authentication');
    expect(ErrorType.AUTHORIZATION).toBe('authorization');
    expect(ErrorType.NETWORK).toBe('network');
    expect(ErrorType.DATABASE).toBe('database');
    expect(ErrorType.BUSINESS_LOGIC).toBe('business_logic');
    expect(ErrorType.UNKNOWN).toBe('unknown');
  });

  it('should have correct error severities', () => {
    expect(ErrorSeverity.LOW).toBe('low');
    expect(ErrorSeverity.MEDIUM).toBe('medium');
    expect(ErrorSeverity.HIGH).toBe('high');
    expect(ErrorSeverity.CRITICAL).toBe('critical');
  });
});

describe('BaseAppError', () => {
  it('should create a base app error with correct properties', () => {
    const error = new BaseAppError('Test error message');
    
    expect(error).toBeInstanceOf(BaseAppError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Test error message');
    expect(error.type).toBe(ErrorType.UNKNOWN);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.id).toMatch(/^err_\d+_[a-z0-9]+$/);
    expect(error.timestamp).toBeInstanceOf(Date);
  });

  it('should create a base app error with custom properties', () => {
    const error = new BaseAppError(
      'Custom error message',
      ErrorType.VALIDATION,
      ErrorSeverity.HIGH,
      'CUSTOM_CODE',
      { field: 'testField', value: 'testValue' }
    );
    
    expect(error.message).toBe('Custom error message');
    expect(error.type).toBe(ErrorType.VALIDATION);
    expect(error.severity).toBe(ErrorSeverity.HIGH);
    expect(error.code).toBe('CUSTOM_CODE');
    expect(error.details).toEqual({ field: 'testField', value: 'testValue' });
  });

  it('should convert to JSON correctly', () => {
    const error = new BaseAppError('Test error');
    const json = error.toJSON();
    
    expect(json.id).toBe(error.id);
    expect(json.type).toBe(error.type);
    expect(json.severity).toBe(error.severity);
    expect(json.message).toBe(error.message);
    expect(json.timestamp).toBe(error.timestamp);
    expect(json.context).toBeDefined();
    // Solo verificamos que las propiedades existan, no sus valores específicos
    expect(json.context?.url).toBeDefined();
    expect(json.context?.userAgent).toBeDefined();
  });
});

describe('Specific Error Classes', () => {
  it('should create ValidationError with correct properties', () => {
    const error = new ValidationError('Validation failed');
    
    expect(error).toBeInstanceOf(ValidationError);
    expect(error).toBeInstanceOf(BaseAppError);
    expect(error.type).toBe(ErrorType.VALIDATION);
    expect(error.severity).toBe(ErrorSeverity.LOW);
  });

  it('should create AuthenticationError with correct properties', () => {
    const error = new AuthenticationError('Authentication failed');
    
    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error).toBeInstanceOf(BaseAppError);
    expect(error.type).toBe(ErrorType.AUTHENTICATION);
    expect(error.severity).toBe(ErrorSeverity.HIGH);
  });

  it('should create AuthorizationError with correct properties', () => {
    const error = new AuthorizationError('Authorization failed');
    
    expect(error).toBeInstanceOf(AuthorizationError);
    expect(error).toBeInstanceOf(BaseAppError);
    expect(error.type).toBe(ErrorType.AUTHORIZATION);
    expect(error.severity).toBe(ErrorSeverity.HIGH);
  });

  it('should create NetworkError with correct properties', () => {
    const error = new NetworkError('Network error occurred');
    
    expect(error).toBeInstanceOf(NetworkError);
    expect(error).toBeInstanceOf(BaseAppError);
    expect(error.type).toBe(ErrorType.NETWORK);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
  });

  it('should create DatabaseError with correct properties', () => {
    const error = new DatabaseError('Database error occurred');
    
    expect(error).toBeInstanceOf(DatabaseError);
    expect(error).toBeInstanceOf(BaseAppError);
    expect(error.type).toBe(ErrorType.DATABASE);
    expect(error.severity).toBe(ErrorSeverity.HIGH);
  });

  it('should create BusinessLogicError with correct properties', () => {
    const error = new BusinessLogicError('Business logic error occurred');
    
    expect(error).toBeInstanceOf(BusinessLogicError);
    expect(error).toBeInstanceOf(BaseAppError);
    expect(error.type).toBe(ErrorType.BUSINESS_LOGIC);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
  });
});

describe('ErrorUtils', () => {
  it('should identify AppError correctly', () => {
    const appError = new BaseAppError('Test error');
    const regularError = new Error('Regular error');
    
    expect(ErrorUtils.isAppError(appError)).toBe(true);
    expect(ErrorUtils.isAppError(regularError)).toBe(false);
    expect(ErrorUtils.isAppError(null)).toBe(false);
    expect(ErrorUtils.isAppError(undefined)).toBe(false);
  });

  it('should identify network errors correctly', () => {
    const networkError = new NetworkError('Network error');
    const regularError = new Error('Regular error');
    
    expect(ErrorUtils.isNetworkError(networkError)).toBe(true);
    expect(ErrorUtils.isNetworkError(regularError)).toBe(false);
    
    // Test with error-like objects
    expect(ErrorUtils.isNetworkError({ name: 'NetworkError' })).toBe(true);
    expect(ErrorUtils.isNetworkError({ code: 'NETWORK_ERROR' })).toBe(true);
    expect(ErrorUtils.isNetworkError({ message: 'fetch failed' })).toBe(true);
  });

  it('should identify validation errors correctly', () => {
    const validationError = new ValidationError('Validation error');
    const regularError = new Error('Regular error');
    
    expect(ErrorUtils.isValidationError(validationError)).toBe(true);
    expect(ErrorUtils.isValidationError(regularError)).toBe(false);
    
    // Test with error-like objects
    expect(ErrorUtils.isValidationError({ name: 'ValidationError' })).toBe(true);
    expect(ErrorUtils.isValidationError({ code: 'VALIDATION_ERROR' })).toBe(true);
  });

  it('should identify auth errors correctly', () => {
    const authError = new AuthenticationError('Auth error');
    const regularError = new Error('Regular error');
    
    expect(ErrorUtils.isAuthError(authError)).toBe(true);
    expect(ErrorUtils.isAuthError(regularError)).toBe(false);
    
    // Test with error-like objects
    expect(ErrorUtils.isAuthError({ message: 'auth failed' })).toBe(true);
    expect(ErrorUtils.isAuthError({ status: 401 })).toBe(true);
    expect(ErrorUtils.isAuthError({ status: 403 })).toBe(true);
  });

  it('should provide user-friendly messages', () => {
    const validationError = new ValidationError('Validation error');
    const networkError = new NetworkError('Network error');
    const authError = new AuthenticationError('Auth error');
    const unknownError = new Error('Unknown error');
    
    expect(ErrorUtils.getUserFriendlyMessage(validationError)).toBe('Los datos ingresados no son válidos. Por favor, revisa la información.');
    expect(ErrorUtils.getUserFriendlyMessage(networkError)).toBe('Problema de conexión. Por favor, verifica tu conexión a internet.');
    expect(ErrorUtils.getUserFriendlyMessage(authError)).toBe('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    expect(ErrorUtils.getUserFriendlyMessage(unknownError)).toBe('Ha ocurrido un error inesperado. Por favor, intenta de nuevo.');
  });

  it('should extract error info correctly', () => {
    const appError = new BaseAppError('App error');
    const regularError = new Error('Regular error');
    const stringError = 'String error';
    
    const appErrorInfo = ErrorUtils.extractErrorInfo(appError);
    const regularErrorInfo = ErrorUtils.extractErrorInfo(regularError);
    const stringErrorInfo = ErrorUtils.extractErrorInfo(stringError);
    
    expect(appErrorInfo.id).toBe(appError.id);
    expect(appErrorInfo.type).toBe(appError.type);
    expect(appErrorInfo.message).toBe(appError.message);
    
    expect(regularErrorInfo.message).toBe(regularError.message);
    expect(regularErrorInfo.type).toBe(ErrorType.UNKNOWN);
    
    expect(stringErrorInfo.message).toBe(stringError);
    expect(stringErrorInfo.type).toBe(ErrorType.UNKNOWN);
  });

  it('should determine retry logic correctly', () => {
    const networkError = new NetworkError('Network error');
    const validationError = new ValidationError('Validation error');
    const authError = new AuthenticationError('Auth error');
    const serverError = { status: 500 };
    const clientError = { status: 400 };
    
    expect(ErrorUtils.shouldRetry(networkError, 0, 3)).toBe(true);
    expect(ErrorUtils.shouldRetry(serverError, 0, 3)).toBe(true);
    expect(ErrorUtils.shouldRetry(validationError, 0, 3)).toBe(false);
    expect(ErrorUtils.shouldRetry(authError, 0, 3)).toBe(false);
    expect(ErrorUtils.shouldRetry(clientError, 0, 3)).toBe(false);
    
    // Test max attempts
    expect(ErrorUtils.shouldRetry(networkError, 3, 3)).toBe(false);
  });
});

describe('Default Error Config', () => {
  it('should have correct default configuration', () => {
    expect(DEFAULT_ERROR_CONFIG.enableLogging).toBe(true);
    expect(DEFAULT_ERROR_CONFIG.enableReporting).toBe(false);
    expect(DEFAULT_ERROR_CONFIG.maxLogEntries).toBe(100);
    expect(DEFAULT_ERROR_CONFIG.enableUserFeedback).toBe(true);
    expect(DEFAULT_ERROR_CONFIG.enableRetry).toBe(true);
    expect(DEFAULT_ERROR_CONFIG.retryAttempts).toBe(3);
    expect(DEFAULT_ERROR_CONFIG.retryDelay).toBe(1000);
  });
});