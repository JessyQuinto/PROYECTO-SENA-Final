import React, { useCallback, useEffect, useState } from 'react';
import { Button } from './shadcn/button';
import logger from '@/lib/logger';

const LOCAL_STORAGE_KEY = 'cookie_consent';

type ConsentValue = 'accepted' | 'rejected';

export const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Verificar si ya se dio consentimiento
    const checkConsent = () => {
      try {
        if (typeof Storage === 'undefined') {
          setVisible(false);
          return;
        }

        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        
        if (!saved || saved === 'null' || saved === 'undefined') {
          setVisible(true);
          return;
        }

        try {
          const consent = JSON.parse(saved);
          
          if (
            consent &&
            consent.value &&
            (consent.value === 'accepted' || consent.value === 'rejected')
          ) {
            setVisible(false);
          } else {
            setVisible(true);
          }
        } catch (parseError) {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          setVisible(true);
        }
      } catch (error) {
        logger.error('[CookieConsent] Error checking consent:', error);
        setVisible(true);
      }
    };

    checkConsent();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY || e.key === null) {
        checkConsent();
      }
    };

    // Listen for custom logout event
    const handleLogout = () => {
      checkConsent();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userLoggedOut', handleLogout);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLoggedOut', handleLogout);
    };
  }, []);

  const setConsent = useCallback(async (value: ConsentValue) => {
    try {
      setLoading(true);
      
      // Test localStorage functionality first
      try {
        localStorage.setItem('cookie_consent_test', 'test');
        localStorage.removeItem('cookie_consent_test');
      } catch (error) {
        logger.error('[CookieConsent] localStorage test failed:', error);
        throw new Error('localStorage no disponible');
      }
      
      const consentData = {
        value,
        at: new Date().toISOString(),
        timestamp: Date.now(),
        userAgent: navigator.userAgent.substring(0, 100),
      };

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(consentData));
      
      // Verify the data was saved correctly
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!saved) {
        throw new Error('No se pudo verificar que el consentimiento se guardó correctamente');
      }
      
      setVisible(false);
      
      logger.debug('[CookieConsent] Consent saved successfully:', value);
    } catch (error) {
      logger.error('[CookieConsent] Error saving consent:', error);
      setVisible(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAccept = useCallback(() => {
    if (loading) return;
    setConsent('accepted');
  }, [loading, setConsent]);

  const handleReject = useCallback(() => {
    if (loading) return;
    setConsent('rejected');
  }, [loading, setConsent]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className='fixed inset-x-4 bottom-4 z-[99999] md:inset-x-auto md:right-6 md:left-auto md:max-w-md'
      role='dialog'
      aria-labelledby='cookie-consent-title'
      aria-describedby='cookie-consent-description'
    >
      <div className='relative overflow-hidden rounded-lg border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-lg'>
        {/* Decorative background */}
        <div
          aria-hidden
          className='absolute inset-0 opacity-5 pointer-events-none'
          style={{
            backgroundImage:
              "url('/assert/motif-de-fond-sans-couture-tribal-dessin-geometrico-noir-et-blanc-vecteur/v1045-03.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        <div className='relative p-4'>
          <div className='flex items-start gap-3'>
            {/* Cookie icon */}
            <div className='flex-shrink-0 mt-1'>
              <svg
                className='w-5 h-5 text-primary'
                fill='currentColor'
                viewBox='0 0 24 24'
                aria-hidden='true'
              >
                <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' />
              </svg>
            </div>

            {/* Content */}
            <div className='flex-1 min-w-0'>
              <h3
                id='cookie-consent-title'
                className='text-sm font-semibold text-foreground mb-1'
              >
                Aviso de cookies
              </h3>
              <p
                id='cookie-consent-description'
                className='text-xs text-muted-foreground mb-3 leading-relaxed'
              >
                Usamos cookies esenciales para el funcionamiento del sitio y
                mejorar tu experiencia. Proyecto educativo del SENA — Grupo 4:
                Análisis y Desarrollo de Software.
              </p>

              {/* Buttons */}
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleReject}
                  disabled={loading}
                  className='text-xs h-8 px-3'
                  type='button'
                  data-testid='cookie-reject'
                  aria-label='Rechazar cookies no esenciales'
                >
                  {loading ? 'Procesando...' : 'Rechazar'}
                </Button>
                <Button
                  size='sm'
                  onClick={handleAccept}
                  disabled={loading}
                  className='text-xs h-8 px-3'
                  type='button'
                  data-testid='cookie-accept'
                  aria-label='Aceptar todas las cookies'
                >
                  {loading ? 'Procesando...' : 'Aceptar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
