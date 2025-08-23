import React from 'react';
import { useAuth } from '@/auth/AuthContext';
import { useForm } from '@/hooks/useForm';
import { useToast } from '@/hooks/useToast';
import { useSupabase } from '@/hooks/useSupabase';
import { useNavigate, Link } from 'react-router-dom';
import { Label } from '@/components/ui/shadcn/label';
import {
  SecureInput,
  PasswordInput,
  SecureButton,
} from '@/components/security/SecureComponents';
import { useRateLimit } from '@/hooks/useSecurity';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { executeMutation } = useSupabase({
    showToast: true,
    toastAction: 'login',
  });

  // Rate limiting for login attempts
  const rateLimit = useRateLimit('login', 5, 15 * 60 * 1000); // 5 attempts per 15 minutes

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

      const { error } = await executeMutation(
        () => signIn(values.email, values.password),
        'Inicio de sesión exitoso',
        'Error en el inicio de sesión'
      );

      if (!error) {
        // Clear rate limit on successful login
        rateLimit.clearLimit();
        navigate('/dashboard');
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
              <form className='space-y-4' onSubmit={form.handleSubmit}>
                <div className='space-y-2'>
                  <Label htmlFor='email'>Email</Label>
                  <SecureInput
                    id='email'
                    type='email'
                    value={form.values.email}
                    onChange={value => form.handleChange('email', value)}
                    validation='email'
                    placeholder='tu@email.com'
                    maxLength={255}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='password'>Contraseña</Label>
                  <PasswordInput
                    id='password'
                    value={form.values.password}
                    onChange={value => form.handleChange('password', value)}
                    placeholder='••••••••'
                    showStrength={false}
                    showToggle={true}
                  />
                </div>
                <SecureButton
                  type='submit'
                  className='w-full'
                  disabled={form.isSubmitting}
                  rateLimitKey='login-submit'
                  maxAttempts={5}
                  lockoutDuration={15 * 60 * 1000}
                  showRemainingAttempts={true}
                >
                  {form.isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
                </SecureButton>
                <div className='text-sm text-center space-y-2'>
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
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
