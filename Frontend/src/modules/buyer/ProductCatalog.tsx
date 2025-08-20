import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/shadcn/input';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { useCart } from './CartContext';
import Icon from '@/components/ui/Icon';

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

interface Category {
  id: string;
  nombre: string;
}

const ProductCatalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  // Multi selección de categorías
  const [priceMaxAuto, setPriceMaxAuto] = useState<number>(1000000);
  const [priceMin, setPriceMin] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(1000000);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'name'>('newest');
  const [avgMap, setAvgMap] = useState<Record<string, number>>({});
  // UX móvil
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [twoColsMobile, setTwoColsMobile] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // Eliminado efecto muerto: usamos derivación directa (filteredProducts)

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar productos con información del vendedor y categoría
      const { data: productsData, error: productsError } = await supabase
        .from('productos')
        .select(`
          *,
          categorias(nombre)
        `)
        .eq('estado', 'activo')
        .eq('archivado', false)
        .gt('stock', 0);

      if (productsError) throw productsError;

      // Cargar categorías
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre');

      if (categoriesError) throw categoriesError;

      setProducts(productsData || []);
      // Ajustar rango de precios dinámicamente
      const maxPrice = Math.max(100000, ...((productsData || []).map((p: any) => Number(p.precio || 0))));
      setPriceMaxAuto(maxPrice);
      setPriceMin(0);
      setPriceMax(maxPrice);
      // Cargar promedios de calificación (si hay ids)
      const ids = (productsData || []).map((p: any) => p.id);
      if (ids.length > 0) {
        const { data: avgRows } = await supabase.from('mv_promedio_calificaciones').select('producto_id,promedio').in('producto_id', ids);
        const map: Record<string, number> = {};
        (avgRows || []).forEach((r: any) => { map[r.producto_id] = Number(r.promedio || 0); });
        setAvgMap(map);
      } else {
        setAvgMap({});
      }
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    const q = debouncedTerm.toLowerCase();
    if (q) {
      filtered = filtered.filter(product => product.nombre.toLowerCase().includes(q));
    }
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product => selectedCategories.includes(product.categoria_id || ''));
    }
    filtered = filtered.filter(product => Number(product.precio) >= priceMin && Number(product.precio) <= priceMax);
    switch (sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => a.precio - b.precio);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.precio - a.precio);
        break;
      case 'name':
        filtered.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }
    return filtered;
  }, [products, debouncedTerm, selectedCategories, priceMin, priceMax, sortBy]);

  if (loading) {
    return (
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="heading-lg mb-2">Catálogo de Productos</h1>
          <p className="opacity-80">Descubre productos únicos hechos por artesanos del Chocó</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="animate-pulse">
              <div className="h-40 bg-gray-200 rounded-t-xl" />
              <div className="border rounded-b-xl p-4 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-6 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header + Hero Search */}
      <div className="mb-6">
        {/* Subtle decorative bar */}
        <div
          className="rounded-xl h-14 mb-4 overflow-hidden"
          style={{
            backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.25), rgba(0,0,0,0.05)), url('/assert/1/v1045-03.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 w-full md:w-auto">
            <div className="relative">
              <Icon category="Catálogo y producto" name="LineMdSearch" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-card search-input"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="form-select"
            >
              <option value="newest">Más recientes</option>
              <option value="price_asc">Precio: menor a mayor</option>
              <option value="price_desc">Precio: mayor a menor</option>
              <option value="name">Nombre A-Z</option>
            </select>
          </div>
        </div>

        {/* Controles móviles: Filtros y Vista */}
        <div className="sm:hidden mt-3 flex items-center gap-2">
          <button
            type="button"
            className="btn btn-outline btn-sm flex items-center gap-2"
            onClick={() => setShowFiltersMobile(v => !v)}
            aria-label={showFiltersMobile ? 'Ocultar filtros' : 'Mostrar filtros'}
            title={showFiltersMobile ? 'Ocultar filtros' : 'Mostrar filtros'}
          >
            <Icon category="Catálogo y producto" name="IonFilter" className="w-4 h-4" />
            {showFiltersMobile ? 'Ocultar filtros' : 'Mostrar filtros'}
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm flex items-center gap-2"
            onClick={() => setTwoColsMobile(v => !v)}
            aria-label={twoColsMobile ? 'Cambiar a vista 1 columna' : 'Cambiar a vista 2 columnas'}
            title={twoColsMobile ? 'Cambiar a vista 1 columna' : 'Cambiar a vista 2 columnas'}
          >
            <Icon category="Navegación principal" name="MdiGrid" className="w-4 h-4" />
            {twoColsMobile ? 'Vista 1x' : 'Vista 2x'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filtros */}
        <div className={`lg:col-span-1 ${showFiltersMobile ? '' : 'hidden'} lg:block`}>
          <Card>
            <CardContent className="p-4 sm:p-4 p-3">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Icon category="Catálogo y producto" name="IonFilter" className="w-4 h-4" />
                Filtros
              </h3>
              
              {/* Categorías */}
              <div className="mb-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Icon category="Catálogo y producto" name="LucideTags" className="w-4 h-4" />
                  Categorías
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, category.id]);
                          } else {
                            setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                          }
                        }}
                        className="rounded"
                      />
                      {category.nombre}
                    </label>
                  ))}
                </div>
              </div>

              {/* Rango de precios */}
              <div className="mb-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Icon category="Carrito y checkout" name="VaadinWallet" className="w-4 h-4" />
                  Rango de precios
                </h4>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm text-gray-600">Mínimo</label>
                    <Input
                      type="number"
                      value={priceMin}
                      onChange={(e) => setPriceMin(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Máximo</label>
                    <Input
                      type="number"
                      value={priceMax}
                      onChange={(e) => setPriceMax(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Limpiar filtros */}
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategories([]);
                  setPriceMin(0);
                  setPriceMax(priceMaxAuto);
                  setSortBy('newest');
                }}
                className="w-full flex items-center gap-2 sm:py-2 py-2"
              >
                <Icon category="Estados y Feedback" name="HugeiconsReload" className="w-4 h-4" />
                Limpiar filtros
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="min-w-0 lg:col-span-3">
          {/* Results count */}
          <div className="flex justify-between items-center mb-6">
            <p className="opacity-80">
              {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Icon category="Catálogo y producto" name="BxsPackage" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
              <p className="text-gray-500">Intenta ajustar tus filtros de búsqueda</p>
            </div>
          ) : (
            <div className={`grid ${twoColsMobile ? 'grid-cols-2' : 'grid-cols-1'} sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch content-start`}>
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} avg={avgMap[product.id]} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ProductCardProps {
  product: Product;
  avg?: number;
}

const ProductCardBase: React.FC<ProductCardProps> = ({ product, avg }) => {
  const { add } = useCart();
  const isLowStock = Number(product.stock) <= 5 && Number(product.stock) > 0;
  const createdAt = product.created_at ? new Date(product.created_at) : null as any;
  const isNew = createdAt ? (Date.now() - createdAt.getTime()) < 1000 * 60 * 60 * 24 * 14 : false;

  return (
    <Card className="transition-all overflow-hidden group hover:shadow-xl border-gray-200">
      <Link to={`/productos/${product.id}`} className="block">
        <div className="relative bg-gray-100 overflow-hidden aspect-[3/2]">
          {product.imagen_url ? (
            <img
              src={product.imagen_url}
              alt={product.nombre}
              loading="lazy" decoding="async"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div
              className="absolute inset-0 w-full h-full flex items-center justify-center text-gray-400"
              style={{
                backgroundImage: "linear-gradient(to bottom, rgba(0,0,0,0.10), rgba(0,0,0,0.10)), url('/assert/2/9a92cd16-82e0-4b9b-bc8f-a7805b2ad499.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <Icon category="Catálogo y producto" name="MynauiImage" className="w-8 h-8" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <div className="flex items-center justify-between">
              {product.categorias?.nombre && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-90 text-gray-700">
                  {product.categorias.nombre}
                </span>
              )}
              {isNew && <span className="text-[11px] text-white/90">Nuevo</span>}
            </div>
          </div>
        </div>
      </Link>
      <CardContent className="p-4">
        <Link to={`/productos/${product.id}`} className="block">
          <h3 className="text-base font-semibold line-clamp-2 group-hover:text-(--color-terracotta-suave)">{product.nombre}</h3>
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-2xl font-bold text-(--color-terracotta-suave)">${Number(product.precio).toLocaleString()}</span>
          {avg !== undefined && (
            <div className="text-xs text-yellow-600 flex items-center gap-1">
              <Icon category="Catálogo y producto" name="LucideHeart" className="w-3 h-3" />
              {avg.toFixed(1)}
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between">
          {isLowStock ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-yellow-100 text-yellow-800">
              <Icon category="Estados y Feedback" name="MaterialSymbolsWarning" className="w-3 h-3 mr-1" />
              ¡Pocas unidades!
            </span>
          ) : (
            <span className="text-xs text-gray-500">Stock: {product.stock}</span>
          )}
          <div className="flex items-center gap-2">
            <Link to={`/productos/${product.id}`} className="btn btn-outline btn-sm flex items-center gap-1">
              <Icon category="Catálogo y producto" name="LineMdSearch" className="w-3 h-3" />
              Ver
            </Link>
            <button
              className="btn btn-primary btn-sm flex items-center gap-1"
              onClick={() => add({ productoId: product.id, nombre: product.nombre, precio: Number(product.precio), cantidad: 1, imagenUrl: product.imagen_url || undefined, stock: product.stock })}
            >
              <Icon category="Carrito y checkout" name="WhhShoppingcart" className="w-3 h-3" />
              Añadir
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ProductCard = React.memo(ProductCardBase);

export default ProductCatalog;
