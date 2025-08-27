import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type EmailVerificationStatus = 'pending' | 'verified' | 'error';

export function useEmailVerificationWatcher(pollIntervalMs = 5000, onVerified?: () => void) {
  const [status, setStatus] = useState<EmailVerificationStatus>('pending');
  const mountedRef = useRef(true);
  const verifiedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let timer: number | undefined;

    async function checkOnce() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          if (mountedRef.current) setStatus('error');
          return;
        }
        const user: any = data?.user;
        const isVerified = Boolean(
          user?.email_confirmed_at ||
            user?.confirmed_at ||
            user?.email_confirmed ||
            user?.identities?.some((i: any) => i?.identity_data?.email_verified === true)
        );
        if (mountedRef.current) {
          setStatus(isVerified ? 'verified' : 'pending');
          if (isVerified && !verifiedRef.current) {
            verifiedRef.current = true;
            onVerified?.();
          }
        }
      } catch {
        if (mountedRef.current) setStatus('error');
      }
    }

    // Primer chequeo inmediato
    checkOnce();

    // Polling
    timer = window.setInterval(checkOnce, pollIntervalMs);

    // Listener de cambios de auth
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      checkOnce();
    });

    return () => {
      if (timer) clearInterval(timer);
      sub.subscription.unsubscribe();
    };
  }, [pollIntervalMs, onVerified]);

  return status;
}


