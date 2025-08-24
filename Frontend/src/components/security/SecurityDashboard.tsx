import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import { SecurityBadge } from './SecureComponents';
import { cspManager } from '@/lib/csp';
import { security, SECURITY_CONSTANTS } from '@/lib/security';
import { serviceWorkerManager } from '@/lib/serviceWorker';

interface SecurityStats {
  cspSupported: boolean;
  cspViolations: number;
  activeRateLimits: number;
  blockedRequests: number;
  securityLevel: 'low' | 'medium' | 'high';
  lastSecurityScan: string;
}

interface RateLimitEntry {
  key: string;
  attempts: number;
  lastAttempt: string;
  isBlocked: boolean;
}

export const SecurityDashboard: React.FC = () => {
  const [stats, setStats] = useState<SecurityStats>({
    cspSupported: false,
    cspViolations: 0,
    activeRateLimits: 0,
    blockedRequests: 0,
    securityLevel: 'medium',
    lastSecurityScan: new Date().toISOString(),
  });

  const [rateLimits, setRateLimits] = useState<RateLimitEntry[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    loadSecurityStats();
  }, []);

  const loadSecurityStats = () => {
    // Check CSP support
    const cspSupported = cspManager.isCSPSupported();

    // Get rate limit data from localStorage
    const rateLimitData = getRateLimitData();

    // Calculate security level
    const securityLevel = calculateSecurityLevel(cspSupported, rateLimitData);

    setStats({
      cspSupported,
      cspViolations: 0, // Would be tracked in real implementation
      activeRateLimits: rateLimitData.filter(rl => rl.isBlocked).length,
      blockedRequests: rateLimitData.reduce((sum, rl) => sum + rl.attempts, 0),
      securityLevel,
      lastSecurityScan: new Date().toISOString(),
    });

    setRateLimits(rateLimitData);
  };

  const getRateLimitData = (): RateLimitEntry[] => {
    const rateLimitData: RateLimitEntry[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('rate_limit_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '[]');
          const rateLimitKey = key.replace('rate_limit_', '');
          const now = Date.now();

          // Filter attempts within last 24 hours
          const recentAttempts = data.filter(
            (time: number) => now - time < 24 * 60 * 60 * 1000
          );

          if (recentAttempts.length > 0) {
            rateLimitData.push({
              key: rateLimitKey,
              attempts: recentAttempts.length,
              lastAttempt: new Date(Math.max(...recentAttempts)).toISOString(),
              isBlocked: recentAttempts.length >= 5, // Assuming 5 is the limit
            });
          }
        } catch (error) {
          console.warn('Error parsing rate limit data:', error);
        }
      }
    }

    return rateLimitData.sort((a, b) => b.attempts - a.attempts);
  };

  const calculateSecurityLevel = (
    cspSupported: boolean,
    rateLimits: RateLimitEntry[]
  ): 'low' | 'medium' | 'high' => {
    let score = 0;

    // CSP support
    if (cspSupported) score += 30;

    // Rate limiting effectiveness
    const blockedAttacks = rateLimits.filter(rl => rl.isBlocked).length;
    if (blockedAttacks === 0) score += 30;
    else if (blockedAttacks < 3) score += 20;
    else if (blockedAttacks < 10) score += 10;

    // Security configuration
    score += 30; // Base score for having security measures

    // Overall security headers
    score += 10; // Assuming headers are configured

    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  };

  const runSecurityScan = async () => {
    setIsScanning(true);

    // Simulate security scan
    await new Promise(resolve => setTimeout(resolve, 2000));

    loadSecurityStats();
    setIsScanning(false);
  };

  const clearAllRateLimits = () => {
    if (
      confirm(
        '¿Estás seguro de que quieres limpiar todos los límites de velocidad?'
      )
    ) {
      rateLimits.forEach(rl => {
        localStorage.removeItem(`rate_limit_${rl.key}`);
      });
      loadSecurityStats();
    }
  };

  const clearSpecificRateLimit = (key: string) => {
    if (confirm(`¿Limpiar límite de velocidad para "${key}"?`)) {
      localStorage.removeItem(`rate_limit_${key}`);
      loadSecurityStats();
    }
  };

  const refreshCSP = () => {
    cspManager.applyCSPMetaTag();
    loadSecurityStats();
  };

  return (
    <div className='space-y-6'>
      {/* Security Overview */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Nivel de Seguridad</p>
                <div className='mt-1'>
                  <SecurityBadge level={stats.securityLevel} />
                </div>
              </div>
              <div className='p-2 bg-blue-100 rounded-full'>
                <svg
                  className='w-6 h-6 text-blue-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12l2 2 4-4m5.818 3.364a9 9 0 11-12.728 0'
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>CSP Activo</p>
                <p className='text-2xl font-bold'>
                  {stats.cspSupported ? 'Sí' : 'No'}
                </p>
              </div>
              <div
                className={`p-2 rounded-full ${stats.cspSupported ? 'bg-green-100' : 'bg-red-100'}`}
              >
                <svg
                  className={`w-6 h-6 ${stats.cspSupported ? 'text-green-600' : 'text-red-600'}`}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Rate Limits Activos</p>
                <p className='text-2xl font-bold'>{stats.activeRateLimits}</p>
              </div>
              <div className='p-2 bg-yellow-100 rounded-full'>
                <svg
                  className='w-6 h-6 text-yellow-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Peticiones Bloqueadas</p>
                <p className='text-2xl font-bold'>{stats.blockedRequests}</p>
              </div>
              <div className='p-2 bg-red-100 rounded-full'>
                <svg
                  className='w-6 h-6 text-red-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728'
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones de Seguridad</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex flex-wrap gap-3'>
            <Button
              onClick={runSecurityScan}
              disabled={isScanning}
              variant='default'
            >
              {isScanning ? 'Escaneando...' : 'Ejecutar Escaneo'}
            </Button>
            <Button onClick={refreshCSP} variant='outline'>
              Actualizar CSP
            </Button>
            <Button onClick={clearAllRateLimits} variant='destructive'>
              Limpiar Rate Limits
            </Button>
            <Button onClick={loadSecurityStats} variant='secondary'>
              Actualizar Stats
            </Button>
          </div>

          <div className='text-sm text-gray-600'>
            Último escaneo: {new Date(stats.lastSecurityScan).toLocaleString()}
          </div>
        </CardContent>
      </Card>

      {/* Rate Limit Monitor */}
      <Card>
        <CardHeader>
          <CardTitle>Monitor de Rate Limiting</CardTitle>
        </CardHeader>
        <CardContent>
          {rateLimits.length === 0 ? (
            <p className='text-gray-500 text-center py-4'>
              No hay rate limits activos
            </p>
          ) : (
            <div className='space-y-3'>
              {rateLimits.map((rateLimit, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-3 border rounded-lg'
                >
                  <div className='flex-1'>
                    <div className='flex items-center gap-2'>
                      <span className='font-medium'>{rateLimit.key}</span>
                      <span
                        className={`badge ${
                          rateLimit.isBlocked ? 'badge-danger' : 'badge-secondary'
                        }`}
                      >
                        {rateLimit.isBlocked ? 'Bloqueado' : 'Activo'}
                      </span>
                    </div>
                    <div className='text-sm text-gray-600 mt-1'>
                      {rateLimit.attempts} intentos • Último:{' '}
                      {new Date(rateLimit.lastAttempt).toLocaleString()}
                    </div>
                  </div>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => clearSpecificRateLimit(rateLimit.key)}
                  >
                    Limpiar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Seguridad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <h4 className='font-medium'>Rate Limiting</h4>
              <div className='text-sm text-gray-600 space-y-1'>
                <div>
                  Máx. intentos de login:{' '}
                  {SECURITY_CONSTANTS.MAX_LOGIN_ATTEMPTS}
                </div>
                <div>
                  Duración bloqueo:{' '}
                  {SECURITY_CONSTANTS.LOGIN_LOCKOUT_DURATION / 1000 / 60} min
                </div>
                <div>
                  Tamaño máx. archivo: {SECURITY_CONSTANTS.MAX_FILE_SIZE_MB} MB
                </div>
              </div>
            </div>

            <div className='space-y-2'>
              <h4 className='font-medium'>Validación de Contraseñas</h4>
              <div className='text-sm text-gray-600 space-y-1'>
                <div>
                  Longitud mínima: {SECURITY_CONSTANTS.PASSWORD_MIN_LENGTH}{' '}
                  caracteres
                </div>
                <div>Requiere mayúsculas: Sí</div>
                <div>Requiere números: Sí</div>
                <div>Requiere símbolos: Sí</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityDashboard;
