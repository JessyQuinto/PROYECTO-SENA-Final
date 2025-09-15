import React from 'react';
import { useAuth } from '@/auth/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert';
import Icon from '@/components/ui/Icon';

const VendorStatusPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();

  if (!user || user.role !== 'vendedor') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600">Acceso no autorizado</p>
              <Link to="/login" className="text-primary hover:underline">
                Volver al login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusInfo = () => {
    switch (user.vendedor_estado) {
      case 'pendiente':
        return {
          icon: (
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
              <Icon category="Estados y Feedback" name="LucideTimer" className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-yellow-600" />
            </div>
          ),
          title: 'Cuenta en Revisión',
          description: 'Tu solicitud de vendedor está siendo revisada por nuestro equipo.',
          status: 'warning',
          nextSteps: [
            'Nuestro equipo revisará tu información en un plazo de 24-48 horas',
            'Recibirás una notificación por correo cuando se apruebe tu cuenta',
            'Mientras tanto, puedes explorar la plataforma como comprador',
          ],
        };
      case 'rechazado':
        return {
          icon: (
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Icon category="Estados y Feedback" name="LucideXCircle" className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-red-600" />
            </div>
          ),
          title: 'Solicitud Rechazada',
          description: 'Lamentablemente, tu solicitud de vendedor no fue aprobada.',
          status: 'destructive',
          nextSteps: [
            'Contacta con nuestro equipo de soporte para conocer los motivos',
            'Puedes enviar una nueva solicitud con información adicional',
            'Mientras tanto, puedes continuar usando la plataforma como comprador',
          ],
        };
      case 'aprobado':
        return {
          icon: (
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <Icon category="Estados y Feedback" name="LucideCheckCircle" className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-green-600" />
            </div>
          ),
          title: '¡Cuenta Aprobada!',
          description: 'Tu cuenta de vendedor ha sido aprobada. ¡Bienvenido a Tesoros Chocó!',
          status: 'default',
          nextSteps: [
            'Ya puedes acceder a tu panel de vendedor',
            'Comienza subiendo tus primeros productos',
            'Configura tu perfil de vendedor',
          ],
        };
      default:
        return {
          icon: (
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Icon category="Interface" name="MdiAccount" className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-600" />
            </div>
          ),
          title: 'Estado Desconocido',
          description: 'No pudimos determinar el estado de tu cuenta.',
          status: 'default',
          nextSteps: ['Contacta con nuestro equipo de soporte'],
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl">
        <Card className="shadow-md sm:shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2 p-4 sm:p-6">
            {statusInfo.icon}
            <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2 px-2">
              {statusInfo.title}
            </CardTitle>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg px-2">
              {statusInfo.description}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            {/* Información del usuario */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                <Icon category="Interface" name="MdiInformation" className="w-4 h-4 sm:w-5 sm:h-5" />
                Tu Información
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:gap-3 text-xs sm:text-sm">
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <p className="text-gray-600 break-all">{user.email}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Nombre:</span>
                  <p className="text-gray-600">{user.nombre || 'No especificado'}</p>
                </div>
              </div>
            </div>

            {/* Próximos pasos */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                <Icon category="Interface" name="MdiListCheck" className="w-4 h-4 sm:w-5 sm:h-5" />
                Próximos Pasos
              </h3>
              <ul className="space-y-2">
                {statusInfo.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary text-xs sm:text-sm font-medium">{index + 1}</span>
                    </div>
                    <span className="text-gray-700 text-xs sm:text-sm leading-relaxed">{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Acciones */}
            <div className="flex flex-col gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
              <Button
                onClick={refreshProfile}
                variant="outline"
                className="w-full text-xs sm:text-sm"
                size="sm"
              >
                <Icon category="Interface" name="MdiRefresh" className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Actualizar Estado
              </Button>
              
              {user.vendedor_estado === 'aprobado' ? (
                <Button asChild className="w-full text-xs sm:text-sm" size="sm">
                  <Link to="/vendedor">
                    <Icon category="Interface" name="MdiStore" className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Ir al Panel
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="secondary" className="w-full text-xs sm:text-sm" size="sm">
                  <Link to="/productos">
                    <Icon category="Catálogo y producto" name="LineMdSearch" className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Explorar Productos
                  </Link>
                </Button>
              )}
            </div>

            {/* Contacto de soporte */}
            <Alert className="text-xs sm:text-sm">
              <Icon category="Interface" name="MdiHeadset" className="w-3 h-3 sm:w-4 sm:h-4" />
              <AlertDescription className="text-xs sm:text-sm leading-relaxed">
                ¿Necesitas ayuda? Contacta con nuestro equipo de soporte en{' '}
                <a 
                  href="mailto:soporte@tesoros-choco.com" 
                  className="text-primary hover:underline font-medium break-all"
                >
                  soporte@tesoros-choco.com
                </a>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorStatusPage;