import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

export type EmailVerificationStatus = 'pending' | 'verified' | 'error' | 'checking';

// ✅ Hook simplificado para verificación de email - SIN ERRORES DE TIPOS
export function useEmailVerificationWatcher(
  intervalMs = 5000,
  onVerified?: () => void
) {
  const [status, setStatus] = useState<EmailVerificationStatus>('checking');
  const [isChecking, setIsChecking] = useState(false);
  const mountedRef = useRef(true);
  const intervalRef = useRef<number | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // ✅ Función principal de verificación
  const checkVerification = useCallback(async (): Promise<boolean> => {
    if (!mountedRef.current) return false;
    
    try {
      setIsChecking(true);
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.warn('[EmailVerification] Auth error:', error.message);
        if (mountedRef.current) {
          setStatus('pending'); // ✅ No marcamos como error si no hay sesión
          retryCount.current++;
        }
        return false;
      }
      
      if (!user) {
        if (mountedRef.current) setStatus('pending');
        return false;
      }
      
      // Verificar confirmación de email
      const isConfirmed = Boolean(
        user.email_confirmed_at ||
        user.confirmed_at ||
        (user as any).email_confirmed
      );
      
      if (mountedRef.current) {
        const newStatus: EmailVerificationStatus = isConfirmed ? 'verified' : 'pending';
        setStatus(newStatus);
        
        if (isConfirmed) {
          // Detener polling si está verificado
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          // Llamar callback de éxito
          onVerified?.();
          
          // Resetear contador de reintentos
          retryCount.current = 0;
        }
      }
      
      return isConfirmed;
      
    } catch (error) {
      console.error('[EmailVerification] Unexpected error:', error);
      if (mountedRef.current) {
        setStatus('error');
        retryCount.current++;
      }
      return false;
    } finally {
      if (mountedRef.current) {
        setIsChecking(false);
      }
    }
  }, [onVerified]);

  // ✅ Iniciar verificación SOLO si estamos en contexto relevante
  useEffect(() => {
    // Solo iniciar si estamos en la página de verificación o hay hash de confirmación
    const shouldCheck = window.location.pathname.includes('verifica-tu-correo') || 
                       window.location.hash.includes('type=signup') ||
                       new URLSearchParams(window.location.search).get('type') === 'signup';
    
    if (!shouldCheck) {
      setStatus('pending');
      return;
    }
    
    // Verificación inicial inmediata
    checkVerification();
    
    // Configurar polling solo si no está ya verificado
    const startPolling = () => {
      if (!intervalRef.current) {
        intervalRef.current = window.setInterval(() => {
          if (mountedRef.current && retryCount.current < maxRetries) {
            checkVerification().then(isVerified => {
              if (isVerified && intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
            });
          } else if (retryCount.current >= maxRetries) {
            console.warn('[EmailVerification] Max retries reached, stopping checks');
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        }, intervalMs);
      }
    };
    
    startPolling();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [intervalMs, checkVerification]);

  // ✅ Listener para cambios de autenticación
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      console.log('[EmailVerification] Auth state change:', event);
      
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        // Verificación inmediata en cambios de estado
        await checkVerification();
      }
    });

    return () => subscription.unsubscribe();
  }, [checkVerification]);

  // ✅ Función para resetear estado
  const resetVerification = useCallback(() => {
    if (mountedRef.current) {
      setStatus('checking');
      setIsChecking(false);
      retryCount.current = 0;
    }
  }, []);

  return {
    status,
    isChecking,
    checkVerification,
    resetVerification,
    retryCount: retryCount.current,
    maxRetries
  };
}