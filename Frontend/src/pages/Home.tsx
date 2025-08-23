import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from '@/components/ui/shadcn/card';
import { useAuth } from '@/auth/AuthContext';
import { useCachedFeaturedProducts } from '@/hooks/useCache';

interface FeaturedProduct {
  id: string;
  nombre: string;
  precio: number;
  imagen_url?: string;
  users?: {
    nombre_completo?: string;
  };
}

export const Home: React.FC = () => {
  const { user } = useAuth();
  const {
    data: featuredProducts,
    loading,
    error,
  } = useCachedFeaturedProducts();

  return (
    <div>
      {/* Hero Section (Crafted style) */}
      <section className='relative overflow-hidden rounded-2xl mx-4 md:mx-10 mt-6 shadow-lg'>
        <div
          className='bg-cover bg-center flex flex-col justify-end min-h-[56vh]'
          style={{
            backgroundImage:
              "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 50%), url('/assert/2/9a92cd16-82e0-4b9b-bc8f-a7805b2ad499.jpg')",
          }}
        >
          <div className='p-8 md:p-16 text-white text-center'>
            <h1 className='heading-hero mb-4'>Descubre el Alma del Pacífico</h1>
            <p className='text-lg md:text-xl max-w-2xl mx-auto text-balance'>
              Producidas y fabricadas a mano por campesinos de la región.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        className='py-16'
        style={{ backgroundColor: 'var(--color-marfil)' }}
      >
        <div className='container'>
          <div className='text-center mb-12'>
            <h2 className='heading-lg mb-4'>¿Por qué Tesoros Chocó?</h2>
            <p className='text-lg opacity-80 max-w-2xl mx-auto text-balance'>
              Conectamos los oficios del Chocó con personas que valoran lo
              fabricado a mano, con historia y origen.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <Card className='text-center'>
              <CardContent className='p-6'>
                <div
                  className='w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'
                  style={{
                    backgroundColor:
                      'color-mix(in oklab, var(--color-terracotta-suave) 15%, white)',
                  }}
                >
                  <svg
                    className='w-8 h-8'
                    style={{ color: 'var(--color-terracotta-suave)' }}
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
                    />
                  </svg>
                </div>
                <CardTitle className='text-xl mb-2'>
                  Piezas con historia
                </CardTitle>
                <CardDescription className='opacity-80'>
                  Cada pieza nace en un taller real: materiales nobles, técnicas
                  ancestrales y el sello de quien la crea.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className='text-center'>
              <CardContent className='p-6'>
                <div
                  className='w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'
                  style={{
                    backgroundColor:
                      'color-mix(in oklab, var(--color-ocre-africano) 15%, white)',
                  }}
                >
                  <svg
                    className='w-8 h-8'
                    style={{ color: 'var(--color-ocre-africano)' }}
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </div>
                <CardTitle className='text-xl mb-2'>
                  Tiempo de calidad
                </CardTitle>
                <CardDescription className='opacity-80'>
                  No hay prisa en la artesanía. Cada pieza requiere su tiempo
                  para alcanzar la perfección.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className='text-center'>
              <CardContent className='p-6'>
                <div
                  className='w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'
                  style={{
                    backgroundColor:
                      'color-mix(in oklab, var(--color-verde-oliva) 15%, white)',
                  }}
                >
                  <svg
                    className='w-8 h-8'
                    style={{ color: 'var(--color-verde-oliva)' }}
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                    />
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                    />
                  </svg>
                </div>
                <CardTitle className='text-xl mb-2'>Origen auténtico</CardTitle>
                <CardDescription className='opacity-80'>
                  Productos que nacen en el corazón del Chocó, con materiales y
                  técnicas locales.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className='py-16'>
        <div className='container'>
          <div className='text-center mb-12'>
            <h2 className='heading-lg mb-4'>Productos Destacados</h2>
            <p className='text-lg opacity-80 max-w-2xl mx-auto text-balance'>
              Descubre nuestras piezas más populares, seleccionadas por su
              calidad y autenticidad.
            </p>
          </div>

          {loading ? (
            <div className='flex justify-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
            </div>
          ) : error ? (
            <div className='text-center text-red-600'>
              Error al cargar productos: {error.message}
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {(featuredProducts || []).map((product: FeaturedProduct) => (
                <Card
                  key={product.id}
                  className='overflow-hidden hover:shadow-lg transition-shadow'
                >
                  <div className='aspect-square overflow-hidden bg-gray-100 flex items-center justify-center'>
                    {product.imagen_url ? (
                      <img
                        src={product.imagen_url}
                        alt={product.nombre}
                        className='w-full h-full object-cover hover:scale-105 transition-transform duration-300'
                        onError={e => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML =
                            '<div class="w-full h-full flex items-center justify-center text-gray-400"><svg class="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path></svg></div>';
                        }}
                      />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center text-gray-400'>
                        <svg
                          className='w-16 h-16'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z'
                            clipRule='evenodd'
                          ></path>
                        </svg>
                      </div>
                    )}
                  </div>
                  <CardContent className='p-4'>
                    <h3 className='font-semibold text-lg mb-2 line-clamp-2'>
                      {product.nombre}
                    </h3>
                    <p className='text-sm text-gray-600 mb-2'>
                      Por:{' '}
                      {product.users?.nombre_completo || 'Artesano Chocoano'}
                    </p>
                    <div className='flex items-center justify-between'>
                      <span className='text-xl font-bold text-primary'>
                        ${product.precio.toLocaleString()}
                      </span>
                      <Link to={`/productos/${product.id}`}>
                        <Button size='sm'>Ver Detalles</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!featuredProducts || featuredProducts.length === 0) &&
                !loading &&
                !error && (
                  <div className='col-span-full text-center py-8'>
                    <p className='text-gray-600'>
                      No hay productos destacados disponibles en este momento.
                    </p>
                  </div>
                )}
            </div>
          )}

          <div className='text-center mt-8'>
            <Link to='/productos'>
              <Button size='lg' variant='outline'>
                Ver Todos los Productos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className='py-16'
        style={{ backgroundColor: 'var(--color-terracotta-suave)' }}
      >
        <div className='container text-center'>
          <h2 className='heading-lg mb-4 text-white'>
            ¿Eres Artesano del Chocó?
          </h2>
          <p className='text-lg mb-8 text-white opacity-90 max-w-2xl mx-auto text-balance'>
            Únete a nuestra plataforma y comparte tu talento con el mundo.
            Conectamos artesanos con compradores que valoran lo auténtico.
          </p>
          {!user ? (
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link to='/register'>
                <Button size='lg' variant='secondary'>
                  Registrarse como Vendedor
                </Button>
              </Link>
              <Link to='/login'>
                <Button
                  size='lg'
                  variant='outline'
                  className='bg-white text-primary hover:bg-gray-100'
                >
                  Iniciar Sesión
                </Button>
              </Link>
            </div>
          ) : user.role === 'vendedor' ? (
            <Link to='/vendedor'>
              <Button size='lg' variant='secondary'>
                Ir al Panel de Vendedor
              </Button>
            </Link>
          ) : (
            <Link to='/register'>
              <Button size='lg' variant='secondary'>
                Cambiar a Cuenta de Vendedor
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};
