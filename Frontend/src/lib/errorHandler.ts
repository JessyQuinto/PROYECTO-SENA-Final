import { toast } from 'sonner';
import {
  AppError,
  ErrorLogEntry,
  ErrorHandlerConfig,
  DEFAULT_ERROR_CONFIG,
  ErrorUtils,
  BaseAppError,
  ErrorSeverity,
  ErrorType,
} from './errors';

export class ErrorHandler {
  private config: ErrorHandlerConfig;
  private errorLog: ErrorLogEntry[] = [];
  private retryQueue: Map<string, { error: any; attempt: number; timestamp: number }> = new Map();

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...DEFAULT_ERROR_CONFIG, ...config };
    this.setupGlobalErrorHandlers();
  }

  // Set up global error handlers
  private setupGlobalErrorHandlers(): void {
    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        component: 'Global',
        action: 'Uncaught Error',
        url: event.filename,
        line: event.lineno,
        column: event.colno,
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, {
        component: 'Global',
        action: 'Unhandled Promise Rejection',
      });
    });
  }

  // Main error handling method
  public handleError(
    error: any,
    context?: {
      component?: string;
      action?: string;
      userId?: string;
      [key: string]: any;
    }
  ): AppError {
    const errorInfo = this.processError(error, context);
    
    // Log the error
    this.logError(errorInfo);
    
    // Report to external service if configured
    if (this.config.enableReporting) {
      this.reportError(errorInfo);
    }
    
    // Show user feedback if enabled
    if (this.config.enableUserFeedback) {
      this.showUserFeedback(errorInfo);
    }
    
    // Handle retry logic
    if (this.config.enableRetry && ErrorUtils.shouldRetry(error, 0, this.config.retryAttempts)) {
      this.queueForRetry(errorInfo, error);
    }

    return errorInfo;
  }

  // Process error into standard format
  private processError(error: any, context?: Record<string, any>): AppError {
    const baseInfo = ErrorUtils.extractErrorInfo(error);
    
    return {
      ...baseInfo,
      userId: context?.userId,
      context: {
        ...baseInfo.context,
        component: context?.component,
        action: context?.action,
        ...context,
      },
    } as AppError;
  }

  // Log error locally
  private logError(error: AppError): void {
    if (!this.config.enableLogging) return;

    const logEntry: ErrorLogEntry = {
      ...error,
      handled: true,
      reportedToService: false,
    };

    this.errorLog.push(logEntry);

    // Limit log size
    if (this.errorLog.length > this.config.maxLogEntries) {
      this.errorLog = this.errorLog.slice(-this.config.maxLogEntries);
    }

    // Console logging in development
    if (import.meta.env.DEV) {
      const emoji = this.getSeverityEmoji(error.severity);
      console.group(`${emoji} Error [${error.type}] - ${error.id}`);
      console.error('Message:', error.message);
      console.log('Details:', error.details);
      console.log('Context:', error.context);
      if (error.stack) console.log('Stack:', error.stack);
      console.groupEnd();
    }
  }

  // Report error to external service
  private async reportError(error: AppError): Promise<void> {
    if (!this.config.reportingEndpoint) return;

    try {
      const response = await fetch(this.config.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        // Mark as reported
        const logEntry = this.errorLog.find(entry => entry.id === error.id);
        if (logEntry) {
          logEntry.reportedToService = true;
        }
      }
    } catch (reportingError) {
      // Silently handle reporting failures to avoid infinite loops
      if (import.meta.env.DEV) {
        console.warn('Failed to report error:', reportingError);
      }
    }
  }

  // Show user-friendly feedback
  private showUserFeedback(error: AppError): void {
    const message = ErrorUtils.getUserFriendlyMessage(error);
    const isDestructive = error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL;

    if (isDestructive) {
      toast.error('Error', {
        description: message,
        duration: 10000,
      });
    } else {
      toast(message, {
        duration: 5000,
      });
    }
  }

  // Queue error for retry
  private queueForRetry(error: AppError, originalError: any): void {
    this.retryQueue.set(error.id, {
      error: originalError,
      attempt: 0,
      timestamp: Date.now(),
    });

    // Start retry process
    setTimeout(() => {
      this.processRetry(error.id);
    }, this.config.retryDelay);
  }

  // Process retry attempts
  private async processRetry(errorId: string): Promise<void> {
    const retryInfo = this.retryQueue.get(errorId);
    if (!retryInfo) return;

    retryInfo.attempt++;

    // Check if should continue retrying
    if (!ErrorUtils.shouldRetry(retryInfo.error, retryInfo.attempt, this.config.retryAttempts)) {
      this.retryQueue.delete(errorId);
      return;
    }

    // Exponential backoff
    const delay = this.config.retryDelay * Math.pow(2, retryInfo.attempt - 1);
    
    setTimeout(() => {
      this.processRetry(errorId);
    }, delay);
  }

  // Public methods for manual error handling
  public logInfo(message: string, details?: Record<string, any>, context?: Record<string, any>): void {
    if (import.meta.env.DEV) {
      console.log(`ℹ️ Info: ${message}`, { details, context });
    }
  }

  public logWarning(message: string, details?: Record<string, any>, context?: Record<string, any>): void {
    if (import.meta.env.DEV) {
      console.warn(`⚠️ Warning: ${message}`, { details, context });
    }
  }

  public clearErrorLog(): void {
    this.errorLog = [];
  }

  public getErrorLog(): ErrorLogEntry[] {
    return [...this.errorLog];
  }

  public getErrorStats(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    recent: number; // Last hour
  } {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const stats = {
      total: this.errorLog.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      recent: 0,
    };

    this.errorLog.forEach(error => {
      // Count by type
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      
      // Count by severity
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
      
      // Count recent errors
      if (error.timestamp.getTime() > oneHourAgo) {
        stats.recent++;
      }
    });

    return stats;
  }

  // Utility methods
  private getSeverityEmoji(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.LOW: return '🟡';
      case ErrorSeverity.MEDIUM: return '🟠';
      case ErrorSeverity.HIGH: return '🔴';
      case ErrorSeverity.CRITICAL: return '💥';
      default: return '❓';
    }
  }

  // Create error handling wrapper for async functions
  public createAsyncWrapper<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context?: Record<string, any>
  ): T {
    return (async (...args: any[]) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handleError(error, context);
        throw error; // Re-throw for upstream handling
      }
    }) as T;
  }

  // Create error boundary for React components
  public createErrorBoundary(fallbackComponent?: React.ComponentType<{ error: AppError }>) {
    // This would be implemented as a React Error Boundary component
    // For now, returning a placeholder
    return null;
  }
}

// Create and export singleton instance
export const errorHandler = new ErrorHandler();

// Export convenience functions
export const handleError = (error: any, context?: Record<string, any>) => 
  errorHandler.handleError(error, context);

export const logInfo = (message: string, details?: Record<string, any>, context?: Record<string, any>) =>
  errorHandler.logInfo(message, details, context);

export const logWarning = (message: string, details?: Record<string, any>, context?: Record<string, any>) =>
  errorHandler.logWarning(message, details, context);

export const createAsyncWrapper = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: Record<string, any>
) => errorHandler.createAsyncWrapper(fn, context);