import React from 'react';
import { useAuth } from '@/auth/AuthContext';
import { useRedirection } from '@/hooks/useRedirection';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import Icon from '@/components/ui/Icon';
import { Link } from 'react-router-dom';

type UserRole = 'admin' | 'vendedor' | 'comprador';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiresApproval?: boolean;
  fallbackComponent?: React.ComponentType;
  redirectTo?: string;
}

const DefaultFallback: React.FC<{ role?: UserRole }> = ({ role }) => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <Card className="w-full max-w-md">
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <Icon category="Estados y Feedback" name="LucideShield" className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Acceso no autorizado
            </h2>
            <p className="text-gray-600 text-sm">
              {role 
                ? `Tu rol '${role}' no tiene permisos para acceder a esta página.`
                : 'Necesitas iniciar sesión para acceder a esta página.'
              }
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/">
                <Icon category="Interface" name="MdiHome" className="w-4 h-4 mr-2" />
                Ir al Inicio
              </Link>
            </Button>
            {!role && (
              <Button asChild className="flex-1">
                <Link to="/login">
                  <Icon category="Interface" name="MdiLogin" className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  allowedRoles = [],
  requiresApproval = false,
  fallbackComponent: FallbackComponent,
  redirectTo
}) => {
  const { user, loading } = useAuth();
  const { redirectToRole } = useRedirection();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Verificando acceso...</span>
        </div>
      </div>
    );
  }

  // Usuario no autenticado
  if (!user) {
    if (redirectTo) {
      redirectToRole({ returnTo: redirectTo });
      return null;
    }
    
    const Fallback = FallbackComponent || DefaultFallback;
    return <Fallback />;
  }

  // Verificar roles permitidos
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role as UserRole)) {
    const Fallback = FallbackComponent || DefaultFallback;
    return <Fallback role={user.role as UserRole} />;
  }

  // Verificar aprobación para vendedores
  if (requiresApproval && user.role === 'vendedor' && user.vendedor_estado !== 'aprobado') {
    redirectToRole({ returnTo: '/vendedor/estado' });
    return null;
  }

  // Usuario autorizado
  return <>{children}</>;
};

// Hook para uso programático
export const useAuthGuard = () => {
  const { user } = useAuth();

  const checkRole = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role as UserRole);
  };

  const checkApproval = (): boolean => {
    if (!user || user.role !== 'vendedor') return true;
    return user.vendedor_estado === 'aprobado';
  };

  const isAuthorized = (allowedRoles: UserRole[], requiresApproval = false): boolean => {
    return checkRole(allowedRoles) && (!requiresApproval || checkApproval());
  };

  return {
    user,
    checkRole,
    checkApproval,
    isAuthorized
  };
};