import { useAuth } from '@/auth/AuthContext';
import { useLogoutFlag } from './useLogoutFlag';

/**
 * Hook unificado que proporciona un estado de autenticación consistente
 * Combina useAuth y useLogoutFlag para evitar parpadeos durante el logout
 * 
 * @returns Estado unificado de autenticación con flags de logout
 */
export function useAuthState() {
  const auth = useAuth();
  const isLogoutInProgress = useLogoutFlag();
  
  // 🔑 ESTADO UNIFICADO que previene parpadeos
  return {
    ...auth,
    // 🔑 CLAVE: Estado efectivo que considera el proceso de logout
    effectiveUser: isLogoutInProgress ? null : auth.user,
    effectiveLoading: isLogoutInProgress ? false : auth.loading,
    // 🔑 FLAG COMBINADO para componentes que necesitan saber si está cerrando sesión
    isSigningOutOrLogoutInProgress: auth.isSigningOut || isLogoutInProgress,
  };
}

// 🔑 RE-EXPORTAR para compatibilidad
export default useAuthState;
