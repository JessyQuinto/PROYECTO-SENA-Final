import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from '@/hooks/useForm';
import { useToast } from '@/hooks/useToast';
import { useSupabase } from '@/hooks/useSupabase';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { Button } from '@/components/ui/shadcn/button';
import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient';

const TOTAL = 120;

const verifyCodeSchema = z.object({
  email: z.string().email('Email inválido'),
  code: z
    .string()
    .min(6, 'El código debe tener 6 dígitos')
    .max(6, 'El código debe tener 6 dígitos'),
});

type VerifyCodeForm = z.infer<typeof verifyCodeSchema>;

const VerifyEmailPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { executeMutation } = useSupabase({
    showToast: true,
    toastAction: 'update',
  });

  // Get state from registration
  const showCountdown = location.state?.showCountdown || false;
  const initialCountdown = location.state?.countdownDuration || 90;
  
  const [seconds, setSeconds] = useState(showCountdown ? initialCountdown : TOTAL);
  const [verifying, setVerifying] = useState(false);
  const [showForm, setShowForm] = useState(!showCountdown);
  const [countdownFinished, setCountdownFinished] = useState(false);

  const form = useForm<VerifyCodeForm>({
    initialValues: {
      email: location.state?.email || '',
      code: '',
    },
    validationSchema: verifyCodeSchema,
    onSubmit: async values => {
      setVerifying(true);
      try {
        const { error } = await supabase.auth.verifyOtp({
          email: values.email,
          token: values.code,
          type: 'signup',
        });

        if (error) {
          toast.error('Código inválido', {
            action: 'update',
          });
        } else {
          toast.success('Email verificado', {
            action: 'update',
          });
          navigate('/login');
        }
      } catch (err: any) {
        toast.error('Error al verificar', {
          action: 'update',
        });
      } finally {
        setVerifying(false);
      }
    },
  });

  // Countdown timer
  useEffect(() => {
    if (seconds > 0) {
      const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showCountdown && !countdownFinished) {
      // Countdown finished, show the form
      setCountdownFinished(true);
      setShowForm(true);
    }
  }, [seconds, showCountdown, countdownFinished]);

  const timeDisplay = useMemo(() => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [seconds]);

  const resendCode = async () => {
    if (!form.values.email) {
      toast.error('Email requerido', {
        action: 'update',
      });
      return;
    }

    const result = await executeMutation(
      () =>
        supabase.auth.resend({
          type: 'signup',
          email: form.values.email,
        }),
      'Código reenviado'
    );

    if (result !== null) {
      setSeconds(TOTAL);
      toast.success('Código reenviado', {
        action: 'update',
      });
    }
  };

  return (
    <div className='min-h-[calc(100vh-120px)] grid place-items-center'>
      <div className='container-sm'>
        <div className='grid md:grid-cols-2 gap-8 items-center'>
          <div className='hidden md:block'>
            <div className='card card-hover'>
              <div className='card-body'>
                <h1 className='text-2xl font-semibold mb-2 font-display'>
                  Verificar tu email
                </h1>
                <p className='opacity-80'>
                  Ingresa el código de verificación que te enviamos.
                </p>
              </div>
            </div>
          </div>
          <div className='card card-hover'>
            <div className='card-body'>
              {showCountdown && !countdownFinished ? (
                // Countdown display
                <div className='text-center space-y-6'>
                  <div className='w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center'>
                    <svg className='w-8 h-8 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                    </svg>
                  </div>
                  <div>
                    <h2 className='text-2xl font-bold mb-2'>¡Cuenta creada exitosamente!</h2>
                    <p className='text-gray-600 mb-4'>
                      Hemos enviado un código de verificación a:
                    </p>
                    <p className='font-semibold text-primary mb-6'>{form.values.email}</p>
                  </div>
                  
                  <div className='bg-amber-50 border border-amber-200 rounded-lg p-4'>
                    <div className='flex items-center gap-3 mb-3'>
                      <svg className='w-5 h-5 text-amber-600 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                      </svg>
                      <p className='text-amber-800 font-medium'>
                        Revisa tu correo en los próximos {timeDisplay}
                      </p>
                    </div>
                    <div className='text-sm text-amber-700 space-y-1'>
                      <p>• Verifica tu <strong>bandeja principal</strong></p>
                      <p>• También revisa la carpeta de <strong>spam</strong></p>
                      <p>• El código expira en unos minutos</p>
                    </div>
                  </div>
                  
                  <div className='pt-4'>
                    <Button 
                      onClick={() => setShowForm(true)}
                      variant='outline'
                      className='w-full'
                    >
                      Ya tengo el código, continuar
                    </Button>
                  </div>
                </div>
              ) : (
                // Regular form display
                <div>
                  <h2 className='text-xl font-semibold mb-4'>
                    {showCountdown ? 'Ingresar código de verificación' : 'Código de verificación'}
                  </h2>
              <form className='space-y-4' onSubmit={form.handleSubmit}>
                <div className='space-y-2'>
                  <Label htmlFor='email'>Email</Label>
                  <Input
                    id='email'
                    type='email'
                    value={form.values.email}
                    onChange={e => form.setValue('email', e.target.value)}
                    onBlur={() => form.validateField('email')}
                    placeholder='tu@email.com'
                    className={form.errors.email ? 'border-red-500' : ''}
                  />
                  {form.errors.email && (
                    <p className='text-sm text-red-600'>{form.errors.email}</p>
                  )}
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='code'>Código de verificación</Label>
                  <Input
                    id='code'
                    value={form.values.code}
                    onChange={e => form.setValue('code', e.target.value)}
                    onBlur={() => form.validateField('code')}
                    placeholder='123456'
                    maxLength={6}
                    className={form.errors.code ? 'border-red-500' : ''}
                  />
                  {form.errors.code && (
                    <p className='text-sm text-red-600'>{form.errors.code}</p>
                  )}
                </div>
                <Button type='submit' className='w-full' disabled={verifying}>
                  {verifying ? 'Verificando…' : 'Verificar código'}
                </Button>
                <div className='text-center space-y-2'>
                  <div className='text-sm'>
                    ¿No recibiste el código?{' '}
                    <button
                      type='button'
                      onClick={resendCode}
                      disabled={seconds > 0}
                      className='text-(--color-terracotta-suave) hover:underline disabled:opacity-50'
                    >
                      {seconds > 0
                        ? `Reenviar en ${timeDisplay}`
                        : 'Reenviar código'}
                    </button>
                  </div>
                  <div className='text-sm'>
                    <Link
                      to='/login'
                      className='text-(--color-terracotta-suave) hover:underline'
                    >
                      Volver a iniciar sesión
                    </Link>
                  </div>
                </div>
              </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
