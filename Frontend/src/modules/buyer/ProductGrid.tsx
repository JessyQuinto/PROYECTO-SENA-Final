import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import ProductCard from './ProductCard';
import { Button } from '@/components/ui/shadcn/button';
import { useAuth } from '@/auth/AuthContext';

interface Product {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
  imagen_url?: string;
  vendedor_id: string;
  categoria_id?: string;
  created_at: string;
  users?: {
    nombre_completo?: string;
    email: string;
  };
  categorias?: {
    nombre: string;
  };
}

interface ProductGridProps {
  products: Product[];
  avgMap: { [key: string]: number };
  twoColsMobile: boolean;
  className?: string;
  hasFiltersApplied?: boolean;
}

const ProductGrid: React.FC<ProductGridProps> = React.memo(
  ({ products, avgMap, twoColsMobile, className = '', hasFiltersApplied = false }) => {
    const { user } = useAuth();
    
    // Empty state
    if (products.length === 0) {
      return (
        <div className={`text-center py-12 px-4 ${className}`}>
          <Icon
            category='Catálogo y producto'
            name='BxsPackage'
            className='w-16 h-16 text-gray-400 mx-auto mb-6'
          />
          <h3 className='text-lg md:text-xl font-medium text-gray-900 mb-3'>
            {hasFiltersApplied ? 'No se encontraron productos' : 'No hay productos disponibles'}
          </h3>
          
          {hasFiltersApplied ? (
            <div className='space-y-4'>
              <p className='text-sm md:text-base text-gray-500 mb-4'>
                Intenta ajustar tus filtros de búsqueda
              </p>
            </div>
          ) : (
            <div className='space-y-4 max-w-md mx-auto'>
              <p className='text-sm md:text-base text-gray-500 mb-6'>
                {!user 
                  ? 'Parece que no hay productos disponibles en este momento. Inicia sesión para ver todos los productos disponibles.'
                  : 'Actualmente no hay productos disponibles. ¡Vuelve pronto para ver las nuevas artesanías!'}
              </p>
              
              {!user && (
                <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                  <Link to='/login'>
                    <Button size='lg' className='w-full sm:w-auto'>
                      Iniciar Sesión
                    </Button>
                  </Link>
                  <Link to='/register'>
                    <Button size='lg' variant='outline' className='w-full sm:w-auto'>
                      Crear Cuenta
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={`min-w-0 lg:col-span-3 ${className}`}>
        {/* Results count */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 md:mb-6'>
          <p className='text-sm md:text-base opacity-80'>
            {products.length} producto{products.length !== 1 ? 's' : ''}{' '}
            encontrado{products.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Products Grid */}
        <div
          className={`grid ${
            twoColsMobile ? 'grid-cols-2' : 'grid-cols-1'
          } sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 items-stretch content-start`}
        >
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              avg={avgMap[product.id]}
            />
          ))}
        </div>
      </div>
    );
  }
);

ProductGrid.displayName = 'ProductGrid';

export default ProductGrid;
