import { renderHook, RenderHookResult } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

// Custom renderHook function that includes providers
export function customRenderHook<P, R>(
  render: (props: P) => R,
  options?: { initialProps?: P }
): RenderHookResult<R, P> {
  return renderHook(render, options);
}

// Re-export everything from RTL
export * from '@testing-library/react';