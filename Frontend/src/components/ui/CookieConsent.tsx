import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from './shadcn/card';
import { Button } from './shadcn/button';

const LOCAL_STORAGE_KEY = 'cookie_consent';

type ConsentValue = 'accepted' | 'rejected';

export const CookieConsent: React.FC = () => {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!saved) {
        setVisible(true);
      }
    } catch (_) {
      setVisible(true);
    }
  }, []);

  const setConsent = (value: ConsentValue) => {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({ value, at: new Date().toISOString() })
      );
    } catch (_) {
      // noop
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 md:inset-x-auto md:right-6 md:left-auto md:max-w-xl">
      <Card className="backdrop-blur supports-[backdrop-filter]:bg-background/80" style={{ WebkitBackdropFilter: 'blur(12px)' }}>
        <CardHeader className="pb-3">
          <CardTitle>Aviso de cookies</CardTitle>
          <CardDescription>
            Esta aplicación tiene como propósito conectar artesanos del Chocó con el mundo, 
            facilitando la venta de productos hechos a mano de manera segura y transparente.
            Usamos cookies esenciales para el funcionamiento del sitio y, opcionalmente, para mejorar
            tu experiencia. Puedes consultar la política de privacidad en la sección correspondiente.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 text-sm opacity-90">
          <p className="mb-2">
            Proyecto educativo del SENA — Grupo 4: <strong>Análisis y Desarrollo de Software (2879645)</strong>.
          </p>
          <p className="text-xs">
            Al hacer clic en "Aceptar", consientes el uso de cookies esenciales y de preferencia.
          </p>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button variant="secondary" onClick={() => setConsent('rejected')}>
            Rechazar
          </Button>
          <Button onClick={() => setConsent('accepted')}>
            Aceptar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CookieConsent;


