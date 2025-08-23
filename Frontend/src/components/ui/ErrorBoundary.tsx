import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorHandler } from '@/lib/errorHandler';
import { AppError, ErrorSeverity, ErrorType } from '@/lib/errors';
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

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
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
        return <FallbackComponent error={this.state.error} onRetry={this.handleRetry} />;
      }

      // Default fallback UI
      return <DefaultErrorFallback error={this.state.error} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

// Default error fallback component
interface DefaultErrorFallbackProps {
  error: AppError;
  onRetry: () => void;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({ error, onRetry }) => {
  const isMinor = error.severity === ErrorSeverity.LOW;
  const isCritical = error.severity === ErrorSeverity.CRITICAL;

  return (
    <Card className="p-6 m-4 border-red-200 bg-red-50">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="text-4xl">
          {isCritical ? '💥' : isMinor ? '🔧' : '⚠️'}
        </div>
        
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isCritical 
              ? 'Error crítico' 
              : isMinor 
                ? 'Pequeño problema' 
                : 'Algo salió mal'
            }
          </h2>
          
          <p className="text-gray-600 mb-4">
            {error.message || 'Ha ocurrido un error inesperado.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={onRetry} variant="default">
            Intentar de nuevo
          </Button>
          
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
          >
            Recargar página
          </Button>
        </div>

        {import.meta.env.DEV && (
          <details className="w-full mt-4">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Detalles del error (desarrollo)
            </summary>
            <div className="mt-2 p-3 bg-gray-100 rounded text-xs text-left">
              <div><strong>ID:</strong> {error.id}</div>
              <div><strong>Tipo:</strong> {error.type}</div>
              <div><strong>Severidad:</strong> {error.severity}</div>
              {error.code && <div><strong>Código:</strong> {error.code}</div>}
              {error.stack && (
                <div className="mt-2">
                  <strong>Stack trace:</strong>
                  <pre className="whitespace-pre-wrap text-xs">{error.stack}</pre>
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    </Card>
  );
};

// Specialized error boundaries for different use cases

// Page-level error boundary
export const PageErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="page">
    {children}
  </ErrorBoundary>
);

// Section-level error boundary  
export const SectionErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="section">
    {children}
  </ErrorBoundary>
);

// Component-level error boundary
export const ComponentErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="component">
    {children}
  </ErrorBoundary>
);

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent: React.FC<P> = (props) => (
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