import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { useForm } from '@/hooks/useForm';
import { useToast } from '@/hooks/useToast';
import { useSupabase } from '@/hooks/useSupabase';
import { useNavigate, Link } from 'react-router-dom';
import { Label } from '@/components/ui/shadcn/label';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { useRateLimit } from '@/hooks/useSecurity';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { executeMutation } = useSupabase({
    showToast: true,
    toastAction: 'login',
  });

  // Rate limiting for login attempts
  const rateLimit = useRateLimit('login', 5, 15 * 60 * 1000); // 5 attempts per 15 minutes
  
  // Track if we just completed a successful login
  const loginSuccessRef = useRef(false);

  // Helper function to determine redirect path based on user role
  const getRedirectPath = (userRole?: string) => {
    switch (userRole) {
      case 'admin':
        return '/admin';
      case 'vendedor':
        return '/vendedor';
      case 'comprador':
      default:
        return '/';
    }
  };

  // Effect to handle redirect after successful login when user data is available
  useEffect(() => {
    if (loginSuccessRef.current && user && !loading) {
      loginSuccessRef.current = false;
      const redirectPath = getRedirectPath(user.role);
      navigate(redirectPath, { replace: true });
    }
  }, [user, loading, navigate]);

  // Redirect already authenticated users
  useEffect(() => {
    if (user && !loading && !loginSuccessRef.current) {
      const redirectPath = getRedirectPath(user.role);
      navigate(redirectPath, { replace: true });
    }
  }, [user, loading, navigate]);

  const form = useForm<LoginForm>({
    initialValues: { email: '', password: '' },
    validationSchema: loginSchema,
    onSubmit: async values => {
      // Check rate limit before attempting login
      if (!rateLimit.checkLimit()) {
        toast.error(
          'Demasiados intentos de inicio de sesión. Intenta más tarde.',
          {
            role: 'comprador',
            action: 'login',
          }
        );
        return;
      }

      const result = await executeMutation(
        async () => {
          const signInResult = await signIn(values.email, values.password);
          return { data: null, error: signInResult.error };
        },
        'Error en el inicio de sesión',
        'Inicio de sesión exitoso'
      );
      
      // If result is not null, it means no error occurred
      if (result !== null) {
        // Clear rate limit on successful login
        rateLimit.clearLimit();
        
        // Mark that login was successful - the useEffect will handle redirect
        loginSuccessRef.current = true;
      }
    },
  });

  // If already loading or user is authenticated, show loading
  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <span className="text-2xl font-bold">TC</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Bienvenido de vuelta</h1>
          <p className="text-muted-foreground mt-2">
            Inicia sesión en tu cuenta de Tesoros Chocó
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-card rounded-2xl border shadow-lg p-8">
          <form onSubmit={form.handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                {...form.getInputProps('email')}
                className={form.hasError('email') ? 'border-destructive' : ''}
              />
              {form.hasError('email') && (
                <p className="text-sm text-destructive">{form.getError('email')}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...form.getInputProps('password')}
                className={form.hasError('password') ? 'border-destructive' : ''}
              />
              {form.hasError('password') && (
                <p className="text-sm text-destructive">{form.getError('password')}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={form.isSubmitting}
            >
              {form.isSubmitting ? (
                <>
                  <div className="loading loading-spinner loading-sm mr-2"></div>
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </Button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-3">
            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="text-primary hover:underline font-medium"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="text-sm text-muted-foreground">
              ¿No tienes una cuenta?{' '}
              <Link
                to="/register"
                className="text-primary hover:underline font-medium"
              >
                Crear cuenta
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>© 2024 Tesoros Chocó. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
