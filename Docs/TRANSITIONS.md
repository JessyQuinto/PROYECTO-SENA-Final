# TRANSITIONS.md (v1.1.0)
Cross-links: `modelado_datos.md`, `diseño_sistema.md`, `rls_policies.md`.
Versión: 1.0.0 | Última actualización: 2025-08-08

## Pedido (orders.estado) FSM
| Actual | Nuevo | Quién | Condiciones |
|--------|-------|-------|-------------|
| pendiente | procesando | sistema / RPC pago simulado | Pago simulado ok |
| pendiente | cancelado | comprador | Antes de procesar |
| procesando | enviado | vendedor(es) | Todos los order_items marcados enviados |
| enviado | entregado | comprador | Confirmación recepción |

Prohibido: saltos no listados. Validado en RPC `pedido_cambiar_estado`.

## Vendedor (users.vendedor_estado)
| Actual | Nuevo | Quién | Condición |
|--------|-------|-------|-----------|
| pendiente | aprobado | admin | Revisión perfil |
| pendiente | rechazado | admin | Falta requisitos |
| aprobado | rechazado | admin | Causa disciplinaria |

## Producto (productos.estado)
| Actual | Nuevo | Quién | Condición |
|--------|-------|-------|-----------|
| activo | inactivo | vendedor/admin | Pausa voluntaria |
| inactivo | activo | vendedor/admin | Reactivación |
| (cualquiera) | bloqueado | admin | Moderación |
| bloqueado | inactivo | admin | Revisión superada |

Auditoría en cada transición.
