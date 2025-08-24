import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { UserRole, VendedorEstado } from '@/types/domain';
import { useToast } from '@/hooks/useToast';

interface SessionUser {
  id: string;
  email?: string;
  nombre?: string;
  role?: UserRole;
  vendedor_estado?: VendedorEstado;
  bloqueado?: boolean;
}

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  signIn(email: string, password: string): Promise<{ error?: string }>;
  signUp(
    email: string,
    password: string,
    role: 'comprador' | 'vendedor',
    extra?: {
      nombre?: string;
      telefono?: string;
      ciudad?: string;
      departamento?: string;
      acceptedTerms?: boolean;
    }
  ): Promise<{ error?: string }>;
  signOut(): Promise<void>;
  refreshProfile(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast(); // Usar la versión simple que no depende de useAuth
  const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL as
    | string
    | undefined;

  // Track loading state to prevent duplicate calls
  const [profileLoading, setProfileLoading] = useState<string | null>(null);
  const [profileRetryCount, setProfileRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second

  const isEmailConfirmed = (session: Session | null): boolean => {
    const u: any = session?.user;
    return !!(u?.email_confirmed_at || u?.confirmed_at || u?.email_confirmed);
  };

  const loadProfile = async (uid: string, retryCount = 0) => {
    if (!supabase) return;
    
    // Prevent duplicate calls for the same user
    if (profileLoading === uid) {
      return;
    }
    
    // Circuit breaker: stop retrying after max attempts
    if (retryCount >= MAX_RETRIES) {
      console.warn('[auth] Max retries reached for loadProfile, giving up');
      setLoading(false);
      return;
    }
    
    setProfileLoading(uid);
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role, vendedor_estado, bloqueado, nombre_completo')
        .eq('id', uid)
        .maybeSingle();
        
      if (error) {
        if (import.meta.env.DEV) {
          console.warn(`[auth] No se pudo cargar perfil users (attempt ${retryCount + 1}):`, error.message);
        }
        
        // Only retry on network errors, not on auth/permission errors
        if (error.message.includes('Failed to fetch') || error.code === 'PGRST301') {
          if (retryCount < MAX_RETRIES) {
            setProfileRetryCount(retryCount + 1);
            setTimeout(() => {
              loadProfile(uid, retryCount + 1);
            }, RETRY_DELAY * Math.pow(2, retryCount)); // Exponential backoff
            return;
          }
        }
        
        setProfileLoading(null);
        setLoading(false);
        return;
      }
      
      if (data) {
        // Reset retry count on success
        setProfileRetryCount(0);
        
        // Seguridad: si usuario está bloqueado, cerrar sesión.
        if (data.bloqueado) {
          await supabase.auth.signOut();
          setUser(null);
          setProfileLoading(null);
          setLoading(false);
          return;
        }
        
        setUser({
          id: data.id,
          email: data.email || undefined,
          nombre: (data as any).nombre_completo || undefined,
          role: (data.role as SessionUser['role']) || undefined,
          vendedor_estado: data.vendedor_estado as SessionUser['vendedor_estado'],
          bloqueado: !!data.bloqueado,
        });
        
        setProfileLoading(null);
        setLoading(false);
        return;
      }

      // Si no existe perfil, no lo creamos desde cliente para evitar conflictos de FK/RLS.
      // El perfil debe crearlo el backend en /auth/post-signup usando service role.
      setProfileLoading(null);
      setLoading(false);
      return;
      
    } catch (error) {
      console.error('[auth] Unexpected error in loadProfile:', error);
      setProfileLoading(null);
      setLoading(false);
      return;
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    // Evitar auto-login tras confirmar email: si vuelve con tokens (?/# type=signup), cerrar sesión y redirigir a /login
    (async () => {
      try {
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        const query =
          typeof window !== 'undefined' ? window.location.search : '';
        const raw =
          (hash && hash.startsWith('#') ? hash.substring(1) : hash) ||
          (query && query.startsWith('?') ? query.substring(1) : '');
        const params = new URLSearchParams(raw);
        const type = params.get('type');
        if (type === 'signup') {
          await supabase.auth.signOut();
          setUser(null);
          try {
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );
          } catch {}
          toast.success('Correo confirmado. Inicia sesión.', {
            action: 'login',
          });
          setLoading(false);
          try {
            window.location.replace('/login');
          } catch {}
          return; // Importante: no continuar con listeners
        }
      } catch {}
    })();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          // Seguridad: si email no confirmado, cerrar sesión y avisar
          if (!isEmailConfirmed(session)) {
            supabase.auth.signOut().finally(() => {
              setUser(null);
              toast.error('Confirma tu correo para iniciar sesión', {
                action: 'login',
              });
              setLoading(false);
            });
            return;
          }
          // Intentar obtener perfil desde tabla users para reflejar cambios admin.
          // Only load if not already loading for this user
          if (profileLoading !== session.user.id) {
            loadProfile(session.user.id);
          }
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );
    
    // Initial session check - but avoid duplicate calls
    supabase.auth
      .getSession()
      .then(async ({ data }: { data: { session: Session | null } }) => {
        const session = data.session as Session | null;
        if (session?.user) {
          if (!isEmailConfirmed(session)) {
            await supabase.auth.signOut();
            setUser(null);
            setLoading(false);
            return;
          }
          // Only load if not already loading for this user
          if (profileLoading !== session.user.id) {
            await loadProfile(session.user.id);
          }
        } else {
          setLoading(false);
        }
      })
      .catch((error: Error) => {
        console.error('[auth] Error getting initial session:', error);
        setLoading(false);
      });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [toast]);

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: 'Supabase no configurado' };
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error && data.user) {
      const sessionNow = (await supabase.auth.getSession()).data.session;
      if (!isEmailConfirmed(sessionNow)) {
        await supabase.auth.signOut();
        return { error: 'Debes confirmar tu correo antes de iniciar sesión' };
      }
      if (profileLoading !== data.user.id) {
        await loadProfile(data.user.id);
      }
    }
    return { error: error?.message };
  };

  const signUp = async (
    email: string,
    password: string,
    role: 'comprador' | 'vendedor',
    extra?: {
      nombre?: string;
      telefono?: string;
      ciudad?: string;
      departamento?: string;
      acceptedTerms?: boolean;
    }
  ) => {
    if (!supabase) return { error: 'Supabase no configurado' };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, ...extra },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return { error: error.message };

    // Post-signup backend: crear/actualizar perfil y claims de rol (seguro con service role)
    if (data.user?.id) {
      try {
        if (backendUrl) {
          let ok = false;
          try {
            const resp = await fetch(
              `${backendUrl.replace(/\/$/, '')}/auth/post-signup`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  user_id: data.user.id,
                  email,
                  role,
                  nombre: extra?.nombre,
                }),
              }
            );
            ok = resp.ok;
          } catch {
            ok = false;
          }
          if (!ok) {
            // Fallback si backend no disponible
            const { error: insertError } = await supabase.from('users').insert({
              id: data.user.id,
              email: email,
              role: role,
              vendedor_estado: role === 'vendedor' ? 'pendiente' : null,
              nombre_completo: extra?.nombre ?? null,
            });
            if (insertError) {
              if (import.meta.env.DEV) {
                console.warn(
                  '[auth] Error creando perfil de usuario (fallback):',
                  insertError
                );
              }
            }
          }
        } else {
          // Fallback: crear perfil mínimo vía RLS desde el cliente (menos seguro; solo dev)
          const { error: insertError } = await supabase.from('users').insert({
            id: data.user.id,
            email: email,
            role: role,
            vendedor_estado: role === 'vendedor' ? 'pendiente' : null,
            nombre_completo: extra?.nombre ?? null,
          });
          if (insertError) {
            if (import.meta.env.DEV) {
              console.warn(
                '[auth] Error creando perfil de usuario (fallback):',
                insertError
              );
            }
          }
        }
      } catch (e) {
        if (import.meta.env.DEV) {
          console.warn('[auth] Error en post-signup:', e);
        }
      }
    }

    return { error: undefined };
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (!supabase) return;
    const session = (await supabase.auth.getSession()).data.session;
    if (session?.user?.id && profileLoading !== session.user.id) {
      await loadProfile(session.user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
