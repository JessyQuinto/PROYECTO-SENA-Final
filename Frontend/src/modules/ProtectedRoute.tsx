import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

interface Props {
  children: React.ReactElement;
  roles?: string[];
}

export const ProtectedRoute: React.FC<Props> = ({ children, roles }) => {
  // 🔑 USAR EL HOOK UNIFICADO para estado consistente
  const { user, loading, isSigningOut } = useAuth();

  // 🔑 CLAVE: Durante el cierre de sesión, evitar renderizar contenido protegido
  if (isSigningOut) return <Navigate to='/' replace />;

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
