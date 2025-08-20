# �️ modelado_datos.md (v1.1.0)
Cross-links: `arquitectura.md`, `diseño_sistema.md`, `rls_policies.md`, `NAMING_CONVENTIONS.md`, `TEST_STRATEGY.md`.
Versión: 1.1.0 | Última actualización: 2025-08-08

Ver también: [RLS](rls_policies.md) · [Transiciones](TRANSITIONS.md) · [SQL Bootstrap](sql_bootstrap.sql)

Modelo de datos normalizado (fuente de verdad única en Postgres Supabase). Ver políticas en `rls_policies.md`.

## ENUMs (fuente canonical en migraciones)
- user_role: admin, vendedor, comprador
- vendedor_estado: pendiente, aprobado, rechazado
- producto_estado: activo, inactivo, bloqueado
- pedido_estado: pendiente, procesando, enviado, entregado, cancelado

## Tablas
| Tabla | Campos clave (principales) |
|-------|----------------------------|
| users | id, email, role, vendedor_estado, nombre_completo, bloqueado, created_at |
| categorias | id, nombre, slug, created_at |
| productos | id, vendedor_id, categoria_id, nombre, descripcion, precio, stock, imagen_url, estado, created_at, updated_at |
| orders | id, comprador_id, estado, total, created_at, updated_at |
| order_items | id, order_id, producto_id, vendedor_id, cantidad, precio_unitario, subtotal |
| evaluaciones | id, comprador_id, producto_id, order_item_id, puntuacion, comentario, created_at |

## Integridad
- No borrar productos con order_items (FK ON DELETE RESTRICT).
- No borrar productos si existen evaluaciones asociadas (trigger preventivo).
- Evaluación única por (comprador, order_item).
- Stock decrementado dentro de la transacción de creación de pedido (`crear_pedido`).
- Transiciones de pedido controladas (FSM) por RPC `pedido_cambiar_estado` (sin saltos ilegales).

## Índices clave
- productos(estado, categoria_id)
- productos USING GIN (to_tsvector('spanish', nombre || ' ' || descripcion))
- productos(created_at DESC)
- order_items(vendedor_id)
- evaluaciones(producto_id)
- orders(comprador_id, created_at DESC)
- order_items(order_id)
- evaluaciones(producto_id, puntuacion)

Índices opcionales futuros: `(categoria_id, estado, created_at)` compuesto para listing filtrado.

## Flujo de Pedido
Carrito → RPC `crear_pedido` (transacción: orders + order_items + stock decrement + audit) → estado inicial = pendiente → simulación pago (`pedido_cambiar_estado` → procesando) → vendedor marca ítems enviados (cuando todos: `pedido_cambiar_estado` → enviado) → comprador confirma (`pedido_cambiar_estado` → entregado).

## Cálculos
- orders.total = SUM(order_items.subtotal) (trigger BEFORE INSERT/UPDATE)
- promedio producto = materialized view `mv_promedio_calificaciones` (REFRESH ON SCHEDULE externo / manual) + vista directa para datos recientes.

## Vistas
- `vw_pedidos_vendedor`: agrega orders por vendedor vía join order_items filtrando por vendedor_id.
- `vw_metricas_admin`: totales (usuarios por rol, pedidos por estado, top categorías, promedio calificaciones).

## Auditoría
Tabla `audit_log(id, actor_id, action, entity, entity_id, old_values jsonb, new_values jsonb, created_at)` con triggers en:
- cambios `vendedor_estado` usuarios
- cambio `estado` pedidos
- cambios `estado` productos (bloqueo / desbloqueo)

## Triggers clave (propuestos)
- `trg_order_total`
- `trg_prevent_delete_product_with_evals`
- `trg_audit_users`
- `trg_audit_orders`
- `trg_audit_product_state`

## RPCs (propuestos)
- `crear_pedido(items json)` → crea pedido multi-producto.
- `pedido_cambiar_estado(p_order_id uuid, nuevo_estado pedido_estado)` → valida transición.
- `marcar_item_enviado(p_order_item_id uuid)` → actualiza ítem y si todos enviados → pedido enviado.

## Futuro
- favoritos, reportes, pagos, movimientos inventario.
