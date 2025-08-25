// Simple logger that is no-op by default. Enable by setting `window.__DEV_LOGS__ = true` in the console during development.
const isEnabled =
  typeof window !== 'undefined' && (window as any).__DEV_LOGS__ === true;

export const debug = (...args: any[]) => {
  if (isEnabled) console.debug(...args);
};

export const info = (...args: any[]) => {
  if (isEnabled) console.info(...args);
};

export const warn = (...args: any[]) => {
  if (isEnabled) console.warn(...args);
};

export const error = (...args: any[]) => {
  if (isEnabled) console.error(...args);
};

export default { debug, info, warn, error };
