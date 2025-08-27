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

  // ✅ NUEVO: Funciones para validar permisos específicos
  const canCreateOrders = isBuyer && !user?.bloqueado;
  const canManageOrders = isAdmin || isVendorApproved;
  const canViewOrders = isAdmin || isVendorApproved || isBuyer;
  const canCreateProducts = isVendorApproved || isAdmin;
  const canEditProducts = isVendorApproved || isAdmin;
  const canDeleteProducts = isAdmin;
  const canViewAuditLog = isAdmin;
  const canManageUsers = isAdmin;
  const canManageCategories = isAdmin;

  // ✅ NUEVO: Función para obtener mensaje de error de permisos
  const getPermissionError = (action: string): string | null => {
    if (!isAuthenticated) return 'Debes iniciar sesión para realizar esta acción';
    
    if (action === 'create_order' && !canCreateOrders) {
      if (user?.bloqueado) return 'Tu cuenta está bloqueada';
      if (!isBuyer) return 'Solo los compradores pueden crear pedidos';
      return 'No tienes permisos para crear pedidos';
    }
    
    if (action === 'manage_products' && !canManageProducts) {
      if (isVendorPending) return 'Tu cuenta de vendedor está pendiente de aprobación';
      if (isVendorRejected) return 'Tu cuenta de vendedor fue rechazada';
      if (!isVendor) return 'Solo los vendedores pueden gestionar productos';
      return 'No tienes permisos para gestionar productos';
    }
    
    if (action === 'admin_panel' && !canViewAdminPanel) {
      return 'Solo los administradores pueden acceder al panel de administración';
    }
    
    if (action === 'vendor_panel' && !canViewVendorPanel) {
      return 'Solo los vendedores pueden acceder al panel de vendedor';
    }
    
    return null;
  };

  // ✅ NUEVO: Función para validar acceso a rutas
  const validateRouteAccess = (requiredRoles: UserRole[], requireApprovedVendor = false): boolean => {
    if (!isAuthenticated) return false;
    
    const hasRequiredRole = requiredRoles.includes(user!.role!);
    if (!hasRequiredRole) return false;
    
    if (requireApprovedVendor && isVendor && !isVendorApproved) {
      return false;
    }
    
    return true;
  };

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
    
    // ✅ NUEVO: Permisos granulares
    canCreateOrders,
    canManageOrders,
    canViewOrders,
    canCreateProducts,
    canEditProducts,
    canDeleteProducts,
    canViewAuditLog,
    canManageUsers,
    canManageCategories,
    
    // ✅ NUEVO: Funciones de validación
    getPermissionError,
    validateRouteAccess,
    
    // Usuario completo
    user,
  };
};

export default usePermissions;

