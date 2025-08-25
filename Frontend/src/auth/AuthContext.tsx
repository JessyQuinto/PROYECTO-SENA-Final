import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useMemo,
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
  isSigningOut: boolean;
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
  const [authState, setAuthState] = useState<{
    user: SessionUser | null;
    loading: boolean;
    isSigningOut: boolean;
  }>({
    user: null,
    loading: true,
    isSigningOut: false,
  });

  const toast = useToast();
  const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL as string | undefined;
  
  // Refs para evitar race conditions
  const isSigningOutRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);
  const authStateChangeInProgressRef = useRef(false);

  // Memoized state updates with proper locking
  const updateAuthState = useCallback((updates: Partial<typeof authState>) => {
    setAuthState(prev => {
      // Prevent updates during sign out process
      if (isSigningOutRef.current && updates.user !== null) {
        return prev;
      }
      return { ...prev, ...updates };
    });
  }, []);

  const isEmailConfirmed = useCallback((session: Session | null): boolean => {
    const u: any = session?.user;
    return !!(u?.email_confirmed_at || u?.confirmed_at || u?.email_confirmed);
  }, []);

  const loadProfile = useCallback(async (uid: string) => {
    if (!supabase || isSigningOutRef.current) return;

    try {
      // Prevent duplicate profile loads
      if (currentUserIdRef.current === uid) return;
      currentUserIdRef.current = uid;

      const { data, error } = await supabase
        .from('users')
        .select('id, email, role, vendedor_estado, bloqueado, nombre_completo')
        .eq('id', uid)
        .maybeSingle();

      if (error) {
        console.warn('[auth] Error loading profile:', error.message);
        updateAuthState({ loading: false });
        return;
      }

      if (data) {
        if (data.bloqueado) {
          await supabase.auth.signOut();
          updateAuthState({ user: null, loading: false });
          toast.error('Tu cuenta ha sido bloqueada por el administrador');
          return;
        }

        const user: SessionUser = {
          id: data.id,
          email: data.email || undefined,
          nombre: (data as any).nombre_completo || undefined,
          role: (data.role as SessionUser['role']) || undefined,
          vendedor_estado: data.vendedor_estado as SessionUser['vendedor_estado'],
          bloqueado: !!data.bloqueado,
        };

        updateAuthState({ user, loading: false });
        
        // Show success notification for sign in
        if (authState.user === null) {
          toast.success(`¡Bienvenido, ${user.nombre || user.email}!`);
        }
      } else {
        updateAuthState({ loading: false });
      }
    } catch (error) {
      console.error('[auth] Unexpected error in loadProfile:', error);
      updateAuthState({ loading: false });
    }
  }, [updateAuthState, toast, authState.user]);

  // Memoized auth state change handler with proper locking
  const handleAuthStateChange = useCallback(async (
    _event: AuthChangeEvent,
    session: Session | null
  ) => {
    // Prevent multiple simultaneous auth state changes
    if (authStateChangeInProgressRef.current) return;
    authStateChangeInProgressRef.current = true;

    try {
      if (isSigningOutRef.current) {
        return;
      }

      if (session?.user) {
        if (!isEmailConfirmed(session)) {
          await supabase.auth.signOut();
          updateAuthState({ user: null, loading: false });
          toast.error('Confirma tu correo para iniciar sesión');
          return;
        }
        await loadProfile(session.user.id);
      } else {
        updateAuthState({ user: null, loading: false });
      }
    } finally {
      authStateChangeInProgressRef.current = false;
    }
  }, [isEmailConfirmed, loadProfile, updateAuthState, toast]);

  useEffect(() => {
    if (!supabase) {
      updateAuthState({ loading: false });
      return;
    }

    // Handle signup confirmation redirect
    const handleSignupRedirect = async () => {
      try {
        const hash = window.location.hash;
        const query = window.location.search;
        const raw = (hash && hash.startsWith('#') ? hash.substring(1) : hash) ||
                   (query && query.startsWith('?') ? query.substring(1) : '');
        const params = new URLSearchParams(raw);
        const type = params.get('type');
        
        if (type === 'signup') {
          await supabase.auth.signOut();
          updateAuthState({ user: null, loading: false });
          window.history.replaceState({}, document.title, window.location.pathname);
          toast.success('Correo confirmado. Inicia sesión.');
          window.location.replace('/login');
          return;
        }
      } catch {}
    };

    handleSignupRedirect();

    const { data: listener } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Initial session check
    supabase.auth.getSession().then(async ({ data }: { data: { session: Session | null } }) => {
      const session = data.session;
      if (isSigningOutRef.current) {
        updateAuthState({ loading: false });
        return;
      }
      
      if (session?.user) {
        if (!isEmailConfirmed(session)) {
          await supabase.auth.signOut();
          updateAuthState({ user: null, loading: false });
          return;
        }
        await loadProfile(session.user.id);
      } else {
        updateAuthState({ loading: false });
      }
    }).catch((error: Error) => {
      console.error('[auth] Error getting initial session:', error);
      updateAuthState({ loading: false });
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [handleAuthStateChange, isEmailConfirmed, loadProfile, updateAuthState, toast]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      return { error: 'Supabase no configurado' };
    }

    try {
      // Show loading state immediately
      updateAuthState({ loading: true });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        updateAuthState({ loading: false });
        return { error: error.message };
      }

      if (!data.user) {
        updateAuthState({ loading: false });
        return { error: 'No se pudo obtener datos del usuario' };
      }

      const sessionNow = (await supabase.auth.getSession()).data.session;
      if (!isEmailConfirmed(sessionNow)) {
        await supabase.auth.signOut();
        updateAuthState({ loading: false });
        return { error: 'Debes confirmar tu correo antes de iniciar sesión' };
      }

      // Profile will be loaded by auth state change listener
      // Don't set loading to false here - let the listener handle it
      return { error: undefined };
    } catch (error) {
      console.error('[AuthContext] Unexpected error in signIn:', error);
      updateAuthState({ loading: false });
      return { error: 'Error inesperado durante el inicio de sesión' };
    }
  }, [isEmailConfirmed, updateAuthState]);

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
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role, ...extra },
          emailRedirectTo: window.location.origin,
        },
      });
      
      if (error) return { error: error.message };

      if (data.user?.id) {
        try {
          if (backendUrl) {
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
            
            if (!resp.ok) {
              // Fallback
              const { error: insertError } = await supabase.from('users').insert({
                id: data.user.id,
                email: email,
                role: role,
                vendedor_estado: role === 'vendedor' ? 'pendiente' : null,
                nombre_completo: extra?.nombre ?? null,
              });
              if (insertError && import.meta.env.DEV) {
                console.warn('[auth] Error creando perfil de usuario (fallback):', insertError);
              }
            }
          } else {
            // Fallback para desarrollo
            const { error: insertError } = await supabase.from('users').insert({
              id: data.user.id,
              email: email,
              role: role,
              vendedor_estado: role === 'vendedor' ? 'pendiente' : null,
              nombre_completo: extra?.nombre ?? null,
            });
            if (insertError && import.meta.env.DEV) {
              console.warn('[auth] Error creando perfil de usuario (fallback):', insertError);
            }
          }
        } catch (e) {
          if (import.meta.env.DEV) {
            console.warn('[auth] Error en post-signup:', e);
          }
        }
      }

      return { error: undefined };
    } catch (error) {
      console.error('[auth] Error in signUp:', error);
      return { error: 'Error inesperado durante el registro' };
    }
  }, [backendUrl]);

  const signOut = useCallback(async () => {
    // Prevent multiple sign out attempts
    if (isSigningOutRef.current || authState.isSigningOut) {
      return;
    }

    try {
      // Set flags immediately to prevent race conditions
      isSigningOutRef.current = true;
      updateAuthState({ isSigningOut: true });
      
      // Clear user state immediately for better UX
      updateAuthState({ user: null });

      // Show immediate feedback
      toast.info('Cerrando sesión...');

      if (supabase) {
        await supabase.auth.signOut();
      }

      // Cleanup state
      cleanupUserState({
        clearSessionStorage: true,
        dispatchEvents: true,
        preserveKeys: ['theme_preference', 'language_preference', 'accessibility_settings'],
        emergency: false,
        verbose: false,
      });

      const validation = validateCleanup();
      if (!validation.clean) {
        const { emergencyCleanup } = await import('@/lib/stateCleanup');
        emergencyCleanup();
      }

      // Notify UI
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(
        new CustomEvent('userLoggedOut', {
          detail: { timestamp: Date.now(), source: 'authContext-signout' },
        })
      );

      // Navigate
      if (window.location.pathname !== '/') {
        window.history.replaceState({}, document.title, '/');
      }

      // Show success message
      toast.success('Sesión cerrada correctamente');

    } catch (error) {
      console.error('[AuthContext] Error during signOut:', error);
      
      // Emergency cleanup
      updateAuthState({ user: null });
      try {
        const { emergencyCleanup } = await import('@/lib/stateCleanup');
        emergencyCleanup();
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(
          new CustomEvent('userLoggedOut', {
            detail: { timestamp: Date.now(), emergency: true, source: 'authContext-error' },
          })
        );
      } catch (cleanupError) {
        console.error('[AuthContext] Emergency cleanup failed:', cleanupError);
      }
    } finally {
      // Reset all flags and states
      isSigningOutRef.current = false;
      currentUserIdRef.current = null;
      updateAuthState({ isSigningOut: false, loading: false });
    }
  }, [authState.isSigningOut, updateAuthState, toast]);

  const refreshProfile = useCallback(async () => {
    if (!supabase || isSigningOutRef.current) return;
    const session = (await supabase.auth.getSession()).data.session;
    if (session?.user?.id) {
      await loadProfile(session.user.id);
    }
  }, [loadProfile]);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo<AuthContextValue>(() => ({
    user: authState.user,
    loading: authState.loading,
    isSigningOut: authState.isSigningOut,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }), [authState.user, authState.loading, authState.isSigningOut, signIn, signUp, signOut, refreshProfile]);

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
