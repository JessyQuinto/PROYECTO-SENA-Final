import { useAuth } from '@/auth/AuthContext';
import { useEffect, useState } from 'react';

/**
 * Hook personalizado que proporciona un estado de autenticación más consistente
 * Evita parpadeos durante el logout al sincronizar el estado local con el contexto
 */
export function useAuthState() {
  const { user, loading, isSigningOut } = useAuth();
  const [localUser, setLocalUser] = useState(user);
  const [localLoading, setLocalLoading] = useState(loading);

  // Sincronizar estado local con el contexto de forma inmediata
  useEffect(() => {
    // Si está cerrando sesión, limpiar inmediatamente
    if (isSigningOut) {
      setLocalUser(null);
      setLocalLoading(false);
      return;
    }

    // Si el usuario cambió, actualizar inmediatamente
    if (user !== localUser) {
      setLocalUser(user);
    }

    // Si el loading cambió, actualizar inmediatamente
    if (loading !== localLoading) {
      setLocalLoading(loading);
    }
  }, [user, loading, isSigningOut, localUser, localLoading]);

  // Escuchar eventos de logout para limpiar estado inmediatamente
  useEffect(() => {
    const handleLogout = () => {
      setLocalUser(null);
      setLocalLoading(false);
    };

    window.addEventListener('userLoggedOut', handleLogout);
    return () => {
      window.removeEventListener('userLoggedOut', handleLogout);
    };
  }, []);

  // Proporcionar estado efectivo que siempre refleje el estado real
  const effectiveUser = isSigningOut ? null : localUser;
  const effectiveLoading = isSigningOut ? false : localLoading;

  return {
    user: effectiveUser,
    loading: effectiveLoading,
    isSigningOut,
    // Métodos del contexto original
    signIn: useAuth().signIn,
    signUp: useAuth().signUp,
    signOut: useAuth().signOut,
    refreshProfile: useAuth().refreshProfile,
  };
}
