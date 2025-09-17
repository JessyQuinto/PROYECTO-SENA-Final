import { useNavigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

// Importar tipos desde AuthContext donde están definidos
type UserRole = 'admin' | 'vendedor' | 'comprador';
type VendedorEstado = 'pendiente' | 'aprobado' | 'rechazado';

interface SessionUser {
  id: string;
  email?: string;
  nombre?: string;
  role?: UserRole;
  vendedor_estado?: VendedorEstado;
  bloqueado?: boolean;
  created_at?: string; // Hacer opcional para compatibilidad
}

export interface RedirectionOptions {
  returnTo?: string;
  isFirstLogin?: boolean;
  forceRedirect?: boolean;
}

export const useRedirection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getRedirectPathForUser = (
    targetUser: SessionUser, 
    options: RedirectionOptions = {}
  ): string => {
    const { isFirstLogin = false } = options;
    
    if (!targetUser.role) return '/';
    
    // Centralizar todas las rutas de redirección
    const routes = {
      admin: {
        dashboard: '/admin',
        welcome: '/admin/bienvenida'
      },
      vendedor: {
        dashboard: '/vendedor',
        welcome: '/vendedor/bienvenida',
        status: '/vendedor/estado'
      },
      comprador: {
        dashboard: '/productos',
        welcome: '/comprador/bienvenida'
      }
    };

    switch (targetUser.role) {
      case 'admin':
        return isFirstLogin ? routes.admin.welcome : routes.admin.dashboard;
        
      case 'vendedor':
        if (targetUser.vendedor_estado === 'aprobado') {
          return isFirstLogin ? routes.vendedor.welcome : routes.vendedor.dashboard;
        }
        return routes.vendedor.status;
        
      case 'comprador':
        return isFirstLogin ? routes.comprador.welcome : routes.comprador.dashboard;
        
      default:
        return '/';
    }
  };

  const redirectToRole = (options: RedirectionOptions = {}) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const targetPath = options.returnTo || getRedirectPathForUser(user, options);
    navigate(targetPath, { replace: true });
  };

  const redirectAfterLogin = (
    loggedUser: SessionUser, 
    options: RedirectionOptions = {}
  ) => {
    const { returnTo } = options;
    
    // Verificar si es primer login
    const isFirstLogin = !localStorage.getItem(`onboarding_completed_${loggedUser.role}`);
    
    const targetPath = returnTo || getRedirectPathForUser(loggedUser, { 
      ...options, 
      isFirstLogin 
    });
    
    navigate(targetPath, { replace: true });
  };

  return {
    getRedirectPathForUser,
    redirectToRole,
    redirectAfterLogin
  };
};