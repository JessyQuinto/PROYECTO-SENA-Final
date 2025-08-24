import React from 'react';
import { Button } from './shadcn/button';

const LOCAL_STORAGE_KEY = 'cookie_consent';

type ConsentValue = 'accepted' | 'rejected';

export const CookieConsent: React.FC = () => {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    // Verificar si ya se dio consentimiento
    const checkConsent = () => {
      try {
        console.log('[CookieConsent] Checking consent...');
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        console.log('[CookieConsent] Saved consent:', saved);
        
        if (!saved) {
          console.log('[CookieConsent] No saved consent, showing component');
          setVisible(true);
        } else {
          const consent = JSON.parse(saved);
          console.log('[CookieConsent] Parsed consent:', consent);
          
          if (consent && consent.value) {
            console.log('[CookieConsent] Consent found, hiding component');
            setVisible(false);
          } else {
            console.log('[CookieConsent] Invalid consent, showing component');
            setVisible(true);
          }
        }
      } catch (error) {
        console.error('[CookieConsent] Error checking consent:', error);
        setVisible(true);
      }
    };

    checkConsent();
  }, []);

  const setConsent = (value: ConsentValue) => {
    try {
      console.log('[CookieConsent] Setting consent:', value);
      
      const consentData = {
        value,
        at: new Date().toISOString(),
        timestamp: Date.now()
      };
      
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(consentData));
      console.log('[CookieConsent] Consent saved successfully');
      
      setVisible(false);
    } catch (error) {
      console.error('[CookieConsent] Error saving consent:', error);
      // Aún así ocultar el componente
      setVisible(false);
    }
  };

  const handleAccept = () => {
    console.log('[CookieConsent] Accept button clicked');
    setConsent('accepted');
  };

  const handleReject = () => {
    console.log('[CookieConsent] Reject button clicked');
    setConsent('rejected');
  };

  if (!visible) {
    console.log('[CookieConsent] Component not visible');
    return null;
  }

  console.log('[CookieConsent] Rendering component');

  return (
    <div className='fixed inset-x-4 bottom-4 z-50 md:inset-x-auto md:right-6 md:left-auto md:max-w-md'>
      <div className='relative overflow-hidden rounded-lg border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-lg'>
        {/* Decorative background */}
        <div
          aria-hidden
          className='absolute inset-0 opacity-5'
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
              >
                <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/>
              </svg>
            </div>
            
            {/* Content */}
            <div className='flex-1 min-w-0'>
              <h3 className='text-sm font-semibold text-foreground mb-1'>
                Aviso de cookies
              </h3>
              <p className='text-xs text-muted-foreground mb-3 leading-relaxed'>
                Usamos cookies esenciales para el funcionamiento del sitio y mejorar tu experiencia. 
                Proyecto educativo del SENA — Grupo 4: Análisis y Desarrollo de Software.
              </p>
              
              {/* Buttons */}
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleReject}
                  className='text-xs h-8 px-3'
                >
                  Rechazar
                </Button>
                <Button
                  size='sm'
                  onClick={handleAccept}
                  className='text-xs h-8 px-3'
                >
                  Aceptar
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
