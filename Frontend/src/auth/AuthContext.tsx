import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
  useCallback,
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
  
  // Rate limiting mechanism to prevent too many calls
  const lastCallTime = useRef<number>(0);
  const MIN_CALL_INTERVAL = 2000; // 2 seconds minimum between calls

  const isEmailConfirmed = (session: Session | null): boolean => {
    const u: any = session?.user;
    return !!(u?.email_confirmed_at || u?.confirmed_at || u?.email_confirmed);
  };

  const loadProfile = useCallback(async (uid: string, retryCount = 0) => {
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

    // Rate limiting: prevent calls too frequently (silent)
    const now = Date.now();
    if (now - lastCallTime.current < MIN_CALL_INTERVAL) {
      setProfileLoading(null);
      return;
    }
    lastCallTime.current = now;

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
          error.message.includes('ERR_INSUFFICIENT_RESOURCES') ||
          error.code === 'PGRST301'
        ) {
          // Add longer delay for resource errors to avoid overwhelming the system
          const delay = error.message.includes('ERR_INSUFFICIENT_RESOURCES') 
            ? Math.min(RETRY_DELAY * Math.pow(3, retryCount), 15000) // Longer delays for resource errors
            : Math.min(RETRY_DELAY * Math.pow(2, retryCount), 10000);
          
          if (retryCount < MAX_RETRIES) {
            console.warn(`[auth] Retrying in ${delay}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            setTimeout(
              () => {
                loadProfile(uid, retryCount + 1);
              },
              delay
            );
            return;
          }
          console.warn('[auth] Max retries reached for network errors');
          
          // Fallback: try to get basic user info from session if profile loading fails
          try {
            const session = await supabase.auth.getSession();
            if (session.data.session?.user) {
              console.warn('[auth] Using fallback user data from session');
              setUser({
                id: session.data.session.user.id,
                email: session.data.session.user.email || undefined,
                nombre: undefined,
                role: undefined,
                vendedor_estado: undefined,
                bloqueado: false,
              });
            }
          } catch (fallbackError) {
            console.error('[auth] Fallback also failed:', fallbackError);
          }
        } else {
          // For other errors (auth/permission), don't retry
          console.error('[auth] Non-retryable error:', error.message);
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
      
      // Handle unexpected errors with retry logic
      if (retryCount < MAX_RETRIES) {
        const delay = Math.min(RETRY_DELAY * Math.pow(2, retryCount), 10000);
        console.warn(`[auth] Retrying after unexpected error in ${delay}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        setTimeout(
          () => {
            loadProfile(uid, retryCount + 1);
          },
          delay
        );
        return;
      }
      
      setProfileLoading(null);
      setLoading(false);
      return;
    }
  }, [profileLoading]);

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
        // Ignorar cambios durante cierre de sesión para evitar renders intermedios
        if (signingOutRef.current) {
          return;
        }
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

    // 🔄 LISTENER PARA CAMBIOS DE ESTADO DE VENDEDOR EN TIEMPO REAL
    const handleVendorStatusChange = (event: CustomEvent) => {
      const { vendorId, newStatus } = event.detail;
      // Si el usuario actual es el vendedor afectado, refrescar su perfil
      if (user?.id === vendorId) {
        console.log(`[auth] Estado de vendedor cambiado a: ${newStatus}, refrescando perfil...`);
        // Refrescar perfil inmediatamente
        if (profileLoading !== vendorId) {
          loadProfile(vendorId);
        }
      }
    };

    // Agregar listener para cambios de estado de vendedor
    window.addEventListener('vendorStatusChanged', handleVendorStatusChange as EventListener);

    // Initial session check - but avoid duplicate calls
    // Evitar trabajo extra si ya estamos cerrando sesión
    if (signingOutRef.current) {
      setLoading(false);
      return () => {
        listener.subscription.unsubscribe();
        window.removeEventListener('vendorStatusChanged', handleVendorStatusChange as EventListener);
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
      window.removeEventListener('vendorStatusChanged', handleVendorStatusChange as EventListener);
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
      if (profileLoading !== data.user.id) {
        console.log('[AuthContext] Loading profile for user:', data.user.id);
        await loadProfile(data.user.id);
      }

      console.log('[AuthContext] Sign in completed successfully');
      return { error: undefined };
    } catch (error) {
      console.error('[AuthContext] Unexpected error in signIn:', error);
      return { error: 'Error inesperado durante el inicio de sesión' };
    }
  }, [profileLoading]);

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
      // No activar loading global para evitar re-render completo

      // Limpiar estado de React inmediatamente para evitar parpadeo
      setUser(null);
      setProfileLoading('');

      // Cerrar sesión en Supabase
      if (supabase) {
        await supabase.auth.signOut();
      }

      // Usar el sistema centralizado de limpieza de estado
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

      // Validar que la limpieza fue exitosa
      const validation = validateCleanup();
      if (!validation.clean) {
        const { emergencyCleanup } = await import('@/lib/stateCleanup');
        emergencyCleanup();
      }

      // Notificar a la UI y navegar sin recargar
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(
        new CustomEvent('userLoggedOut', {
          detail: {
            timestamp: Date.now(),
            source: 'authContext-signout',
          },
        })
      );

      try {
        const target = '/';
        if (window.location.pathname !== target) {
          window.history.replaceState({}, document.title, target);
        }
      } finally {
        // Mantener loading en false; cerrar transición
        setIsSigningOut(false);
      }
    } catch (error) {
      console.error('[AuthContext] Error during signOut:', error);

      // Asegurar limpieza y desbloqueo de transición
      setUser(null);
      setProfileLoading('');
      setIsSigningOut(false);

      try {
        const { emergencyCleanup } = await import('@/lib/stateCleanup');
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
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!supabase) return;
    const session = (await supabase.auth.getSession()).data.session;
    if (session?.user?.id && profileLoading !== session.user.id) {
      await loadProfile(session.user.id);
    }
  }, [profileLoading]);

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
