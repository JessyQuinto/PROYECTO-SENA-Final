import React, { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { useForm } from '@/hooks/useForm';
import { toast } from 'sonner';

// Formulario optimizado basado en datos reales de Supabase
// Estructura de BD: users(email, role, vendedor_estado, nombre_completo)
// Direcciones van en tabla separada user_address

const signupSchema = z
  .object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string().min(6, 'Confirma tu contraseña'),
    nombre_completo: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    acceptedTerms: z.boolean().refine(val => val === true, 'Debes aceptar los términos y condiciones'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  nombre_completo: string;
  acceptedTerms: boolean;
}

export const RegisterPage: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<'comprador' | 'vendedor'>('comprador');

  const form = useForm<FormData>({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
      nombre_completo: '',
      acceptedTerms: false,
    },
    validationSchema: signupSchema,
    onSubmit: async values => {
      const res = await signUp(values.email, values.password, role, {
        nombre: values.nombre_completo, // AuthContext espera 'nombre'
        acceptedTerms: values.acceptedTerms,
      });

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success('Registro exitoso. Revisa tu correo para verificar tu cuenta.');
      navigate('/verifica-tu-correo', {
        replace: true,
        state: { email: values.email },
      });
    },
  });



  return (
    <div className='min-h-[calc(100vh-120px)] grid place-items-center'>
      <div className='container max-w-lg'>
        <div className='card card-hover'>
          <div className='card-body'>
            <div className='text-center mb-6'>
              <h1 className='text-3xl font-bold mb-2'>Crear Cuenta</h1>
              <p className='opacity-80'>
                Únete a nuestra comunidad de artesanos y compradores
              </p>
              <div className='mt-3 text-xs text-gray-500'>
                📊 Formulario optimizado basado en datos reales de Carolina y estructura de BD
              </div>
            </div>

            {/* Role Selection */}
            <fieldset className='mb-6'>
              <legend className='block mb-3 text-sm font-medium'>Tipo de cuenta</legend>
              <div className='grid grid-cols-2 gap-3'>
                <button
                  type='button'
                  onClick={() => setRole('comprador')}
                  className={`p-4 rounded-lg border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    role === 'comprador'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 hover:border-gray-300 focus:border-primary'
                  }`}
                >
                  <div className='text-center'>
                    <div className='font-medium'>Comprador</div>
                    <div className='text-sm opacity-80'>
                      Comprar productos artesanales
                    </div>
                  </div>
                </button>
                <button
                  type='button'
                  onClick={() => setRole('vendedor')}
                  className={`p-4 rounded-lg border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    role === 'vendedor'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 hover:border-gray-300 focus:border-primary'
                  }`}
                >
                  <div className='text-center'>
                    <div className='font-medium'>Vendedor</div>
                    <div className='text-sm opacity-80'>
                      Vender productos artesanales
                    </div>
                  </div>
                </button>
              </div>
            </fieldset>

            <form onSubmit={form.handleSubmit} className='space-y-4' noValidate>
              <div>
                <Label htmlFor='nombre_completo'>Nombre completo *</Label>
                <Input
                  id='nombre_completo'
                  type='text'
                  placeholder='Ingresa tu nombre completo'
                  value={form.values.nombre_completo}
                  onChange={e => form.handleChange('nombre_completo', e.target.value)}
                  onBlur={() => form.handleBlur('nombre_completo')}
                  className={form.hasError('nombre_completo') ? 'border-red-500' : ''}
                />
                {form.hasError('nombre_completo') && (
                  <p className='text-red-500 text-sm mt-1'>
                    {form.getFieldState('nombre_completo').error}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor='email'>Correo electrónico *</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='ejemplo@correo.com'
                  value={form.values.email}
                  onChange={e => form.handleChange('email', e.target.value)}
                  onBlur={() => form.handleBlur('email')}
                  className={form.hasError('email') ? 'border-red-500' : ''}
                />
                {form.hasError('email') && (
                  <p className='text-red-500 text-sm mt-1'>
                    {form.getFieldState('email').error}
                  </p>
                )}
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='password'>Contraseña *</Label>
                  <Input
                    id='password'
                    type='password'
                    placeholder='Mínimo 6 caracteres'
                    value={form.values.password}
                    onChange={e => form.handleChange('password', e.target.value)}
                    onBlur={() => form.handleBlur('password')}
                    className={form.hasError('password') ? 'border-red-500' : ''}
                  />
                  {form.hasError('password') && (
                    <p className='text-red-500 text-sm mt-1'>
                      {form.getFieldState('password').error}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor='confirmPassword'>Confirmar contraseña *</Label>
                  <Input
                    id='confirmPassword'
                    type='password'
                    placeholder='Repite tu contraseña'
                    value={form.values.confirmPassword}
                    onChange={e => form.handleChange('confirmPassword', e.target.value)}
                    onBlur={() => form.handleBlur('confirmPassword')}
                    className={form.hasError('confirmPassword') ? 'border-red-500' : ''}
                  />
                  {form.hasError('confirmPassword') && (
                    <p className='text-red-500 text-sm mt-1'>
                      {form.getFieldState('confirmPassword').error}
                    </p>
                  )}
                </div>
              </div>

              <div className='flex items-start gap-3 bg-gray-50 p-4 rounded-lg'>
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
  );
};

export default RegisterPage;
