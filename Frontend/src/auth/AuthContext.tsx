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

  const isEmailConfirmed = (session: Session | null): boolean => {
    const u: any = session?.user;
    return !!(u?.email_confirmed_at || u?.confirmed_at || u?.email_confirmed);
  };

  const loadProfile = async (uid: string) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, vendedor_estado, bloqueado, nombre_completo')
      .eq('id', uid)
      .maybeSingle();
    if (error) {
      if (import.meta.env.DEV) {
        console.warn('[auth] No se pudo cargar perfil users:', error.message);
      }
      return;
    }
    if (data) {
      // Seguridad: si usuario está bloqueado, cerrar sesión.
      if (data.bloqueado) {
        await supabase.auth.signOut();
        setUser(null);
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
      return;
    }

    // Si no existe perfil, no lo creamos desde cliente para evitar conflictos de FK/RLS.
    // El perfil debe crearlo el backend en /auth/post-signup usando service role.
    return;
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
          loadProfile(session.user.id).finally(() => setLoading(false));
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );
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
          await loadProfile(session.user.id);
        }
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
      await loadProfile(data.user.id);
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
    if (session?.user?.id) {
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
