import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

interface Props {
  children: React.ReactElement;
  roles?: string[];
  requireApprovedVendor?: boolean;
}

export const ProtectedRoute: React.FC<Props> = ({ children, roles, requireApprovedVendor = false }) => {
  const { user, loading, isSigningOut } = useAuth();
  const { validateRouteAccess, getPermissionError } = usePermissions();

  // Durante el cierre de sesión, evitar renderizar contenido protegido
  if (isSigningOut) return <Navigate to='/' replace />;

  if (loading) return <p>Cargando sesión...</p>;
  if (!user) return <Navigate to='/' replace />;
  
  // ✅ MEJORADO: Usar el hook de permisos para validación más robusta
  if (roles) {
    const hasAccess = validateRouteAccess(roles as any[], requireApprovedVendor);
    if (!hasAccess) {
      // Obtener mensaje de error específico
      const errorMessage = getPermissionError('route_access');
      console.warn(`[ProtectedRoute] Access denied: ${errorMessage}`);
      return <Navigate to='/' replace />;
    }
  }

  // ✅ MANTENIDO: Validaciones específicas para compatibilidad
  // Validación específica para vendedores: debe tener rol vendedor Y estar aprobado
  if (roles?.includes('vendedor')) {
    if (user.role !== 'vendedor' || user.vendedor_estado !== 'aprobado') {
      console.warn('[ProtectedRoute] Vendor access denied: role or status invalid');
      return <Navigate to='/' replace />;
    }
  }

  // Validación específica para compradores: debe tener rol comprador
  if (roles?.includes('comprador')) {
    if (user.role !== 'comprador') {
      console.warn('[ProtectedRoute] Buyer access denied: invalid role');
      return <Navigate to='/' replace />;
    }
  }

  // Validación específica para admins: debe tener rol admin
  if (roles?.includes('admin')) {
    if (user.role !== 'admin') {
      console.warn('[ProtectedRoute] Admin access denied: invalid role');
      return <Navigate to='/' replace />;
    }
  }

  return children;
};
