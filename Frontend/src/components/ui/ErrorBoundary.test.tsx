import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';
import { ErrorHandler } from '../../lib/errorHandler';
import { ValidationError, NetworkError } from '../../lib/errors';

// Mock the toast hook
vi.mock('@/hooks/useToast', () => ({
  toast: vi.fn(),
}));

// Component that throws an error for testing
const ThrowError = ({ shouldThrow = false, errorMessage = 'Test error' }) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console errors during tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'group').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders error fallback when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Test error message" />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('shows retry button in error state', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Intentar de nuevo')).toBeInTheDocument();
    expect(screen.getByText('Recargar página')).toBeInTheDocument();
  });

  it('uses custom fallback component when provided', () => {
    const CustomFallback = ({ error }: { error: any }) => (
      <div>Custom error: {error.message}</div>
    );
    
    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} errorMessage="Custom error test" />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Custom error: Custom error test')).toBeInTheDocument();
  });
});

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  
  beforeEach(() => {
    errorHandler = new ErrorHandler();
    vi.clearAllMocks();
  });

  it('handles validation errors correctly', () => {
    const validationError = new ValidationError('Invalid input', 'VALIDATION_001');
    const result = errorHandler.handleError(validationError);
    
    expect(result.type).toBe('validation');
    expect(result.message).toBe('Invalid input');
    expect(result.code).toBe('VALIDATION_001');
  });

  it('handles network errors correctly', () => {
    const networkError = new NetworkError('Connection failed');
    const result = errorHandler.handleError(networkError);
    
    expect(result.type).toBe('network');
    expect(result.message).toBe('Connection failed');
  });

  it('logs errors to internal log', () => {
    const error = new Error('Test error');
    errorHandler.handleError(error);
    
    const errorLog = errorHandler.getErrorLog();
    expect(errorLog).toHaveLength(1);
    expect(errorLog[0].message).toBe('Test error');
  });

  it('calculates error statistics correctly', () => {
    // Add multiple errors
    errorHandler.handleError(new ValidationError('Error 1'));
    errorHandler.handleError(new NetworkError('Error 2'));
    errorHandler.handleError(new Error('Error 3'));
    
    const stats = errorHandler.getErrorStats();
    expect(stats.total).toBe(3);
    expect(stats.byType.validation).toBe(1);
    expect(stats.byType.network).toBe(1);
    expect(stats.byType.unknown).toBe(1);
  });

  it('clears error log when requested', () => {
    errorHandler.handleError(new Error('Test error'));
    expect(errorHandler.getErrorLog()).toHaveLength(1);
    
    errorHandler.clearErrorLog();
    expect(errorHandler.getErrorLog()).toHaveLength(0);
  });
});