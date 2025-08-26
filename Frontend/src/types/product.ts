// Centralized product interfaces and types

export interface Product {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  imagen_url?: string;
  vendedor_id: string;
  categoria_id?: string;
  estado?: 'activo' | 'inactivo' | 'archivado';
  archivado?: boolean;
  created_at: string;
  updated_at?: string;
  users?: {
    nombre_completo?: string;
    email: string;
  };
  categorias?: {
    id: string;
    nombre: string;
  };
}

export interface Category {
  id: string;
  nombre: string;
  descripcion?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductFilters {
  searchTerm: string;
  priceMin: number;
  priceMax: number;
  selectedCategories: string[];
  sortBy: 'newest' | 'price_asc' | 'price_desc' | 'name';
  vendorId?: string;
  estado?: 'activo' | 'inactivo' | 'archivado';
  inStock?: boolean;
}

export interface ProductRating {
  producto_id: string;
  promedio: number;
  total_calificaciones?: number;
}

export interface FeaturedProduct {
  id: string;
  nombre: string;
  precio: number;
  imagen_url?: string;
  users?: {
    nombre_completo?: string;
  };
}

// Sort options for product lists
export const PRODUCT_SORT_OPTIONS = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'name', label: 'Nombre A-Z' },
] as const;

// Product status options
export const PRODUCT_STATUS_OPTIONS = [
  { value: 'activo', label: 'Activo', color: 'green' },
  { value: 'inactivo', label: 'Inactivo', color: 'yellow' },
  { value: 'archivado', label: 'Archivado', color: 'red' },
] as const;

export type ProductSortOption = typeof PRODUCT_SORT_OPTIONS[number]['value'];
export type ProductStatus = typeof PRODUCT_STATUS_OPTIONS[number]['value'];