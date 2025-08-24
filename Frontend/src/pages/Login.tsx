import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { useForm } from '@/hooks/useForm';
import { useToast } from '@/hooks/useToast';
import { useSupabase } from '@/hooks/useSupabase';
import { useNavigate, Link } from 'react-router-dom';
import { Label } from '@/components/ui/shadcn/label';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { RateLimitReset } from '@/components/RateLimitReset';
import { EnvDiagnostic } from '@/components/EnvDiagnostic';
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
        
        // If user data is already available, redirect immediately
        if (user && !loading) {
          const redirectPath = getRedirectPath(user.role);
          navigate(redirectPath, { replace: true });
        }
      }
    },
  });

    return (
    <div className='min-h-[calc(100vh-120px)] grid place-items-center'>
      <div className='container-sm'>
        <div className='grid md:grid-cols-2 gap-8 items-center'>
          <div className='hidden md:block'>
            <div className='card card-hover'>
              <div className='card-body'>
                <h1 className='text-2xl font-semibold mb-2 font-display'>
                  Bienvenido de vuelta
                </h1>
                <p className='opacity-80'>
                  Inicia sesión en tu cuenta para continuar.
                </p>
              </div>
            </div>
          </div>
          <div className='card card-hover'>
            <div className='card-body'>
              <h2 className='text-xl font-semibold mb-4'>Iniciar sesión</h2>
              {/* TEMPORAL: Componentes de diagnóstico */}
              <EnvDiagnostic />
              <RateLimitReset />
              
              <form {...form.getFormProps()}>
                <div className='space-y-4'>
                  <div>
                    <Label htmlFor='email'>Email</Label>
                    <Input
                      {...form.getInputProps('email')}
                      id='email'
                      type='email'
                      placeholder='tu-email@ejemplo.com'
                      autoComplete='email'
                    />
                  </div>
                  <div>
                    <Label htmlFor='password'>Contraseña</Label>
                    <Input
                      {...form.getInputProps('password')}
                      id='password'
                      type='password'
                      placeholder='••••••••'
                      autoComplete='current-password'
                    />
                  </div>
                  <Button
                    type='submit'
                    className='w-full'
                    disabled={loading}
                  >
                    {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                  </Button>
                </div>
              </form>
              <div className='text-sm text-center space-y-2 mt-4'>
                <div>
                  <Link
                    to='/forgot-password'
                    className='text-(--color-terracotta-suave) hover:underline'
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div>
                  ¿No tienes cuenta?{' '}
                  <Link
                    to='/register'
                    className='text-(--color-terracotta-suave) hover:underline'
                  >
                    Regístrate aquí
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
