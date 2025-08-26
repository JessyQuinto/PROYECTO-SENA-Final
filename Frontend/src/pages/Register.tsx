import React, { useEffect, useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { getDepartamentos, getCiudades } from '@/lib/geo';
import { useForm } from '@/hooks/useForm';
import { useToastWithAuth } from '@/hooks/useToast';
import { useRateLimit } from '@/hooks/useSecurity';

const signupSchema = z
  .object({
    email: z.string().email('Email inválido'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
      .regex(/\d/, 'Debe contener al menos un número')
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        'Debe contener al menos un carácter especial'
      ),
    confirmPassword: z.string().min(8, 'Confirma tu contraseña'),
    nombre: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(50, 'El nombre no puede exceder 50 caracteres'),
    telefono: z
      .string()
      .min(10, 'El teléfono debe tener al menos 10 dígitos')
      .regex(/^[+]?[1-9][\d]{9,15}$/, 'Formato de teléfono inválido'),
    ciudad: z.string().min(1, 'La ciudad es obligatoria'),
    departamento: z.string().min(1, 'El departamento es obligatorio'),
    confirmInfo: z
      .boolean()
      .refine(
        val => val === true,
        'Debes confirmar que la información es verdadera'
      ),
    acceptedTerms: z
      .boolean()
      .refine(val => val === true, 'Debes aceptar los términos y condiciones'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  nombre: string;
  telefono: string;
  ciudad: string;
  departamento: string;
  confirmInfo: boolean;
  acceptedTerms: boolean;
}

export const RegisterPage: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const toast = useToastWithAuth(); // Usar la versión que incluye el rol del usuario

  // Rate limiting for registration attempts
  const rateLimit = useRateLimit('register', 3, 10 * 60 * 1000); // 3 attempts per 10 minutes

  // Unificar formulario (sin pasos)
  const [role, setRole] = useState<'comprador' | 'vendedor'>('comprador');

  const departamentos = getDepartamentos();
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>('');
  const ciudades = getCiudades(selectedDepartamento as any);

  const form = useForm<FormData>({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
      nombre: '',
      telefono: '',
      ciudad: '',
      departamento: '',
      confirmInfo: false,
      acceptedTerms: false,
    },
    validationSchema: signupSchema,
    onSubmit: async values => {
      // Check rate limit before attempting registration
      if (!rateLimit.checkLimit()) {
        toast.error('Demasiados intentos de registro. Intenta más tarde.', {
          action: 'register',
        });
        return;
      }

      const res = await signUp(values.email, values.password, role, {
        nombre: values.nombre,
        telefono: values.telefono,
        ciudad: values.ciudad,
        departamento: values.departamento,
        acceptedTerms: values.acceptedTerms,
      });

      if (res.error) {
        toast.error(res.error, { action: 'register' });
        return;
      }

      // Clear rate limit on successful registration
      rateLimit.clearLimit();
      // Redirigir a pantalla de verificación
      navigate('/verifica-tu-correo', {
        replace: true,
        state: { email: values.email },
      });
    },
  });

  // Aviso post-registro sin pasos
  useEffect(() => {
    const sub = supabase?.auth.onAuthStateChange(
      (_event: any, session: any) => {
        if (session?.user) navigate('/login', { replace: true });
      }
    );
    return () => {
      sub?.data?.subscription?.unsubscribe?.();
    };
  }, [navigate]);

  const handleDepartamentoChange = (departamento: string) => {
    setSelectedDepartamento(departamento);
    form.setValue('departamento', departamento);
    form.setValue('ciudad', ''); // Reset ciudad when departamento changes
  };

  const handleCiudadChange = (ciudad: string) => {
    form.setValue('ciudad', ciudad);
  };

  return (
    <div className='min-h-[calc(100vh-120px)] grid place-items-center relative overflow-hidden'>
      {/* Decorative auth background */}
      <div
        aria-hidden
        className='absolute inset-0 opacity-12'
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.04), rgba(0,0,0,0.00)), url('/assert/motif-de-fond-sans-couture-tribal-dessin-geometrique-noir-et-blanc-vecteur/v1045-03.jpg')",
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
                  Únete a Tesoros Chocó
                </h2>
                <p className='opacity-80 mb-6'>
                  Conectamos artesanos del Chocó con personas que valoran lo
                  fabricado a mano, con historia y origen.
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
                    <span className='text-sm'>
                      Acceso inmediato a productos únicos
                    </span>
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
                          d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                        />
                      </svg>
                    </div>
                    <span className='text-sm'>Apoya a artesanos locales</span>
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
                      Productos con historia y autenticidad
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
                  <h1 className='text-3xl font-bold mb-2'>Crear Cuenta</h1>
                  <p className='opacity-80'>
                    Únete a nuestra comunidad de artesanos y compradores
                  </p>
                </div>

                {/* Role Selection */}
                <div className='mb-6'>
                  <Label className='block mb-3'>Tipo de cuenta</Label>
                  <div className='grid grid-cols-2 gap-3'>
                    <button
                      type='button'
                      onClick={() => setRole('comprador')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        role === 'comprador'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className='text-center'>
                        <svg
                          className='w-8 h-8 mx-auto mb-2'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                          />
                        </svg>
                        <div className='font-medium'>Comprador</div>
                        <div className='text-sm opacity-80'>
                          Comprar productos artesanales
                        </div>
                      </div>
                    </button>
                    <button
                      type='button'
                      onClick={() => setRole('vendedor')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        role === 'vendedor'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className='text-center'>
                        <svg
                          className='w-8 h-8 mx-auto mb-2'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                          />
                        </svg>
                        <div className='font-medium'>Vendedor</div>
                        <div className='text-sm opacity-80'>
                          Vender productos artesanales
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <form onSubmit={form.handleSubmit} className='space-y-6'>
                  {/* Sección 1: Información Personal */}
                  <div className='space-y-4'>
                    <div className='border-b pb-2'>
                      <h3 className='text-lg font-semibold text-gray-900'>
                        Información Personal
                      </h3>
                      <p className='text-sm text-gray-600'>
                        Datos básicos para tu cuenta
                      </p>
                    </div>

                    <div>
                      <Label htmlFor='nombre'>Nombre completo *</Label>
                      <Input
                        id='nombre'
                        type='text'
                        placeholder='Ingresa tu nombre completo'
                        value={form.values.nombre}
                        onChange={e =>
                          form.handleChange('nombre', e.target.value)
                        }
                        onBlur={() => form.handleBlur('nombre')}
                        className={
                          form.hasError('nombre') ? 'border-red-500' : ''
                        }
                      />
                      {form.hasError('nombre') && (
                        <p className='text-red-500 text-sm mt-1'>
                          {form.getFieldState('nombre').error}
                        </p>
                      )}
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <Label htmlFor='email'>Correo electrónico *</Label>
                        <Input
                          id='email'
                          type='email'
                          placeholder='ejemplo@correo.com'
                          value={form.values.email}
                          onChange={e =>
                            form.handleChange('email', e.target.value)
                          }
                          onBlur={() => form.handleBlur('email')}
                          className={
                            form.hasError('email') ? 'border-red-500' : ''
                          }
                        />
                        {form.hasError('email') && (
                          <p className='text-red-500 text-sm mt-1'>
                            {form.getFieldState('email').error}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor='telefono'>Teléfono *</Label>
                        <Input
                          id='telefono'
                          type='tel'
                          placeholder='+57 300 123 4567'
                          value={form.values.telefono}
                          onChange={e =>
                            form.handleChange('telefono', e.target.value)
                          }
                          onBlur={() => form.handleBlur('telefono')}
                          className={
                            form.hasError('telefono') ? 'border-red-500' : ''
                          }
                        />
                        {form.hasError('telefono') && (
                          <p className='text-red-500 text-sm mt-1'>
                            {form.getFieldState('telefono').error}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sección 2: Ubicación */}
                  <div className='space-y-4'>
                    <div className='border-b pb-2'>
                      <h3 className='text-lg font-semibold text-gray-900'>
                        Ubicación
                      </h3>
                      <p className='text-sm text-gray-600'>
                        Dinos dónde te encuentras
                      </p>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <Label htmlFor='departamento'>Departamento *</Label>
                        <select
                          id='departamento'
                          value={selectedDepartamento}
                          onChange={e =>
                            handleDepartamentoChange(e.target.value)
                          }
                          className='form-select'
                        >
                          <option value=''>Selecciona un departamento</option>
                          {departamentos.map(dept => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                        {form.hasError('departamento') && (
                          <p className='text-red-500 text-sm mt-1'>
                            {form.getFieldState('departamento').error}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor='ciudad'>Ciudad *</Label>
                        <select
                          id='ciudad'
                          value={form.values.ciudad}
                          onChange={e => handleCiudadChange(e.target.value)}
                          disabled={!selectedDepartamento}
                          className='form-select disabled:opacity-50'
                        >
                          <option value=''>Selecciona una ciudad</option>
                          {ciudades.map(ciudad => (
                            <option key={ciudad} value={ciudad}>
                              {ciudad}
                            </option>
                          ))}
                        </select>
                        {form.hasError('ciudad') && (
                          <p className='text-red-500 text-sm mt-1'>
                            {form.getFieldState('ciudad').error}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sección 3: Seguridad */}
                  <div className='space-y-4'>
                    <div className='border-b pb-2'>
                      <h3 className='text-lg font-semibold text-gray-900'>
                        Seguridad
                      </h3>
                      <p className='text-sm text-gray-600'>
                        Crea una contraseña segura para tu cuenta
                      </p>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <Label htmlFor='password'>Contraseña *</Label>
                        <Input
                          id='password'
                          type='password'
                          placeholder='Mínimo 8 caracteres'
                          value={form.values.password}
                          onChange={e =>
                            form.handleChange('password', e.target.value)
                          }
                          onBlur={() => form.handleBlur('password')}
                          className={
                            form.hasError('password') ? 'border-red-500' : ''
                          }
                        />
                        {form.hasError('password') && (
                          <p className='text-red-500 text-sm mt-1'>
                            {form.getFieldState('password').error}
                          </p>
                        )}
                        <div className='mt-1 text-xs text-gray-500'>
                          Debe contener mayúsculas, minúsculas, números y
                          símbolos
                        </div>
                      </div>
                      <div>
                        <Label htmlFor='confirmPassword'>
                          Confirmar contraseña *
                        </Label>
                        <Input
                          id='confirmPassword'
                          type='password'
                          placeholder='Repite tu contraseña'
                          value={form.values.confirmPassword}
                          onChange={e =>
                            form.handleChange('confirmPassword', e.target.value)
                          }
                          onBlur={() => form.handleBlur('confirmPassword')}
                          className={
                            form.hasError('confirmPassword')
                              ? 'border-red-500'
                              : ''
                          }
                        />
                        {form.hasError('confirmPassword') && (
                          <p className='text-red-500 text-sm mt-1'>
                            {form.getFieldState('confirmPassword').error}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sección 4: Términos y Confirmación */}
                  <div className='space-y-4'>
                    <div className='border-b pb-2'>
                      <h3 className='text-lg font-semibold text-gray-900'>
                        Confirmación
                      </h3>
                      <p className='text-sm text-gray-600'>
                        Acepta nuestros términos para continuar
                      </p>
                    </div>

                    <div className='space-y-4 bg-gray-50 p-4 rounded-lg'>
                      <div className='flex items-start gap-3'>
                        <Checkbox
                          id='confirmInfo'
                          checked={form.values.confirmInfo}
                          onCheckedChange={checked =>
                            form.setValue('confirmInfo', checked as boolean)
                          }
                        />
                        <Label
                          htmlFor='confirmInfo'
                          className='text-sm leading-relaxed cursor-pointer'
                        >
                          Confirmo que toda la información proporcionada es
                          verdadera y actualizada
                        </Label>
                      </div>
                      {form.hasError('confirmInfo') && (
                        <p className='text-red-500 text-sm'>
                          {form.getFieldState('confirmInfo').error}
                        </p>
                      )}

                      <div className='flex items-start gap-3'>
                        <Checkbox
                          id='acceptedTerms'
                          checked={form.values.acceptedTerms}
                          onCheckedChange={checked =>
                            form.setValue('acceptedTerms', checked as boolean)
                          }
                        />
                        <Label
                          htmlFor='acceptedTerms'
                          className='text-sm leading-relaxed cursor-pointer'
                        >
                          Acepto los{' '}
                          <Link
                            to='/terminos'
                            className='text-primary hover:underline font-medium'
                            target='_blank'
                          >
                            términos y condiciones
                          </Link>{' '}
                          y la{' '}
                          <Link
                            to='/privacidad'
                            className='text-primary hover:underline font-medium'
                            target='_blank'
                          >
                            política de privacidad
                          </Link>
                        </Label>
                      </div>
                      {form.hasError('acceptedTerms') && (
                        <p className='text-red-500 text-sm'>
                          {form.getFieldState('acceptedTerms').error}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    type='submit'
                    className='w-full py-3 text-base'
                    disabled={form.isSubmitting}
                  >
                    {form.isSubmitting ? (
                      <div className='flex items-center gap-2'>
                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                        Creando cuenta...
                      </div>
                    ) : (
                      'Crear cuenta'
                    )}
                  </Button>
                </form>

                <div className='text-center mt-6'>
                  <p className='text-sm opacity-80'>
                    ¿Ya tienes una cuenta?{' '}
                    <Link to='/login' className='text-primary hover:underline'>
                      Inicia sesión
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
