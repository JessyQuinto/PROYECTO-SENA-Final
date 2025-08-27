import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { useAuth } from '@/auth/AuthContext';
import { toast } from 'sonner';
import type { ToastType, AppRole, ToastAction } from '@/hooks/useToast';
import { createWelcomeMessage } from '@/hooks/useToast';

export interface ToastOptions {
  type?: ToastType;
  title?: string;
  message: string;
  role?: AppRole;
  action?: ToastAction;
  durationMs?: number;
}

// Mantener API, pero delegar a sonner

interface ToastContextValue {
  notify(opts: ToastOptions): void;
  success(message: string, opts?: Omit<ToastOptions, 'message' | 'type'>): void;
  error(message: string, opts?: Omit<ToastOptions, 'message' | 'type'>): void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function getSimpleTitle(
  role: AppRole,
  action?: ToastOptions['action'],
  type?: ToastType,
  userName?: string
) {
  // Special handling for login success to create personalized welcome message
  if (action === 'login' && type === 'success') {
    return createWelcomeMessage(userName);
  }

  const simpleActionTexts: Record<NonNullable<ToastOptions['action']>, { success: string; error: string; default: string }> = {
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

  if (!action) {
    return type === 'error' ? 'Error' : type === 'success' ? 'Éxito' : 'Notificación';
  }

  const actionTexts = simpleActionTexts[action];
  
  if (type === 'error') return actionTexts.error;
  if (type === 'success') return actionTexts.success;
  return actionTexts.default;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();

  const notify = useCallback(
    (opts: ToastOptions) => {
      const role: AppRole = opts.role ?? (user?.role as AppRole);
      const type: ToastType = opts.type ?? 'info';
      const title =
        opts.title ?? getSimpleTitle(role, opts.action, type, user?.nombre);
      const duration = opts.durationMs ?? (type === 'error' ? 6000 : 4000);
      if (type === 'error')
        toast.error(title, { description: opts.message, duration });
      else if (type === 'success')
        toast.success(title, { description: opts.message, duration });
      else if (type === 'warning')
        toast(title, { description: opts.message, duration });
      else toast(title, { description: opts.message, duration });
    },
    [user?.role, user?.nombre]
  );

  const success = useCallback(
    (message: string, opts?: Omit<ToastOptions, 'message' | 'type'>) =>
      notify({ ...opts, type: 'success', message }),
    [notify]
  );
  const error = useCallback(
    (message: string, opts?: Omit<ToastOptions, 'message' | 'type'>) =>
      notify({ ...opts, type: 'error', message }),
    [notify]
  );

  const value = useMemo(
    () => ({ notify, success, error }),
    [notify, success, error]
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
};
