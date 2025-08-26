import React, { useEffect } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { useForm } from '@/hooks/useForm';
import { useToastWithAuth } from '@/hooks/useToast';
import { useRateLimit } from '@/hooks/useSecurity';
import { AuthLayout, AuthFeatureSets } from '@/components/auth/AuthLayout';

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
    <AuthLayout
      title="Bienvenido de vuelta"
      subtitle="Iniciar Sesión"
      description="Accede a tu cuenta para continuar explorando los tesoros artesanales del Chocó."
      features={AuthFeatureSets.login}
    >
      <p className='opacity-80 text-center mb-6'>
        Accede a tu cuenta para continuar
      </p>

      <form onSubmit={form.handleSubmit} className='space-y-6' noValidate>
        {/* Screen reader announcement area for form errors */}
        <div 
          className='sr-only' 
          role='status' 
          aria-live='polite' 
          aria-atomic='true'
        >
          {Object.keys(form.errors).length > 0 && (
            <span>
              Hay {Object.keys(form.errors).length} error{Object.keys(form.errors).length > 1 ? 'es' : ''} en el formulario. Por favor revisa los campos marcados.
            </span>
          )}
        </div>
        {/* Email Field */}
        <div className='space-y-2'>
          <Label htmlFor='email' className='text-sm font-medium'>
            Correo electrónico
            <span className='text-destructive ml-1' aria-label='campo requerido'>*</span>
          </Label>
          <Input
            id='email'
            type='email'
            placeholder='tu@email.com'
            {...form.getInputProps('email')}
            className={form.hasError('email') ? 'border-red-500' : ''}
            aria-required='true'
            aria-describedby={form.hasError('email') ? 'email-error' : 'email-hint'}
            autoComplete='email'
          />
          <div id='email-hint' className='sr-only'>
            Ingresa tu dirección de correo electrónico para iniciar sesión
          </div>
          {form.hasError('email') && (
            <p 
              id='email-error'
              className='text-red-500 text-sm mt-1'
              role='alert'
              aria-live='polite'
            >
              {form.getFieldState('email').error}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className='space-y-2'>
          <Label htmlFor='password' className='text-sm font-medium'>
            Contraseña
            <span className='text-destructive ml-1' aria-label='campo requerido'>*</span>
          </Label>
          <Input
            id='password'
            type='password'
            placeholder='••••••••'
            {...form.getInputProps('password')}
            className={
              form.hasError('password') ? 'border-red-500' : ''
            }
            aria-required='true'
            aria-describedby={form.hasError('password') ? 'password-error' : 'password-hint'}
            autoComplete='current-password'
          />
          <div id='password-hint' className='sr-only'>
            Ingresa tu contraseña para iniciar sesión
          </div>
          {form.hasError('password') && (
            <p 
              id='password-error'
              className='text-red-500 text-sm mt-1'
              role='alert'
              aria-live='polite'
            >
              {form.getFieldState('password').error}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type='submit'
          className='w-full py-3 text-base'
          disabled={form.isSubmitting || loading}
          aria-describedby='submit-status'
        >
          {form.isSubmitting || loading ? (
            <div className='flex items-center gap-2'>
              <div 
                className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'
                role='status'
                aria-label='Iniciando sesión'
              ></div>
              <span aria-live='polite'>Iniciando sesión...</span>
            </div>
          ) : (
            'Iniciar sesión'
          )}
        </Button>
        <div id='submit-status' className='sr-only' aria-live='polite'>
          {form.isSubmitting || loading ? 'Procesando inicio de sesión' : ''}
        </div>
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
    </AuthLayout>
  );
};

export default LoginPage;
