import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/shadcn/button';
import { supabase } from '@/lib/supabaseClient';
import { useEmailVerificationWatcher } from '@/hooks/useEmailVerificationWatcher';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

const VerifyEmailPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const email = (location.state as any)?.email as string | undefined;
  
  // ✅ MEJORADO: Callback más robusto con mejor UX
  const handleVerificationSuccess = () => {
    toast.success('¡Cuenta verificada exitosamente! 🎉', { 
      action: 'login',
      durationMs: 3000 
    });
    
    // ✅ NUEVO: Redirección automática con delay para mejor UX
    setTimeout(() => {
      navigate('/login', { 
        replace: true,
        state: { 
          message: 'Tu cuenta ha sido verificada. Puedes iniciar sesión ahora.',
          verified: true 
        }
      });
    }, 2000);
  };

  const { status, checkVerification, resetVerification } = useEmailVerificationWatcher(3000, handleVerificationSuccess);

  // ✅ NUEVO: Detección adicional de cambios de sesión
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Verificar si el email está confirmado
        const isVerified = Boolean(
          session.user.email_confirmed_at ||
          session.user.confirmed_at ||
          session.user.email_confirmed
        );
        
        if (isVerified) {
          handleVerificationSuccess();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const resendLink = async () => {
    if (!email) {
      toast.error('Email requerido', { action: 'update' });
      return;
    }
    
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) {
        toast.error('No pudimos reenviar el enlace', { action: 'update' });
        return;
      }
      toast.success('✅ Enlace de confirmación reenviado. Revisa tu correo.', { action: 'update' });
    } catch (error) {
      toast.error('Error al reenviar el enlace', { action: 'update' });
    }
  };

  // ✅ MEJORADO: UI más informativa y atractiva
  return (
    <div className='min-h-[calc(100vh-120px)] grid place-items-center bg-gradient-to-br from-orange-50 to-amber-50'>
      <div className='container-sm'>
        <div className='grid md:grid-cols-2 gap-8 items-center'>
          <div className='hidden md:block'>
            <div className='card card-hover shadow-lg border-0 bg-white/80 backdrop-blur-sm'>
              <div className='card-body text-center'>
                <div className='mb-6'>
                  <div className='w-20 h-20 mx-auto bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center mb-4'>
                    <svg width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='text-white'>
                      <path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' />
                      <polyline points='22,6 12,13 2,6' />
                    </svg>
                  </div>
                  <h1 className='text-3xl font-bold mb-3 font-display text-gray-800'>
                    Verificar tu email
                  </h1>
                  <p className='text-gray-600 text-lg'>
                    Te enviamos un enlace para confirmar tu cuenta.
                  </p>
                </div>
                
                {/* ✅ MEJORADO: Estados más informativos */}
                {status === 'pending' && (
                  <div className='mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200'>
                    <div className='flex items-center gap-3 text-blue-700'>
                      <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600'></div>
                      <span className='font-medium'>Verificando estado...</span>
                    </div>
                    <p className='text-sm text-blue-600 mt-2'>
                      Esta página detectará automáticamente cuando confirmes tu correo.
                    </p>
                  </div>
                )}
                
                {status === 'verified' && (
                  <div className='mt-4 p-4 bg-green-50 rounded-lg border border-green-200'>
                    <div className='flex items-center gap-3 text-green-700'>
                      <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='text-green-600'>
                        <path d='M20 6L9 17l-5-5' />
                      </svg>
                      <span className='font-medium'>¡Cuenta verificada!</span>
                    </div>
                    <p className='text-sm text-green-600 mt-2'>
                      Redirigiendo al login en unos segundos...
                    </p>
                  </div>
                )}
                
                {status === 'error' && (
                  <div className='mt-4 p-4 bg-red-50 rounded-lg border border-red-200'>
                    <div className='flex items-center gap-3 text-red-700'>
                      <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='text-red-600'>
                        <circle cx='12' cy='12' r='10' />
                        <line x1='15' y1='9' x2='9' y2='15' />
                        <line x1='9' y1='9' x2='15' y2='15' />
                      </svg>
                      <span className='font-medium'>Error de verificación</span>
                    </div>
                    <p className='text-sm text-red-600 mt-2'>
                      No pudimos comprobar el estado. Intenta recargar la página.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className='card card-hover shadow-lg border-0 bg-white/80 backdrop-blur-sm'>
            <div className='card-body'>
              <h2 className='text-2xl font-bold mb-4 text-gray-800'>
                Revisa tu correo
              </h2>
              <p className='text-gray-600 mb-6 text-lg'>
                Te enviamos un enlace para confirmar tu cuenta. 
                <span className='font-medium text-orange-600'> Esta página se actualizará automáticamente.</span>
              </p>
              
              <div className='space-y-4'>
                <div className='space-y-3'>
                  <Button 
                    type='button' 
                    onClick={resendLink} 
                    variant='secondary'
                    className='w-full py-3 text-base font-medium'
                    disabled={status === 'verified'}
                  >
                    {status === 'verified' ? '✅ Correo verificado' : '📧 Reenviar enlace de confirmación'}
                  </Button>
                  
                  {status !== 'verified' && (
                    <Button 
                      type='button' 
                      onClick={checkVerification} 
                      variant='outline'
                      className='w-full py-2 text-sm'
                    >
                      🔍 Verificar estado manualmente
                    </Button>
                  )}
                </div>
                
                {status === 'verified' && (
                  <div className='p-4 bg-green-50 rounded-lg border border-green-200'>
                    <div className='flex items-center gap-3 text-green-700'>
                      <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='text-green-600'>
                        <path d='M20 6L9 17l-5-5' />
                      </svg>
                      <span className='font-medium'>¡Correo verificado exitosamente!</span>
                    </div>
                    <p className='text-sm text-green-600 mt-2'>
                      Redirigiendo al login en unos segundos...
                    </p>
                  </div>
                )}
                
                {status === 'error' && (
                  <div className='p-4 bg-red-50 rounded-lg border border-red-200'>
                    <div className='text-sm text-red-600'>
                      No pudimos comprobar el estado de verificación. Intenta recargar la página.
                    </div>
                  </div>
                )}
                
                <div className='text-center pt-4 border-t border-gray-200'>
                  <Link
                    to='/login'
                    className='text-orange-600 hover:text-orange-700 font-medium hover:underline transition-colors'
                  >
                    ← Volver a iniciar sesión
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
