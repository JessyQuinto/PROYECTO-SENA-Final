import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { UserRole, VendedorEstado } from '@/types/domain';
import { useToast } from '@/hooks/useToast';
import { cleanupUserState, validateCleanup } from '@/lib/stateCleanup';

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
  isSigningOut: boolean; // Nuevo estado para transición
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
  const [isSigningOut, setIsSigningOut] = useState(false); // Nuevo estado para transición
  const signingOutRef = useRef(false);
  useEffect(() => {
    signingOutRef.current = isSigningOut;
  }, [isSigningOut]);
  const toast = useToast(); // Usar la versión simple que no depende de useAuth
  const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL as
    | string
    | undefined;

  // Track loading state to prevent duplicate calls
  const [profileLoading, setProfileLoading] = useState<string | null>(null);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second

  // 🔑 FUNCIÓN CLAVE: Cambiar estado de UI INMEDIATAMENTE
  const setUserStateImmediately = (newUser: SessionUser | null) => {
    setUser(newUser);
    if (newUser === null) {
      setProfileLoading('');
    }
  };

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
          console.warn(
            `[auth] No se pudo cargar perfil users (attempt ${retryCount + 1}):`,
            error.message
          );
        }

        // Only retry on network errors, not on auth/permission errors
        if (
          error.message.includes('Failed to fetch') ||
          error.code === 'PGRST301'
        ) {
          if (retryCount < MAX_RETRIES) {
            setTimeout(
              () => {
                loadProfile(uid, retryCount + 1);
              },
              RETRY_DELAY * Math.pow(2, retryCount)
            ); // Exponential backoff
            return;
          }
          console.warn('[auth] Max retries reached for network errors');
        }

        setProfileLoading(null);
        setLoading(false);
        return;
      }

      if (data) {
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
          vendedor_estado:
            data.vendedor_estado as SessionUser['vendedor_estado'],
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
      async (event: AuthChangeEvent, session: Session | null) => {
        // 🔑 CLAVE: Verificar múltiples flags para prevenir race conditions
        if (signingOutRef.current || isSigningOut || (typeof window !== 'undefined' && (window as any).__LOGOUT_IN_PROGRESS__)) {
          console.log('[AuthContext] Ignoring auth state change during logout:', event);
          return;
        }
        
        console.log('[AuthContext] Auth state change:', event, session?.user?.id);
        
        if (session?.user) {
          // Seguridad: si email no confirmado, cerrar sesión y avisar
          if (!isEmailConfirmed(session)) {
            console.log('[AuthContext] Email not confirmed, signing out');
            await supabase.auth.signOut();
            setUser(null);
            toast.error('Confirma tu correo para iniciar sesión', {
              action: 'login',
            });
            setLoading(false);
            return;
          }
          
          // Intentar obtener perfil desde tabla users para reflejar cambios admin.
          // Only load if not already loading for this user
          if (profileLoading !== session.user.id) {
            await loadProfile(session.user.id);
          }
        } else {
          // 🔑 CLAVE: Solo cambiar estado si no estamos en proceso de logout
          if (!signingOutRef.current && !isSigningOut) {
            console.log('[AuthContext] Session ended, clearing user state');
            setUser(null);
            setLoading(false);
          }
        }
      }
    );

    // Initial session check - but avoid duplicate calls
    // Evitar trabajo extra si ya estamos cerrando sesión
    if (signingOutRef.current) {
      setLoading(false);
      return () => {
        listener.subscription.unsubscribe();
      };
    }

    supabase.auth
      .getSession()
      .then(async ({ data }: { data: { session: Session | null } }) => {
        const session = data.session as Session | null;
        if (signingOutRef.current) {
          setLoading(false);
          return;
        }
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
    console.log('[AuthContext] signIn called with email:', email);

    if (!supabase) {
      console.error('[AuthContext] Supabase not configured');
      return { error: 'Supabase no configurado' };
    }

    try {
      // 🔑 RESETEAR estado antes de intentar login
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('[AuthContext] Supabase auth result:', { data, error });

      if (error) {
        console.error('[AuthContext] Auth error:', error);
        setLoading(false);
        return { error: error.message };
      }

      if (!data.user) {
        console.error('[AuthContext] No user data returned');
        setLoading(false);
        return { error: 'No se pudo obtener datos del usuario' };
      }

      console.log('[AuthContext] User authenticated:', data.user.id);

      // Verificar si el email está confirmado
      const sessionNow = (await supabase.auth.getSession()).data.session;
      if (!isEmailConfirmed(sessionNow)) {
        console.log('[AuthContext] Email not confirmed, signing out');
        await supabase.auth.signOut();
        setLoading(false);
        return { error: 'Debes confirmar tu correo antes de iniciar sesión' };
      }

      // 🔑 CARGAR PERFIL INMEDIATAMENTE después de autenticación exitosa
      console.log('[AuthContext] Loading profile for user:', data.user.id);
      await loadProfile(data.user.id);

      console.log('[AuthContext] Sign in completed successfully');
      return { error: undefined };
    } catch (error) {
      console.error('[AuthContext] Unexpected error in signIn:', error);
      setLoading(false);
      return { error: 'Error inesperado durante el inicio de sesión' };
    }
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
    if (isSigningOut) {
      return;
    }

    try {
      setIsSigningOut(true);
      
      // 🔑 1️⃣ SETEAR FLAG GLOBAL para bloquear Supabase storage
      if (typeof window !== 'undefined') {
        (window as any).__LOGOUT_IN_PROGRESS__ = true;
      }
      
      // 🚀 2️⃣ UI cambia al instante - esto es clave para evitar parpadeo
      setUserStateImmediately(null);
      
      // 🚀 3️⃣ Limpiar localStorage inmediatamente (no async)
      cleanupUserState({
        clearSessionStorage: true,
        dispatchEvents: false, // No disparar eventos aún
        preserveKeys: [
          'theme_preference',
          'language_preference',
          'accessibility_settings',
        ],
        emergency: false,
        verbose: false,
      });

      // 🚀 4️⃣ Backend en segundo plano (no bloquear UI)
      const supabaseSignOut = supabase ? supabase.auth.signOut() : Promise.resolve();
      
      // 🚀 5️⃣ Validar limpieza inmediatamente
      const validation = validateCleanup();
      if (!validation.clean) {
        const { emergencyCleanup } = await import('@/lib/stateCleanup');
        emergencyCleanup();
      }

      // 🚀 6️⃣ Esperar backend (pero UI ya está limpia)
      await supabaseSignOut;

      // 🔑 7️⃣ RESETEAR FLAG GLOBAL después del logout
      if (typeof window !== 'undefined') {
        (window as any).__LOGOUT_IN_PROGRESS__ = false;
      }

      // 🚀 8️⃣ Solo después, disparar eventos y navegar
      window.dispatchEvent(
        new CustomEvent('userLoggedOut', {
          detail: {
            timestamp: Date.now(),
            source: 'authContext-signout',
          },
        })
      );

      // Navegar sin recargar
      try {
        const target = '/';
        if (window.location.pathname !== target) {
          window.history.replaceState({}, document.title, target);
        }
      } finally {
        setIsSigningOut(false);
      }
    } catch (error) {
      console.error('[AuthContext] Error during signOut:', error);

      // 🚨 Asegurar que la UI esté limpia incluso si hay error
      setUserStateImmediately(null);
      setIsSigningOut(false);
      
      // 🔑 RESETEAR FLAG GLOBAL en caso de error
      if (typeof window !== 'undefined') {
        (window as any).__LOGOUT_IN_PROGRESS__ = false;
      }

      try {
        const { emergencyCleanup } = await import('@/lib/stateCleanup');
        emergencyCleanup();
        window.dispatchEvent(
          new CustomEvent('userLoggedOut', {
            detail: {
              timestamp: Date.now(),
              emergency: true,
              source: 'authContext-error',
            },
          })
        );
      } catch (cleanupError) {
        console.error('[AuthContext] Emergency cleanup failed:', cleanupError);
      }
    }
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
      value={{ user, loading, isSigningOut, signIn, signUp, signOut, refreshProfile }}
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
