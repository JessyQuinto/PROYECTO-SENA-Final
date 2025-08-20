import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { toast } from 'sonner';

type ToastType = 'success' | 'error' | 'info' | 'warning';
type AppRole = 'admin' | 'vendedor' | 'comprador' | undefined;

export interface ToastOptions {
  type?: ToastType;
  title?: string;
  message: string;
  role?: AppRole;
  action?: 'register' | 'login' | 'purchase' | 'sale' | 'update' | 'delete' | 'approve' | 'reject' | 'ship' | 'cancel' | 'generic';
  durationMs?: number;
}

// Mantener API, pero delegar a sonner

interface ToastContextValue {
  notify(opts: ToastOptions): void;
  success(message: string, opts?: Omit<ToastOptions, 'message' | 'type'>): void;
  error(message: string, opts?: Omit<ToastOptions, 'message' | 'type'>): void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function roleActionDefaultTitle(role: AppRole, action?: ToastOptions['action'], type?: ToastType) {
  const actionText: Record<NonNullable<ToastOptions['action']>, string> = {
    register: 'Registro', login: 'Inicio de sesión', purchase: 'Compra', sale: 'Venta', update: 'Actualización', delete: 'Eliminación', approve: 'Aprobación', reject: 'Rechazo', ship: 'Envío', cancel: 'Cancelación', generic: 'Notificación'
  };
  const roleText: Record<NonNullable<AppRole>, string> = { admin: 'Administrador', vendedor: 'Vendedor', comprador: 'Comprador' } as any;
  const base = action ? actionText[action] : 'Notificación';
  const who = role ? roleText[role] : 'Usuario';
  if (type === 'error') return `${base} (${who}) - Error`;
  if (type === 'success') return `${base} (${who}) - Éxito`;
  return `${base} (${who})`;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const notify = useCallback((opts: ToastOptions) => {
    const role: AppRole = opts.role ?? (user?.role as AppRole);
    const type: ToastType = opts.type ?? 'info';
    const title = opts.title ?? roleActionDefaultTitle(role, opts.action, type);
    const duration = opts.durationMs ?? (type === 'error' ? 6000 : 4000);
    if (type === 'error') toast.error(title, { description: opts.message, duration });
    else if (type === 'success') toast.success(title, { description: opts.message, duration });
    else if (type === 'warning') toast(title, { description: opts.message, duration });
    else toast(title, { description: opts.message, duration });
  }, [user?.role]);

  const success = useCallback((message: string, opts?: Omit<ToastOptions, 'message' | 'type'>) => notify({ ...opts, type: 'success', message }), [notify]);
  const error = useCallback((message: string, opts?: Omit<ToastOptions, 'message' | 'type'>) => notify({ ...opts, type: 'error', message }), [notify]);

  useEffect(() => {
    (window as any).toast = { notify, success, error };
    return () => { delete (window as any).toast; };
  }, [notify, success, error]);

  const value = useMemo(() => ({ notify, success, error }), [notify, success, error]);

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
};


