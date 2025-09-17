export interface VendorStats {
  totalProductos: number;
  productosActivos: number;
  totalPedidos: number;
  ventasDelMes: number;
}

export interface Product {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  estado: string;
  categoria_id?: string;
  imagen_url?: string;
  created_at: string;
  archivado?: boolean;
}

export interface Order {
  id: string;
  total: number;
  estado: string;
  created_at: string;
  comprador_email?: string;
}

export interface OrderItemRowUI {
  id: string;
  order_id: string;
  producto_nombre: string;
  cantidad: number;
  enviado: boolean;
  created_at?: string;
}

export type ActiveTab = 'products' | 'orders' | 'add-product' | 'config';
