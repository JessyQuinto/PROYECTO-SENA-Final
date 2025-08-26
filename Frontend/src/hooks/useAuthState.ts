import { useAuth } from '@/auth/AuthContext';

/**
 * Hook unificado que proporciona un estado de autenticación consistente
 * Re-exporta useAuth para mantener compatibilidad
 * 
 * @returns Estado de autenticación simplificado
 */
export function useAuthState() {
  return useAuth();
}

// Re-exportar para compatibilidad
export default useAuthState;
