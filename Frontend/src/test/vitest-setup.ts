import { vi } from 'vitest';
import path from 'path';

// Mock window and localStorage for tests
if (typeof window === 'undefined') {
  // Create a mock window object
  const mockWindow = {
    localStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    },
    matchMedia: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  };

  // @ts-ignore
  global.window = mockWindow;
  // @ts-ignore
  global.localStorage = mockWindow.localStorage;
}

// Mock other browser APIs that might be needed
if (typeof document === 'undefined') {
  // @ts-ignore
  global.document = {
    createElement: vi.fn().mockImplementation(() => ({
      style: {},
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
    })),
    createTextNode: vi.fn().mockImplementation(text => ({
      textContent: text,
    })),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}