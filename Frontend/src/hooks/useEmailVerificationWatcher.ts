import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type EmailVerificationStatus = 'pending' | 'verified' | 'error';

export function useEmailVerificationWatcher(pollIntervalMs = 3000, onVerified?: () => void) {
  const [status, setStatus] = useState<EmailVerificationStatus>('pending');
  const mountedRef = useRef(true);
  const verifiedRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let timer: number | undefined;
    let retryTimer: number | undefined;

    async function checkOnce() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.warn('[EmailVerification] Auth error:', error.message);
          if (mountedRef.current) {
            setStatus('error');
            retryCountRef.current++;
          }
          return;
        }
        
        const user: any = data?.user;
        if (!user) {
          if (mountedRef.current) setStatus('pending');
          return;
        }

        // ✅ MEJORADO: Verificación más robusta del estado del email
        const isVerified = Boolean(
          user?.email_confirmed_at ||
          user?.confirmed_at ||
          user?.email_confirmed ||
          user?.identities?.some((i: any) => i?.identity_data?.email_verified === true) ||
          // ✅ NUEVO: Verificar también en la tabla users
          (async () => {
            try {
              const { data: userProfile } = await supabase
                .from('users')
                .select('email_confirmed_at')
                .eq('id', user.id)
                .single();
              return userProfile?.email_confirmed_at;
            } catch {
              return false;
            }
          })()
        );

        if (mountedRef.current) {
          setStatus(isVerified ? 'verified' : 'pending');
          if (isVerified && !verifiedRef.current) {
            verifiedRef.current = true;
            onVerified?.();
          }
          
          // ✅ NUEVO: Resetear contador de reintentos en éxito
          if (isVerified) {
            retryCountRef.current = 0;
          }
        }
      } catch (error) {
        console.error('[EmailVerification] Unexpected error:', error);
        if (mountedRef.current) {
          setStatus('error');
          retryCountRef.current++;
        }
      }
    }

    // ✅ MEJORADO: Lógica de reintentos más inteligente
    const scheduleNextCheck = () => {
      if (retryCountRef.current >= maxRetries) {
        console.warn('[EmailVerification] Max retries reached, stopping checks');
        return;
      }

      if (status === 'verified') {
        return; // No seguir verificando si ya está verificado
      }

      timer = window.setTimeout(() => {
        checkOnce();
        scheduleNextCheck();
      }, pollIntervalMs);
    };

    // Primer chequeo inmediato
    checkOnce();

    // Programar siguiente verificación
    scheduleNextCheck();

    // ✅ MEJORADO: Listener de cambios de auth más robusto
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[EmailVerification] Auth state change:', event);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // ✅ NUEVO: Verificación inmediata en cambios de auth
        await checkOnce();
      }
    });

    return () => {
      if (timer) clearTimeout(timer);
      if (retryTimer) clearTimeout(retryTimer);
      sub.subscription.unsubscribe();
    };
  }, [pollIntervalMs, onVerified, status]);

  // ✅ NUEVO: Función para resetear el estado
  const resetVerification = () => {
    if (mountedRef.current) {
      setStatus('pending');
      verifiedRef.current = false;
      retryCountRef.current = 0;
    }
  };

  // ✅ NUEVO: Función para verificar manualmente
  const checkVerification = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      const user: any = data?.user;
      const isVerified = Boolean(
        user?.email_confirmed_at ||
        user?.confirmed_at ||
        user?.email_confirmed
      );
      
      if (mountedRef.current) {
        setStatus(isVerified ? 'verified' : 'pending');
        if (isVerified && !verifiedRef.current) {
          verifiedRef.current = true;
          onVerified?.();
        }
      }
      
      return isVerified;
    } catch (error) {
      console.error('[EmailVerification] Manual check failed:', error);
      if (mountedRef.current) setStatus('error');
      return false;
    }
  };

  return {
    status,
    resetVerification,
    checkVerification,
    retryCount: retryCountRef.current,
    maxRetries
  };
}


