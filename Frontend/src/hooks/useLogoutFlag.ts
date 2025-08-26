import { useState, useEffect } from 'react';

/**
 * Hook personalizado para detectar el estado global de logout
 * Evita múltiples verificaciones del flag global en diferentes componentes
 */
export function useLogoutFlag() {
  const [isLogoutInProgress, setIsLogoutInProgress] = useState(false);

  useEffect(() => {
    const checkLogoutFlag = () => {
      if (typeof window !== 'undefined' && (window as any).__LOGOUT_IN_PROGRESS__) {
        setIsLogoutInProgress(true);
      } else {
        setIsLogoutInProgress(false);
      }
    };

    // Verificar al montar
    checkLogoutFlag();

    // Escuchar cambios del flag global
    const interval = setInterval(checkLogoutFlag, 100);

    return () => clearInterval(interval);
  }, []);

  return isLogoutInProgress;
}
