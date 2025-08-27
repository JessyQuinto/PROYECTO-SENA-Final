import { useEffect, useCallback } from 'react';
import { useAuth } from '@/auth/AuthContext';

interface VendorStatusChangeEvent {
  vendorId: string;
  newStatus: 'pendiente' | 'aprobado' | 'rechazado';
  timestamp: number;
}

/**
 * Hook para escuchar cambios de estado de vendedor en tiempo real
 * Útil para componentes que necesitan reaccionar inmediatamente a cambios de estado
 */
export const useVendorStatusListener = () => {
  const { user, refreshProfile } = useAuth();

  const handleVendorStatusChange = useCallback((event: CustomEvent<VendorStatusChangeEvent>) => {
    const { vendorId, newStatus } = event.detail;
    
    // Si el usuario actual es el vendedor afectado, refrescar su perfil
    if (user?.id === vendorId) {
      console.log(`[useVendorStatusListener] Estado cambiado a: ${newStatus}, refrescando perfil...`);
      
      // Refrescar perfil inmediatamente
      refreshProfile();
      
      // Mostrar notificación de cambio de estado
      if (newStatus === 'aprobado') {
        // El usuario puede mostrar una notificación de éxito
        window.dispatchEvent(new CustomEvent('showVendorApprovedNotification', {
          detail: { timestamp: Date.now() }
        }));
      } else if (newStatus === 'rechazado') {
        // El usuario puede mostrar una notificación de rechazo
        window.dispatchEvent(new CustomEvent('showVendorRejectedNotification', {
          detail: { timestamp: Date.now() }
        }));
      }
    }
  }, [user, refreshProfile]);

  useEffect(() => {
    // Agregar listener para cambios de estado de vendedor
    window.addEventListener('vendorStatusChanged', handleVendorStatusChange as EventListener);

    return () => {
      // Limpiar listener al desmontar
      window.removeEventListener('vendorStatusChanged', handleVendorStatusChange as EventListener);
    };
  }, [handleVendorStatusChange]);

  return {
    // Función para forzar refrescar el perfil (útil para testing)
    forceRefresh: refreshProfile,
    // Estado actual del usuario
    currentStatus: user?.vendedor_estado,
    // ID del usuario actual
    userId: user?.id
  };
};

export default useVendorStatusListener;
