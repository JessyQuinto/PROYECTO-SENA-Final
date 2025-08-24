import React from 'react';
import { Button } from '@/components/ui/shadcn/button';

export const RateLimitReset: React.FC = () => {
  const resetRateLimit = () => {
    try {
      // Limpiar rate limiting del localStorage
      const keys = Object.keys(localStorage);
      const rateLimitKeys = keys.filter(key => key.startsWith('rate_limit_'));
      
      rateLimitKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Removed rate limit key: ${key}`);
      });

      // Limpiar también del sessionStorage por si acaso
      const sessionKeys = Object.keys(sessionStorage);
      const sessionRateLimitKeys = sessionKeys.filter(key => key.startsWith('rate_limit_'));
      
      sessionRateLimitKeys.forEach(key => {
        sessionStorage.removeItem(key);
        console.log(`🗑️ Removed session rate limit key: ${key}`);
      });

      alert('✅ Rate limiting reseteado. Puedes intentar iniciar sesión nuevamente.');
      
      // Recargar la página para aplicar los cambios
      window.location.reload();
    } catch (error) {
      console.error('Error reseteando rate limit:', error);
      alert('❌ Error reseteando rate limit. Revisa la consola.');
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '600px', 
      margin: '0 auto', 
      fontFamily: 'monospace',
      backgroundColor: '#fff3cd',
      border: '1px solid #ffeaa7',
      borderRadius: '8px'
    }}>
      <h2>🔓 Resetear Rate Limiting</h2>
      <p>Has excedido el límite de intentos de inicio de sesión (5 intentos en 15 minutos).</p>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>📋 Información:</h3>
        <ul>
          <li><strong>Límite actual:</strong> 5 intentos</li>
          <li><strong>Duración del bloqueo:</strong> 15 minutos</li>
          <li><strong>Estado:</strong> Bloqueado</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <Button
          onClick={resetRateLimit}
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🔓 Resetear Rate Limiting
        </Button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>🔧 Alternativa Manual:</h3>
        <p>Si el botón no funciona, ejecuta este script en la consola del navegador:</p>
        <pre style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '10px', 
          borderRadius: '4px', 
          overflow: 'auto',
          fontSize: '12px'
        }}>
{`// Resetear rate limiting manualmente
const keys = Object.keys(localStorage);
const rateLimitKeys = keys.filter(key => key.startsWith('rate_limit_'));
rateLimitKeys.forEach(key => {
  localStorage.removeItem(key);
  console.log('Removed:', key);
});
alert('Rate limiting reseteado');
location.reload();`}
        </pre>
      </div>

             <div style={{ marginBottom: '20px' }}>
         <h3>📝 Credenciales del Administrador:</h3>
         <ul>
           <li><strong>Email:</strong> admin@demo.com</li>
           <li><strong>Contraseña:</strong> admin123</li>
         </ul>
         <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
           <strong>Alternativa:</strong> admin@tesoros-choco.com / admin123
         </p>
       </div>
    </div>
  );
};
