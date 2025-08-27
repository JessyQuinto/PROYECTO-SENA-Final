import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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

// Combine all filter state into a single object to reduce re-renders
interface ProductFilters {
  searchTerm: string;
  priceMin: number;
  priceMax: number;
  selectedCategories: string[];
  sortBy: 'newest' | 'price_asc' | 'price_desc' | 'name';
}

// Memoized filter function outside component to prevent recreation
const filterProducts = (products: any[], filters: ProductFilters, debouncedSearchTerm: string) => {
  if (!products.length) return [];

  let filtered = products;

  // Apply search filter with debounced term
  if (debouncedSearchTerm) {
    const searchLower = debouncedSearchTerm.toLowerCase();
    filtered = filtered.filter(product =>
      product.nombre.toLowerCase().includes(searchLower)
    );
  }

  // Apply category filter
  if (filters.selectedCategories.length > 0) {
    filtered = filtered.filter(product =>
      filters.selectedCategories.includes(product.categoria_id || '')
    );
  }

  // Apply price filter
  filtered = filtered.filter(
    product =>
      Number(product.precio) >= filters.priceMin && 
      Number(product.precio) <= filters.priceMax
  );

  // Apply sorting
  switch (filters.sortBy) {
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
};

const ProductCatalog: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceMaxAuto, setPriceMaxAuto] = useState<number>(1000000);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [twoColsMobile, setTwoColsMobile] = useState(false);

  // Consolidated filter state - this reduces the number of state variables
  const [filters, setFilters] = useState<ProductFilters>({
    searchTerm: '',
    priceMin: 0,
    priceMax: 1000000,
    selectedCategories: [],
    sortBy: 'newest',
  });

  // Use cached data hooks
  const { data: categories, loading: categoriesLoading } = useCachedCategories();
  
  // Debounced search term for better performance
  const debouncedSearchTerm = useDebounce(filters.searchTerm.trim(), 300);
  
  // Ref to track if component is mounted (prevent state updates after unmount)
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Memoized product IDs to prevent unnecessary recalculations
  const productIds = useMemo(() => products.map(p => p.id), [products]);
  const { data: avgMap } = useCachedProductRatings(productIds);

  // Optimized data loading function with error handling
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

      // Only update state if component is still mounted
      if (!isMountedRef.current) return;

      setProducts(productsData || []);
      
      // Calculate price range dynamically
      const maxPrice = Math.max(
        100000,
        ...(productsData || []).map((p: any) => Number(p.precio || 0))
      );
      
      setPriceMaxAuto(maxPrice);
      
      // Update filter max price if it's still at default
      setFilters(prev => ({
        ...prev,
        priceMax: prev.priceMax === 1000000 ? maxPrice : prev.priceMax,
      }));
      
    } catch (error) {
      console.error('Error loading products:', error);
      if (isMountedRef.current) {
        // You might want to set an error state here
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Memoized filtered products with stable dependencies
  const filteredProducts = useMemo(() => {
    return filterProducts(products, filters, debouncedSearchTerm);
  }, [products, filters, debouncedSearchTerm]);

  // Optimized event handlers using useCallback with stable dependencies
  const handleSearchTermChange = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, searchTerm }));
  }, []);

  const handleSortByChange = useCallback((sortBy: ProductFilters['sortBy']) => {
    setFilters(prev => ({ ...prev, sortBy }));
  }, []);

  const handleCategoriesChange = useCallback((selectedCategories: string[]) => {
    setFilters(prev => ({ ...prev, selectedCategories }));
  }, []);

  const handlePriceMinChange = useCallback((priceMin: number) => {
    setFilters(prev => ({ ...prev, priceMin }));
  }, []);

  const handlePriceMaxChange = useCallback((priceMax: number) => {
    setFilters(prev => ({ ...prev, priceMax }));
  }, []);

  const handleToggleFiltersMobile = useCallback(() => {
    setShowFiltersMobile(prev => !prev);
  }, []);

  const handleToggleTwoColsMobile = useCallback(() => {
    setTwoColsMobile(prev => !prev);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      priceMin: 0,
      priceMax: priceMaxAuto,
      selectedCategories: [],
      sortBy: 'newest',
    });
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
        searchTerm={filters.searchTerm}
        onSearchChange={handleSearchTermChange}
        sortBy={filters.sortBy}
        onSortChange={handleSortByChange}
        showFiltersMobile={showFiltersMobile}
        onToggleFiltersMobile={handleToggleFiltersMobile}
        twoColsMobile={twoColsMobile}
        onToggleTwoColsMobile={handleToggleTwoColsMobile}
      />

      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        <ProductFilters
          categories={categories || []}
          selectedCategories={filters.selectedCategories}
          onCategoriesChange={handleCategoriesChange}
          priceMin={filters.priceMin}
          priceMax={filters.priceMax}
          priceMaxAuto={priceMaxAuto}
          onPriceMinChange={handlePriceMinChange}
          onPriceMaxChange={handlePriceMaxChange}
          onClearFilters={handleClearFilters}
          showFiltersMobile={showFiltersMobile}
        />

        <ProductGrid
          products={filteredProducts}
          avgMap={avgMap || {}}
          twoColsMobile={twoColsMobile}
          className='lg:col-span-3'
        />
      </div>
    </div>
  );
};

// Memoize the entire component to prevent unnecessary re-renders from parent
export default React.memo(ProductCatalog);
