import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/shadcn/button';
import { supabase } from '@/lib/supabaseClient';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

// ✅ MEJORADO: Sistema de verificación más robusto y directo
const VerifyEmailNewPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const email = (location.state as any)?.email as string | undefined;
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'checking' | 'verified' | 'pending' | 'error'>('checking');
  const [resendCooldown, setResendCooldown] = useState(0);
  
  // ✅ EFECTO PRINCIPAL: Verificación inmediata al cargar
  useEffect(() => {
    const checkEmailVerification = async () => {
      try {
        setIsVerifying(true);
        
        // Verificar si venimos de un enlace de confirmación
        const urlParams = new URLSearchParams(window.location.search);
        const hash = window.location.hash;
        
        if (hash.includes('type=signup') || urlParams.get('type') === 'signup') {
          // Procesar confirmación desde enlace de email
          try {
            const { data: { user }, error } = await supabase.auth.getUser();
            
            if (error || !user) {
              console.warn('[VerifyEmail] No user found after clicking email link');
              setVerificationStatus('error');
              return;
            }
            
            // Verificar si el email está confirmado
            const isConfirmed = Boolean(
              user.email_confirmed_at ||
              user.confirmed_at ||
              (user as any).email_confirmed
            );
            
            if (isConfirmed) {
              setVerificationStatus('verified');
              toast.success('¡Correo verificado exitosamente! 🎉', { 
                durationMs: 3000 
              });
              
              // Limpiar URL y redirigir
              window.history.replaceState({}, document.title, '/login?verified=true');
              
              setTimeout(() => {
                navigate('/login', { 
                  replace: true,
                  state: { 
                    message: 'Tu cuenta ha sido verificada. Puedes iniciar sesión ahora.',
                    verified: true 
                  }
                });
              }, 2000);
              return;
            }
          } catch (error) {
            console.error('[VerifyEmail] Error processing email verification:', error);
          }
        }
        
        // Verificación de estado normal
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          setVerificationStatus('pending');
          return;
        }
        
        const isConfirmed = Boolean(
          user.email_confirmed_at ||
          user.confirmed_at ||
          (user as any).email_confirmed
        );
        
        setVerificationStatus(isConfirmed ? 'verified' : 'pending');
        
        if (isConfirmed) {
          toast.success('¡Tu correo ya está verificado! 🎉', { 
            durationMs: 3000 
          });
          
          setTimeout(() => {
            navigate('/login', { 
              replace: true,
              state: { 
                message: 'Tu cuenta está verificada. Puedes iniciar sesión.',
                verified: true 
              }
            });
          }, 2000);
        }
        
      } catch (error) {
        console.error('[VerifyEmail] Unexpected error:', error);
        setVerificationStatus('error');
        toast.error('Error verificando el estado del correo');
      } finally {
        setIsVerifying(false);
      }
    };
    
    checkEmailVerification();
  }, []);
  
  // ✅ LISTENER para cambios de autenticación
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const isVerified = Boolean(
          session.user.email_confirmed_at ||
          session.user.confirmed_at ||
          (session.user as any).email_confirmed
        );
        
        if (isVerified && verificationStatus !== 'verified') {
          setVerificationStatus('verified');
          toast.success('¡Correo verificado exitosamente! 🎉', { 
            durationMs: 3000 
          });
          
          setTimeout(() => {
            navigate('/login', { 
              replace: true,
              state: { 
                message: 'Tu cuenta ha sido verificada. Puedes iniciar sesión ahora.',
                verified: true 
              }
            });
          }, 2000);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [verificationStatus]);
  
  // ✅ FUNCIÓN: Reenviar enlace de confirmación
  const resendLink = async () => {
    if (!email) {
      toast.error('Email requerido para reenviar el enlace');
      return;
    }
    
    if (resendCooldown > 0) {
      toast.error(`Espera ${resendCooldown} segundos antes de reenviar`);
      return;
    }
    
    try {
      const { error } = await supabase.auth.resend({ 
        type: 'signup', 
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/verifica-tu-correo`
        }
      });
      
      if (error) {
        toast.error(`Error al reenviar: ${error.message}`);
        return;
      }
      
      toast.success('✅ Enlace de confirmación reenviado. Revisa tu correo.');
      
      // Cooldown de 60 segundos
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('[VerifyEmail] Error resending email:', error);
      toast.error('Error al reenviar el enlace');
    }
  };
  
  // ✅ FUNCIÓN: Verificación manual
  const checkVerificationManually = async () => {
    setIsVerifying(true);
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        toast.error('No se pudo verificar el estado del usuario');
        return;
      }
      
      const isConfirmed = Boolean(
        user.email_confirmed_at ||
        user.confirmed_at ||
        (user as any).email_confirmed
      );
      
      setVerificationStatus(isConfirmed ? 'verified' : 'pending');
      
      if (isConfirmed) {
        toast.success('¡Correo verificado! 🎉');
        setTimeout(() => {
          navigate('/login', { 
            replace: true,
            state: { 
              message: 'Tu cuenta ha sido verificada. Puedes iniciar sesión ahora.',
              verified: true 
            }
          });
        }, 2000);
      } else {
        toast.info('Aún no se ha verificado el correo');
      }
      
    } catch (error) {
      console.error('[VerifyEmail] Manual check failed:', error);
      toast.error('Error al verificar el estado');
    } finally {
      setIsVerifying(false);
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
                    {verificationStatus === 'verified' ? (
                      <svg width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='text-white'>
                        <path d='M20 6L9 17l-5-5' />
                      </svg>
                    ) : verificationStatus === 'checking' || isVerifying ? (
                      <div className='w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin'></div>
                    ) : (
                      <svg width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='text-white'>
                        <path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' />
                        <polyline points='22,6 12,13 2,6' />
                      </svg>
                    )}
                  </div>
                  <h1 className='text-3xl font-bold mb-3 font-display text-gray-800'>
                    {verificationStatus === 'verified' ? '¡Verificado!' : 'Verificar tu email'}
                  </h1>
                  <p className='text-gray-600 text-lg'>
                    {verificationStatus === 'verified' 
                      ? 'Tu cuenta ha sido verificada exitosamente.'
                      : 'Te enviamos un enlace para confirmar tu cuenta.'
                    }
                  </p>
                </div>
                
                {/* ✅ ESTADOS VISUALES MEJORADOS */}
                {verificationStatus === 'checking' && (
                  <div className='mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200'>
                    <div className='flex items-center gap-3 text-blue-700'>
                      <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600'></div>
                      <span className='font-medium'>Verificando estado...</span>
                    </div>
                    <p className='text-sm text-blue-600 mt-2'>
                      Procesando la verificación de tu correo electrónico.
                    </p>
                  </div>
                )}
                
                {verificationStatus === 'verified' && (
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
                
                {verificationStatus === 'pending' && (
                  <div className='mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200'>
                    <div className='flex items-center gap-3 text-amber-700'>
                      <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='text-amber-600'>
                        <circle cx='12' cy='12' r='10' />
                        <path d='M12 6v6l4 2' />
                      </svg>
                      <span className='font-medium'>Pendiente de verificación</span>
                    </div>
                    <p className='text-sm text-amber-600 mt-2'>
                      Revisa tu correo y haz clic en el enlace de confirmación.
                    </p>
                  </div>
                )}
                
                {verificationStatus === 'error' && (
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
                      Hubo un problema verificando tu correo. Intenta recargar la página.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className='card card-hover shadow-lg border-0 bg-white/80 backdrop-blur-sm'>
            <div className='card-body'>
              <h2 className='text-2xl font-bold mb-4 text-gray-800'>
                {verificationStatus === 'verified' ? '¡Listo!' : 'Revisa tu correo'}
              </h2>
              
              {verificationStatus === 'verified' ? (
                <div className='text-center'>
                  <p className='text-gray-600 mb-6 text-lg'>
                    Tu cuenta ha sido verificada exitosamente. 
                    <span className='font-medium text-green-600'>Serás redirigido al login.</span>
                  </p>
                  <div className='flex items-center justify-center gap-2 text-green-600'>
                    <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-green-600'></div>
                    <span>Redirigiendo...</span>
                  </div>
                </div>
              ) : (
                <>
                  <p className='text-gray-600 mb-6 text-lg'>
                    Te enviamos un enlace para confirmar tu cuenta{email && ` a ${email}`}. 
                    <span className='font-medium text-orange-600'>Revisa tu bandeja de entrada y spam.</span>
                  </p>
                  
                  <div className='space-y-4'>
                    <div className='space-y-3'>
                      <Button 
                        type='button' 
                        onClick={resendLink} 
                        variant='secondary'
                        className='w-full py-3 text-base font-medium'
                        disabled={!email || resendCooldown > 0 || verificationStatus === 'checking'}
                      >
                        {resendCooldown > 0 
                          ? `⏱️ Espera ${resendCooldown}s` 
                          : '📧 Reenviar enlace de confirmación'
                        }
                      </Button>
                      
                      <Button 
                        type='button' 
                        onClick={checkVerificationManually} 
                        variant='outline'
                        className='w-full py-2 text-sm'
                        disabled={isVerifying || verificationStatus === 'checking'}
                      >
                        {isVerifying ? (
                          <div className='flex items-center gap-2'>
                            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-current'></div>
                            Verificando...
                          </div>
                        ) : (
                          '🔍 Verificar estado manualmente'
                        )}
                      </Button>
                    </div>
                    
                    {verificationStatus === 'error' && (
                      <div className='p-4 bg-red-50 rounded-lg border border-red-200'>
                        <div className='text-sm text-red-600'>
                          Hubo un problema verificando tu correo. Intenta recargar la página o contacta soporte.
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailNewPage;