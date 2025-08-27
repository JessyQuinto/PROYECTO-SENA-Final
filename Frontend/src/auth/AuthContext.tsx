import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { UserRole, VendedorEstado } from '@/types/domain';
import { useToast } from '@/hooks/useToast';
import { cleanupUserState, validateCleanup, emergencyCleanup } from '@/lib/stateCleanup';

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
  const profileLoadingRef = useRef<string | null>(null);
  
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
  const PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache for profile data

  const isEmailConfirmed = (session: Session | null): boolean => {
    const u: any = session?.user;
    return !!(u?.email_confirmed_at || u?.confirmed_at || u?.email_confirmed);
  };

  const loadProfile = useCallback(async (uid: string, retryCount = 0) => {
    if (!supabase) return;

    // Prevent duplicate calls for the same user
    if (profileLoadingRef.current === uid) {
      return;
    }

    // Circuit breaker: stop retrying after max attempts
    if (retryCount >= MAX_RETRIES) {
      console.warn('[auth] Max retries reached for loadProfile, giving up');
      setLoading(false);
      return;
    }

    profileLoadingRef.current = uid;
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

        profileLoadingRef.current = null;
        setProfileLoading(null);
        setLoading(false);
        return;
      }

      if (data) {
        // Seguridad: si usuario está bloqueado, cerrar sesión.
        if (data.bloqueado) {
          await supabase.auth.signOut();
          setUser(null);
          profileLoadingRef.current = null;
          setProfileLoading(null);
          setLoading(false);
          return;
        }

        const userData = {
          id: data.id,
          email: data.email || undefined,
          nombre: (data as any).nombre_completo || undefined,
          role: (data.role as SessionUser['role']) || undefined,
          vendedor_estado:
            data.vendedor_estado as SessionUser['vendedor_estado'],
          bloqueado: !!data.bloqueado,
        };

        setUser(userData);
        profileLoadingRef.current = null;
        setProfileLoading(null);
        setLoading(false);
        return;
      }

      // Si no existe perfil, no lo creamos desde cliente para evitar conflictos de FK/RLS.
      // El perfil debe crearlo el backend en /auth/post-signup usando service role.
      profileLoadingRef.current = null;
      setProfileLoading(null);
      setLoading(false);
      return;
    } catch (error) {
      console.error('[auth] Unexpected error in loadProfile:', error);
      profileLoadingRef.current = null;
      setProfileLoading(null);
      setLoading(false);
      return;
    }
  }, []);  // Remove dependency on profileLoading state

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
          toast.success('Correo confirmado. Inicia sesión.');
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
        // Ignore changes during sign out to prevent intermediate renders
        if (signingOutRef.current) {
          return;
        }
        
        if (session?.user) {
          // Security: if email not confirmed, sign out and notify
          if (!isEmailConfirmed(session)) {
            supabase.auth.signOut().finally(() => {
              setUser(null);
              toast.error('Confirma tu correo para iniciar sesión');
              setLoading(false);
            });
            return;
          }
          // Try to get profile from users table to reflect admin changes
          // Only load if not already loading for this user
          if (profileLoadingRef.current !== session.user.id) {
            loadProfile(session.user.id);
          }
        } else {
          // No session - ensure clean state
          if (!signingOutRef.current) {
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
          if (profileLoadingRef.current !== session.user.id) {
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

  const signIn = useCallback(async (email: string, password: string) => {
    console.log('[AuthContext] signIn called with email:', email);

    if (!supabase) {
      console.error('[AuthContext] Supabase not configured');
      return { error: 'Supabase no configurado' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('[AuthContext] Supabase auth result:', { data, error });

      if (error) {
        console.error('[AuthContext] Auth error:', error);
        return { error: error.message };
      }

      if (!data.user) {
        console.error('[AuthContext] No user data returned');
        return { error: 'No se pudo obtener datos del usuario' };
      }

      console.log('[AuthContext] User authenticated:', data.user.id);

      // Verificar si el email está confirmado
      const sessionNow = (await supabase.auth.getSession()).data.session;
      if (!isEmailConfirmed(sessionNow)) {
        console.log('[AuthContext] Email not confirmed, signing out');
        await supabase.auth.signOut();
        return { error: 'Debes confirmar tu correo antes de iniciar sesión' };
      }

      // Cargar perfil del usuario
      if (profileLoadingRef.current !== data.user.id) {
        console.log('[AuthContext] Loading profile for user:', data.user.id);
        await loadProfile(data.user.id);
      }

      console.log('[AuthContext] Sign in completed successfully');
      return { error: undefined };
    } catch (error) {
      console.error('[AuthContext] Unexpected error in signIn:', error);
      return { error: 'Error inesperado durante el inicio de sesión' };
    }
  }, [loadProfile]);  // Remove profileLoading dependency

  const signUp = useCallback(async (
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
  }, [backendUrl]);

  const signOut = useCallback(async () => {
    if (isSigningOut) {
      return;
    }

    try {
      setIsSigningOut(true);
      
      // Immediately clear React state to prevent flashing
      setUser(null);
      setProfileLoading('');

      // Dispatch early logout event for immediate UI updates
      window.dispatchEvent(
        new CustomEvent('userLogoutStart', {
          detail: {
            timestamp: Date.now(),
            source: 'authContext-signout-start',
          },
        })
      );

      // Use centralized state cleanup system
      cleanupUserState({
        clearSessionStorage: true,
        dispatchEvents: true,
        preserveKeys: [
          'theme_preference',
          'language_preference',
          'accessibility_settings',
        ],
        emergency: false,
        verbose: false,
      });

      // Close Supabase session
      if (supabase) {
        await supabase.auth.signOut();
      }

      // Validate cleanup was successful
      const validation = validateCleanup();
      if (!validation.clean) {
        emergencyCleanup();
      }

      // Notify UI components and navigate
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(
        new CustomEvent('userLoggedOut', {
          detail: {
            timestamp: Date.now(),
            source: 'authContext-signout',
          },
        })
      );

      // Navigate to home page if not already there
      try {
        const target = '/';
        if (window.location.pathname !== target) {
          window.history.replaceState({}, document.title, target);
        }
      } catch (navigationError) {
        console.warn('[AuthContext] Navigation warning:', navigationError);
      }
    } catch (error) {
      console.error('[AuthContext] Error during signOut:', error);

      // Ensure cleanup and state reset even on error
      setUser(null);
      setProfileLoading('');

      try {
        emergencyCleanup();
        window.dispatchEvent(new Event('storage'));
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
    } finally {
      // Always reset signing out state
      setIsSigningOut(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!supabase) return;
    const session = (await supabase.auth.getSession()).data.session;
    if (session?.user?.id && profileLoadingRef.current !== session.user.id) {
      await loadProfile(session.user.id);
    }
  }, [loadProfile]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      user,
      loading,
      isSigningOut,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [user, loading, isSigningOut, signIn, signUp, signOut, refreshProfile]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
