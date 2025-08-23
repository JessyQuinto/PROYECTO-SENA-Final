import { useCallback } from 'react';
import { toast } from 'sonner';

export type ToastType = 'success' | 'error' | 'info' | 'warning';
export type AppRole = 'admin' | 'vendedor' | 'comprador' | undefined;
export type ToastAction = 'register' | 'login' | 'purchase' | 'sale' | 'update' | 'delete' | 'approve' | 'reject' | 'ship' | 'cancel' | 'generic';

export interface ToastOptions {
  type?: ToastType;
  title?: string;
  message: string;
  role?: AppRole;
  action?: ToastAction;
  durationMs?: number;
}

const ACTION_TEXT_MAP: Record<ToastAction, string> = {
  register: 'Registro',
  login: 'Inicio de sesión',
  purchase: 'Compra',
  sale: 'Venta',
  update: 'Actualización',
  delete: 'Eliminación',
  approve: 'Aprobación',
  reject: 'Rechazo',
  ship: 'Envío',
  cancel: 'Cancelación',
  generic: 'Notificación'
};

const ROLE_TEXT_MAP: Record<NonNullable<AppRole>, string> = {
  admin: 'Administrador',
  vendedor: 'Vendedor',
  comprador: 'Comprador'
};

function getDefaultTitle(role: AppRole, action?: ToastAction, type?: ToastType): string {
  const actionText = action ? ACTION_TEXT_MAP[action] : 'Notificación';
  const roleText = role ? ROLE_TEXT_MAP[role] : 'Usuario';
  
  if (type === 'error') return `${actionText} (${roleText}) - Error`;
  if (type === 'success') return `${actionText} (${roleText}) - Éxito`;
  return `${actionText} (${roleText})`;
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

  const success = useCallback((message: string, opts?: Omit<ToastOptions, 'message' | 'type'>) => {
    notify({ ...opts, type: 'success', message });
  }, [notify]);

  const error = useCallback((message: string, opts?: Omit<ToastOptions, 'message' | 'type'>) => {
    notify({ ...opts, type: 'error', message });
  }, [notify]);

  const info = useCallback((message: string, opts?: Omit<ToastOptions, 'message' | 'type'>) => {
    notify({ ...opts, type: 'info', message });
  }, [notify]);

  const warning = useCallback((message: string, opts?: Omit<ToastOptions, 'message' | 'type'>) => {
    notify({ ...opts, type: 'warning', message });
  }, [notify]);

  return {
    notify,
    success,
    error,
    info,
    warning
  };
};

// Versión que incluye el rol del usuario actual (para usar después de que AuthProvider esté disponible)
import { useAuth } from '@/auth/AuthContext';
export const useToastWithAuth = () => {
  const { user } = useAuth();
  
  const notify = useCallback((opts: ToastOptions) => {
    const role: AppRole = opts.role ?? (user?.role as AppRole);
    const type: ToastType = opts.type ?? 'info';
    const title = opts.title ?? getDefaultTitle(role, opts.action, type);
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
  }, [user?.role]);

  const success = useCallback((message: string, opts?: Omit<ToastOptions, 'message' | 'type'>) => {
    notify({ ...opts, type: 'success', message });
  }, [notify]);

  const error = useCallback((message: string, opts?: Omit<ToastOptions, 'message' | 'type'>) => {
    notify({ ...opts, type: 'error', message });
  }, [notify]);

  const info = useCallback((message: string, opts?: Omit<ToastOptions, 'message' | 'type'>) => {
    notify({ ...opts, type: 'info', message });
  }, [notify]);

  const warning = useCallback((message: string, opts?: Omit<ToastOptions, 'message' | 'type'>) => {
    notify({ ...opts, type: 'warning', message });
  }, [notify]);

  return {
    notify,
    success,
    error,
    info,
    warning
  };
};
