import { useMemo } from 'react';
import { Product, ProductFilters, ProductSortOption } from '@/types/product';

/**
 * Centralized product filtering logic to eliminate duplication
 */
export function filterProducts(
  products: Product[],
  filters: ProductFilters,
  searchTerm?: string
): Product[] {
  if (!products.length) return [];

  let filtered = [...products];
  const queryTerm = searchTerm || filters.searchTerm;

  // Apply search filter
  if (queryTerm) {
    const searchLower = queryTerm.toLowerCase();
    filtered = filtered.filter(product => {
      const nameMatch = product.nombre.toLowerCase().includes(searchLower);
      const descMatch = product.descripcion?.toLowerCase().includes(searchLower) || false;
      const categoryMatch = product.categorias?.nombre.toLowerCase().includes(searchLower) || false;
      const vendorMatch = product.users?.nombre_completo?.toLowerCase().includes(searchLower) || false;
      
      return nameMatch || descMatch || categoryMatch || vendorMatch;
    });
  }

  // Apply category filter
  if (filters.selectedCategories.length > 0) {
    filtered = filtered.filter(product =>
      filters.selectedCategories.includes(product.categoria_id || '')
    );
  }

  // Apply price range filter
  filtered = filtered.filter(
    product =>
      Number(product.precio) >= filters.priceMin &&
      Number(product.precio) <= filters.priceMax
  );

  // Apply vendor filter if specified
  if (filters.vendorId) {
    filtered = filtered.filter(product => product.vendedor_id === filters.vendorId);
  }

  // Apply status filter if specified
  if (filters.estado) {
    filtered = filtered.filter(product => product.estado === filters.estado);
  }

  // Apply stock filter if specified
  if (filters.inStock !== undefined) {
    filtered = filtered.filter(product => 
      filters.inStock ? product.stock > 0 : product.stock === 0
    );
  }

  // Apply sorting
  return sortProducts(filtered, filters.sortBy);
}

/**
 * Sort products by the specified criteria
 */
export function sortProducts(products: Product[], sortBy: ProductSortOption): Product[] {
  const sorted = [...products];

  switch (sortBy) {
    case 'price_asc':
      return sorted.sort((a, b) => Number(a.precio) - Number(b.precio));
    
    case 'price_desc':
      return sorted.sort((a, b) => Number(b.precio) - Number(a.precio));
    
    case 'name':
      return sorted.sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    case 'newest':
    default:
      return sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }
}

/**
 * Hook for product filtering with memoization
 */
export function useProductFiltering(
  products: Product[],
  filters: ProductFilters,
  searchTerm?: string
) {
  return useMemo(() => {
    return filterProducts(products, filters, searchTerm);
  }, [products, filters, searchTerm]);
}

/**
 * Calculate price range from products
 */
export function calculatePriceRange(products: Product[]): {
  min: number;
  max: number;
} {
  if (!products.length) {
    return { min: 0, max: 1000000 };
  }

  const prices = products.map(p => Number(p.precio || 0));
  return {
    min: Math.min(...prices),
    max: Math.max(100000, ...prices), // Minimum sensible max
  };
}

/**
 * Get unique categories from products
 */
export function getProductCategories(products: Product[]): string[] {
  const categories = new Set<string>();
  products.forEach(product => {
    if (product.categoria_id) {
      categories.add(product.categoria_id);
    }
  });
  return Array.from(categories);
}

/**
 * Get products by vendor
 */
export function getProductsByVendor(products: Product[], vendorId: string): Product[] {
  return products.filter(product => product.vendedor_id === vendorId);
}

/**
 * Check if product is available (active and in stock)
 */
export function isProductAvailable(product: Product): boolean {
  return (
    product.estado === 'activo' &&
    !product.archivado &&
    product.stock > 0
  );
}

/**
 * Format product price with currency
 */
export function formatProductPrice(price: number, currency = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Get product availability status
 */
export function getProductStatus(product: Product): {
  status: string;
  color: string;
  label: string;
} {
  if (product.archivado) {
    return { status: 'archived', color: 'red', label: 'Archivado' };
  }
  
  if (product.estado === 'inactivo') {
    return { status: 'inactive', color: 'yellow', label: 'Inactivo' };
  }
  
  if (product.stock === 0) {
    return { status: 'out_of_stock', color: 'orange', label: 'Agotado' };
  }
  
  return { status: 'active', color: 'green', label: 'Disponible' };
}

/**
 * Create default product filters
 */
export function createDefaultFilters(
  products: Product[] = [],
  overrides: Partial<ProductFilters> = {}
): ProductFilters {
  const priceRange = calculatePriceRange(products);
  
  return {
    searchTerm: '',
    priceMin: priceRange.min,
    priceMax: priceRange.max,
    selectedCategories: [],
    sortBy: 'newest',
    ...overrides,
  };
}

/**
 * Search products with advanced text matching
 */
export function searchProducts(
  products: Product[],
  query: string,
  options: {
    matchDescription?: boolean;
    matchCategory?: boolean;
    matchVendor?: boolean;
    exactMatch?: boolean;
  } = {}
): Product[] {
  if (!query.trim()) return products;

  const {
    matchDescription = true,
    matchCategory = true,
    matchVendor = true,
    exactMatch = false,
  } = options;

  const searchTerm = exactMatch ? query : query.toLowerCase();
  
  return products.filter(product => {
    const productName = exactMatch ? product.nombre : product.nombre.toLowerCase();
    const nameMatch = exactMatch 
      ? productName === searchTerm
      : productName.includes(searchTerm);

    if (nameMatch) return true;

    if (matchDescription && product.descripcion) {
      const description = exactMatch ? product.descripcion : product.descripcion.toLowerCase();
      const descMatch = exactMatch
        ? description === searchTerm
        : description.includes(searchTerm);
      if (descMatch) return true;
    }

    if (matchCategory && product.categorias?.nombre) {
      const categoryName = exactMatch ? product.categorias.nombre : product.categorias.nombre.toLowerCase();
      const categoryMatch = exactMatch
        ? categoryName === searchTerm
        : categoryName.includes(searchTerm);
      if (categoryMatch) return true;
    }

    if (matchVendor && product.users?.nombre_completo) {
      const vendorName = exactMatch ? product.users.nombre_completo : product.users.nombre_completo.toLowerCase();
      const vendorMatch = exactMatch
        ? vendorName === searchTerm
        : vendorName.includes(searchTerm);
      if (vendorMatch) return true;
    }

    return false;
  });
}