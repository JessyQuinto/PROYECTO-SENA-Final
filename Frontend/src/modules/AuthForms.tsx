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
  const [isTransitioning, setIsTransitioning] = useState(false);
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
          toast.error(result.error);
        } else {
          toast.success('', {
            action: 'login',
          });
          navigate('/dashboard');
        }
      } catch (error: any) {
        toast.error('Error inesperado');
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
          toast.error(result.error);
        } else {
          toast.success('Revisa tu correo para confirmar tu cuenta', {
            action: 'register',
          });
          navigate('/verify-email', {
            state: { email: values.email },
          });
        }
      } catch (error: any) {
        toast.error('Error inesperado');
      }
    },
  });

  const toggleMode = () => {
    setIsTransitioning(true);
    // Reset forms when switching modes to clear any errors
    loginForm.reset();
    signupForm.reset();
    
    // Delay the mode change to allow for smooth transition
    setTimeout(() => {
      setMode(mode === 'login' ? 'signup' : 'login');
      setIsTransitioning(false);
    }, 150); // Half of transition duration for smoother effect
  };

  return (
    <div className='w-full max-w-md mx-auto'>
      <div className='card card-hover'>
        <div className='card-body'>
          <div 
            className={`transition-all duration-300 ease-out ${
              isTransitioning ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'
            }`}
          >
            <div className='text-center mb-6'>
              <h2 className='text-2xl font-semibold mb-2 transition-all duration-300'>
                {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </h2>
              <p className='text-sm opacity-70 transition-all duration-300'>
                {mode === 'login'
                  ? 'Accede a tu cuenta para continuar'
                  : 'Únete a nuestra comunidad de artesanos'}
              </p>
            </div>

            <div className='min-h-[200px] transition-all duration-300'>
              {mode === 'login' ? (
                <form
                  onSubmit={e => loginForm.handleSubmit(e)}
                  className='space-y-4 transition-all duration-300'
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
                      className={`transition-all duration-200 ${
                        loginForm.errors.email ? 'border-red-500' : ''
                      }`}
                    />
                    {loginForm.errors.email && (
                      <p className='text-sm text-red-600 animate-in slide-in-from-top-1 duration-200'>
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
                      className={`transition-all duration-200 ${
                        loginForm.errors.password ? 'border-red-500' : ''
                      }`}
                    />
                    {loginForm.errors.password && (
                      <p className='text-sm text-red-600 animate-in slide-in-from-top-1 duration-200'>
                        {loginForm.errors.password}
                      </p>
                    )}
                  </div>
                  <Button
                    type='submit'
                    className='w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]'
                    disabled={loginForm.isSubmitting}
                  >
                    {loginForm.isSubmitting
                      ? 'Iniciando sesión…'
                      : 'Iniciar sesión'}
                  </Button>
                </form>
              ) : (
                <form 
                  onSubmit={signupForm.handleSubmit} 
                  className='space-y-4 transition-all duration-300'
                >
                  <div className='space-y-2'>
                    <Label htmlFor='signup-email'>Email</Label>
                    <Input
                      id='signup-email'
                      type='email'
                      value={signupForm.values.email}
                      onChange={e => signupForm.setValue('email', e.target.value)}
                      onBlur={() => signupForm.validateField('email')}
                      placeholder='tu@email.com'
                      className={`transition-all duration-200 ${
                        signupForm.errors.email ? 'border-red-500' : ''
                      }`}
                    />
                    {signupForm.errors.email && (
                      <p className='text-sm text-red-600 animate-in slide-in-from-top-1 duration-200'>
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
                      className={`transition-all duration-200 ${
                        signupForm.errors.password ? 'border-red-500' : ''
                      }`}
                    />
                    {signupForm.errors.password && (
                      <p className='text-sm text-red-600 animate-in slide-in-from-top-1 duration-200'>
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
                      className={`transition-all duration-200 ${
                        signupForm.errors.confirmPassword ? 'border-red-500' : ''
                      }`}
                    />
                    {signupForm.errors.confirmPassword && (
                      <p className='text-sm text-red-600 animate-in slide-in-from-top-1 duration-200'>
                        {signupForm.errors.confirmPassword}
                      </p>
                    )}
                  </div>
                  <Button
                    type='submit'
                    className='w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]'
                    disabled={signupForm.isSubmitting}
                  >
                    {signupForm.isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
                  </Button>
                </form>
              )}
            </div>
          </div>

          <div className='text-center mt-6'>
            <button
              type='button'
              onClick={toggleMode}
              disabled={isTransitioning}
              className={`text-sm text-(--color-terracotta-suave) hover:underline transition-all duration-200 ${
                isTransitioning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
              }`}
            >
              {mode === 'login'
                ? '¿No tienes cuenta? Regístrate aquí'
                : '¿Ya tienes cuenta? Inicia sesión aquí'}
            </button>
          </div>

          {mode === 'login' && (
            <div className='text-center mt-4 transition-all duration-300'>
              <a
                href='/forgot-password'
                className='text-sm text-(--color-terracotta-suave) hover:underline transition-all duration-200 hover:scale-105'
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
