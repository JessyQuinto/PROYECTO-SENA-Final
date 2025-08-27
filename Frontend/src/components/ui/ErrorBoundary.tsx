import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorHandler } from '@/lib/errorHandler';
import { AppError, ErrorSeverity } from '@/lib/errors';
import { Button } from '@/components/ui/shadcn/button';
import { Card } from '@/components/ui/shadcn/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
  errorId: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: AppError; onRetry: () => void }>;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  isolate?: boolean; // If true, only catches errors from direct children
  level?: 'page' | 'section' | 'component'; // Error boundary level for context
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Process the error through our error handler
    const appError = errorHandler.handleError(error, {
      component: 'ErrorBoundary',
      action: 'Component Error',
      level: this.props.level || 'component',
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    // Update state with processed error
    this.setState({
      error: appError,
      errorId: appError.id,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback component if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            onRetry={this.handleRetry}
          />
        );
      }

      // Default fallback UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
interface DefaultErrorFallbackProps {
  error: AppError;
  onRetry: () => void;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
  error,
  onRetry,
}) => {
  const isMinor = error.severity === ErrorSeverity.LOW;
  const isCritical = error.severity === ErrorSeverity.CRITICAL;

  return (
    <div className='flex min-h-[400px] items-center justify-center p-4'>
      <Card
        variant='outlined'
        className='max-w-md w-full border-destructive/20 bg-destructive/5'
        padding='lg'
      >
        <div className='flex flex-col items-center text-center space-y-6'>
          {/* Error Icon */}
          <div className='flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10'>
            {isCritical ? (
              <svg
                className='h-8 w-8 text-destructive'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
              >
                <circle cx='12' cy='12' r='10' strokeWidth={2} />
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 9l-6 6M9 9l6 6'
                />
              </svg>
            ) : isMinor ? (
              <svg
                className='h-8 w-8 text-warning'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z'
                />
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v4M12 17h.01'
                />
              </svg>
            ) : (
              <svg
                className='h-8 w-8 text-warning'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
              >
                <circle cx='12' cy='12' r='10' strokeWidth={2} />
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 8v4M12 16h.01'
                />
              </svg>
            )}
          </div>

          {/* Error Message */}
          <div className='space-y-2'>
            <h2 className='heading-lg text-foreground'>
              {isCritical
                ? 'Error crítico'
                : isMinor
                  ? 'Pequeño problema'
                  : 'Algo salió mal'}
            </h2>

            <p className='body-base text-muted-foreground'>
              {error.message ||
                'Ha ocurrido un error inesperado. Por favor, intenta de nuevo.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className='flex flex-col sm:flex-row gap-3 w-full'>
            <Button
              onClick={onRetry}
              variant='default'
              className='flex-1'
              leftIcon={
                <svg
                  className='h-4 w-4'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                  />
                </svg>
              }
            >
              Intentar de nuevo
            </Button>

            <Button
              onClick={() => window.location.reload()}
              variant='outline'
              className='flex-1'
              leftIcon={
                <svg
                  className='h-4 w-4'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                  />
                </svg>
              }
            >
              Recargar página
            </Button>
          </div>

          {/* Debug Info (Development Only) */}
          {import.meta.env.DEV && (
            <details className='w-full'>
              <summary className='cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors'>
                Detalles del error (desarrollo)
              </summary>
              <div className='mt-3 p-4 bg-muted rounded-md text-left border'>
                <div className='space-y-2 text-xs'>
                  <div className='flex justify-between'>
                    <span className='font-medium'>ID:</span>
                    <span className='font-mono'>{error.id}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='font-medium'>Tipo:</span>
                    <span className='font-mono'>{error.type}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='font-medium'>Severidad:</span>
                    <span className='font-mono'>{error.severity}</span>
                  </div>
                  {error.code && (
                    <div className='flex justify-between'>
                      <span className='font-medium'>Código:</span>
                      <span className='font-mono'>{error.code}</span>
                    </div>
                  )}
                </div>
                {error.stack && (
                  <div className='mt-3 pt-3 border-t'>
                    <span className='font-medium text-xs'>Stack trace:</span>
                    <pre className='mt-1 text-xs text-muted-foreground overflow-auto max-h-32 font-mono'>
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </Card>
    </div>
  );
};

// Factory function for creating type-safe specialized error boundaries
export function createErrorBoundary(
  level: 'page' | 'section' | 'component',
  defaultProps?: Partial<ErrorBoundaryProps>
) {
  const BoundaryComponent: React.FC<{ 
    children: ReactNode;
    fallback?: React.ComponentType<{ error: AppError; onRetry: () => void }>;
    onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  }> = ({ children, fallback, onError }) => (
    <ErrorBoundary 
      level={level} 
      fallback={fallback}
      onError={onError}
      {...defaultProps}
    >
      {children}
    </ErrorBoundary>
  );
  
  BoundaryComponent.displayName = `${level.charAt(0).toUpperCase() + level.slice(1)}ErrorBoundary`;
  return BoundaryComponent;
}

// Pre-configured error boundaries using factory function
export const PageErrorBoundary = createErrorBoundary('page');
export const SectionErrorBoundary = createErrorBoundary('section');
export const ComponentErrorBoundary = createErrorBoundary('component');

// Additional pre-configured boundaries with specific behaviors
export const IsolatedErrorBoundary = createErrorBoundary('component', { isolate: true });
export const SilentErrorBoundary = createErrorBoundary('component', { 
  onError: (error) => {
    // Silent error logging without user notification
    console.warn('Silent error caught:', error);
  }
});

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent: React.FC<P> = props => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Hook for error boundary context
export const useErrorHandler = () => {
  const throwError = (error: Error | string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    errorHandler.handleError(errorObj, {
      component: 'useErrorHandler',
      action: 'Manual Error',
    });
  };

  const handleAsyncError = async (
    asyncFn: () => Promise<any>,
    context?: Record<string, any>
  ): Promise<any | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      errorHandler.handleError(error, {
        component: 'useErrorHandler',
        action: 'Async Error',
        ...context,
      });
      return null;
    }
  };

  return {
    throwError,
    handleAsyncError,
    logInfo: errorHandler.logInfo.bind(errorHandler),
    logWarning: errorHandler.logWarning.bind(errorHandler),
  };
};
