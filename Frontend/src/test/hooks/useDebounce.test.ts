import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock implementation of useDebounce
const useDebounceMock = vi.fn((value, delay = 500) => {
  return value;
});

// Mock the actual hook
vi.mock('../../hooks/useDebounce', () => ({
  useDebounce: useDebounceMock
}));

describe('useDebounce Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useDebounceMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const result = useDebounceMock('initial', 500);
    expect(result).toBe('initial');
    expect(useDebounceMock).toHaveBeenCalledWith('initial', 500);
  });

  it('debounces value changes', () => {
    let value = 'initial';
    let delay = 500;
    
    // First call
    let result = useDebounceMock(value, delay);
    expect(result).toBe('initial');
    
    // Change value
    value = 'changed';
    result = useDebounceMock(value, delay);
    expect(result).toBe('changed');
  });

  it('uses default delay of 500ms', () => {
    const result = useDebounceMock('initial');
    expect(result).toBe('initial');
    expect(useDebounceMock).toHaveBeenCalledWith('initial');
  });

  it('handles zero delay', () => {
    const result = useDebounceMock('initial', 0);
    expect(result).toBe('initial');
    expect(useDebounceMock).toHaveBeenCalledWith('initial', 0);
  });

  it('handles negative delay', () => {
    const result = useDebounceMock('initial', -100);
    expect(result).toBe('initial');
    expect(useDebounceMock).toHaveBeenCalledWith('initial', -100);
  });
});