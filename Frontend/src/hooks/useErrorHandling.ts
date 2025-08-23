import { useCallback, useEffect, useState } from 'react';
import { errorHandler } from '@/lib/errorHandler';
import { AppError, BaseAppError, ErrorType, ErrorSeverity } from '@/lib/errors';

interface UseErrorHandlingOptions {
  component?: string;
  enableRetry?: boolean;
  maxRetries?: number;
  onError?: (error: AppError) => void;
}

interface UseErrorHandlingReturn {
  error: AppError | null;
  isError: boolean;
  clearError: () => void;
  handleError: (error: any, context?: Record<string, any>) => AppError;
  handleAsyncError: <T>(
    asyncFn: () => Promise<T>,
    context?: Record<string, any>
  ) => Promise<T | null>;
  retryLastOperation: () => Promise<void>;
  errorStats: {
    total: number;
    recent: number;
  };
}

export const useErrorHandling = (
  options: UseErrorHandlingOptions = {}
): UseErrorHandlingReturn => {
  const [currentError, setCurrentError] = useState<AppError | null>(null);
  const [lastOperation, setLastOperation] = useState<
    (() => Promise<any>) | null
  >(null);
  const [retryCount, setRetryCount] = useState(0);

  const {
    component = 'UnknownComponent',
    enableRetry = true,
    maxRetries = 3,
    onError,
  } = options;

  // Clear error state
  const clearError = useCallback(() => {
    setCurrentError(null);
    setRetryCount(0);
  }, []);

  // Handle error
  const handleError = useCallback(
    (error: any, context: Record<string, any> = {}) => {
      const appError = errorHandler.handleError(error, {
        component,
        ...context,
      });

      setCurrentError(appError);

      if (onError) {
        onError(appError);
      }

      return appError;
    },
    [component, onError]
  );

  // Handle async operations with error handling
  const handleAsyncError = useCallback(
    async <T>(
      asyncFn: () => Promise<T>,
      context: Record<string, any> = {}
    ): Promise<T | null> => {
      try {
        // Store operation for potential retry
        if (enableRetry) {
          setLastOperation(() => asyncFn);
        }

        const result = await asyncFn();

        // Clear error on success
        if (currentError) {
          clearError();
        }

        return result;
      } catch (error) {
        handleError(error, {
          action: 'Async Operation',
          ...context,
        });
        return null;
      }
    },
    [enableRetry, currentError, clearError, handleError]
  );

  // Retry last operation
  const retryLastOperation = useCallback(async () => {
    if (!lastOperation || !enableRetry || retryCount >= maxRetries) {
      return;
    }

    try {
      setRetryCount(prev => prev + 1);
      await lastOperation();
      clearError();
    } catch (error) {
      handleError(error, {
        action: 'Retry Operation',
        retryAttempt: retryCount + 1,
      });
    }
  }, [
    lastOperation,
    enableRetry,
    retryCount,
    maxRetries,
    clearError,
    handleError,
  ]);

  // Get error statistics
  const errorStats = {
    total: errorHandler.getErrorLog().length,
    recent: errorHandler.getErrorStats().recent,
  };

  return {
    error: currentError,
    isError: currentError !== null,
    clearError,
    handleError,
    handleAsyncError,
    retryLastOperation,
    errorStats,
  };
};

// Hook for API error handling
interface UseApiErrorHandlingOptions extends UseErrorHandlingOptions {
  showToast?: boolean;
  redirectOnAuth?: boolean;
}

export const useApiErrorHandling = (
  options: UseApiErrorHandlingOptions = {}
) => {
  const { showToast = true, redirectOnAuth = true, ...baseOptions } = options;

  const errorHandling = useErrorHandling(baseOptions);

  const handleApiError = useCallback(
    (error: any, context: Record<string, any> = {}) => {
      // Handle specific API errors
      const apiContext = {
        ...context,
        action: 'API Call',
      };

      // Check for authentication errors
      if (error?.status === 401 || error?.message?.includes('Unauthorized')) {
        const authError = new BaseAppError(
          'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          ErrorType.AUTHENTICATION,
          ErrorSeverity.HIGH,
          'AUTH_EXPIRED'
        );

        if (redirectOnAuth) {
          // Redirect to login page
          window.location.href = '/login';
        }

        return errorHandling.handleError(authError, apiContext);
      }

      // Check for forbidden errors
      if (error?.status === 403) {
        const forbiddenError = new BaseAppError(
          'No tienes permisos para realizar esta acción.',
          ErrorType.AUTHORIZATION,
          ErrorSeverity.HIGH,
          'FORBIDDEN'
        );

        return errorHandling.handleError(forbiddenError, apiContext);
      }

      // Check for validation errors
      if (error?.status === 400 || error?.status === 422) {
        const validationError = new BaseAppError(
          error?.message || 'Los datos enviados no son válidos.',
          ErrorType.VALIDATION,
          ErrorSeverity.LOW,
          'VALIDATION_ERROR',
          error?.details
        );

        return errorHandling.handleError(validationError, apiContext);
      }

      // Check for server errors
      if (error?.status >= 500) {
        const serverError = new BaseAppError(
          'Error del servidor. Por favor, intenta de nuevo más tarde.',
          ErrorType.DATABASE,
          ErrorSeverity.HIGH,
          'SERVER_ERROR'
        );

        return errorHandling.handleError(serverError, apiContext);
      }

      // Default handling
      return errorHandling.handleError(error, apiContext);
    },
    [errorHandling, redirectOnAuth]
  );

  return {
    ...errorHandling,
    handleApiError,
  };
};

// Hook for form error handling
export const useFormErrorHandling = (formName: string) => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const errorHandling = useErrorHandling({
    component: `Form_${formName}`,
  });

  const setFieldError = useCallback((field: string, error: string) => {
    setFieldErrors(prev => ({
      ...prev,
      [field]: error,
    }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const clearAllFieldErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const handleFormError = useCallback(
    (error: any, context: Record<string, any> = {}) => {
      // Handle validation errors with field-specific messages
      if (error?.details && typeof error.details === 'object') {
        Object.entries(error.details).forEach(([field, message]) => {
          setFieldError(field, String(message));
        });
      }

      return errorHandling.handleError(error, {
        action: 'Form Submission',
        formName,
        ...context,
      });
    },
    [errorHandling, formName, setFieldError]
  );

  return {
    ...errorHandling,
    fieldErrors,
    setFieldError,
    clearFieldError,
    clearAllFieldErrors,
    handleFormError,
  };
};
