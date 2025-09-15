import React, { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import Icon from '@/components/ui/Icon';

interface WelcomeFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface RoleConfig {
  title: string;
  subtitle: string;
  description: string;
  features: WelcomeFeature[];
  primaryAction: {
    text: string;
    path: string;
  };
  secondaryActions?: Array<{
    text: string;
    path: string;
  }>;
}

const WelcomeScreen: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  if (!user) {
    return null;
  }

  const getRoleConfig = (): RoleConfig => {
    switch (user.role) {
      case 'admin':
        return {
          title: `¡Bienvenido, ${user.nombre || 'Administrador'}!`,
          subtitle: 'Panel de Administración - Tesoros Chocó',
          description: 'Tienes acceso completo para gestionar la plataforma, usuarios y moderación de contenido.',
          features: [
            {
              icon: <Icon category="Interface" name="MdiAccountMultiple" className="w-6 h-6 text-red-600" />,
              title: 'Gestión de Usuarios',
              description: 'Aprobar vendedores, gestionar roles y moderar usuarios'
            },
            {
              icon: <Icon category="Interface" name="MdiChartLine" className="w-6 h-6 text-blue-600" />,
              title: 'Analytics y Métricas',
              description: 'Visualiza estadísticas de ventas, productos y actividad'
            },
            {
              icon: <Icon category="Interface" name="MdiShield" className="w-6 h-6 text-green-600" />,
              title: 'Moderación',
              description: 'Revisar productos, pedidos y gestionar reportes'
            }
          ],
          primaryAction: {
            text: 'Ir al Panel de Admin',
            path: '/admin'
          },
          secondaryActions: [
            {
              text: 'Ver Vendedores Pendientes',
              path: '/admin/vendedores'
            }
          ]
        };

      case 'vendedor':
        const isApproved = user.vendedor_estado === 'aprobado';
        return {
          title: `¡Bienvenido, ${user.nombre || 'Vendedor'}!`,
          subtitle: isApproved ? 'Panel de Vendedor - Tesoros Chocó' : 'Cuenta de Vendedor',
          description: isApproved 
            ? 'Tu cuenta ha sido aprobada. Comienza a vender tus productos artesanales únicos.'
            : 'Tu cuenta está en proceso de revisión. Mientras tanto, puedes explorar la plataforma.',
          features: isApproved ? [
            {
              icon: <Icon category="Catálogo y producto" name="MdiPackageVariant" className="w-6 h-6 text-amber-600" />,
              title: 'Gestionar Productos',
              description: 'Sube, edita y administra tu catálogo de productos'
            },
            {
              icon: <Icon category="Interface" name="MdiTruckDelivery" className="w-6 h-6 text-green-600" />,
              title: 'Gestionar Pedidos',
              description: 'Recibe y procesa pedidos de tus clientes'
            },
            {
              icon: <Icon category="Interface" name="MdiChartBox" className="w-6 h-6 text-blue-600" />,
              title: 'Ver Estadísticas',
              description: 'Analiza el rendimiento de tus ventas'
            }
          ] : [
            {
              icon: <Icon category="Estados y Feedback" name="LucideTimer" className="w-6 h-6 text-yellow-600" />,
              title: 'En Revisión',
              description: 'Tu cuenta será revisada en 24-48 horas'
            },
            {
              icon: <Icon category="Catálogo y producto" name="LineMdSearch" className="w-6 h-6 text-blue-600" />,
              title: 'Explorar Productos',
              description: 'Conoce lo que venden otros artesanos'
            },
            {
              icon: <Icon category="Interface" name="MdiHeadset" className="w-6 h-6 text-green-600" />,
              title: 'Soporte',
              description: 'Contacta si tienes preguntas sobre el proceso'
            }
          ],
          primaryAction: {
            text: isApproved ? 'Ir al Panel de Vendedor' : 'Ver Estado de Cuenta',
            path: isApproved ? '/vendedor' : '/vendedor/estado'
          },
          secondaryActions: [
            {
              text: 'Explorar Productos',
              path: '/productos'
            }
          ]
        };

      case 'comprador':
      default:
        return {
          title: `¡Bienvenido, ${user.nombre || 'Comprador'}!`,
          subtitle: 'Descubre Tesoros Artesanales del Chocó',
          description: 'Explora productos únicos hechos a mano por artesanos locales del Pacífico colombiano.',
          features: [
            {
              icon: <Icon category="Catálogo y producto" name="LineMdSearch" className="w-6 h-6 text-orange-600" />,
              title: 'Explorar Productos',
              description: 'Descubre artesanías únicas con historia y tradición'
            },
            {
              icon: <Icon category="Interface" name="MdiCart" className="w-6 h-6 text-green-600" />,
              title: 'Comprar Fácil',
              description: 'Proceso de compra simple y seguro'
            },
            {
              icon: <Icon category="Interface" name="MdiMapMarker" className="w-6 h-6 text-blue-600" />,
              title: 'Apoyar Artesanos',
              description: 'Cada compra apoya directamente a familias del Chocó'
            }
          ],
          primaryAction: {
            text: 'Explorar Productos',
            path: '/productos'
          },
          secondaryActions: [
            {
              text: 'Ver Mi Perfil',
              path: '/perfil'
            }
          ]
        };
    }
  };

  const config = getRoleConfig();
  const totalSteps = config.features.length;

  const handleGetStarted = () => {
    // Marcar como completado el onboarding
    localStorage.setItem(`onboarding_completed_${user.role}`, 'true');
    navigate(config.primaryAction.path);
  };

  const handleSkip = () => {
    localStorage.setItem(`onboarding_completed_${user.role}`, 'true');
    navigate(config.primaryAction.path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl">
        <Card className="shadow-lg sm:shadow-xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
          {/* Header */}
          <CardHeader className="text-center bg-gradient-to-r from-orange-500 to-amber-500 text-white relative p-4 sm:p-6">
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
              <button
                onClick={handleSkip}
                className="text-white/80 hover:text-white text-xs sm:text-sm underline"
              >
                Saltar
              </button>
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <Icon category="Interface" name="MdiHeart" className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 px-2">
              {config.title}
            </CardTitle>
            <p className="text-base sm:text-lg md:text-xl text-white/90 px-2">
              {config.subtitle}
            </p>
            <p className="text-white/80 mt-2 max-w-2xl mx-auto text-sm sm:text-base px-3">
              {config.description}
            </p>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 md:p-8">
            {/* Progress Indicator */}
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="flex space-x-1.5 sm:space-x-2">
                {Array.from({ length: totalSteps }, (_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-colors ${
                      index === currentStep
                        ? 'bg-orange-500'
                        : index < currentStep
                        ? 'bg-orange-300'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Feature Content */}
            <div className="min-h-[180px] sm:min-h-[200px] flex items-center justify-center">
              <div className="text-center max-w-xs sm:max-w-md px-2">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                  {config.features[currentStep]?.icon}
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">
                  {config.features[currentStep]?.title}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed">
                  {config.features[currentStep]?.description}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 sm:mt-8 space-y-3 sm:space-y-0">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="w-full sm:w-auto min-w-[100px] order-2 sm:order-1"
              >
                Anterior
              </Button>

              <span className="text-xs sm:text-sm text-gray-500 order-1 sm:order-2">
                {currentStep + 1} de {totalSteps}
              </span>

              {currentStep < totalSteps - 1 ? (
                <Button
                  onClick={() => setCurrentStep(Math.min(totalSteps - 1, currentStep + 1))}
                  className="w-full sm:w-auto min-w-[100px] bg-orange-500 hover:bg-orange-600 order-3"
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  onClick={handleGetStarted}
                  className="w-full sm:w-auto min-w-[100px] bg-green-600 hover:bg-green-700 order-3"
                >
                  ¡Comenzar!
                </Button>
              )}
            </div>

            {/* Quick Actions */}
            {config.secondaryActions && (
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
                <p className="text-center text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                  También puedes:
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-3">
                  {config.secondaryActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      asChild
                      className="w-full sm:w-auto text-orange-600 hover:text-orange-700 text-xs sm:text-sm"
                    >
                      <Link to={action.path}>{action.text}</Link>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WelcomeScreen;