import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

interface Props {
  children: React.ReactElement;
  roles?: string[];
}

export const ProtectedRoute: React.FC<Props> = ({ children, roles }) => {
  const { user, loading, isSigningOut } = useAuth();

  // Durante el cierre de sesión, evitar renderizar contenido protegido
  if (isSigningOut) return <Navigate to='/' replace />;

  if (loading) return <p>Cargando sesión...</p>;
  if (!user) return <Navigate to='/' replace />;
  
  // Validación principal de roles
  if (roles && !roles.includes(user.role || '')) {
    return <Navigate to='/' replace />;
  }

  // Validación específica para vendedores: debe tener rol vendedor Y estar aprobado
  if (roles?.includes('vendedor')) {
    if (user.role !== 'vendedor' || user.vendedor_estado !== 'aprobado') {
      return <Navigate to='/' replace />;
    }
  }

  // Validación específica para compradores: debe tener rol comprador
  if (roles?.includes('comprador')) {
    if (user.role !== 'comprador') {
      return <Navigate to='/' replace />;
    }
  }

  // Validación específica para admins: debe tener rol admin
  if (roles?.includes('admin')) {
    if (user.role !== 'admin') {
      return <Navigate to='/' replace />;
    }
  }

  return children;
};
