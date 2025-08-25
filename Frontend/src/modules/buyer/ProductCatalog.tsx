import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import CatalogHeader from './CatalogHeader';
import ProductFilters from './ProductFilters';
import ProductGrid from './ProductGrid';
import { LoadingPageSkeleton } from '@/components/ui/Skeleton';
import {
  useCachedCategories,
  useCachedProductRatings,
} from '../../hooks/useCache';
import { useDebounce } from '@/hooks/useDebounce';

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
  const [priceMaxAuto, setPriceMaxAuto] = useState<number>(1000000);
  const [priceMin, setPriceMin] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(1000000);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<
    'newest' | 'price_asc' | 'price_desc' | 'name'
  >('newest');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [twoColsMobile, setTwoColsMobile] = useState(false);

  // Use cached data hooks
  const { data: categories, loading: categoriesLoading } = useCachedCategories();
  
  // Debounced search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm.trim(), 300);
  
  // Memoized product IDs to prevent unnecessary recalculations
  const productIds = useMemo(() => products.map(p => p.id), [products]);
  const { data: avgMap } = useCachedProductRatings(productIds);

  // Memoized data loading function
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

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

      setProducts(productsData || []);
      
      // Calculate price range dynamically
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
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Memoized filtered products with optimized filtering logic
  const filteredProducts = useMemo(() => {
    if (!products.length) return [];

    let filtered = [...products];
    
    // Apply search filter
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.nombre.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product =>
        selectedCategories.includes(product.categoria_id || '')
      );
    }
    
    // Apply price filter
    filtered = filtered.filter(
      product =>
        Number(product.precio) >= priceMin && Number(product.precio) <= priceMax
    );
    
    // Apply sorting
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
  }, [products, debouncedSearchTerm, selectedCategories, priceMin, priceMax, sortBy]);

  // Memoized event handlers
  const handleToggleFiltersMobile = useCallback(() => {
    setShowFiltersMobile(prev => !prev);
  }, []);

  const handleToggleTwoColsMobile = useCallback(() => {
    setTwoColsMobile(prev => !prev);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedCategories([]);
    setPriceMin(0);
    setPriceMax(priceMaxAuto);
    setSortBy('newest');
  }, [priceMaxAuto]);

  // Loading state with enhanced skeleton
  if (loading || categoriesLoading) {
    return (
      <LoadingPageSkeleton showNavigation={false} layout='grid' itemCount={8} />
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
