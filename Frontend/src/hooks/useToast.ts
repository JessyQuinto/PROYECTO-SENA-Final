import { useCallback } from 'react';
import { toast } from 'sonner';

export type ToastType = 'success' | 'error' | 'info' | 'warning';
export type AppRole = 'admin' | 'vendedor' | 'comprador' | undefined;
export type ToastAction =
  | 'register'
  | 'login'
  | 'purchase'
  | 'sale'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'ship'
  | 'cancel'
  | 'generic';

export interface ToastOptions {
  type?: ToastType;
  title?: string;
  message: string;
  role?: AppRole;
  action?: ToastAction;
  durationMs?: number;
}

// Simplified action text map for cleaner notifications
const SIMPLE_ACTION_TEXT_MAP: Record<ToastAction, { success: string; error: string; default: string }> = {
  register: { success: 'Registro exitoso', error: 'Error en el registro', default: 'Registro' },
  login: { success: 'Bienvenido', error: 'Error de inicio de sesión', default: 'Inicio de sesión' },
  purchase: { success: 'Compra exitosa', error: 'Error en la compra', default: 'Compra' },
  sale: { success: 'Venta realizada', error: 'Error en la venta', default: 'Venta' },
  update: { success: 'Actualizado', error: 'Error al actualizar', default: 'Actualización' },
  delete: { success: 'Eliminado', error: 'Error al eliminar', default: 'Eliminación' },
  approve: { success: 'Aprobado', error: 'Error al aprobar', default: 'Aprobación' },
  reject: { success: 'Rechazado', error: 'Error al rechazar', default: 'Rechazo' },
  ship: { success: 'Enviado', error: 'Error en el envío', default: 'Envío' },
  cancel: { success: 'Cancelado', error: 'Error al cancelar', default: 'Cancelación' },
  generic: { success: 'Éxito', error: 'Error', default: 'Notificación' },
};

function getDefaultTitle(
  role: AppRole,
  action?: ToastAction,
  type?: ToastType
): string {
  if (!action) {
    return type === 'error' ? 'Error' : type === 'success' ? 'Éxito' : 'Notificación';
  }

  const actionTexts = SIMPLE_ACTION_TEXT_MAP[action];
  
  if (type === 'error') return actionTexts.error;
  if (type === 'success') return actionTexts.success;
  return actionTexts.default;
}

// Function to create personalized welcome messages
export function createWelcomeMessage(userName?: string): string {
  if (userName) {
    return `Bienvenido, ${userName}`;
  }
  return 'Bienvenido';
}

export const useToast = () => {
  const notify = useCallback((opts: ToastOptions) => {
    const type: ToastType = opts.type ?? 'info';
    const title = opts.title ?? getDefaultTitle(opts.role, opts.action, type);
    const duration = opts.durationMs ?? (type === 'error' ? 6000 : 4000);

    switch (type) {
      case 'error':
        toast.error(title, { description: opts.message, duration });
        break;
      case 'success':
        toast.success(title, { description: opts.message, duration });
        break;
      case 'warning':
        toast(title, { description: opts.message, duration });
        break;
      default:
        toast(title, { description: opts.message, duration });
    }
  }, []);

  const success = useCallback(
    (message: string, opts?: Omit<ToastOptions, 'message' | 'type'>) => {
      notify({ ...opts, type: 'success', message });
    },
    [notify]
  );

  const error = useCallback(
    (message: string, opts?: Omit<ToastOptions, 'message' | 'type'>) => {
      notify({ ...opts, type: 'error', message });
    },
    [notify]
  );

  const info = useCallback(
    (message: string, opts?: Omit<ToastOptions, 'message' | 'type'>) => {
      notify({ ...opts, type: 'info', message });
    },
    [notify]
  );

  const warning = useCallback(
    (message: string, opts?: Omit<ToastOptions, 'message' | 'type'>) => {
      notify({ ...opts, type: 'warning', message });
    },
    [notify]
  );

  return {
    notify,
    success,
    error,
    info,
    warning,
  };
};

// Versión que incluye el rol del usuario actual (para usar después de que AuthProvider esté disponible)
import { useAuth } from '@/auth/AuthContext';
export const useToastWithAuth = () => {
  const { user } = useAuth();

  const notify = useCallback(
    (opts: ToastOptions) => {
      const role: AppRole = opts.role ?? (user?.role as AppRole);
      const type: ToastType = opts.type ?? 'info';
      
      let title = opts.title;
      
      // Special handling for login success to create personalized welcome message
      if (!title && opts.action === 'login' && type === 'success') {
        title = createWelcomeMessage(user?.nombre);
      } else if (!title) {
        title = getDefaultTitle(role, opts.action, type);
      }
      
      const duration = opts.durationMs ?? (type === 'error' ? 6000 : 4000);

      switch (type) {
        case 'error':
          toast.error(title, { description: opts.message, duration });
          break;
        case 'success':
          toast.success(title, { description: opts.message, duration });
          break;
        case 'warning':
          toast(title, { description: opts.message, duration });
          break;
        default:
          toast(title, { description: opts.message, duration });
      }
    },
    [user?.role, user?.nombre]
  );

  const success = useCallback(
    (message: string, opts?: Omit<ToastOptions, 'message' | 'type'>) => {
      notify({ ...opts, type: 'success', message });
    },
    [notify]
  );

  const error = useCallback(
    (message: string, opts?: Omit<ToastOptions, 'message' | 'type'>) => {
      notify({ ...opts, type: 'error', message });
    },
    [notify]
  );

  const info = useCallback(
    (message: string, opts?: Omit<ToastOptions, 'message' | 'type'>) => {
      notify({ ...opts, type: 'info', message });
    },
    [notify]
  );

  const warning = useCallback(
    (message: string, opts?: Omit<ToastOptions, 'message' | 'type'>) => {
      notify({ ...opts, type: 'warning', message });
    },
    [notify]
  );

  return {
    notify,
    success,
    error,
    info,
    warning,
  };
};
