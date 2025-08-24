import React, { useCallback } from 'react';
import { Button } from './shadcn/button';

const LOCAL_STORAGE_KEY = 'cookie_consent';

type ConsentValue = 'accepted' | 'rejected';

export const CookieConsent: React.FC = () => {
  const [visible, setVisible] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    // Verificar si ya se dio consentimiento
    const checkConsent = () => {
      try {
        console.log('[CookieConsent] Checking consent...');
        
        // Test localStorage availability first
        if (typeof Storage === 'undefined') {
          console.warn('[CookieConsent] localStorage not available');
          setVisible(false);
          return;
        }
        
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        console.log('[CookieConsent] Saved consent raw:', saved);
        
        if (!saved || saved === 'null' || saved === 'undefined') {
          console.log('[CookieConsent] No valid saved consent, showing component');
          setVisible(true);
          return;
        }
        
        try {
          const consent = JSON.parse(saved);
          console.log('[CookieConsent] Parsed consent:', consent);
          
          if (consent && consent.value && (consent.value === 'accepted' || consent.value === 'rejected')) {
            console.log('[CookieConsent] Valid consent found, hiding component');
            setVisible(false);
          } else {
            console.log('[CookieConsent] Invalid consent format, showing component');
            setVisible(true);
          }
        } catch (parseError) {
          console.error('[CookieConsent] Error parsing consent JSON:', parseError);
          console.log('[CookieConsent] Removing invalid consent data');
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          setVisible(true);
        }
      } catch (error) {
        console.error('[CookieConsent] Error checking consent:', error);
        setVisible(true);
      }
    };

    checkConsent();
    
    // Listen for storage changes (e.g., from other tabs or logout)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY || e.key === null) {
        console.log('[CookieConsent] Storage change detected, rechecking consent');
        checkConsent();
      }
    };
    
    // Listen for custom logout event
    const handleLogout = () => {
      console.log('[CookieConsent] Logout detected, resetting consent');
      checkConsent();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userLoggedOut', handleLogout);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLoggedOut', handleLogout);
    };
  }, []);

  const setConsent = useCallback((value: ConsentValue) => {
    try {
      console.log('[CookieConsent] Setting consent:', value);
      setLoading(true);
      
      const consentData = {
        value,
        at: new Date().toISOString(),
        timestamp: Date.now(),
        userAgent: navigator.userAgent.substring(0, 100) // Truncated for privacy
      };
      
      console.log('[CookieConsent] Consent data to save:', consentData);
      
      // Test localStorage write
      const testKey = `${LOCAL_STORAGE_KEY}_test`;
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(consentData));
      
      // Verify the save
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      console.log('[CookieConsent] Verification - saved data:', saved);
      
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.value === value) {
            console.log('[CookieConsent] Consent saved and verified successfully');
          } else {
            console.error('[CookieConsent] Consent verification failed - value mismatch');
          }
        } catch (e) {
          console.error('[CookieConsent] Consent verification failed - parse error:', e);
        }
      } else {
        console.error('[CookieConsent] Consent verification failed - no saved data');
      }
      
      setVisible(false);
      console.log('[CookieConsent] Component hidden after consent');
    } catch (error) {
      console.error('[CookieConsent] Error saving consent:', error);
      console.error('[CookieConsent] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Still hide the component to prevent it from blocking the UI
      setVisible(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAccept = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[CookieConsent] Accept button clicked - event details:', {
      type: e.type,
      button: e.button,
      target: e.target,
      currentTarget: e.currentTarget
    });
    
    if (loading) {
      console.log('[CookieConsent] Already processing, ignoring click');
      return;
    }
    
    setConsent('accepted');
  }, [loading, setConsent]);

  const handleReject = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[CookieConsent] Reject button clicked - event details:', {
      type: e.type,
      button: e.button,
      target: e.target,
      currentTarget: e.currentTarget
    });
    
    if (loading) {
      console.log('[CookieConsent] Already processing, ignoring click');
      return;
    }
    
    setConsent('rejected');
  }, [loading, setConsent]);

  if (!visible) {
    console.log('[CookieConsent] Component not visible, returning null');
    return null;
  }

  console.log('[CookieConsent] Rendering component, loading:', loading);

  return (
    <div 
      className='fixed inset-x-4 bottom-4 z-50 md:inset-x-auto md:right-6 md:left-auto md:max-w-md'
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className='relative overflow-hidden rounded-lg border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-lg'>
        {/* Decorative background */}
        <div
          aria-hidden
          className='absolute inset-0 opacity-5 pointer-events-none'
          style={{
            backgroundImage:
              "url('/assert/motif-de-fond-sans-couture-tribal-dessin-geometrique-noir-et-blanc-vecteur/v1045-03.jpg')",
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
                aria-hidden="true"
              >
                <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/>
              </svg>
            </div>
            
            {/* Content */}
            <div className='flex-1 min-w-0'>
              <h3 id="cookie-consent-title" className='text-sm font-semibold text-foreground mb-1'>
                Aviso de cookies
              </h3>
              <p id="cookie-consent-description" className='text-xs text-muted-foreground mb-3 leading-relaxed'>
                Usamos cookies esenciales para el funcionamiento del sitio y mejorar tu experiencia. 
                Proyecto educativo del SENA — Grupo 4: Análisis y Desarrollo de Software.
              </p>
              
              {/* Buttons */}
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleReject}
                  disabled={loading}
                  className='text-xs h-8 px-3 cursor-pointer'
                  type="button"
                  data-testid="cookie-reject"
                  aria-label="Rechazar cookies no esenciales"
                >
                  {loading ? 'Procesando...' : 'Rechazar'}
                </Button>
                <Button
                  size='sm'
                  onClick={handleAccept}
                  disabled={loading}
                  className='text-xs h-8 px-3 cursor-pointer'
                  type="button"
                  data-testid="cookie-accept"
                  aria-label="Aceptar todas las cookies"
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
