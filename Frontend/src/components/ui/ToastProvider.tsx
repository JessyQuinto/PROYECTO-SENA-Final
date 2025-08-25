import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useAuth } from '@/auth/AuthContext';
import { toast } from 'sonner';
import type { ToastType, AppRole, ToastAction } from '@/hooks/useToast';

export interface ToastOptions {
  type?: ToastType;
  title?: string;
  message: string;
  role?: AppRole;
  action?: ToastAction;
  durationMs?: number;
  id?: string; // Para deduplicación
}

// Mantener API, pero delegar a sonner

interface ToastContextValue {
  notify(opts: ToastOptions): void;
  success(message: string, opts?: Omit<ToastOptions, 'message' | 'type'>): void;
  error(message: string, opts?: Omit<ToastOptions, 'message' | 'type'>): void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function roleActionDefaultTitle(
  role: AppRole,
  action?: ToastOptions['action'],
  type?: ToastType
) {
  const actionText: Record<NonNullable<ToastOptions['action']>, string> = {
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
  const roleText: Record<NonNullable<AppRole>, string> = {
    admin: 'Administrador',
    vendedor: 'Vendedor',
    comprador: 'Comprador',
  } as any;
  const base = action ? actionText[action] : 'Notificación';
  const who = role ? roleText[role] : 'Usuario';
  if (type === 'error') return `${base} (${who}) - Error`;
  if (type === 'success') return `${base} (${who}) - Éxito`;
  return `${base} (${who})`;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  
  // Ref para tracking de notificaciones recientes (deduplicación)
  const recentToastsRef = useRef<Map<string, number>>(new Map());
  const TOAST_DEDUP_INTERVAL = 3000; // 3 segundos

  const notify = useCallback(
    (opts: ToastOptions) => {
      const role: AppRole = opts.role ?? (user?.role as AppRole);
      const type: ToastType = opts.type ?? 'info';
      const title =
        opts.title ?? roleActionDefaultTitle(role, opts.action, type);
      const duration = opts.durationMs ?? (type === 'error' ? 6000 : 4000);
      
      // Sistema de deduplicación
      const toastKey = `${type}-${title}-${opts.message}`;
      const now = Date.now();
      const lastShown = recentToastsRef.current.get(toastKey);
      
      if (lastShown && (now - lastShown) < TOAST_DEDUP_INTERVAL) {
        console.log('[ToastProvider] Duplicate toast prevented:', toastKey);
        return; // Evitar notificación duplicada
      }
      
      // Registrar timestamp de esta notificación
      recentToastsRef.current.set(toastKey, now);
      
      // Limpiar toasts antiguos (más de 10 segundos)
      for (const [key, timestamp] of recentToastsRef.current.entries()) {
        if (now - timestamp > 10000) {
          recentToastsRef.current.delete(key);
        }
      }
      
      // Use immediate execution for better responsiveness
      if (type === 'error') {
        toast.error(title, { 
          description: opts.message, 
          duration,
          id: opts.id || toastKey, // Usar ID para deduplicación
        });
      } else if (type === 'success') {
        toast.success(title, { 
          description: opts.message, 
          duration,
          id: opts.id || toastKey, // Usar ID para deduplicación
        });
      } else if (type === 'warning') {
        toast(title, { 
          description: opts.message, 
          duration,
          icon: '⚠️',
          id: opts.id || toastKey, // Usar ID para deduplicación
        });
      } else {
        toast(title, { 
          description: opts.message, 
          duration,
          id: opts.id || toastKey, // Usar ID para deduplicación
        });
      }
    },
    [user?.role]
  );

  const success = useCallback(
    (message: string, opts?: Omit<ToastOptions, 'message' | 'type'>) =>
      notify({ ...opts, type: 'success', message }),
    [notify]
  );
  
  const error = useCallback(
    (message: string, opts?: Omit<ToastOptions, 'message' | 'type'>): void =>
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
