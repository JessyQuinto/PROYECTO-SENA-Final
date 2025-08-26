import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import CatalogHeader from './CatalogHeader';
import ProductFilters from './ProductFilters';
import ProductGrid from './ProductGrid';
import { LoadingPageSkeleton } from '@/components/ui/GenericSkeleton';
import { useCachedCategories, useCachedProductRatings } from '@/hooks/useCacheConfig';
import { Product, Category, ProductFilters as IProductFilters } from '@/types/product';
import { useProductFiltering, createDefaultFilters } from '@/hooks/useProductFiltering';

const ProductCatalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<IProductFilters>(() => 
    createDefaultFilters([], { priceMax: 1000000 })
  );

  // Use cached data hooks
  const { data: categories, loading: categoriesLoading } =
    useCachedCategories();
  const productIds = useMemo(() => products.map(p => p.id), [products]);
  const { data: avgMap } = useCachedProductRatings(productIds);

  useEffect(() => {
    loadData();
  }, []);

  // Use unified product filtering
  const filteredProducts = useProductFiltering(products, filters);

  const handleToggleFiltersMobile = () => {
    setShowFiltersMobile(prev => !prev);
  };

  const handleToggleTwoColsMobile = () => {
    setTwoColsMobile(prev => !prev);
  };

  const handleClearFilters = () => {
    setFilters(createDefaultFilters(products, { priceMax: priceMaxAuto }));
  };

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
