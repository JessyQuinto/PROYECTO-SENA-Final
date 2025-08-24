/**
 * Centralized State Cleanup Utilities
 * 
 * This module provides utilities for cleaning up application state,
 * particularly useful during logout operations to prevent state persistence issues.
 */
import React from 'react';

export interface CleanupOptions {
  /** Whether to clear session storage */
  clearSessionStorage?: boolean;
  /** Whether to dispatch storage events to notify components */
  dispatchEvents?: boolean;
  /** Custom keys to preserve during cleanup */
  preserveKeys?: string[];
  /** Whether to perform emergency cleanup (more aggressive) */
  emergency?: boolean;
  /** Whether to log cleanup operations */
  verbose?: boolean;
}

export interface CleanupResult {
  success: boolean;
  removedKeys: string[];
  preservedKeys: string[];
  errors: Array<{ key: string; error: Error }>;
}

/**
 * Predefined key patterns for different types of data
 */
export const KEY_PATTERNS = {
  USER_DATA: ['user_', 'profile_', 'preferences_'],
  CART_DATA: ['cart_'],
  AUTH_DATA: ['sb-', 'supabase', 'auth_'],
  SESSION_DATA: ['session_', 'temp_'],
  SYSTEM_DATA: ['theme', 'language', 'locale']
} as const;

/**
 * Default keys that should typically be preserved during logout
 */
export const DEFAULT_PRESERVE_KEYS = [
  'theme_preference',
  'language_preference', 
  'accessibility_settings',
  'cookie_consent'
] as const;

/**
 * Keys that should always be removed during logout
 */
export const ALWAYS_REMOVE_KEYS = [
  'user_preferences',
  'cart_data',
  'user_session',
  'last_visited',
  'user_profile'
] as const;

/**
 * Centralized function to clean up user-related state from localStorage
 */
export function cleanupUserState(options: CleanupOptions = {}): CleanupResult {
  const {
    clearSessionStorage = true,
    dispatchEvents = true,
    preserveKeys = [...DEFAULT_PRESERVE_KEYS],
    emergency = false,
    verbose = true
  } = options;

  const result: CleanupResult = {
    success: true,
    removedKeys: [],
    preservedKeys: [],
    errors: []
  };

  if (verbose) {
    console.log('[StateCleanup] Starting user state cleanup', {
      clearSessionStorage,
      dispatchEvents,
      preserveKeys,
      emergency
    });
  }

  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      console.warn('[StateCleanup] Browser storage not available');
      return { ...result, success: false };
    }

    // Get all current localStorage keys
    const allKeys = Object.keys(localStorage);
    if (verbose) {
      console.log('[StateCleanup] Found localStorage keys:', allKeys);
    }

    // Determine which keys to remove
    const keysToRemove = allKeys.filter(key => {
      // Always remove certain keys
      if (ALWAYS_REMOVE_KEYS.some(pattern => key.includes(pattern))) {
        return true;
      }

      // In emergency mode, be more aggressive
      if (emergency) {
        // Remove anything that looks user-related
        if (KEY_PATTERNS.USER_DATA.some(pattern => key.startsWith(pattern)) ||
            KEY_PATTERNS.CART_DATA.some(pattern => key.startsWith(pattern)) ||
            KEY_PATTERNS.AUTH_DATA.some(pattern => key.includes(pattern))) {
          return !preserveKeys.includes(key);
        }
      } else {
        // Normal mode - be more selective
        if (KEY_PATTERNS.USER_DATA.some(pattern => key.startsWith(pattern)) ||
            KEY_PATTERNS.CART_DATA.some(pattern => key.startsWith(pattern))) {
          return !preserveKeys.includes(key);
        }

        // Remove auth-related keys
        if (KEY_PATTERNS.AUTH_DATA.some(pattern => key.includes(pattern))) {
          return !preserveKeys.includes(key);
        }
      }

      return false;
    });

    if (verbose) {
      console.log('[StateCleanup] Keys to remove:', keysToRemove);
      console.log('[StateCleanup] Keys to preserve:', preserveKeys);
    }

    // Remove identified keys
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        result.removedKeys.push(key);
        if (verbose) {
          console.log(`[StateCleanup] ✅ Removed key: ${key}`);
        }
      } catch (error) {
        result.errors.push({ key, error: error as Error });
        if (verbose) {
          console.error(`[StateCleanup] ❌ Failed to remove key ${key}:`, error);
        }
      }
    });

    // Track preserved keys
    result.preservedKeys = allKeys.filter(key => !keysToRemove.includes(key));

    // Clear session storage if requested
    if (clearSessionStorage) {
      try {
        sessionStorage.clear();
        if (verbose) {
          console.log('[StateCleanup] ✅ SessionStorage cleared');
        }
      } catch (error) {
        result.errors.push({ key: 'sessionStorage', error: error as Error });
        if (verbose) {
          console.error('[StateCleanup] ❌ Failed to clear sessionStorage:', error);
        }
      }
    }

    // Dispatch events to notify components if requested
    if (dispatchEvents) {
      try {
        // Standard storage event
        window.dispatchEvent(new Event('storage'));
        
        // Custom cleanup event with details
        window.dispatchEvent(new CustomEvent('userStateCleanup', {
          detail: {
            timestamp: Date.now(),
            removedKeys: result.removedKeys,
            preservedKeys: result.preservedKeys,
            emergency
          }
        }));

        if (verbose) {
          console.log('[StateCleanup] ✅ Events dispatched');
        }
      } catch (error) {
        result.errors.push({ key: 'events', error: error as Error });
        if (verbose) {
          console.error('[StateCleanup] ❌ Failed to dispatch events:', error);
        }
      }
    }

    // Final verification
    const remainingKeys = Object.keys(localStorage);
    const unexpectedUserKeys = remainingKeys.filter(key =>
      KEY_PATTERNS.USER_DATA.some(pattern => key.startsWith(pattern)) &&
      !preserveKeys.includes(key)
    );

    if (unexpectedUserKeys.length > 0) {
      console.warn('[StateCleanup] ⚠️ Unexpected user keys remain:', unexpectedUserKeys);
    }

    if (verbose) {
      console.log('[StateCleanup] Cleanup completed', {
        removedCount: result.removedKeys.length,
        preservedCount: result.preservedKeys.length,
        errorCount: result.errors.length,
        remainingKeys: remainingKeys.length
      });
    }

  } catch (error) {
    console.error('[StateCleanup] Fatal error during cleanup:', error);
    result.success = false;
    result.errors.push({ key: 'fatal', error: error as Error });
  }

  return result;
}

