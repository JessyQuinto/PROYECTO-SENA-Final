import React, { useState } from 'react';
import { z } from 'zod';
import { useAuth } from '@/auth/AuthContext';
import { useForm } from '@/hooks/useForm';
import { useToast } from '@/hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { Button } from '@/components/ui/shadcn/button';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const signupSchema = loginSchema
  .extend({
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

interface AuthFormsProps {
  defaultMode?: 'login' | 'signup';
}

export const AuthForms: React.FC<AuthFormsProps> = ({
  defaultMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const loginForm = useForm<LoginForm>({
    initialValues: { email: '', password: '' },
    validationSchema: loginSchema,
    onSubmit: async values => {
      try {
        const result = await signIn(values.email, values.password);
        if (result.error) {
          toast.error('Error en el inicio de sesión', {
            action: 'login',
          });
        } else {
          toast.success('Inicio de sesión exitoso', {
            action: 'login',
          });
          navigate('/dashboard');
        }
      } catch (error: any) {
        toast.error('Error inesperado', {
          action: 'login',
        });
      }
    },
  });

  const signupForm = useForm<SignupForm>({
    initialValues: { email: '', password: '', confirmPassword: '' },
    validationSchema: signupSchema,
    onSubmit: async values => {
      try {
        // Solo permitir registro como comprador o vendedor
        // Los administradores solo pueden ser creados por el super-admin
        const result = await signUp(values.email, values.password, 'comprador');
        if (result.error) {
          toast.error(result.error, {
            action: 'register',
          });
        } else {
          toast.success(
            'Registro exitoso. Revisa tu correo para confirmar tu cuenta.',
            {
              action: 'register',
            }
          );
          navigate('/verify-email', {
            state: { email: values.email },
          });
        }
      } catch (error: any) {
        toast.error('Error inesperado', {
          action: 'register',
        });
      }
    },
  });

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
  };

  return (
    <div className='w-full max-w-md mx-auto'>
      <div className='card card-hover'>
        <div className='card-body'>
          <div className='text-center mb-6'>
            <h2 className='text-2xl font-semibold mb-2'>
              {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </h2>
            <p className='text-sm opacity-70'>
              {mode === 'login'
                ? 'Accede a tu cuenta para continuar'
                : 'Únete a nuestra comunidad de artesanos'}
            </p>
          </div>

          {mode === 'login' ? (
            <form
              onSubmit={e => loginForm.handleSubmit(e)}
              className='space-y-4'
            >
              <div className='space-y-2'>
                <Label htmlFor='login-email'>Email</Label>
                <Input
                  id='login-email'
                  type='email'
                  value={loginForm.values.email}
                  onChange={e => loginForm.setValue('email', e.target.value)}
                  onBlur={() => loginForm.validateField('email')}
                  placeholder='tu@email.com'
                  className={loginForm.errors.email ? 'border-red-500' : ''}
                />
                {loginForm.errors.email && (
                  <p className='text-sm text-red-600'>
                    {loginForm.errors.email}
                  </p>
                )}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='login-password'>Contraseña</Label>
                <Input
                  id='login-password'
                  type='password'
                  value={loginForm.values.password}
                  onChange={e => loginForm.setValue('password', e.target.value)}
                  onBlur={() => loginForm.validateField('password')}
                  placeholder='••••••••'
                  className={loginForm.errors.password ? 'border-red-500' : ''}
                />
                {loginForm.errors.password && (
                  <p className='text-sm text-red-600'>
                    {loginForm.errors.password}
                  </p>
                )}
              </div>
              <Button
                type='submit'
                className='w-full'
                disabled={loginForm.isSubmitting}
              >
                {loginForm.isSubmitting
                  ? 'Iniciando sesión…'
                  : 'Iniciar sesión'}
              </Button>
            </form>
          ) : (
            <form onSubmit={signupForm.handleSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='signup-email'>Email</Label>
                <Input
                  id='signup-email'
                  type='email'
                  value={signupForm.values.email}
                  onChange={e => signupForm.setValue('email', e.target.value)}
                  onBlur={() => signupForm.validateField('email')}
                  placeholder='tu@email.com'
                  className={signupForm.errors.email ? 'border-red-500' : ''}
                />
                {signupForm.errors.email && (
                  <p className='text-sm text-red-600'>
                    {signupForm.errors.email}
                  </p>
                )}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='signup-password'>Contraseña</Label>
                <Input
                  id='signup-password'
                  type='password'
                  value={signupForm.values.password}
                  onChange={e =>
                    signupForm.setValue('password', e.target.value)
                  }
                  onBlur={() => signupForm.validateField('password')}
                  placeholder='••••••••'
                  className={signupForm.errors.password ? 'border-red-500' : ''}
                />
                {signupForm.errors.password && (
                  <p className='text-sm text-red-600'>
                    {signupForm.errors.password}
                  </p>
                )}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='signup-confirm'>Confirmar contraseña</Label>
                <Input
                  id='signup-confirm'
                  type='password'
                  value={signupForm.values.confirmPassword}
                  onChange={e =>
                    signupForm.setValue('confirmPassword', e.target.value)
                  }
                  onBlur={() => signupForm.validateField('confirmPassword')}
                  placeholder='••••••••'
                  className={
                    signupForm.errors.confirmPassword ? 'border-red-500' : ''
                  }
                />
                {signupForm.errors.confirmPassword && (
                  <p className='text-sm text-red-600'>
                    {signupForm.errors.confirmPassword}
                  </p>
                )}
              </div>
              <Button
                type='submit'
                className='w-full'
                disabled={signupForm.isSubmitting}
              >
                {signupForm.isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
              </Button>
            </form>
          )}

          <div className='text-center mt-6'>
            <button
              type='button'
              onClick={toggleMode}
              className='text-sm text-(--color-terracotta-suave) hover:underline'
            >
              {mode === 'login'
                ? '¿No tienes cuenta? Regístrate aquí'
                : '¿Ya tienes cuenta? Inicia sesión aquí'}
            </button>
          </div>

          {mode === 'login' && (
            <div className='text-center mt-4'>
              <a
                href='/forgot-password'
                className='text-sm text-(--color-terracotta-suave) hover:underline'
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
