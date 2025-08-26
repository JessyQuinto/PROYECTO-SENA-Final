import { useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthContext';

/**
 * Custom hook to track logout state and prevent navigation issues
 * This helps prevent flashing of protected content during logout
 */
export function useLogoutFlag(): boolean {
  const [isLogoutInProgress, setIsLogoutInProgress] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    // Listen for custom logout events
    const handleLogoutStart = () => {
      setIsLogoutInProgress(true);
    };

    const handleLogoutComplete = () => {
      setIsLogoutInProgress(false);
    };

    // Listen for logout events
    window.addEventListener('userLogoutStart', handleLogoutStart);
    window.addEventListener('userLoggedOut', handleLogoutComplete);

    return () => {
      window.removeEventListener('userLogoutStart', handleLogoutStart);
      window.removeEventListener('userLoggedOut', handleLogoutComplete);
    };
  }, []);

  useEffect(() => {
    // Auto-clear logout flag when auth state stabilizes
    if (!loading && !user && isLogoutInProgress) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsLogoutInProgress(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [loading, user, isLogoutInProgress]);

  return isLogoutInProgress;
}

// Default export for better module resolution
export default useLogoutFlag;