/**
 * Emergency cleanup - removes ALL user-related data aggressively
 */
export function emergencyCleanup(): CleanupResult {
  console.log('[StateCleanup] 🚨 EMERGENCY CLEANUP INITIATED');
  
  return cleanupUserState({
    emergency: true,
    clearSessionStorage: true,
    dispatchEvents: true,
    preserveKeys: ['cookie_consent'], // Only preserve cookie consent
    verbose: true
  });
}

/**
 * Gentle cleanup - preserves more user preferences
 */
export function gentleCleanup(): CleanupResult {
  return cleanupUserState({
    emergency: false,
    clearSessionStorage: true,
    dispatchEvents: true,
    preserveKeys: [
      ...DEFAULT_PRESERVE_KEYS,
      'user_display_preferences',
      'accessibility_settings',
      'notification_preferences'
    ],
    verbose: true
  });
}

/**
 * Validate that user state has been properly cleaned
 */
export function validateCleanup(): { clean: boolean; issues: string[] } {
  const issues: string[] = [];
  
  try {
    const allKeys = Object.keys(localStorage);
    
    // Check for problematic keys that should have been removed
    const problematicKeys = allKeys.filter(key =>
      ALWAYS_REMOVE_KEYS.some(pattern => key.includes(pattern)) ||
      (KEY_PATTERNS.USER_DATA.some(pattern => key.startsWith(pattern)) &&
       !DEFAULT_PRESERVE_KEYS.includes(key))
    );

    if (problematicKeys.length > 0) {
      issues.push(`Found user data that should have been cleaned: ${problematicKeys.join(', ')}`);
    }

    // Check session storage
    if (sessionStorage.length > 0) {
      issues.push('SessionStorage is not empty');
    }

    console.log('[StateCleanup] Validation result:', {
      clean: issues.length === 0,
      totalKeys: allKeys.length,
      issues: issues.length
    });

  } catch (error) {
    issues.push(`Validation error: ${error.message}`);
  }

  return {
    clean: issues.length === 0,
    issues
  };
}

/**
 * Setup cleanup event listeners for components
 */
export function setupCleanupListeners(callback: (detail: any) => void): () => void {
  const handleCleanup = (e: CustomEvent) => {
    console.log('[StateCleanup] Component received cleanup event:', e.detail);
    callback(e.detail);
  };

  window.addEventListener('userStateCleanup', handleCleanup as EventListener);
  window.addEventListener('userLoggedOut', handleCleanup as EventListener);

  // Return cleanup function
  return () => {
    window.removeEventListener('userStateCleanup', handleCleanup as EventListener);
    window.removeEventListener('userLoggedOut', handleCleanup as EventListener);
  };
}

/**
 * Hook for React components to listen to cleanup events
 */
export function useCleanupListener(callback: (detail: any) => void) {
  React.useEffect(() => {
    return setupCleanupListeners(callback);
  }, [callback]);
}

// Re-export for convenience
export { cleanupUserState as cleanup };
export default cleanupUserState;