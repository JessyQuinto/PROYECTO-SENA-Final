// Frontend domain interfaces and enums derived from Docs/modelado_datos.md and diseño_sistema.md
// Nota: campos UI en camelCase; filas DB en snake_case. Usa dto.ts para mapear.

// Enums (como union types para tree-shaking)
export type UserRole = 'admin' | 'vendedor' | 'comprador';
export type VendedorEstado = 'pendiente' | 'aprobado' | 'rechazado';
export type ProductoEstado = 'activo' | 'inactivo' | 'bloqueado';
export type PedidoEstado =
  | 'pendiente'
  | 'procesando'
  | 'enviado'
  | 'entregado'
  | 'cancelado';

// UI Models (camelCase)
export interface Usuario {
  id: string;
  email?: string;
  role: UserRole;
  vendedorEstado?: VendedorEstado | null;
  bloqueado?: boolean;
  nombreCompleto?: string | null;
  fechaCreacion?: string; // ISO
}

export interface Categoria {
  id: string;
  nombre: string;
  slug?: string | null;
  descripcion?: string | null;
  createdAt?: string;
}

export interface Producto {
  id: string;
  vendedorId: string;
  categoriaId?: string | null;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stock: number;
  imagenUrl?: string | null;
  estado: ProductoEstado;
  createdAt?: string;
  updatedAt?: string;
  promedioCalificacion?: number; // opcional (vista/materialized)
}

export interface OrderItem {
  id: string;
  orderId: string;
  productoId: string;
  vendedorId: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  enviado?: boolean; // derivado/estado por ítem si se maneja
}

export interface Order {
  id: string;
  compradorId: string;
  estado: PedidoEstado;
  total: number;
  createdAt: string;
  updatedAt?: string;
  items?: OrderItem[];
}

export interface Evaluacion {
  id: string;
  compradorId: string;
  productoId: string;
  orderItemId: string;
  puntuacion: number; // 1..5
  comentario?: string | null;
  createdAt: string;
}

// Tipos auxiliares UI
export interface CartItem {
  productoId: string;
  nombre: string;
  precio: number;
  cantidad: number; // >0 y <= stock
  stock?: number;
  imagenUrl?: string | null;
  vendedorId?: string;
}

export interface Paged<T> {
  data: T[];
  page: number;
  pageSize: number;
  total?: number;
}

// DB Row types (snake_case) para mapeo estricto desde Supabase
export interface UsuarioRow {
  id: string;
  email: string | null;
  role: UserRole | null;
  vendedor_estado: VendedorEstado | null;
  bloqueado: boolean | null;
  nombre_completo?: string | null;
  created_at?: string;
}

export interface CategoriaRow {
  id: string;
  nombre: string;
  slug?: string | null;
  descripcion?: string | null;
  created_at?: string;
}

export interface ProductoRow {
  id: string;
  vendedor_id: string;
  categoria_id: string | null;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  imagen_url: string | null;
  estado: ProductoEstado;
  created_at?: string;
  updated_at?: string;
}

export interface OrderRow {
  id: string;
  comprador_id: string;
  estado: PedidoEstado;
  total: number;
  created_at: string;
  updated_at?: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  producto_id: string;
  vendedor_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface EvaluacionRow {
  id: string;
  comprador_id: string;
  producto_id: string;
  order_item_id: string;
  puntuacion: number;
  comentario: string | null;
  created_at: string;
}
