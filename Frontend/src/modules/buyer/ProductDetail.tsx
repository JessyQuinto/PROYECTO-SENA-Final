import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from './CartContext';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import Icon from '@/components/ui/Icon';
import { 
  useCachedProduct, 
  useCachedProductAverageRating, 
  useCachedProductStory 
} from '@/hooks/useCache';

const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  // Use cached data hooks
  const { 
    data: product, 
    loading: productLoading, 
    error: productError 
  } = useCachedProduct(id!, { enabled: !!id });
  
  const { 
    data: avg, 
    loading: avgLoading 
  } = useCachedProductAverageRating(id!, { enabled: !!id });
  
  const { 
    data: story, 
    loading: storyLoading 
  } = useCachedProductStory(id!, { enabled: !!id });

  const loading = productLoading || avgLoading || storyLoading;

  if (loading) {
    return (
      <div className='container py-8'>
        <div className='flex items-center justify-center'>
          <Icon
            category='Estados y Feedback'
            name='HugeiconsReload'
            className='w-8 h-8 animate-spin'
          />
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className='container py-8'>
        <div className='text-center'>
          <Icon
            category='Estados y Feedback'
            name='BxErrorCircle'
            className='w-16 h-16 mx-auto text-red-500 mb-4'
          />
          <h2 className='text-xl font-semibold text-gray-700 mb-2'>
            Error al cargar el producto
          </h2>
          <p className='text-gray-500'>
            {productError?.message || 'Producto no encontrado'}
          </p>
        </div>
      </div>
    );
  }

  const addToCart = () => {
    add({
      productoId: product.id,
      nombre: product.nombre,
      precio: product.precio,
      cantidad: qty,
      imagenUrl: product.imagen_url,
      stock: product.stock,
    });
    navigate('/carrito');
  };

  return (
    <div className='container py-8'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
        <Card className='overflow-hidden'>
          <CardContent className='p-0'>
            <div className='relative bg-gray-100' style={{ paddingTop: '66%' }}>
              {product.imagen_url ? (
                <img
                  src={product.imagen_url}
                  alt={product.nombre}
                  className='absolute inset-0 w-full h-full object-cover'
                />
              ) : (
                <div className='absolute inset-0 w-full h-full flex items-center justify-center text-gray-400'>
                  <Icon
                    category='Catálogo y producto'
                    name='MynauiImage'
                    className='w-16 h-16'
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-6 space-y-4'>
            <h1 className='heading-lg flex items-center gap-3'>
              <Icon
                category='Catálogo y producto'
                name='BxsPackage'
                className='w-8 h-8'
              />
              {product.nombre}
            </h1>
            {avg !== null && (
              <div className='text-sm text-yellow-600 flex items-center gap-1'>
                <Icon
                  category='Catálogo y producto'
                  name='LucideHeart'
                  className='w-4 h-4'
                />
                {avg.toFixed(1)}
              </div>
            )}
            {/* Descripción */}
            {product.descripcion && (
              <div>
                <h2 className='text-sm font-semibold uppercase tracking-wide text-gray-500 mb-1'>
                  Descripción
                </h2>
                <p className='text-gray-700 leading-relaxed'>{product.descripcion}</p>
              </div>
            )}
            <div className='text-3xl font-bold text-(--color-terracotta-suave) flex items-center gap-2'>
              <Icon
                category='Carrito y checkout'
                name='VaadinWallet'
                className='w-6 h-6'
              />
              ${product.precio?.toLocaleString()}
            </div>
            <div className='flex items-center gap-3'>
              <label className='form-label flex items-center gap-2'>
                <Icon
                  category='Catálogo y producto'
                  name='BxsPackage'
                  className='w-4 h-4'
                />
                Cantidad
              </label>
              <Input
                type='number'
                min={1}
                max={product.stock}
                value={qty}
                onChange={e =>
                  setQty(
                    Math.max(1, Math.min(Number(e.target.value || 1), product.stock))
                  )
                }
                className='w-24'
              />
              <Button onClick={addToCart} className='flex items-center gap-2'>
                <Icon
                  category='Carrito y checkout'
                  name='WhhShoppingcart'
                  className='w-4 h-4'
                />
                Añadir al carrito
              </Button>
            </div>
            <div className='text-sm text-gray-500 flex items-center gap-2'>
              <Icon
                category='Vendedor'
                name='SiInventoryFill'
                className='w-4 h-4'
              />
              Stock disponible: {product.stock}
            </div>

            {/* Historia y origen */}
            <div className='mt-4 space-y-2'>
              <h2 className='text-sm font-semibold uppercase tracking-wide text-gray-500'>
                Historia y origen
              </h2>
              <p className='text-gray-700 leading-relaxed'>
                {story?.historia?.trim() ||
                  `Producido y fabricado a mano por campesinos de la región. ${product.categorias?.nombre ? `${product.categorias.nombre} elaborada con dedicación, respetando técnicas locales y cuidando cada detalle.` : 'Pieza elaborada con dedicación, respetando técnicas locales y cuidando cada detalle.'}`}
              </p>
              <div className='flex flex-wrap gap-2 text-sm'>
                {story?.materiales && (
                  <span className='badge badge-secondary' title='Materiales'>
                    {story.materiales}
                  </span>
                )}
                {story?.tecnica && (
                  <span className='badge badge-secondary' title='Técnica'>
                    {story.tecnica}
                  </span>
                )}
                {story?.origen && (
                  <span className='badge badge-secondary' title='Origen'>
                    {story.origen}
                  </span>
                )}
                {story?.cuidados && (
                  <span className='badge badge-secondary' title='Cuidados'>
                    {story.cuidados}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductDetail;
