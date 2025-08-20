import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/shadcn/card';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';

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
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select(`
          id,
          nombre,
          precio,
          imagen_url,
          users!productos_vendedor_id_fkey(nombre_completo)
        `)
        .eq('estado', 'activo')
        .gt('stock', 0)
        .limit(6)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeaturedProducts(data || []);
    } catch (error) {
      console.error('Error loading featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero Section (Crafted style) */}
      <section className="relative overflow-hidden rounded-2xl mx-4 md:mx-10 mt-6 shadow-lg">
        <div
          className="bg-cover bg-center flex flex-col justify-end min-h-[56vh]"
          style={{
            backgroundImage:
              "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 50%), url('/assert/2/9a92cd16-82e0-4b9b-bc8f-a7805b2ad499.jpg')",
          }}
        >
          <div className="p-8 md:p-16 text-white text-center">
            <h1 className="heading-hero mb-4">Descubre el Alma del Pacífico</h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto text-balance">
              Producidas y fabricadas a mano por campesinos de la región.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16" style={{ backgroundColor: 'var(--color-marfil)' }}>
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-4">¿Por qué Tesoros Chocó?</h2>
            <p className="text-lg opacity-80 max-w-2xl mx-auto text-balance">
              Conectamos los oficios del Chocó con personas que valoran lo fabricado a mano, con historia y origen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'color-mix(in oklab, var(--color-terracotta-suave) 15%, white)' }}>
                  <svg className="w-8 h-8" style={{ color: 'var(--color-terracotta-suave)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <CardTitle className="text-xl mb-2">Piezas con historia</CardTitle>
                <CardDescription className="opacity-80">
                  Cada pieza nace en un taller real: materiales nobles, técnicas ancestrales y el sello de quien la crea.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'color-mix(in oklab, var(--color-ocre-africano) 15%, white)' }}>
                  <svg className="w-8 h-8" style={{ color: 'var(--color-ocre-africano)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <CardTitle className="text-xl mb-2">Impacto en la comunidad</CardTitle>
                <CardDescription className="opacity-80">
                  Tu compra impulsa el ingreso de familias campesinas y artesanas del Chocó.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'color-mix(in oklab, var(--color-verde-oliva-tenue) 20%, white)' }}>
                  <svg className="w-8 h-8" style={{ color: 'var(--color-verde-oliva-tenue)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <CardTitle className="text-xl mb-2">Calidad que se siente</CardTitle>
                <CardDescription className="opacity-80">
                  Certificamos a cada uno de nuestros artesanos, verificamos las óptimas condiciones del producto y nos aseguramos que las piezas sean entregadas a su destino eficaz y cuidadosamente!.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16" style={{ backgroundColor: 'color-mix(in oklab, var(--color-marfil) 95%, black)' }}>
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="heading-lg mb-2">Recién salidas del taller</h2>
              <p className="opacity-80">Descubre lo nuevo, fabricado con manos del Pacífico</p>
            </div>
            <Link to="/productos" className="hidden sm:block">
              <Button size="lg">Ver Todos</Button>
            </Link>
            <Link to="/productos" className="sm:hidden p-2 rounded-lg hover:bg-(--color-marfil)" aria-label="Ver todos los productos">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="loading-spinner w-8 h-8"></div>
            </div>
          ) : (
            <div className="grid-auto-cards items-stretch content-start">
              {featuredProducts.slice(0, 6).map((product) => (
                <Link key={product.id} to={`/productos/${product.id}`} className="group block h-full">
                  <Card className="transition-all overflow-hidden group hover:shadow-xl border-gray-200 h-full flex flex-col">
                    <div className="relative bg-gray-100 overflow-hidden aspect-[3/2]">
                      {product.imagen_url ? (
                        <img
                          src={product.imagen_url}
                          alt={product.nombre}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 flex flex-col flex-1">
                      <div className="min-h-[3.25rem]">
                        <h3 className="text-base font-semibold transition-colors group-hover:text-(--color-terracotta-suave) line-clamp-2">{product.nombre}</h3>
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-2xl font-bold text-(--color-terracotta-suave)">${product.precio.toLocaleString()}</span>
                        <span className="text-sm opacity-75">Por {product.users?.nombre_completo || 'Artesano'}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-16 text-white" style={{ backgroundColor: 'var(--color-terracotta-suave)' }}>
        {/* Decorative background pattern */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: "url('/assert/conception-de-modele-africain-plat/6989328.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'saturate(0.8) contrast(1.05)',
            pointerEvents: 'none'
          }}
        />
        <div className="container relative z-10 text-center">
          <h2 className="heading-lg mb-4" style={{ color: 'white' }}>¿Eres artesano del Chocó?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Súmate a Tesoros Chocó y muestra tu oficio al mundo. Te ayudamos a Impulsar tu emprendimiento, contar tu historia y llegar a más personas!.
          </p>
          {!user ? (
            <Link to="/auth">
              <Button size="lg">Únete como vendedor</Button>
            </Link>
          ) : user.role === 'vendedor' && user.vendedor_estado === 'aprobado' ? (
            <Link to="/vendedor">
              <Button size="lg">Ir a mi Panel</Button>
            </Link>
          ) : (
            <div className="inline-flex items-center px-6 py-3 rounded-lg bg-white/20 text-white">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ya eres parte de Tesoros Chocó
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
