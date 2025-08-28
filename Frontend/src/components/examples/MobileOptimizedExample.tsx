import React from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent, CardTitle } from '@/components/ui/shadcn/card';
import { Input } from '@/components/ui/shadcn/input';

/**
 * Componente de ejemplo que demuestra las optimizaciones móviles implementadas
 * Este componente muestra las mejores prácticas para diseño responsive
 */
const MobileOptimizedExample: React.FC = () => {
  return (
    <div className='mobile-container mobile-scroll py-6'>
      <div className='max-w-4xl mx-auto space-y-8'>
        
        {/* Header Section */}
        <div className='text-center space-y-4'>
          <h1 className='text-2xl md:text-4xl font-bold text-primary'>
            Optimizaciones Móviles
          </h1>
          <p className='text-base md:text-lg text-muted-foreground max-w-2xl mx-auto'>
            Ejemplos de las mejoras implementadas para dispositivos móviles
          </p>
        </div>

        {/* Touch Targets Section */}
        <Card className='mobile-card'>
          <CardContent className='p-6 md:p-8'>
            <CardTitle className='text-xl md:text-2xl mb-6 flex items-center gap-3'>
              <span className='w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold'>
                1
              </span>
              Elementos Táctiles Optimizados
            </CardTitle>
            
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6'>
              {/* Touch Target Examples */}
              <div className='space-y-4'>
                <h3 className='font-semibold text-lg'>Botones Táctiles</h3>
                <div className='flex flex-wrap gap-3'>
                  <Button className='touch-target'>
                    Botón Normal
                  </Button>
                  <Button className='touch-target-lg' variant='outline'>
                    Botón Grande
                  </Button>
                  <Button className='touch-target' size='sm'>
                    Pequeño
                  </Button>
                </div>
              </div>

              {/* Input Examples */}
              <div className='space-y-4'>
                <h3 className='font-semibold text-lg'>Inputs Móviles</h3>
                <div className='space-y-3'>
                  <Input 
                    placeholder='Input táctil' 
                    className='mobile-input'
                  />
                  <Input 
                    placeholder='Input con touch-target' 
                    className='mobile-input touch-target'
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography Section */}
        <Card className='mobile-card'>
          <CardContent className='p-6 md:p-8'>
            <CardTitle className='text-xl md:text-2xl mb-6 flex items-center gap-3'>
              <span className='w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold'>
                2
              </span>
              Tipografía Responsive
            </CardTitle>
            
            <div className='space-y-4'>
              <div className='space-y-2'>
                <h1 className='text-2xl md:text-4xl lg:text-5xl font-bold'>
                  Título Principal
                </h1>
                <h2 className='text-xl md:text-2xl lg:text-3xl font-semibold'>
                  Subtítulo
                </h2>
                <h3 className='text-lg md:text-xl font-medium'>
                  Título de Sección
                </h3>
                <p className='text-base md:text-lg leading-relaxed'>
                  Párrafo con texto responsive que se adapta a diferentes tamaños de pantalla.
                  La legibilidad se mantiene en todos los dispositivos.
                </p>
                <p className='text-sm md:text-base text-muted-foreground'>
                  Texto secundario con tamaño optimizado para móviles.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Layout Section */}
        <Card className='mobile-card'>
          <CardContent className='p-6 md:p-8'>
            <CardTitle className='text-xl md:text-2xl mb-6 flex items-center gap-3'>
              <span className='w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold'>
                3
              </span>
              Layout Responsive
            </CardTitle>
            
            <div className='space-y-6'>
              {/* Grid Example */}
              <div>
                <h3 className='font-semibold text-lg mb-4'>Grid Adaptativo</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'>
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div 
                      key={item}
                      className='bg-muted p-4 rounded-lg text-center touch-target'
                    >
                      Item {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Container Example */}
              <div>
                <h3 className='font-semibold text-lg mb-4'>Contenedores Móviles</h3>
                <div className='space-y-4'>
                  <div className='mobile-container-fluid bg-muted p-4 rounded-lg'>
                    <p className='text-sm'>Contenedor fluido con safe areas</p>
                  </div>
                  <div className='mobile-container-sm bg-muted p-4 rounded-lg'>
                    <p className='text-sm'>Contenedor pequeño</p>
                  </div>
                  <div className='mobile-container-md bg-muted p-4 rounded-lg'>
                    <p className='text-sm'>Contenedor mediano</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Animations Section */}
        <Card className='mobile-card'>
          <CardContent className='p-6 md:p-8'>
            <CardTitle className='text-xl md:text-2xl mb-6 flex items-center gap-3'>
              <span className='w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold'>
                4
              </span>
              Animaciones Móviles
            </CardTitle>
            
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6'>
              <div className='bg-muted p-6 rounded-lg text-center mobile-fade-in'>
                <h4 className='font-semibold mb-2'>Fade In</h4>
                <p className='text-sm'>Animación de aparición suave</p>
              </div>
              <div className='bg-muted p-6 rounded-lg text-center mobile-slide-up'>
                <h4 className='font-semibold mb-2'>Slide Up</h4>
                <p className='text-sm'>Animación de deslizamiento</p>
              </div>
              <div className='bg-muted p-6 rounded-lg text-center mobile-scale-in'>
                <h4 className='font-semibold mb-2'>Scale In</h4>
                <p className='text-sm'>Animación de escala</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Section */}
        <Card className='mobile-card'>
          <CardContent className='p-6 md:p-8'>
            <CardTitle className='text-xl md:text-2xl mb-6 flex items-center gap-3'>
              <span className='w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold'>
                5
              </span>
              Optimizaciones de Performance
            </CardTitle>
            
            <div className='space-y-4'>
              <div className='bg-muted p-4 rounded-lg mobile-accelerated'>
                <h4 className='font-semibold mb-2'>Hardware Acceleration</h4>
                <p className='text-sm'>Elemento con aceleración por hardware</p>
              </div>
              
              <div className='bg-muted p-4 rounded-lg mobile-scroll-smooth'>
                <h4 className='font-semibold mb-2'>Scroll Optimizado</h4>
                <p className='text-sm'>Contenedor con scroll suave</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accessibility Section */}
        <Card className='mobile-card'>
          <CardContent className='p-6 md:p-8'>
            <CardTitle className='text-xl md:text-2xl mb-6 flex items-center gap-3'>
              <span className='w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold'>
                6
              </span>
              Accesibilidad
            </CardTitle>
            
            <div className='space-y-4'>
              <Button 
                className='touch-target mobile-focus-visible'
                aria-label='Botón accesible con focus visible'
              >
                Botón Accesible
              </Button>
              
              <div className='bg-muted p-4 rounded-lg'>
                <h4 className='font-semibold mb-2'>Reduced Motion</h4>
                <p className='text-sm'>
                  Las animaciones se desactivan automáticamente cuando el usuario 
                  prefiere movimiento reducido.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Best Practices Summary */}
        <Card className='mobile-card bg-primary/5 border-primary/20'>
          <CardContent className='p-6 md:p-8'>
            <CardTitle className='text-xl md:text-2xl mb-6 text-primary'>
              🎯 Mejores Prácticas Implementadas
            </CardTitle>
            
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-3'>
                <h4 className='font-semibold text-lg'>Usabilidad</h4>
                <ul className='space-y-2 text-sm'>
                  <li>• Tamaños táctiles mínimos (44px)</li>
                  <li>• Espaciado generoso entre elementos</li>
                  <li>• Feedback visual inmediato</li>
                  <li>• Navegación simplificada</li>
                </ul>
              </div>
              
              <div className='space-y-3'>
                <h4 className='font-semibold text-lg'>Performance</h4>
                <ul className='space-y-2 text-sm'>
                  <li>• Hardware acceleration</li>
                  <li>• Scroll optimizado</li>
                  <li>• Animaciones suaves</li>
                  <li>• Carga progresiva</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileOptimizedExample;


