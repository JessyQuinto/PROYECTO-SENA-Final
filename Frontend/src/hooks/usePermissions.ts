import { useAuth } from '@/auth/AuthContext';
import type { UserRole, VendedorEstado } from '@/types/domain';

export const usePermissions = () => {
  const { user, loading } = useAuth();

  const isAuthenticated = !!user && !loading;
  const isAdmin = user?.role === 'admin';
  const isVendor = user?.role === 'vendedor';
  const isBuyer = user?.role === 'comprador';
  
  const isVendorApproved = isVendor && user?.vendedor_estado === 'aprobado';
  const isVendorPending = isVendor && user?.vendedor_estado === 'pendiente';
  const isVendorRejected = isVendor && user?.vendedor_estado === 'rechazado';
  
  const canManageProducts = isVendorApproved || isAdmin;
  const canViewAdminPanel = isAdmin;
  const canViewVendorPanel = isVendor;
  const canViewBuyerPanel = isBuyer;
  
  const canAccessVendorFeatures = isVendorApproved;
  const canAccessAdminFeatures = isAdmin;
  const canAccessBuyerFeatures = isBuyer;

  return {
    // Estados de autenticación
    isAuthenticated,
    loading,
    
    // Roles
    isAdmin,
    isVendor,
    isBuyer,
    
    // Estados de vendedor
    isVendorApproved,
    isVendorPending,
    isVendorRejected,
    
    // Permisos específicos
    canManageProducts,
    canViewAdminPanel,
    canViewVendorPanel,
    canViewBuyerPanel,
    
    // Acceso a funcionalidades
    canAccessVendorFeatures,
    canAccessAdminFeatures,
    canAccessBuyerFeatures,
    
    // Usuario completo
    user,
  };
};

export default usePermissions;

