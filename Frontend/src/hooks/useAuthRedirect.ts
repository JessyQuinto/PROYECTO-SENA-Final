import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

interface RedirectOptions {
  message?: string;
  returnTo?: string;
}

/**
 * Hook personalizado para manejar redirecciones de autenticación
 * Proporciona funciones para redirigir usuarios no autenticados al login
 */
export const useAuthRedirect = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  /**
   * Redirige al usuario al login si no está autenticado
   * @param options - Opciones de redirección
   * @returns true si el usuario está autenticado, false si fue redirigido
   */
  const requireAuth = (options: RedirectOptions = {}): boolean => {
    if (!user) {
      navigate('/login', {
        state: {
          message: options.message || 'Debes iniciar sesión para continuar',
          returnTo: options.returnTo || window.location.pathname
        }
      });
      return false;
    }
    return true;
  };

  /**
   * Redirige al usuario al login si no tiene el rol requerido
   * @param requiredRole - Rol requerido para la acción
   * @param options - Opciones de redirección
   * @returns true si el usuario tiene el rol correcto, false si fue redirigido
   */
  const requireRole = (requiredRole: string, options: RedirectOptions = {}): boolean => {
    if (!user) {
      navigate('/login', {
        state: {
          message: options.message || 'Debes iniciar sesión para continuar',
          returnTo: options.returnTo || window.location.pathname
        }
      });
      return false;
    }

    if (user.role !== requiredRole) {
      navigate('/login', {
        state: {
          message: options.message || `Solo los usuarios con rol '${requiredRole}' pueden realizar esta acción`,
          returnTo: options.returnTo || window.location.pathname
        }
      });
      return false;
    }

    return true;
  };

  /**
   * Verifica si el usuario puede añadir productos al carrito
   * @param options - Opciones de redirección
   * @returns true si puede añadir al carrito, false si fue redirigido
   */
  const requireCartAccess = (options: RedirectOptions = {}): boolean => {
    return requireRole('comprador', {
      message: options.message || 'Solo los compradores pueden añadir productos al carrito',
      returnTo: options.returnTo || '/productos'
    });
  };

  return {
    requireAuth,
    requireRole,
    requireCartAccess,
    isAuthenticated: !!user,
    user
  };
};
