import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import CatalogHeader from './CatalogHeader';
import ProductFilters from './ProductFilters';
import ProductGrid from './ProductGrid';
import { LoadingPageSkeleton } from '@/components/ui/Skeleton';
import { useCachedCategories, useCachedProductRatings } from '../../hooks/useCache';

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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  // Multi selección de categorías
  const [priceMaxAuto, setPriceMaxAuto] = useState<number>(1000000);
  const [priceMin, setPriceMin] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(1000000);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<
    'newest' | 'price_asc' | 'price_desc' | 'name'
  >('newest');
  // UX móvil
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [twoColsMobile, setTwoColsMobile] = useState(false);

  // Use cached data hooks
  const { data: categories, loading: categoriesLoading } =
    useCachedCategories();
  const productIds = useMemo(() => products.map(p => p.id), [products]);
  const { data: avgMap } = useCachedProductRatings(productIds);

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
        .select(
          `
          *,
          categorias(nombre)
        `
        )
        .eq('estado', 'activo')
        .eq('archivado', false)
        .gt('stock', 0);

      if (productsError) throw productsError;

      setProducts(productsData || []);
      // Ajustar rango de precios dinámicamente
      const maxPrice = Math.max(
        100000,
        ...(productsData || []).map((p: any) => Number(p.precio || 0))
      );
      setPriceMaxAuto(maxPrice);
      setPriceMin(0);
      setPriceMax(maxPrice);
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
      filtered = filtered.filter(product =>
        product.nombre.toLowerCase().includes(q)
      );
    }
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product =>
        selectedCategories.includes(product.categoria_id || '')
      );
    }
    filtered = filtered.filter(
      product =>
        Number(product.precio) >= priceMin && Number(product.precio) <= priceMax
    );
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
        filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
    }
    return filtered;
  }, [products, debouncedTerm, selectedCategories, priceMin, priceMax, sortBy]);

  const handleToggleFiltersMobile = () => {
    setShowFiltersMobile(prev => !prev);
  };

  const handleToggleTwoColsMobile = () => {
    setTwoColsMobile(prev => !prev);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setPriceMin(0);
    setPriceMax(priceMaxAuto);
    setSortBy('newest');
  };

  // Loading state with enhanced skeleton
  if (loading || categoriesLoading) {
    return (
      <LoadingPageSkeleton 
        showNavigation={false}
        layout="grid"
        itemCount={8}
      />
    );
  }

  return (
    <div className='container py-8'>
      <CatalogHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortBy={sortBy}
        onSortChange={setSortBy}
        showFiltersMobile={showFiltersMobile}
        onToggleFiltersMobile={handleToggleFiltersMobile}
        twoColsMobile={twoColsMobile}
        onToggleTwoColsMobile={handleToggleTwoColsMobile}
      />

      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        <ProductFilters
          categories={categories || []}
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
          priceMin={priceMin}
          priceMax={priceMax}
          priceMaxAuto={priceMaxAuto}
          onPriceMinChange={setPriceMin}
          onPriceMaxChange={setPriceMax}
          onClearFilters={handleClearFilters}
          showFiltersMobile={showFiltersMobile}
        />

        <ProductGrid
          products={filteredProducts}
          avgMap={avgMap || {}}
          twoColsMobile={twoColsMobile}
        />
      </div>
    </div>
  );
};

export default ProductCatalog;
