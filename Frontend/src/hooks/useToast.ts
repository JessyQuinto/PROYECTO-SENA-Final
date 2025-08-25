import { useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/auth/AuthContext';

// Types
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

// Constants
const DEFAULT_DURATIONS = {
  error: 6000,
  success: 4000,
  info: 4000,
  warning: 4000,
} as const;

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
  generic: 'Notificación',
};

const ROLE_TEXT_MAP: Record<NonNullable<AppRole>, string> = {
  admin: 'Administrador',
  vendedor: 'Vendedor',
  comprador: 'Comprador',
};

// Utility functions
function getDefaultTitle(
  role: AppRole,
  action?: ToastAction,
  type?: ToastType
): string {
  // For production, we want clean notifications without unnecessary prefixes
  if (type === 'error') return 'Error';
  return '';
}

function getToastDuration(type: ToastType, customDuration?: number): number {
  return customDuration ?? DEFAULT_DURATIONS[type];
}

function showToast(type: ToastType, title: string, message: string, duration: number): void {
  switch (type) {
    case 'error':
      toast.error(title, { description: message, duration });
      break;
    case 'success':
      toast.success(title, { description: message, duration });
      break;
    case 'warning':
      toast.warning(title, { description: message, duration });
      break;
    default:
      toast.info(title, { description: message, duration });
  }
}

// Base hook without authentication
export const useToast = () => {
  const notify = useCallback((opts: ToastOptions) => {
    const type: ToastType = opts.type ?? 'info';
    const title = opts.title ?? getDefaultTitle(opts.role, opts.action, type);
    const duration = getToastDuration(type, opts.durationMs);

    showToast(type, title, opts.message, duration);
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

// Hook with authentication context
export const useToastWithAuth = () => {
  const { user } = useAuth();

  const notify = useCallback(
    (opts: ToastOptions) => {
      const role: AppRole = opts.role ?? (user?.role as AppRole);
      const type: ToastType = opts.type ?? 'info';
      const title = opts.title ?? getDefaultTitle(role, opts.action, type);
      const duration = getToastDuration(type, opts.durationMs);

      showToast(type, title, opts.message, duration);
    },
    [user?.role]
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
