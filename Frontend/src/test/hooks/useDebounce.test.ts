import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../../hooks/useDebounce';

describe('useDebounce Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    
    expect(result.current).toBe('initial');
  });

  it('debounces value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'changed', delay: 500 });
    
    // Value should still be initial
    expect(result.current).toBe('initial');
    
    // Fast forward time and wait for the effect
    vi.advanceTimersByTime(500);
    
    // Now value should be updated
    expect(result.current).toBe('changed');
  });

  it('uses default delay of 500ms', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'changed' });
    
    // Value should still be initial
    expect(result.current).toBe('initial');
    
    // Fast forward time
    vi.advanceTimersByTime(500);
    
    // Now value should be updated
    expect(result.current).toBe('changed');
  });

  it('cancels previous timeout on new value', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 1000 } }
    );

    expect(result.current).toBe('initial');

    // Change value multiple times quickly
    rerender({ value: 'first', delay: 1000 });
    rerender({ value: 'second', delay: 1000 });
    rerender({ value: 'final', delay: 1000 });
    
    // Value should still be initial
    expect(result.current).toBe('initial');
    
    // Fast forward time
    vi.advanceTimersByTime(1000);
    
    // Should only get the final value
    expect(result.current).toBe('final');
  });

  it('handles zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 0 } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'changed', delay: 0 });
    
    // With zero delay, should update immediately
    expect(result.current).toBe('changed');
  });

  it('handles negative delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: -100 } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'changed', delay: -100 });
    
    // With negative delay, should update immediately
    expect(result.current).toBe('changed');
  });

  it('works with different data types', () => {
    // Test with number
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: 500 } }
    );

    expect(numberResult.current).toBe(0);

    numberRerender({ value: 42, delay: 500 });
    expect(numberResult.current).toBe(0);
    
    vi.advanceTimersByTime(500);
    expect(numberResult.current).toBe(42);

    // Test with boolean
    const { result: boolResult, rerender: boolRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: false, delay: 500 } }
    );

    expect(boolResult.current).toBe(false);

    boolRerender({ value: true, delay: 500 });
    expect(boolResult.current).toBe(false);
    
    vi.advanceTimersByTime(500);
    expect(boolResult.current).toBe(true);
  });

  it('handles rapid value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 100 } }
    );

    expect(result.current).toBe('initial');

    // Change value rapidly
    for (let i = 0; i < 10; i++) {
      rerender({ value: `value-${i}`, delay: 100 });
    }
    
    // Value should still be initial
    expect(result.current).toBe('initial');
    
    // Fast forward time
    vi.advanceTimersByTime(100);
    
    // Should get the last value
    expect(result.current).toBe('value-9');
  });

  it('cleans up timeout on unmount', () => {
    const { unmount } = renderHook(() => useDebounce('initial', 500));
    
    // This should not throw any errors
    expect(() => unmount()).not.toThrow();
  });

  it('handles undefined and null values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: undefined, delay: 500 } }
    );

    expect(result.current).toBeUndefined();

    rerender({ value: null as any, delay: 500 });
    expect(result.current).toBeUndefined();
    
    vi.advanceTimersByTime(500);
    expect(result.current).toBeNull();
  });
});
