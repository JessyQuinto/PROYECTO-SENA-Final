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

  const [seconds, setSeconds] = useState(TOTAL);
  const [verifying, setVerifying] = useState(false);

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
    }
  }, [seconds]);

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
              <h2 className='text-xl font-semibold mb-4'>
                Código de verificación
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
