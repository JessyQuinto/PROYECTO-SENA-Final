import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { useLogoutFlag } from '@/hooks/useLogoutFlag';

interface Props {
  children: React.ReactElement;
  roles?: string[];
}

export const ProtectedRoute: React.FC<Props> = ({ children, roles }) => {
  // Use unified hook for consistent state
  const { user, loading } = useAuth();
  
  // Use custom hook to detect logout in progress
  const isLogoutInProgress = useLogoutFlag();

  // During logout, avoid rendering protected content
  if (isLogoutInProgress) return <Navigate to='/' replace />;

  if (loading) return <p>Cargando sesión...</p>;
  if (!user) return <Navigate to='/' replace />;
  if (roles && !roles.includes(user.role || ''))
    return <Navigate to='/' replace />;

  // Regla: si ruta requiere rol vendedor, solo permitir si vendedor aprobado
  if (roles?.includes('vendedor') && user.vendedor_estado !== 'aprobado') {
    return <Navigate to='/' replace />;
  }

  return children;
};

export default ProtectedRoute;
