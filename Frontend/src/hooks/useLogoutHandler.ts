import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/auth/AuthContext';

/**
 * Comprehensive logout handler hook that provides consistent logout behavior
 * across all components and prevents common post-logout anomalies
 */
export function useLogoutHandler() {
  const { isSigningOut } = useAuth();
  const cleanupCallbacksRef = useRef<Array<() => void>>([]);

  /**
   * Register a cleanup callback to be executed during logout
   */
  const registerCleanup = useCallback((callback: () => void) => {
    cleanupCallbacksRef.current.push(callback);
    
    // Return unregister function
    return () => {
      cleanupCallbacksRef.current = cleanupCallbacksRef.current.filter(
        cb => cb !== callback
      );
    };
  }, []);

  /**
   * Execute all registered cleanup callbacks
   */
  const executeCleanup = useCallback(() => {
    cleanupCallbacksRef.current.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('[LogoutHandler] Cleanup callback error:', error);
      }
    });
  }, []);

  /**
   * Handle logout start event
   */
  const handleLogoutStart = useCallback(() => {
    executeCleanup();
  }, [executeCleanup]);

  /**
   * Handle logout completion event
   */
  const handleLogoutComplete = useCallback(() => {
    // Additional cleanup if needed
    cleanupCallbacksRef.current = [];
  }, []);

  // Listen for logout events
  useEffect(() => {
    const handleLogoutStartEvent = () => handleLogoutStart();
    const handleLogoutCompleteEvent = () => handleLogoutComplete();

    window.addEventListener('userLogoutStart', handleLogoutStartEvent);
    window.addEventListener('userLoggedOut', handleLogoutCompleteEvent);

    return () => {
      window.removeEventListener('userLogoutStart', handleLogoutStartEvent);
      window.removeEventListener('userLoggedOut', handleLogoutCompleteEvent);
    };
  }, [handleLogoutStart, handleLogoutComplete]);

  // Execute cleanup when isSigningOut changes to true
  useEffect(() => {
    if (isSigningOut) {
      executeCleanup();
    }
  }, [isSigningOut, executeCleanup]);

  return {
    isSigningOut,
    registerCleanup,
    executeCleanup,
  };
}

/**
 * Hook for components that need to react to logout state changes
 */
export function useLogoutState() {
  const { isSigningOut } = useAuth();
  
  return {
    isSigningOut,
    isLoggingOut: isSigningOut, // Alias for consistency
  };
}

/**
 * Hook that automatically clears component state during logout
 */
export function useLogoutStateCleanup<T>(
  setState: (value: T) => void,
  defaultValue: T
) {
  const { registerCleanup } = useLogoutHandler();

  useEffect(() => {
    const unregister = registerCleanup(() => {
      setState(defaultValue);
    });

    return unregister;
  }, [registerCleanup, setState, defaultValue]);
}

export default useLogoutHandler;