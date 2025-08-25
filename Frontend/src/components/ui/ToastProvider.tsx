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

// Función simplificada para títulos más profesionales
function getProfessionalTitle(
  role: AppRole,
  action?: ToastOptions['action'],
  type?: ToastType
) {
  // Solo generar título automático para acciones específicas que lo necesiten
  if (action === 'approve') return 'Aprobación exitosa';
  if (action === 'reject') return 'Rechazo procesado';
  if (action === 'ship') return 'Envío confirmado';
  if (action === 'delete') return 'Eliminación completada';
  
  // Para la mayoría de casos, no usar título automático
  return undefined;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();

  const notify = useCallback(
    (opts: ToastOptions) => {
      const role: AppRole = opts.role ?? (user?.role as AppRole);
      const type: ToastType = opts.type ?? 'info';
      
      // Solo usar título automático si no se proporciona uno personalizado
      const title = opts.title ?? getProfessionalTitle(role, opts.action, type);
      const duration = opts.durationMs ?? (type === 'error' ? 6000 : 4000);
      
      // Para notificaciones de éxito, usar solo el mensaje si no hay título
      if (type === 'success' && !title) {
        toast.success(opts.message, { duration });
      } else if (type === 'error' && !title) {
        toast.error(opts.message, { duration });
      } else if (title) {
        // Solo usar título + descripción cuando sea necesario
        if (type === 'error') {
          toast.error(title, { 
            description: opts.message, 
            duration,
          });
        } else if (type === 'success') {
          toast.success(title, { 
            description: opts.message, 
            duration,
          });
        } else if (type === 'warning') {
          toast(title, { 
            description: opts.message, 
            duration,
            icon: '⚠️',
          });
        } else {
          toast(title, { 
            description: opts.message, 
            duration,
          });
        }
      } else {
        // Notificación simple sin título
        toast(opts.message, { duration });
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
