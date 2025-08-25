import React, { useEffect } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { useForm } from '@/hooks/useForm';
import { useToastWithAuth } from '@/hooks/useToast';
import { useRateLimit } from '@/hooks/useSecurity';

// validation handled inline in submit handler

interface FormData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const { signIn, loading, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToastWithAuth();
  const rateLimit = useRateLimit('login', 5, 15 * 60 * 1000); // 5 intentos por 15 minutos

  const form = useForm<FormData>({
    initialValues: {
      email: '',
      password: '',
    },
    onSubmit: async values => {
      // removed debug logging

      // Validación manual simple
      if (!values.email) {
        toast.error('El correo electrónico es obligatorio', {
          action: 'login',
        });
        return;
      }
      if (!values.password) {
        toast.error('La contraseña es obligatoria', { action: 'login' });
        return;
      }

      if (!rateLimit.checkLimit()) {
        toast.error(
          'Demasiados intentos de inicio de sesión. Intenta más tarde.',
          {
            action: 'login',
          }
        );
        return;
      }

      const result = await signIn(values.email, values.password);
      if (result.error) {
        toast.error(result.error, {
          action: 'login',
        });
        return;
      }

      // Limpiar rate limit en login exitoso
      rateLimit.clearLimit();
      toast.success('Inicio de sesión exitoso', {
        action: 'login',
      });
    },
  });

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className='min-h-[calc(100vh-120px)] grid place-items-center relative overflow-hidden'>
      {/* Decorative auth background */}
      <div
        aria-hidden
        className='absolute inset-0 opacity-12'
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.04), rgba(0,0,0,0.00)), url('/assert/motif-de-fond-sans-couture-tribal-dessin-geometrico-noir-et-blanc-vecteur/v1045-03.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className='container max-w-5xl relative z-10'>
        <div className='grid md:grid-cols-3 gap-8 items-start'>
          <div className='hidden md:block md:col-span-1'>
            <div className='card card-hover'>
              <div className='card-body'>
                <h2 className='card-title text-2xl mb-4'>
                  Bienvenido de vuelta
                </h2>
                <p className='opacity-80 mb-6'>
                  Accede a tu cuenta para continuar explorando los tesoros
                  artesanales del Chocó.
                </p>
                <div className='space-y-4'>
                  <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center'>
                      <svg
                        className='w-4 h-4 text-primary'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                        />
                      </svg>
                    </div>
                    <span className='text-sm'>Acceso rápido a tu perfil</span>
                  </div>
                  <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center'>
                      <svg
                        className='w-4 h-4 text-primary'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'
                        />
                      </svg>
                    </div>
                    <span className='text-sm'>Gestiona tus pedidos</span>
                  </div>
                  <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center'>
                      <svg
                        className='w-4 h-4 text-primary'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
                        />
                      </svg>
                    </div>
                    <span className='text-sm'>
                      Favoritos y listas personalizadas
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='md:col-span-2'>
            <div className='card card-hover'>
              <div className='card-body'>
                <div className='text-center mb-6'>
                  <h1 className='text-3xl font-bold mb-2'>Iniciar Sesión</h1>
                  <p className='opacity-80'>
                    Accede a tu cuenta para continuar
                  </p>
                </div>

                <form onSubmit={form.handleSubmit} className='space-y-6'>
                  {/* Email Field */}
                  <div className='space-y-2'>
                    <Label htmlFor='email' className='text-sm font-medium'>
                      Correo electrónico
                    </Label>
                    <Input
                      id='email'
                      type='email'
                      placeholder='tu@email.com'
                      {...form.getInputProps('email')}
                      className={form.hasError('email') ? 'border-red-500' : ''}
                    />
                    {form.hasError('email') && (
                      <p className='text-red-500 text-sm mt-1'>
                        {form.getFieldState('email').error}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className='space-y-2'>
                    <Label htmlFor='password' className='text-sm font-medium'>
                      Contraseña
                    </Label>
                    <Input
                      id='password'
                      type='password'
                      placeholder='••••••••'
                      {...form.getInputProps('password')}
                      className={
                        form.hasError('password') ? 'border-red-500' : ''
                      }
                    />
                    {form.hasError('password') && (
                      <p className='text-red-500 text-sm mt-1'>
                        {form.getFieldState('password').error}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type='submit'
                    className='w-full py-3 text-base'
                    disabled={form.isSubmitting || loading}
                  >
                    {form.isSubmitting || loading ? (
                      <div className='flex items-center gap-2'>
                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                        Iniciando sesión...
                      </div>
                    ) : (
                      'Iniciar sesión'
                    )}
                  </Button>
                </form>

                {/* Links */}
                <div className='mt-6 text-center space-y-3'>
                  <div className='text-sm'>
                    <Link
                      to='/forgot-password'
                      className='text-primary hover:underline font-medium'
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    ¿No tienes una cuenta?{' '}
                    <Link
                      to='/register'
                      className='text-primary hover:underline font-medium'
                    >
                      Crear cuenta
                    </Link>
                  </div>
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
