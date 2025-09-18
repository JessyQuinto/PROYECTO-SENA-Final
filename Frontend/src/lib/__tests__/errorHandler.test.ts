import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toast } from 'sonner';
import {
  ErrorHandler,
  handleError,
  logInfo,
  logWarning,
  createAsyncWrapper
} from '../errorHandler';
import {
  BaseAppError,
  ErrorType,
  ErrorSeverity,
  ValidationError,
  NetworkError
} from '../errors';

// Mock de toast
vi.mock('sonner', () => ({
  toast: vi.fn().mockImplementation(() => {}),
}));

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  const mockConfig = {
    enableLogging: true,
    enableReporting: false,
    maxLogEntries: 50,
    enableUserFeedback: true,
    enableRetry: true,
    retryAttempts: 2,
    retryDelay: 100,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    errorHandler = new ErrorHandler(mockConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should create ErrorHandler with default config', () => {
      const defaultHandler = new ErrorHandler();
      
      expect(defaultHandler).toBeInstanceOf(ErrorHandler);
    });

    it('should create ErrorHandler with custom config', () => {
      expect(errorHandler).toBeInstanceOf(ErrorHandler);
    });
  });

  describe('handleError', () => {
    it('should handle BaseAppError correctly', () => {
      const error = new BaseAppError('Test error');
      const context = { component: 'TestComponent', action: 'testAction' };
      
      const result = errorHandler.handleError(error, context);
      
      expect(result).toBeDefined();
      expect(result.message).toBe('Test error');
      expect(result.context?.component).toBe('TestComponent');
      expect(result.context?.action).toBe('testAction');
    });

    it('should handle regular Error correctly', () => {
      const error = new Error('Regular error');
      const context = { component: 'TestComponent' };
      
      const result = errorHandler.handleError(error, context);
      
      expect(result).toBeDefined();
      expect(result.message).toBe('Regular error');
      expect(result.type).toBe(ErrorType.UNKNOWN);
    });

    it('should handle string error correctly', () => {
      const error = 'String error';
      const result = errorHandler.handleError(error);
      
      expect(result).toBeDefined();
      expect(result.message).toBe('String error');
      expect(result.type).toBe(ErrorType.UNKNOWN);
    });

    it('should log error when logging is enabled', () => {
      const error = new BaseAppError('Test error');
      const result = errorHandler.handleError(error);
      
      const errorLog = errorHandler.getErrorLog();
      expect(errorLog).toHaveLength(1);
      expect(errorLog[0].id).toBe(result.id);
    });

    it('should not log error when logging is disabled', () => {
      const handler = new ErrorHandler({ ...mockConfig, enableLogging: false });
      const error = new BaseAppError('Test error');
      
      handler.handleError(error);
      const errorLog = handler.getErrorLog();
      
      expect(errorLog).toHaveLength(0);
    });

    it('should show user feedback when enabled', () => {
      const error = new BaseAppError('Test error');
      
      errorHandler.handleError(error);
      
      expect(toast).toHaveBeenCalled();
    });

    it('should not show user feedback when disabled', () => {
      const handler = new ErrorHandler({ ...mockConfig, enableUserFeedback: false });
      const error = new BaseAppError('Test error');
      
      handler.handleError(error);
      
      expect(toast).not.toHaveBeenCalled();
    });

    it('should queue for retry when retry is enabled and applicable', () => {
      const handler = new ErrorHandler({ ...mockConfig, enableRetry: true });
      // Crear un error que debería ser reintentado
      const error = new NetworkError('Network error');
      
      // Mock queueForRetry para verificar que se llama
      const queueForRetrySpy = vi.spyOn(handler as any, 'queueForRetry').mockImplementation(() => {});
      
      handler.handleError(error);
      
      // Verificar que queueForRetry haya sido llamado
      expect(queueForRetrySpy).toHaveBeenCalled();
    });
  });

  describe('Error Logging', () => {
    it('should maintain error log size within limits', () => {
      const handler = new ErrorHandler({ ...mockConfig, maxLogEntries: 2 });
      
      // Add more errors than the limit
      for (let i = 0; i < 5; i++) {
        const error = new BaseAppError(`Error ${i}`);
        handler.handleError(error);
      }
      
      const errorLog = handler.getErrorLog();
      expect(errorLog).toHaveLength(2);
    });

    it('should clear error log', () => {
      const error = new BaseAppError('Test error');
      errorHandler.handleError(error);
      
      expect(errorHandler.getErrorLog()).toHaveLength(1);
      
      errorHandler.clearErrorLog();
      expect(errorHandler.getErrorLog()).toHaveLength(0);
    });

    it('should get error stats', () => {
      // Mock toast.error para evitar errores
      (toast as any).error = vi.fn();
      
      const error1 = new BaseAppError('Error 1', ErrorType.VALIDATION, ErrorSeverity.LOW);
      const error2 = new BaseAppError('Error 2', ErrorType.NETWORK, ErrorSeverity.HIGH);
      
      errorHandler.handleError(error1);
      errorHandler.handleError(error2);
      
      const stats = errorHandler.getErrorStats();
      
      expect(stats.total).toBe(2);
      expect(stats.byType[ErrorType.VALIDATION]).toBe(1);
      expect(stats.byType[ErrorType.NETWORK]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.LOW]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.HIGH]).toBe(1);
    });
  });

  describe('Utility Methods', () => {
    it('should get severity emoji correctly', () => {
      const getSeverityEmoji = (errorHandler as any).getSeverityEmoji;
      
      expect(getSeverityEmoji(ErrorSeverity.LOW)).toBe('🟡');
      expect(getSeverityEmoji(ErrorSeverity.MEDIUM)).toBe('🟠');
      expect(getSeverityEmoji(ErrorSeverity.HIGH)).toBe('🔴');
      expect(getSeverityEmoji(ErrorSeverity.CRITICAL)).toBe('💥');
      expect(getSeverityEmoji('unknown' as ErrorSeverity)).toBe('❓');
    });
  });

  describe('Async Wrapper', () => {
    it('should wrap async function and handle errors', async () => {
      const asyncFn = async () => {
        throw new Error('Async error');
      };
      
      const wrappedFn = errorHandler.createAsyncWrapper(asyncFn, { component: 'Test' });
      
      await expect(wrappedFn()).rejects.toThrow('Async error');
    });

    it('should wrap async function and allow successful execution', async () => {
      const asyncFn = async () => 'success';
      
      const wrappedFn = errorHandler.createAsyncWrapper(asyncFn, { component: 'Test' });
      
      const result = await wrappedFn();
      expect(result).toBe('success');
    });
  });

  describe('Convenience Functions', () => {
    it('should export handleError function', () => {
      const error = new BaseAppError('Test error');
      const result = handleError(error);
      
      expect(result).toBeDefined();
      expect(result.message).toBe('Test error');
    });

    it('should export logInfo function', () => {
      // This function uses the unified logger, so we just test it doesn't throw
      expect(() => {
        logInfo('Test info message', { detail: 'test' }, { component: 'Test' });
      }).not.toThrow();
    });

    it('should export logWarning function', () => {
      // This function uses the unified logger, so we just test it doesn't throw
      expect(() => {
        logWarning('Test warning message', { detail: 'test' }, { component: 'Test' });
      }).not.toThrow();
    });

    it('should export createAsyncWrapper function', () => {
      const asyncFn = async () => 'test';
      const wrappedFn = createAsyncWrapper(asyncFn, { component: 'Test' });
      
      expect(typeof wrappedFn).toBe('function');
    });
  });
});