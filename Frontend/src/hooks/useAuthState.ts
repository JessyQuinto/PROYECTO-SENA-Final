import { useAuth } from '@/auth/AuthContext';

/**
 * Hook personalizado que proporciona un estado de autenticación más consistente
 * Evita parpadeos durante el logout al usar el AuthContext original
 * 
 * @deprecated Usar useAuth() directamente para mejor consistencia
 */
export function useAuthState() {
  // 🔑 USAR EL AUTHCONTEXT ORIGINAL directamente
  return useAuth();
}

// 🔑 RE-EXPORTAR para compatibilidad
export default useAuthState;
