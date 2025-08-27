import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

interface VendorRouteGuardProps {
  children: React.ReactNode;
  requireApproval?: boolean;
}

export const VendorRouteGuard: React.FC<VendorRouteGuardProps> = ({ 
  children, 
  requireApproval = true 
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras se carga la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si no hay usuario, redirigir al login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar que sea vendedor
  if (user.role !== 'vendedor') {
    return <Navigate to="/" replace />;
  }

  // Si requiere aprobación, verificar estado
  if (requireApproval && user.vendedor_estado !== 'aprobado') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Cuenta en revisión
          </h2>
          <p className="text-gray-600 mb-4">
            Tu cuenta de vendedor está siendo revisada por nuestro equipo. 
            Te notificaremos por correo cuando sea aprobada.
          </p>
          {user.vendedor_estado === 'pendiente' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                Estado: <span className="font-medium">Pendiente de aprobación</span>
              </p>
            </div>
          )}
          {user.vendedor_estado === 'rechazado' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">
                Estado: <span className="font-medium">Rechazado</span>
              </p>
              <p className="text-xs text-red-600 mt-1">
                Si consideras que se trata de un error, contáctanos.
              </p>
            </div>
          )}
          <button
            onClick={() => window.history.back()}
            className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Si todo está bien, mostrar el contenido
  return <>{children}</>;
};

export default VendorRouteGuard;

