import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { UserRole, VendedorEstado } from '@/types/domain';

export interface SessionUser {
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

  // Load user profile from database
  const loadProfile = async (uid: string) => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role, vendedor_estado, bloqueado, nombre_completo')
        .eq('id', uid)
        .maybeSingle();

      if (error) {
        console.error('[auth] Error loading profile:', error);
        return;
      }

      if (data) {
        setUser({
          id: data.id,
          email: data.email || undefined,
          role: data.role || 'comprador',
          vendedor_estado: data.vendedor_estado || undefined,
          bloqueado: data.bloqueado || false,
          nombre: data.nombre_completo || undefined,
        });
      }
    } catch (error) {
      console.error('[auth] Error in loadProfile:', error);
    }
  };

  // Handle auth state changes
  useEffect(() => {
    if (!supabase) return;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await loadProfile(session.user.id);
        }
      } catch (error) {
        console.error('[auth] Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('[auth] Auth state changed:', event, session?.user?.id);

        if (event === 'SIGNED_IN' && session?.user) {
          await loadProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          await loadProfile(session.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: 'Supabase not initialized' };

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('[auth] Sign in error:', error);
      return { error: 'Error interno del sistema' };
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
    if (!supabase) return { error: 'Supabase not initialized' };

    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        return { error: authError.message };
      }

      if (authData.user) {
        // Create user profile in database
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email,
            role,
            nombre_completo: extra?.nombre,
            telefono: extra?.telefono,
            ciudad: extra?.ciudad,
            departamento: extra?.departamento,
            vendedor_estado: role === 'vendedor' ? 'pendiente' : null,
          });

        if (profileError) {
          console.error('[auth] Profile creation error:', profileError);
          // Try to delete the auth user if profile creation fails
          await supabase.auth.admin.deleteUser(authData.user.id);
          return { error: 'Error creando perfil de usuario' };
        }
      }

      return {};
    } catch (error) {
      console.error('[auth] Sign up error:', error);
      return { error: 'Error interno del sistema' };
    }
  };

  const signOut = async () => {
    if (!supabase) return;

    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('[auth] Sign out error:', error);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  };

  const value: AuthContextValue = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
