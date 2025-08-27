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
  const toast = useToastWithAuth();

  // Rate limiting for registration attempts
  const rateLimit = useRateLimit('register', 3, 10 * 60 * 1000);

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const totalSteps = 4;
  
  // Role selection
  const [role, setRole] = useState<'comprador' | 'vendedor'>('comprador');

  const departamentos = getDepartamentos();
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>('');
  const ciudades = getCiudades(selectedDepartamento as any);

  // Navigation helpers
  const nextStep = () => {
    if (currentStep < totalSteps && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const prevStep = () => {
    if (currentStep > 1 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsTransitioning(false);
      }, 150);
    }
  };

  // Validate current step
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1: // Role selection
        return !!role;
      case 2: // Personal info
        const hasPersonalData = !!(form.values.nombre?.trim() && form.values.email?.trim() && form.values.telefono?.trim());
        const hasNoPersonalErrors = !form.errors.nombre && !form.errors.email && !form.errors.telefono;
        return hasPersonalData && hasNoPersonalErrors;
      case 3: // Location
        return !!(form.values.departamento && form.values.ciudad);
      case 4: // Security & Terms
        const hasPasswords = !!(form.values.password && form.values.confirmPassword);
        const hasAgreements = !!(form.values.confirmInfo && form.values.acceptedTerms);
        const hasNoPasswordErrors = !form.errors.password && !form.errors.confirmPassword;
        return hasPasswords && hasAgreements && hasNoPasswordErrors;
      default:
        return false;
    }
  };

  const handleNext = () => {
    // Validate current step fields first
    const fieldsToValidate = getStepFields(currentStep);
    let hasValidationErrors = false;
    
    fieldsToValidate.forEach((field: keyof FormData) => {
      if (!form.validateField(field)) {
        hasValidationErrors = true;
      }
    });
    
    // Check if step is complete after validation
    if (!hasValidationErrors && validateCurrentStep()) {
      nextStep();
    } else {
      // Show error message for incomplete step
      const stepName = getStepTitle(currentStep);
      toast.error(`Por favor completa todos los campos requeridos en: ${stepName}`);
    }
  };

  const getStepFields = (step: number): (keyof FormData)[] => {
    switch (step) {
      case 2: return ['nombre', 'email', 'telefono'];
      case 3: return ['departamento', 'ciudad'];
      case 4: return ['password', 'confirmPassword'];
      default: return [];
    }
  };

  // Step content helpers
  const getStepTitle = (step: number): string => {
    switch (step) {
      case 1: return 'Tipo de Cuenta';
      case 2: return 'Información Personal';
      case 3: return 'Ubicación';
      case 4: return 'Seguridad y Términos';
      default: return '';
    }
  };

  const getStepSubtitle = (step: number): string => {
    switch (step) {
      case 1: return 'Selecciona cómo quieres usar la plataforma';
      case 2: return 'Cuéntanos un poco sobre ti';
      case 3: return 'Dinos dónde te encuentras';
      case 4: return 'Protege tu cuenta y acepta nuestros términos';
      default: return '';
    }
  };

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
      // Redirect to email verification countdown page
      navigate('/verifica-tu-correo', {
        replace: true,
        state: { 
          email: values.email,
          showCountdown: true,
          countdownDuration: 90 // 90 seconds
        },
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

                {/* Progress indicator */}
                <div className='mb-8'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium text-gray-700'>Paso {currentStep} de {totalSteps}</span>
                    <span className='text-sm text-gray-500'>{Math.round((currentStep / totalSteps) * 100)}% completado</span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div 
                      className='bg-primary h-2 rounded-full transition-all duration-300 ease-out'
                      style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Step content with smooth transitions */}
                <div 
                  className={`transition-all duration-300 ease-out min-h-[400px] ${
                    isTransitioning ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'
                  }`}
                >
                  <div className='text-center mb-6'>
                    <h2 className='text-xl font-semibold mb-2'>{getStepTitle(currentStep)}</h2>
                    <p className='text-sm opacity-70'>{getStepSubtitle(currentStep)}</p>
                  </div>

                  {/* Step 1: Role Selection */}
                  {currentStep === 1 && (
                    <div className='space-y-4'>
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <button
                          type='button'
                          onClick={() => setRole('comprador')}
                          className={`p-6 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] ${
                            role === 'comprador'
                              ? 'border-primary bg-primary/5 text-primary shadow-md'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }`}
                        >
                          <div className='text-center'>
                            <svg className='w-12 h-12 mx-auto mb-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                            </svg>
                            <div className='font-semibold text-lg mb-1'>Comprador</div>
                            <div className='text-sm opacity-80'>Explora y compra productos únicos</div>
                          </div>
                        </button>
                        <button
                          type='button'
                          onClick={() => setRole('vendedor')}
                          className={`p-6 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] ${
                            role === 'vendedor'
                              ? 'border-primary bg-primary/5 text-primary shadow-md'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }`}
                        >
                          <div className='text-center'>
                            <svg className='w-12 h-12 mx-auto mb-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' />
                            </svg>
                            <div className='font-semibold text-lg mb-1'>Vendedor</div>
                            <div className='text-sm opacity-80'>Vende tus creaciones artesanales</div>
                          </div>
                        </button>
                      </div>
                      {role === 'vendedor' && (
                        <div className='mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg'>
                          <div className='flex items-start gap-3'>
                            <svg className='w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                            </svg>
                            <div className='text-sm text-amber-800'>
                              <strong>Nota:</strong> Las cuentas de vendedor requieren aprobación antes de publicar productos.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 2: Personal Information */}
                  {currentStep === 2 && (
                    <div className='space-y-5'>
                      <div>
                        <Label htmlFor='nombre'>Nombre completo
                          <span className='text-destructive ml-1'>*</span>
                        </Label>
                        <Input
                          id='nombre'
                          type='text'
                          placeholder='Ingresa tu nombre completo'
                          value={form.values.nombre}
                          onChange={e => form.handleChange('nombre', e.target.value)}
                          onBlur={() => form.handleBlur('nombre')}
                          className={`transition-all duration-200 ${
                            form.hasError('nombre') ? 'border-red-500' : ''
                          }`}
                        />
                        {form.hasError('nombre') && (
                          <p className='text-red-500 text-sm mt-1 animate-in slide-in-from-top-1 duration-200'>
                            {form.getFieldState('nombre').error}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor='email'>Correo electrónico
                          <span className='text-destructive ml-1'>*</span>
                        </Label>
                        <Input
                          id='email'
                          type='email'
                          placeholder='ejemplo@correo.com'
                          value={form.values.email}
                          onChange={e => form.handleChange('email', e.target.value)}
                          onBlur={() => form.handleBlur('email')}
                          className={`transition-all duration-200 ${
                            form.hasError('email') ? 'border-red-500' : ''
                          }`}
                        />
                        {form.hasError('email') && (
                          <p className='text-red-500 text-sm mt-1 animate-in slide-in-from-top-1 duration-200'>
                            {form.getFieldState('email').error}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor='telefono'>Teléfono
                          <span className='text-destructive ml-1'>*</span>
                        </Label>
                        <Input
                          id='telefono'
                          type='tel'
                          placeholder='+57 300 123 4567'
                          value={form.values.telefono}
                          onChange={e => form.handleChange('telefono', e.target.value)}
                          onBlur={() => form.handleBlur('telefono')}
                          className={`transition-all duration-200 ${
                            form.hasError('telefono') ? 'border-red-500' : ''
                          }`}
                        />
                        {form.hasError('telefono') && (
                          <p className='text-red-500 text-sm mt-1 animate-in slide-in-from-top-1 duration-200'>
                            {form.getFieldState('telefono').error}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Location */}
                  {currentStep === 3 && (
                    <div className='space-y-5'>
                      <div>
                        <Label htmlFor='departamento'>Departamento
                          <span className='text-destructive ml-1'>*</span>
                        </Label>
                        <select
                          id='departamento'
                          value={selectedDepartamento}
                          onChange={e => handleDepartamentoChange(e.target.value)}
                          className='form-select w-full transition-all duration-200'
                        >
                          <option value=''>Selecciona un departamento</option>
                          {departamentos.map(dept => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                        {form.hasError('departamento') && (
                          <p className='text-red-500 text-sm mt-1 animate-in slide-in-from-top-1 duration-200'>
                            {form.getFieldState('departamento').error}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor='ciudad'>Ciudad
                          <span className='text-destructive ml-1'>*</span>
                        </Label>
                        <select
                          id='ciudad'
                          value={form.values.ciudad}
                          onChange={e => handleCiudadChange(e.target.value)}
                          disabled={!selectedDepartamento}
                          className='form-select w-full disabled:opacity-50 transition-all duration-200'
                        >
                          <option value=''>Selecciona una ciudad</option>
                          {ciudades.map(ciudad => (
                            <option key={ciudad} value={ciudad}>
                              {ciudad}
                            </option>
                          ))}
                        </select>
                        {form.hasError('ciudad') && (
                          <p className='text-red-500 text-sm mt-1 animate-in slide-in-from-top-1 duration-200'>
                            {form.getFieldState('ciudad').error}
                          </p>
                        )}
                        {!selectedDepartamento && (
                          <p className='text-gray-500 text-sm mt-1'>
                            Primero selecciona un departamento
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 4: Security & Terms */}
                  {currentStep === 4 && (
                    <div className='space-y-6'>
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div>
                          <Label htmlFor='password'>Contraseña
                            <span className='text-destructive ml-1'>*</span>
                          </Label>
                          <Input
                            id='password'
                            type='password'
                            placeholder='Mínimo 8 caracteres'
                            value={form.values.password}
                            onChange={e => form.handleChange('password', e.target.value)}
                            onBlur={() => form.handleBlur('password')}
                            className={`transition-all duration-200 ${
                              form.hasError('password') ? 'border-red-500' : ''
                            }`}
                          />
                          {form.hasError('password') && (
                            <p className='text-red-500 text-sm mt-1 animate-in slide-in-from-top-1 duration-200'>
                              {form.getFieldState('password').error}
                            </p>
                          )}
                          <div className='mt-1 text-xs text-gray-500'>
                            Debe contener mayúsculas, minúsculas, números y símbolos
                          </div>
                        </div>
                        <div>
                          <Label htmlFor='confirmPassword'>Confirmar contraseña
                            <span className='text-destructive ml-1'>*</span>
                          </Label>
                          <Input
                            id='confirmPassword'
                            type='password'
                            placeholder='Repite tu contraseña'
                            value={form.values.confirmPassword}
                            onChange={e => form.handleChange('confirmPassword', e.target.value)}
                            onBlur={() => form.handleBlur('confirmPassword')}
                            className={`transition-all duration-200 ${
                              form.hasError('confirmPassword') ? 'border-red-500' : ''
                            }`}
                          />
                          {form.hasError('confirmPassword') && (
                            <p className='text-red-500 text-sm mt-1 animate-in slide-in-from-top-1 duration-200'>
                              {form.getFieldState('confirmPassword').error}
                            </p>
                          )}
                        </div>
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
                            Confirmo que toda la información proporcionada es verdadera y actualizada
                          </Label>
                        </div>
                        {form.hasError('confirmInfo') && (
                          <p className='text-red-500 text-sm animate-in slide-in-from-top-1 duration-200'>
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
                          <p className='text-red-500 text-sm animate-in slide-in-from-top-1 duration-200'>
                            {form.getFieldState('acceptedTerms').error}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                </div>

                {/* Navigation buttons */}
                <div className='flex items-center justify-between mt-8 pt-6 border-t'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={prevStep}
                    disabled={currentStep === 1 || isTransitioning}
                    className={`transition-all duration-200 ${
                      currentStep === 1 ? 'invisible' : 'visible hover:scale-105'
                    }`}
                  >
                    <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                    </svg>
                    Anterior
                  </Button>

                  {currentStep < totalSteps ? (
                    <Button
                      type='button'
                      onClick={handleNext}
                      disabled={isTransitioning}
                      className='transition-all duration-200 hover:scale-105 active:scale-95'
                    >
                      Siguiente
                      <svg className='w-4 h-4 ml-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                      </svg>
                    </Button>
                  ) : (
                    <Button
                      type='button'
                      onClick={form.handleSubmit}
                      disabled={form.isSubmitting || !validateCurrentStep()}
                      className='transition-all duration-200 hover:scale-105 active:scale-95'
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
                  )}
                </div>

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
