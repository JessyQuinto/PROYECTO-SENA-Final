import React, { useEffect } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { useForm } from '@/hooks/useForm';
import { useToastWithAuth } from '@/hooks/useToast';
import { useRateLimit } from '@/hooks/useSecurity';
import { AuthFeatureSets } from '@/components/auth/AuthLayout';
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert';
import Icon from '@/components/ui/Icon';

// validation handled inline in submit handler

interface FormData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const { signIn, loading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToastWithAuth();
  const rateLimit = useRateLimit('login', 5, 15 * 60 * 1000); // 5 intentos por 15 minutos

  // Obtener mensaje informativo del estado de navegación
  const infoMessage = location.state?.message;
  const returnTo = location.state?.returnTo;

  const form = useForm<FormData>({
    initialValues: {
      email: '',
      password: '',
    },
    onSubmit: async values => {
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

      // ✅ MEJORADO: Pasar opciones de redirección al signIn
      const result = await signIn(values.email, values.password, {
        returnTo: returnTo
      });
      
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

  // ✅ MEJORADO: El useEffect ya no es necesario porque la redirección 
  // se maneja automáticamente en AuthContext
  // useEffect(() => {
  //   if (user) {
  //     navigate(returnTo || '/');
  //   }
  // }, [user, navigate, returnTo]);

  return (
    <div className='min-h-[calc(100vh-80px)] sm:min-h-[calc(100vh-120px)] grid place-items-center py-4 px-2 sm:py-8 sm:px-4'>
      <div className='container max-w-sm sm:max-w-md md:max-w-lg lg:max-w-5xl'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 items-start'>
          {/* Sidebar con características - Solo visible en pantallas grandes */}
          <div className='hidden lg:block lg:col-span-1'>
            <div className='card card-hover'>
              <div className='card-body p-4 sm:p-5'>
                <h2 className='card-title text-xl sm:text-2xl mb-3 sm:mb-4'>Bienvenido de vuelta</h2>
                <p className='opacity-80 mb-4 sm:mb-6 text-sm sm:text-base'>Accede a tu cuenta para continuar explorando los tesoros artesanales del Chocó.</p>
                <div className='space-y-3 sm:space-y-4'>
                  {AuthFeatureSets.login.map((feature, index) => (
                    <div key={index} className='flex items-center gap-2 sm:gap-3'>
                      <div className='w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center'>
                        {feature.icon}
                      </div>
                      <span className='text-xs sm:text-sm'>{feature.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Formulario de login */}
          <div className='lg:col-span-2'>
            <div className='card card-hover'>
              <div className='card-body p-4 sm:p-5'>
                <div className='text-center mb-3 sm:mb-4'>
                  <h1 className='text-xl sm:text-2xl font-bold mb-1'>Iniciar Sesión</h1>
                </div>

                {/* Mensaje informativo cuando se redirige desde otra página */}
                {infoMessage && (
                  <Alert variant="info" className='mb-3 sm:mb-4'>
                    <Icon
                      category='Estados y Feedback'
                      name='LucideInfo'
                      className='h-3 w-3 sm:h-4 sm:w-4'
                    />
                    <AlertDescription className='text-xs sm:text-sm'>
                      {infoMessage}
                    </AlertDescription>
                  </Alert>
                )}

                <p className='opacity-80 text-center mb-3 sm:mb-4 text-xs sm:text-sm'>
                  Accede a tu cuenta para continuar
                </p>

                <form onSubmit={form.handleSubmit} className='space-y-3 sm:space-y-4' noValidate>
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
                  <div className='space-y-1 sm:space-y-1.5'>
                    <Label htmlFor='email' className='text-xs sm:text-sm font-medium'>
                      Correo electrónico
                      <span className='text-destructive ml-1' aria-label='campo requerido'>*</span>
                    </Label>
                    <Input
                      id='email'
                      type='email'
                      placeholder='tu@email.com'
                      {...form.getInputProps('email')}
                      className={`py-2 sm:py-2.5 text-sm ${form.hasError('email') ? 'border-red-500' : ''}`}
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
                        className='text-red-500 text-xs mt-1'
                        role='alert'
                        aria-live='polite'
                      >
                        {form.getFieldState('email').error}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className='space-y-1 sm:space-y-1.5'>
                    <Label htmlFor='password' className='text-xs sm:text-sm font-medium'>
                      Contraseña
                      <span className='text-destructive ml-1' aria-label='campo requerido'>*</span>
                    </Label>
                    <Input
                      id='password'
                      type='password'
                      placeholder='••••••••'
                      {...form.getInputProps('password')}
                      className={`py-2 sm:py-2.5 text-sm ${form.hasError('password') ? 'border-red-500' : ''}`}
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
                        className='text-red-500 text-xs mt-1'
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
                    className='w-full py-2.5 sm:py-3 text-xs sm:text-sm font-medium'
                    disabled={form.isSubmitting || loading}
                    aria-describedby='submit-status'
                  >
                    {form.isSubmitting || loading ? (
                      <div className='flex items-center gap-2'>
                        <div 
                          className='w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin'
                          role='status'
                          aria-label='Iniciando sesión'
                        ></div>
                        <span aria-live='polite' className='text-xs sm:text-sm'>Iniciando sesión...</span>
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
                <div className='mt-3 sm:mt-4 text-center space-y-1.5 sm:space-y-2'>
                  <div className='text-xs sm:text-sm'>
                    <Link
                      to='/forgot-password'
                      className='text-primary hover:underline font-medium'
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <div className='text-xs sm:text-sm text-muted-foreground'>
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
