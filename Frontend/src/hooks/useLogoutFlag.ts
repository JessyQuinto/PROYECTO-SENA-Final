import { useState, useEffect } from 'react';

/**
 * Hook personalizado para detectar el estado global de logout
 * Evita múltiples verificaciones del flag global en diferentes componentes
 * Optimizado para eliminar polling innecesario
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

    // 🔑 ESCUCHAR EVENTOS en lugar de polling para mejor rendimiento
    const handleLogoutStarted = () => {
      console.log('[useLogoutFlag] Logout started event received');
      setIsLogoutInProgress(true);
    };

    const handleLogoutCompleted = () => {
      console.log('[useLogoutFlag] Logout completed event received');
      setIsLogoutInProgress(false);
    };

    // Escuchar eventos personalizados
    window.addEventListener('userLoggedOut', handleLogoutCompleted);
    
    // 🔑 ESCUCHAR CAMBIOS DEL FLAG GLOBAL solo cuando sea necesario
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === '__LOGOUT_IN_PROGRESS__') {
        checkLogoutFlag();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // 🔑 VERIFICACIÓN PERIÓDICA como fallback (cada 500ms en lugar de 100ms)
    const interval = setInterval(checkLogoutFlag, 500);

    return () => {
      clearInterval(interval);
      window.removeEventListener('userLoggedOut', handleLogoutCompleted);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return isLogoutInProgress;
}
