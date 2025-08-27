import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/shadcn/button';
import { supabase } from '@/lib/supabaseClient';
import { useEmailVerificationWatcher } from '@/hooks/useEmailVerificationWatcher';

const VerifyEmailPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const email = (location.state as any)?.email as string | undefined;
  const status = useEmailVerificationWatcher(5000, () => {
    // Callback cuando se verifique: avisar y navegar
    toast.success('¡Cuenta verificada! Puedes iniciar sesión.', { action: 'login' });
    try {
      // Si ya hay sesión válida, redirigir al home o dashboard según rol en tu flujo
      navigate('/login', { replace: true });
    } catch {}
  });
  const resendLink = async () => {
    if (!email) {
      toast.error('Email requerido', { action: 'update' });
      return;
    }
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) {
      toast.error('No pudimos reenviar el enlace', { action: 'update' });
      return;
    }
    toast.success('Enlace de confirmación reenviado', { action: 'update' });
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
                  Te enviamos un enlace para confirmar tu cuenta.
                </p>
                {status === 'pending' && (
                  <div className='mt-3 text-sm text-gray-600'>
                    Esta página detectará automáticamente cuando confirmes tu correo.
                  </div>
                )}
                {status === 'verified' && (
                  <div className='mt-3 text-sm text-green-700 flex items-center gap-2'>
                    <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='text-green-600'>
                      <path d='M20 6L9 17l-5-5' />
                    </svg>
                    <span>Tu cuenta ya está verificada.</span>
                  </div>
                )}
                {status === 'error' && (
                  <div className='mt-3 text-sm text-red-600'>
                    No pudimos comprobar el estado de verificación. Intenta recargar.
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className='card card-hover'>
            <div className='card-body'>
              <h2 className='text-xl font-semibold mb-2'>
                Revisa tu correo
              </h2>
              <p className='opacity-80 mb-4'>
                Te enviamos un enlace para confirmar tu cuenta. Esta página detectará cuando completes la confirmación.
              </p>
              <div className='flex flex-col gap-3'>
                <Button type='button' onClick={resendLink} variant='secondary'>
                  Reenviar enlace de confirmación
                </Button>
                {status === 'verified' && (
                  <div className='flex items-center justify-center gap-2 text-green-700 text-sm'>
                    <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='text-green-600'>
                      <path d='M20 6L9 17l-5-5' />
                    </svg>
                    <span>Correo verificado. Redirigiendo…</span>
                  </div>
                )}
                {status === 'error' && (
                  <div className='text-sm text-red-600'>No pudimos comprobar el estado de verificación. Intenta recargar.</div>
                )}
                <div className='text-sm text-center'>
                  <Link
                    to='/login'
                    className='text-(--color-terracotta-suave) hover:underline'
                  >
                    Volver a iniciar sesión
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
