// Simple DTO mappers between DB rows (snake_case) and UI models (camelCase)
import type {
  ProductoRow,
  Producto,
  UsuarioRow,
  Usuario,
  OrderItemRow,
  OrderItem,
  OrderRow,
  Order,
  CategoriaRow,
  Categoria,
  EvaluacionRow,
  Evaluacion,
} from './domain';

export const mapProducto = (r: ProductoRow): Producto => ({
  id: r.id,
  vendedorId: r.vendedor_id,
  categoriaId: r.categoria_id ?? undefined,
  nombre: r.nombre,
  descripcion: r.descripcion ?? undefined,
  precio: r.precio,
  stock: r.stock,
  imagenUrl: r.imagen_url ?? undefined,
  estado: r.estado,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const mapUsuario = (r: UsuarioRow): Usuario => ({
  id: r.id,
  email: r.email ?? undefined,
  role: r.role ?? 'comprador',
  vendedorEstado: r.vendedor_estado,
  bloqueado: !!r.bloqueado,
  nombreCompleto: r.nombre_completo ?? undefined,
  fechaCreacion: r.created_at,
});

export const mapOrderItem = (r: OrderItemRow): OrderItem => ({
  id: r.id,
  orderId: r.order_id,
  productoId: r.producto_id,
  vendedorId: r.vendedor_id,
  cantidad: r.cantidad,
  precioUnitario: r.precio_unitario,
  subtotal: r.subtotal,
});

export const mapOrder = (r: OrderRow, items?: OrderItemRow[]): Order => ({
  id: r.id,
  compradorId: r.comprador_id,
  estado: r.estado,
  total: r.total,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  items: items?.map(mapOrderItem),
});

export const mapCategoria = (r: CategoriaRow): Categoria => ({
  id: r.id,
  nombre: r.nombre,
  slug: r.slug ?? undefined,
  descripcion: r.descripcion ?? undefined,
  createdAt: r.created_at,
});

export const mapEvaluacion = (r: EvaluacionRow): Evaluacion => ({
  id: r.id,
  compradorId: r.comprador_id,
  productoId: r.producto_id,
  orderItemId: r.order_item_id,
  puntuacion: r.puntuacion,
  comentario: r.comentario ?? undefined,
  createdAt: r.created_at,
});
